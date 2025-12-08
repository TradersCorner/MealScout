import type { Express } from 'express';
import { db } from './db';
import { isAuthenticated, isRestaurantOwner } from './unifiedAuth';
import {
  videoStories,
  storyLikes,
  storyComments,
  storyViews,
  storyAwards,
  userReviewerLevels,
  insertVideoStorySchema,
  insertStoryLikeSchema,
  insertStoryCommentSchema,
  insertStoryViewSchema,
  insertStoryAwardSchema,
  type VideoStory,
  type User,
  restaurants,
  users,
} from '@shared/schema';
import { eq, desc, and, lte, sql, count, gte, like } from 'drizzle-orm';
import { uploadToCloudinary, deleteFromCloudinary } from './imageUpload';
import { upload } from './imageUpload';
import multer from 'multer';

// Configure multer for video uploads
const videoStorage = multer.memoryStorage();
const videoUpload = multer({
  storage: videoStorage,
  fileFilter: (_req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null as any, true);
    } else {
      cb(new Error('Only video files are allowed') as any);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

export default function setupStoriesRoutes(app: Express) {
  // POST - Upload video story
  app.post(
    '/api/stories/upload',
    isAuthenticated,
    videoUpload.single('video'),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: 'No video file provided' });
        }

        const userId = (req as any).user?.id;
        if (!userId) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        // Validate request body
        const bodyData = {
          title: req.body.title,
          description: req.body.description || null,
          duration: parseInt(req.body.duration),
          restaurantId: req.body.restaurantId || null,
          hashtags: req.body.hashtags ? JSON.parse(req.body.hashtags) : [],
          cuisine: req.body.cuisine || null,
        };

        const validationResult = insertVideoStorySchema.safeParse(bodyData);
        if (!validationResult.success) {
          return res.status(400).json({
            message: 'Invalid input',
            errors: validationResult.error.flatten(),
          });
        }

        // Upload video to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
          req.file.buffer,
          'video',
          {
            folder: 'mealscout/stories',
            public_id: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          } as any
        );

        if (!cloudinaryResult.secureUrl) {
          return res.status(500).json({ message: 'Failed to upload video' });
        }

        // Create story record in database
        const story = await db
          .insert(videoStories)
          .values({
            userId,
            restaurantId: bodyData.restaurantId,
            title: bodyData.title,
            description: bodyData.description,
            duration: bodyData.duration,
            videoUrl: cloudinaryResult.secureUrl,
            thumbnailUrl: cloudinaryResult.thumbnailUrl || undefined,
            cuisine: bodyData.cuisine,
            hashtags: bodyData.hashtags,
            status: 'ready', // For MVP, we skip encoding - use Cloudinary's optimization
          })
          .returning();

        // Initialize reviewer level if user doesn't have one
        const existingLevel = await db
          .select()
          .from(userReviewerLevels)
          .where(eq(userReviewerLevels.userId, userId))
          .limit(1);

        if (existingLevel.length === 0) {
          await db.insert(userReviewerLevels).values({
            userId,
            level: 1,
            totalStories: 1,
          });
        } else {
          // Increment total stories count
          await db
            .update(userReviewerLevels)
            .set({
              totalStories: sql`${userReviewerLevels.totalStories} + 1`,
            })
            .where(eq(userReviewerLevels.userId, userId));
        }

        res.status(201).json({
          message: 'Video story uploaded successfully',
          story: story[0],
        });
      } catch (error) {
        console.error('Error uploading video story:', error);
        res.status(500).json({ message: 'Failed to upload video story' });
      }
    }
  );

  // GET - Feed (infinite scroll)
  app.get('/api/stories/feed', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 0;
      const limit = 10;
      const offset = page * limit;

      // Get stories sorted by newest first, excluding expired/deleted
      const stories = await db
        .select()
        .from(videoStories)
        .where(
          and(
            eq(videoStories.status, 'ready'),
            lte(videoStories.createdAt, sql`NOW()`),
            gte(videoStories.expiresAt, sql`NOW()`)
          )
        )
        .orderBy(desc(videoStories.createdAt))
        .limit(limit)
        .offset(offset);

      // Enrich stories with engagement data
      const enrichedStories = await Promise.all(
        stories.map(async (story: VideoStory) => {
          const userLiked = await db
            .select({ count: count() })
            .from(storyLikes)
            .where(
              and(
                eq(storyLikes.storyId, story.id),
                eq(storyLikes.userId, userId)
              )
            );

          return {
            ...story,
            userLiked: (userLiked[0]?.count || 0) > 0,
          };
        })
      );

      res.json({
        stories: enrichedStories,
        hasMore: stories.length === limit,
        page,
      });
    } catch (error) {
      console.error('Error fetching stories feed:', error);
      res.status(500).json({ message: 'Failed to fetch feed' });
    }
  });

  // GET - Single story details
  app.get('/api/stories/:storyId', async (req, res) => {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user?.id;

      // Get story
      const story = await db
        .select()
        .from(videoStories)
        .where(eq(videoStories.id, storyId))
        .limit(1);

      if (!story.length) {
        return res.status(404).json({ message: 'Story not found' });
      }

      // Get creator info
      const creator = await db
        .select()
        .from(users)
        .where(eq(users.id, story[0].userId))
        .limit(1);

      // Get restaurant info if exists
      const restaurant = story[0].restaurantId
        ? await db
            .select()
            .from(restaurants)
            .where(eq(restaurants.id, story[0].restaurantId))
            .limit(1)
        : null;

      // Get creator's reviewer level
      const reviewerLevel = await db
        .select()
        .from(userReviewerLevels)
        .where(eq(userReviewerLevels.userId, story[0].userId))
        .limit(1);

      // Get comments (limit to 5, load more on demand)
      const comments = await db
        .select()
        .from(storyComments)
        .where(
          and(
            eq(storyComments.storyId, storyId),
            eq(storyComments.isApproved, true)
          )
        )
        .orderBy(desc(storyComments.createdAt))
        .limit(5);

      // Get awards
      const awards = await db
        .select()
        .from(storyAwards)
        .where(eq(storyAwards.storyId, storyId));

      // Check if user liked this story
      let userLiked = false;
      if (userId) {
        const likeCheck = await db
          .select()
          .from(storyLikes)
          .where(
            and(
              eq(storyLikes.storyId, storyId),
              eq(storyLikes.userId, userId)
            )
          )
          .limit(1);
        userLiked = likeCheck.length > 0;
      }

      res.json({
        story: story[0],
        creator: creator[0],
        restaurant: restaurant?.[0] || null,
        reviewerLevel: reviewerLevel[0] || null,
        comments,
        awards,
        userLiked,
      });
    } catch (error) {
      console.error('Error fetching story details:', error);
      res.status(500).json({ message: 'Failed to fetch story' });
    }
  });

  // POST - Like story
  app.post('/api/stories/:storyId/like', isAuthenticated, async (req, res) => {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user?.id;

      // Check if story exists
      const story = await db
        .select()
        .from(videoStories)
        .where(eq(videoStories.id, storyId))
        .limit(1);

      if (!story.length) {
        return res.status(404).json({ message: 'Story not found' });
      }

      // Check if already liked
      const existingLike = await db
        .select()
        .from(storyLikes)
        .where(
          and(
            eq(storyLikes.storyId, storyId),
            eq(storyLikes.userId, userId)
          )
        )
        .limit(1);

      if (existingLike.length > 0) {
        // Unlike
        await db
          .delete(storyLikes)
          .where(
            and(
              eq(storyLikes.storyId, storyId),
              eq(storyLikes.userId, userId)
            )
          );

        // Decrement like count
        await db
          .update(videoStories)
          .set({
            likeCount: sql`GREATEST(${videoStories.likeCount} - 1, 0)`,
          })
          .where(eq(videoStories.id, storyId));

        // Decrement user's total favorites
        await db
          .update(userReviewerLevels)
          .set({
            totalFavorites: sql`GREATEST(${userReviewerLevels.totalFavorites} - 1, 0)`,
          })
          .where(eq(userReviewerLevels.userId, story[0].userId));

        return res.json({ liked: false, message: 'Story unliked' });
      }

      // Create like
      await db.insert(storyLikes).values({
        storyId,
        userId,
      });

      // Increment like count
      await db
        .update(videoStories)
        .set({
          likeCount: sql`${videoStories.likeCount} + 1`,
        })
        .where(eq(videoStories.id, storyId));

      // Increment creator's total favorites
      const creatorLevels = await db
        .select()
        .from(userReviewerLevels)
        .where(eq(userReviewerLevels.userId, story[0].userId));

      const currentTotal = creatorLevels[0]?.totalFavorites || 0;
      const newTotal = currentTotal + 1;

      await db
        .update(userReviewerLevels)
        .set({
          totalFavorites: newTotal,
        })
        .where(eq(userReviewerLevels.userId, story[0].userId));

      // Check for milestone awards (500, 1000, 3000, 10000)
      const milestones = [500, 1000, 3000, 10000];
      const awardTypes = [
        'bronze_fork',
        'silver_fork',
        'gold_fork',
        'platinum_fork',
      ];

      for (let i = 0; i < milestones.length; i++) {
        if (newTotal === milestones[i]) {
          // Check if award already exists
          const existingAward = await db
            .select()
            .from(storyAwards)
            .where(
              and(
                eq(storyAwards.storyId, storyId),
                eq(storyAwards.awardType, awardTypes[i])
              )
            )
            .limit(1);

          if (!existingAward.length) {
            await db.insert(storyAwards).values({
              storyId,
              awardType: awardTypes[i],
            });
          }
        }
      }

      // Update reviewer level based on total favorites
      const levels = [
        { threshold: 0, level: 1 },
        { threshold: 100, level: 2 },
        { threshold: 500, level: 3 },
        { threshold: 1000, level: 4 },
        { threshold: 2500, level: 5 },
        { threshold: 5000, level: 6 },
      ];

      let newLevel = 1;
      for (const lvl of levels) {
        if (newTotal >= lvl.threshold) {
          newLevel = lvl.level;
        }
      }

      await db
        .update(userReviewerLevels)
        .set({ level: newLevel })
        .where(eq(userReviewerLevels.userId, story[0].userId));

      res.json({ liked: true, message: 'Story liked' });
    } catch (error) {
      console.error('Error liking story:', error);
      res.status(500).json({ message: 'Failed to like story' });
    }
  });

  // POST - Comment on story
  app.post(
    '/api/stories/:storyId/comments',
    isAuthenticated,
    async (req, res) => {
      try {
        const { storyId } = req.params;
        const userId = (req as any).user?.id;
        const { text, parentCommentId } = req.body;

        // Validate input
        if (!text || text.trim().length === 0) {
          return res.status(400).json({ message: 'Comment text is required' });
        }

        if (text.length > 500) {
          return res
            .status(400)
            .json({ message: 'Comment must be less than 500 characters' });
        }

        // Check if story exists
        const story = await db
          .select()
          .from(videoStories)
          .where(eq(videoStories.id, storyId))
          .limit(1);

        if (!story.length) {
          return res.status(404).json({ message: 'Story not found' });
        }

        // Create comment
        const comment = await db
          .insert(storyComments)
          .values({
            storyId,
            userId,
            text,
            parentCommentId: parentCommentId || null,
          })
          .returning();

        // Increment comment count
        await db
          .update(videoStories)
          .set({
            commentCount: sql`${videoStories.commentCount} + 1`,
          })
          .where(eq(videoStories.id, storyId));

        res.status(201).json({
          message: 'Comment added successfully',
          comment: comment[0],
        });
      } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Failed to add comment' });
      }
    }
  );

  // POST - Record view
  app.post('/api/stories/:storyId/view', async (req, res) => {
    try {
      const { storyId } = req.params;
      const userId = (req as any).user?.id;
      const { watchDuration } = req.body;

      // Record view (only count if watched 3+ seconds)
      if (!watchDuration || watchDuration >= 3) {
        await db.insert(storyViews).values({
          storyId,
          userId: userId || null,
          watchDuration: watchDuration || null,
        });

        // Increment view count
        await db
          .update(videoStories)
          .set({
            viewCount: sql`${videoStories.viewCount} + 1`,
          })
          .where(eq(videoStories.id, storyId));
      }

      res.json({ message: 'View recorded' });
    } catch (error) {
      console.error('Error recording view:', error);
      res.status(500).json({ message: 'Failed to record view' });
    }
  });

  // GET - Leaderboards
  app.get('/api/stories/leaderboards/trending', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'week'; // 'day' | 'week' | 'month' | 'all'

      let hoursBack = 7 * 24; // default week
      if (timeframe === 'day') hoursBack = 24;
      if (timeframe === 'month') hoursBack = 30 * 24;
      if (timeframe === 'all') hoursBack = 365 * 24;

      const cutoffDate = sql`NOW() - INTERVAL '${hoursBack} hours'`;

      const trending = await db
        .select({
          id: videoStories.id,
          title: videoStories.title,
          creatorName: users.firstName,
          viewCount: videoStories.viewCount,
          likeCount: videoStories.likeCount,
          engagement: sql<number>`(${videoStories.likeCount} + ${videoStories.commentCount} * 2) / NULLIF(${videoStories.viewCount}, 0)`,
        })
        .from(videoStories)
        .innerJoin(users, eq(videoStories.userId, users.id))
        .where(
          and(
            eq(videoStories.status, 'ready'),
            gte(videoStories.createdAt, cutoffDate)
          )
        )
        .orderBy(desc(sql`${videoStories.likeCount} + ${videoStories.commentCount}`))
        .limit(20);

      res.json({ trending, timeframe });
    } catch (error) {
      console.error('Error fetching trending stories:', error);
      res.status(500).json({ message: 'Failed to fetch trending stories' });
    }
  });

  // GET - Top reviewers
  app.get('/api/stories/leaderboards/top-reviewers', async (req, res) => {
    try {
      const timeframe = req.query.timeframe || 'month';

      const topReviewers = await db
        .select({
          userId: userReviewerLevels.userId,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          level: userReviewerLevels.level,
          totalFavorites: userReviewerLevels.totalFavorites,
          totalStories: userReviewerLevels.totalStories,
        })
        .from(userReviewerLevels)
        .innerJoin(users, eq(userReviewerLevels.userId, users.id))
        .orderBy(desc(userReviewerLevels.totalFavorites))
        .limit(50);

      res.json({ topReviewers, timeframe });
    } catch (error) {
      console.error('Error fetching top reviewers:', error);
      res
        .status(500)
        .json({ message: 'Failed to fetch top reviewers' });
    }
  });

  // GET - User's stories
  app.get('/api/stories/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const userStories = await db
        .select()
        .from(videoStories)
        .where(
          and(
            eq(videoStories.userId, userId),
            eq(videoStories.status, 'ready')
          )
        )
        .orderBy(desc(videoStories.createdAt));

      res.json({ stories: userStories });
    } catch (error) {
      console.error('Error fetching user stories:', error);
      res.status(500).json({ message: 'Failed to fetch user stories' });
    }
  });

  // DELETE - Delete story (only by creator)
  app.delete(
    '/api/stories/:storyId',
    isAuthenticated,
    async (req, res) => {
      try {
        const { storyId } = req.params;
        const userId = (req as any).user?.id;

        // Get story
        const story = await db
          .select()
          .from(videoStories)
          .where(eq(videoStories.id, storyId))
          .limit(1);

        if (!story.length) {
          return res.status(404).json({ message: 'Story not found' });
        }

        // Check ownership
        if (story[0].userId !== userId) {
          return res
            .status(403)
            .json({ message: 'Unauthorized - not story creator' });
        }

        // Delete from Cloudinary
        if (story[0].videoUrl) {
          try {
            await deleteFromCloudinary(story[0].videoUrl);
          } catch (err) {
            console.error('Error deleting from Cloudinary:', err);
            // Continue with DB deletion even if Cloudinary fails
          }
        }

        // Soft delete in database
        await db
          .update(videoStories)
          .set({ deletedAt: sql`NOW()`, status: 'expired' })
          .where(eq(videoStories.id, storyId));

        res.json({ message: 'Story deleted successfully' });
      } catch (error) {
        console.error('Error deleting story:', error);
        res.status(500).json({ message: 'Failed to delete story' });
      }
    }
  );

  // GET - User's reviewer level
  app.get('/api/stories/reviewer-level/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const level = await db
        .select()
        .from(userReviewerLevels)
        .where(eq(userReviewerLevels.userId, userId))
        .limit(1);

      if (!level.length) {
        // Return default level 1
        return res.json({
          userId,
          level: 1,
          totalFavorites: 0,
          totalStories: 0,
        });
      }

      res.json(level[0]);
    } catch (error) {
      console.error('Error fetching reviewer level:', error);
      res.status(500).json({ message: 'Failed to fetch reviewer level' });
    }
  });
}
