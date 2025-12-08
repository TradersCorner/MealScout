import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for session management, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table supporting multiple authentication methods
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userType: varchar("user_type").notNull().default("customer"), // 'customer' | 'restaurant_owner' | 'admin'
  // Facebook authentication (for regular users)
  facebookId: varchar("facebook_id").unique(),
  facebookAccessToken: text("facebook_access_token"),
  // Google authentication (for all users)
  googleId: varchar("google_id").unique(),
  googleAccessToken: text("google_access_token"),
  // Email/password authentication (for all users)
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  // Common fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionBillingInterval: varchar("subscription_billing_interval"), // 'month' | '3-month' | 'year'
  // Optional demographics for aggregated analytics insights (privacy-conscious)
  birthYear: integer("birth_year"),
  gender: varchar("gender"), // 'male' | 'female' | 'other' | 'prefer_not_to_say'
  postalCode: varchar("postal_code"),
  // Golden Fork Award for influential food reviewers
  hasGoldenFork: boolean("has_golden_fork").default(false),
  goldenForkEarnedAt: timestamp("golden_fork_earned_at"),
  reviewCount: integer("review_count").default(0),
  recommendationCount: integer("recommendation_count").default(0),
  influenceScore: integer("influence_score").default(0), // Calculated from reviews, recommendations, favorites
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security audit log table for all critical actions
export const securityAuditLog = pgTable('security_audit_log', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id'),
  action: varchar('action').notNull(),
  resourceType: varchar('resource_type'),
  resourceId: varchar('resource_id'),
  ip: varchar('ip'),
  userAgent: varchar('user_agent'),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: jsonb('metadata'),
}, table => [
  index('idx_security_audit_user').on(table.userId),
  index('idx_security_audit_action').on(table.action),
  index('idx_security_audit_resource').on(table.resourceType, table.resourceId),
  index('idx_security_audit_time').on(table.timestamp)
]);

// Incidents table for SOC-lite workflow
export const incidents = pgTable('incidents', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  ruleId: varchar('rule_id').notNull(),
  severity: varchar('severity').notNull(), // 'low' | 'medium' | 'high' | 'critical'
  status: varchar('status').notNull().default('new'), // 'new' | 'acknowledged' | 'resolved' | 'closed'
  userId: varchar('user_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at'),
  acknowledgedBy: varchar('acknowledged_by'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by'),
  closedAt: timestamp('closed_at'),
  closedBy: varchar('closed_by'),
  signatureHash: varchar('signature_hash'), // Cryptographic signature for tamper detection
}, table => [
  index('idx_incidents_status').on(table.status),
  index('idx_incidents_severity').on(table.severity),
  index('idx_incidents_rule').on(table.ruleId),
  index('idx_incidents_created').on(table.createdAt)
]);

// On-call rotation schedule
export const oncallRotation = pgTable('oncall_rotation', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').notNull().references(() => users.id),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isPrimary: boolean('is_primary').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, table => [
  index('idx_oncall_dates').on(table.startDate, table.endDate)
]);

export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone"),
  businessType: varchar("business_type").notNull().default("restaurant"), // 'restaurant' | 'bar' | 'food_truck'
  cuisineType: varchar("cuisine_type"),
  promoCode: varchar("promo_code"), // For tracking beta access and special offers
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  // Food truck specific fields
  isFoodTruck: boolean("is_food_truck").default(false),
  mobileOnline: boolean("mobile_online").default(false),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  lastBroadcastAt: timestamp("last_broadcast_at"),
  // Operating hours as JSONB: { mon: [{ open: "HH:MM", close: "HH:MM" }], tue: [...], ... }
  operatingHours: jsonb("operating_hours"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  // Image uploads
  logoUrl: varchar("logo_url"),
  coverImageUrl: varchar("cover_image_url"),
  // Golden Plate Award for top-performing restaurants (awarded every 90 days)
  hasGoldenPlate: boolean("has_golden_plate").default(false),
  goldenPlateEarnedAt: timestamp("golden_plate_earned_at"),
  goldenPlateCount: integer("golden_plate_count").default(0), // Total times awarded (permanent record)
  rankingScore: integer("ranking_score").default(0), // Calculated from recommendations, favorites, reviews, deal usage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  dealType: varchar("deal_type").notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 5, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 8, scale: 2 }),
  imageUrl: varchar("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startTime: varchar("start_time").notNull(), // Format: "HH:MM"
  endTime: varchar("end_time").notNull(), // Format: "HH:MM"
  totalUsesLimit: integer("total_uses_limit"),
  perCustomerLimit: integer("per_customer_limit").default(1),
  currentUses: integer("current_uses").default(0),
  facebookPageUrl: varchar("facebook_page_url"),
  isActive: boolean("is_active").default(true),
  isAiGenerated: boolean("is_ai_generated").default(false), // Mark AI-generated sample deals for beta testing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dealClaims = pgTable(
  "deal_claims",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dealId: varchar("deal_id").notNull().references(() => deals.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    claimedAt: timestamp("claimed_at").defaultNow(),
    usedAt: timestamp("used_at"),
    isUsed: boolean("is_used").default(false),
    orderAmount: decimal("order_amount", { precision: 10, scale: 2 }), // For revenue tracking
  },
  (table) => [
    index("IDX_deal_claims_deal_used").on(table.dealId, table.usedAt),
    index("IDX_deal_claims_deal_status").on(table.dealId, table.isUsed),
    index("IDX_deal_claims_user_claimed").on(table.userId, table.claimedAt),
  ],
);

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  status: varchar("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  documents: text("documents").array(), // Array of base64 data URLs or file paths
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal views table for tracking impressions and analytics
export const dealViews = pgTable(
  "deal_views",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dealId: varchar("deal_id").notNull().references(() => deals.id),
    userId: varchar("user_id").references(() => users.id), // Nullable for anonymous views
    sessionId: varchar("session_id").notNull(), // Track anonymous sessions
    viewedAt: timestamp("viewed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_deal_views_deal_viewed").on(table.dealId, table.viewedAt),
    index("IDX_deal_views_user_deal").on(table.userId, table.dealId),
    index("IDX_deal_views_session").on(table.sessionId),
  ],
);

// Restaurant favorites tracking
export const restaurantFavorites = pgTable(
  "restaurant_favorites",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    favoritedAt: timestamp("favorited_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_restaurant_favorites_restaurant").on(table.restaurantId, table.favoritedAt.desc()),
    index("IDX_restaurant_favorites_user").on(table.userId, table.favoritedAt.desc()),
    index("IDX_restaurant_favorites_unique").on(table.restaurantId, table.userId),
  ],
);

// Restaurant recommendations tracking - when a restaurant appears in recommendation feeds
export const restaurantRecommendations = pgTable(
  "restaurant_recommendations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    userId: varchar("user_id").references(() => users.id), // Nullable for anonymous users
    sessionId: varchar("session_id").notNull(), // Track anonymous sessions
    recommendationType: varchar("recommendation_type").notNull(), // 'homepage' | 'search' | 'nearby' | 'personalized'
    recommendationContext: text("recommendation_context"), // Additional context like search query, location, etc.
    isClicked: boolean("is_clicked").default(false),
    clickedAt: timestamp("clicked_at"),
    showedAt: timestamp("showed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_restaurant_recommendations_restaurant").on(table.restaurantId, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_user").on(table.userId, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_session").on(table.sessionId),
    index("IDX_restaurant_recommendations_type").on(table.recommendationType, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_clicked").on(table.isClicked, table.clickedAt),
  ],
);

// Food truck session management
export const foodTruckSessions = pgTable(
  "food_truck_sessions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    startedAt: timestamp("started_at").defaultNow(),
    endedAt: timestamp("ended_at"),
    deviceId: varchar("device_id").notNull(),
    startedByUserId: varchar("started_by_user_id").notNull().references(() => users.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_food_truck_sessions_restaurant").on(table.restaurantId),
    index("IDX_food_truck_sessions_active").on(table.isActive, table.startedAt),
  ],
);

// Food truck location history for tracking and analytics
export const foodTruckLocations = pgTable(
  "food_truck_locations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    sessionId: varchar("session_id").references(() => foodTruckSessions.id),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    heading: decimal("heading", { precision: 5, scale: 2 }), // 0-360 degrees
    speed: decimal("speed", { precision: 5, scale: 2 }), // km/h
    accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // meters
    source: varchar("source").default("gps"), // 'gps' | 'network' | 'manual'
    recordedAt: timestamp("recorded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_food_truck_locations_restaurant_time").on(table.restaurantId, table.recordedAt.desc()),
    index("IDX_food_truck_locations_time").on(table.recordedAt.desc()),
    index("IDX_food_truck_locations_geo").on(table.restaurantId, table.latitude, table.longitude),
    index("IDX_food_truck_locations_session").on(table.sessionId),
  ],
);

// User addresses for saved locations
export const userAddresses = pgTable(
  "user_addresses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar("type").notNull(), // 'home' | 'work' | 'other'
    label: varchar("label").notNull(),
    address: text("address").notNull(),
    city: varchar("city").notNull(),
    state: varchar("state"),
    postalCode: varchar("postal_code"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_user_addresses_user").on(table.userId, table.createdAt.desc()),
    index("IDX_user_addresses_type").on(table.userId, table.type),
    index("IDX_user_addresses_default").on(table.userId, table.isDefault),
  ],
);

// Password reset tokens for secure password reset functionality
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text("token_hash").notNull(), // Store hashed token for security
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"), // Nullable - set when token is used
    requestIp: varchar("request_ip"), // Track IP for security auditing
    userAgent: varchar("user_agent"), // Track user agent for security auditing
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_password_reset_tokens_user").on(table.userId, table.createdAt.desc()),
    index("IDX_password_reset_tokens_token").on(table.tokenHash),
    index("IDX_password_reset_tokens_expires").on(table.expiresAt),
    index("IDX_password_reset_tokens_used").on(table.usedAt),
  ],
);

// Deal feedback for ratings and suggestions
export const dealFeedback = pgTable(
  "deal_feedback",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dealId: varchar("deal_id").notNull().references(() => deals.id, { onDelete: 'cascade' }),
    userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }), // Nullable for anonymous feedback
    rating: integer("rating").notNull(), // 1-5 stars
    feedbackType: varchar("feedback_type").notNull(), // 'rating' | 'suggestion' | 'issue'
    comment: text("comment"), // Optional feedback comment
    isHelpful: boolean("is_helpful"), // Did the deal work as expected?
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_deal_feedback_deal").on(table.dealId, table.createdAt.desc()),
    index("IDX_deal_feedback_user").on(table.userId, table.createdAt.desc()),
    index("IDX_deal_feedback_rating").on(table.dealId, table.rating),
    index("IDX_deal_feedback_type").on(table.feedbackType),
  ],
);

// API Keys for service-to-service authentication
export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar("name").notNull(), // 'POS Integration', 'Live Location Service', etc.
    keyHash: text("key_hash").notNull(), // bcrypt hashed (never store plaintext)
    keyPrefix: varchar("key_prefix", { length: 8 }), // First 8 chars for display (e.g., 'sk_live_abc123')
    scope: varchar("scope").notNull(), // 'read', 'write', 'admin'
    isActive: boolean("is_active").default(true),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"), // Optional - null means no expiration
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_api_keys_user").on(table.userId, table.isActive),
    index("IDX_api_keys_prefix").on(table.keyPrefix),
    index("IDX_api_keys_active").on(table.isActive, table.expiresAt),
  ],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  dealClaims: many(dealClaims),
  reviews: many(reviews),
  dealViews: many(dealViews),
  restaurantFavorites: many(restaurantFavorites),
  restaurantRecommendations: many(restaurantRecommendations),
  addresses: many(userAddresses),
  passwordResetTokens: many(passwordResetTokens),
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Video Stories - 15 second recommendations and ads
export const videoStories = pgTable(
  "video_stories",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    restaurantId: varchar("restaurant_id").references(() => restaurants.id, { onDelete: 'set null' }), // Nullable for personal reviews
    title: varchar("title").notNull(),
    description: text("description"),
    // Video metadata
    duration: integer("duration").notNull(), // seconds (10-15)
    videoUrl: text("video_url").notNull(), // Cloudinary URL
    thumbnailUrl: text("thumbnail_url"),
    // Status tracking
    status: varchar("status").notNull().default("processing"), // 'processing' | 'ready' | 'failed' | 'expired'
    // Engagement metrics
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    commentCount: integer("comment_count").default(0),
    shareCount: integer("share_count").default(0),
    impressionCount: integer("impression_count").default(0), // Times shown in feed
    engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }).default('0.00'), // Like ratio
    // Tags & search
    hashtags: text("hashtags").array().default([]), // ['#pizza', '#foodie']
    cuisine: varchar("cuisine"), // inherited from restaurant
    // Expiration & featured
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '3 days'`), // 3-day expiration
    deletedAt: timestamp("deleted_at"), // soft delete
    // Featured video system
    isFeatured: boolean("is_featured").default(false), // Currently in restaurant's featured slot
    featuredSlotNumber: integer("featured_slot_number"), // 1, 2, or 3
    featuredStartedAt: timestamp("featured_started_at"), // When featured
    featuredEndedAt: timestamp("featured_ended_at"), // When removed from featured
    // Moderation
    isApproved: boolean("is_approved").default(true),
    flagCount: integer("flag_count").default(0),
  },
  (table) => [
    index("IDX_video_stories_user").on(table.userId, table.createdAt.desc()),
    index("IDX_video_stories_restaurant").on(table.restaurantId, table.createdAt.desc()),
    index("IDX_video_stories_expires").on(table.expiresAt),
    index("IDX_video_stories_status").on(table.status),
    index("IDX_video_stories_deleted").on(table.deletedAt),
    index("IDX_video_stories_featured").on(table.isFeatured, table.featuredSlotNumber),
  ],
);

// Story Likes (favorites)
export const storyLikes = pgTable(
  "story_likes",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: varchar("story_id").notNull().references(() => videoStories.id, { onDelete: 'cascade' }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_story_likes_story").on(table.storyId, table.createdAt.desc()),
    index("IDX_story_likes_user").on(table.userId, table.createdAt.desc()),
    index("IDX_story_likes_unique").on(table.storyId, table.userId),
  ],
);

// Story Comments
export const storyComments: any = pgTable(
  "story_comments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: varchar("story_id").notNull().references(() => videoStories.id, { onDelete: 'cascade' }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    parentCommentId: varchar("parent_comment_id").references((): any => storyComments.id, { onDelete: 'cascade' }), // for replies
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    // Moderation
    isApproved: boolean("is_approved").default(true),
  },
  (table) => [
    index("IDX_story_comments_story").on(table.storyId, table.createdAt.desc()),
    index("IDX_story_comments_user").on(table.userId, table.createdAt.desc()),
    index("IDX_story_comments_parent").on(table.parentCommentId),
  ],
);

// Story Views (for analytics)
export const storyViews = pgTable(
  "story_views",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: varchar("story_id").notNull().references(() => videoStories.id, { onDelete: 'cascade' }),
    userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }), // nullable for anonymous
    viewedAt: timestamp("viewed_at").defaultNow(),
    watchDuration: integer("watch_duration"), // seconds watched
  },
  (table) => [
    index("IDX_story_views_story").on(table.storyId, table.viewedAt.desc()),
    index("IDX_story_views_user").on(table.userId, table.viewedAt.desc()),
  ],
);

// Reviewer Levels (denormalized for performance)
export const userReviewerLevels = pgTable(
  "user_reviewer_levels",
  {
    userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    level: integer("level").default(1), // 1-6
    totalFavorites: integer("total_favorites").default(0),
    totalStories: integer("total_stories").default(0),
    topStoryFavorites: integer("top_story_favorites").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
);

// Story Awards (for golden forks, etc.)
export const storyAwards = pgTable(
  "story_awards",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    storyId: varchar("story_id").notNull().references(() => videoStories.id, { onDelete: 'cascade' }),
    awardType: varchar("award_type").notNull(), // 'bronze_fork' | 'silver_fork' | 'gold_fork' | 'platinum_fork'
    awardedAt: timestamp("awarded_at").defaultNow(),
  },
  (table) => [
    index("IDX_story_awards_story").on(table.storyId),
    index("IDX_story_awards_type").on(table.awardType),
    index("IDX_story_awards_date").on(table.awardedAt.desc()),
  ],
);

// Relations
export const videoStoriesRelations = relations(videoStories, ({ one, many }) => ({
  user: one(users, {
    fields: [videoStories.userId],
    references: [users.id],
  }),
  restaurant: one(restaurants, {
    fields: [videoStories.restaurantId],
    references: [restaurants.id],
  }),
  likes: many(storyLikes),
  comments: many(storyComments),
  views: many(storyViews),
  awards: many(storyAwards),
}));

export const storyLikesRelations = relations(storyLikes, ({ one }) => ({
  story: one(videoStories, {
    fields: [storyLikes.storyId],
    references: [videoStories.id],
  }),
  user: one(users, {
    fields: [storyLikes.userId],
    references: [users.id],
  }),
}));

export const storyCommentsRelations = relations(storyComments, ({ one, many }) => {
  return {
    story: one(videoStories, {
      fields: [storyComments.storyId],
      references: [videoStories.id],
    }),
    user: one(users, {
      fields: [storyComments.userId],
      references: [users.id],
    }),
    parentComment: one(storyComments, {
      fields: [storyComments.parentCommentId],
      references: [storyComments.id],
    }),
    replies: many(storyComments),
  };
});

export const storyViewsRelations = relations(storyViews, ({ one }) => ({
  story: one(videoStories, {
    fields: [storyViews.storyId],
    references: [videoStories.id],
  }),
  user: one(users, {
    fields: [storyViews.userId],
    references: [users.id],
  }),
}));

export const storyAwardsRelations = relations(storyAwards, ({ one }) => ({
  story: one(videoStories, {
    fields: [storyAwards.storyId],
    references: [videoStories.id],
  }),
}));

export const userReviewerLevelsRelations = relations(userReviewerLevels, ({ one }) => ({
  user: one(users, {
    fields: [userReviewerLevels.userId],
    references: [users.id],
  }),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  deals: many(deals),
  reviews: many(reviews),
  verificationRequests: many(verificationRequests),
  foodTruckSessions: many(foodTruckSessions),
  foodTruckLocations: many(foodTruckLocations),
  favorites: many(restaurantFavorites),
  recommendations: many(restaurantRecommendations),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [deals.restaurantId],
    references: [restaurants.id],
  }),
  claims: many(dealClaims),
  views: many(dealViews),
  feedback: many(dealFeedback),
}));

export const dealClaimsRelations = relations(dealClaims, ({ one }) => ({
  deal: one(deals, {
    fields: [dealClaims.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealClaims.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [verificationRequests.restaurantId],
    references: [restaurants.id],
  }),
  reviewer: one(users, {
    fields: [verificationRequests.reviewerId],
    references: [users.id],
  }),
}));

export const dealViewsRelations = relations(dealViews, ({ one }) => ({
  deal: one(deals, {
    fields: [dealViews.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealViews.userId],
    references: [users.id],
  }),
}));

export const foodTruckSessionsRelations = relations(foodTruckSessions, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [foodTruckSessions.restaurantId],
    references: [restaurants.id],
  }),
  startedByUser: one(users, {
    fields: [foodTruckSessions.startedByUserId],
    references: [users.id],
  }),
  locations: many(foodTruckLocations),
}));

export const foodTruckLocationsRelations = relations(foodTruckLocations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [foodTruckLocations.restaurantId],
    references: [restaurants.id],
  }),
  session: one(foodTruckSessions, {
    fields: [foodTruckLocations.sessionId],
    references: [foodTruckSessions.id],
  }),
}));

export const restaurantFavoritesRelations = relations(restaurantFavorites, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantFavorites.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantFavorites.userId],
    references: [users.id],
  }),
}));

export const restaurantRecommendationsRelations = relations(restaurantRecommendations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantRecommendations.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantRecommendations.userId],
    references: [users.id],
  }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export const dealFeedbackRelations = relations(dealFeedback, ({ one }) => ({
  deal: one(deals, {
    fields: [dealFeedback.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealFeedback.userId],
    references: [users.id],
  }),
}));

// Operating hours schema - supports multiple open/close periods per day
export const operatingHoursTimeSlotSchema = z.object({
  open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
}).refine((slot) => {
  const [openHours, openMinutes] = slot.open.split(':').map(Number);
  const [closeHours, closeMinutes] = slot.close.split(':').map(Number);
  const openTime = openHours * 60 + openMinutes;
  const closeTime = closeHours * 60 + closeMinutes;
  
  // Allow closing time to be earlier than opening time (overnight operation)
  return openTime !== closeTime;
}, "Open and close times cannot be the same");

export const operatingHoursSchema = z.object({
  mon: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  tue: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  wed: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  thu: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  fri: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  sat: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
  sun: z.array(operatingHoursTimeSlotSchema).max(3, "Maximum 3 time slots per day").optional(),
});

export const updateRestaurantLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  mobileOnline: z.boolean().optional(),
});

export const updateRestaurantOperatingHoursSchema = z.object({
  operatingHours: operatingHoursSchema,
});

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  operatingHours: operatingHoursSchema.optional(),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealClaimSchema = createInsertSchema(dealClaims).omit({
  id: true,
  claimedAt: true,
  usedAt: true,
  isUsed: true,
  orderAmount: true,
});

export const insertDealViewSchema = createInsertSchema(dealViews).omit({
  id: true,
  viewedAt: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewerId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  documents: z.array(z.string().url())
    .min(1, "At least one document is required")
    .max(5, "Maximum 5 documents allowed")
    .refine(
      (docs) => docs.every(doc => doc.startsWith("data:")), 
      "Documents must be valid base64 data URLs"
    )
});

export const insertFoodTruckSessionSchema = createInsertSchema(foodTruckSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  isActive: true,
  createdAt: true,
});

export const insertFoodTruckLocationSchema = createInsertSchema(foodTruckLocations).omit({
  id: true,
  recordedAt: true,
  createdAt: true,
}).extend({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(200).optional(), // Max 200 km/h
  accuracy: z.number().min(0).max(10000).optional(), // Max 10km accuracy
});

export const updateRestaurantMobileSettingsSchema = z.object({
  isFoodTruck: z.boolean().optional(),
  mobileOnline: z.boolean().optional(),
});

export const insertRestaurantFavoriteSchema = createInsertSchema(restaurantFavorites).omit({
  id: true,
  favoritedAt: true,
  createdAt: true,
});

export const insertRestaurantRecommendationSchema = createInsertSchema(restaurantRecommendations).omit({
  id: true,
  showedAt: true,
  createdAt: true,
}).extend({
  recommendationType: z.enum(['homepage', 'search', 'nearby', 'personalized']),
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['home', 'work', 'other']),
  label: z.string().min(1, "Label is required").max(50, "Label must be less than 50 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().max(50, "State must be less than 50 characters").optional(),
  postalCode: z.string().max(20, "Postal code must be less than 20 characters").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  usedAt: true,
  createdAt: true,
}).extend({
  tokenHash: z.string().min(1, "Token hash is required"),
  expiresAt: z.date().refine((date) => date > new Date(), "Expiry date must be in the future"),
  requestIp: z.string().ip().optional(),
  userAgent: z.string().max(500, "User agent must be less than 500 characters").optional(),
});

export const insertDealFeedbackSchema = createInsertSchema(dealFeedback).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  feedbackType: z.enum(['rating', 'suggestion', 'issue']),
  comment: z.string().max(500, "Comment must be less than 500 characters").optional().nullable(),
  isHelpful: z.boolean().optional().nullable(),
});

// Video Stories insert schemas
export const insertVideoStorySchema = createInsertSchema(videoStories).omit({
  id: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  shareCount: true,
  createdAt: true,
  expiresAt: true,
  deletedAt: true,
  flagCount: true,
}).extend({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  duration: z.number().int().min(10, "Duration must be at least 10 seconds").max(15, "Duration must not exceed 15 seconds"),
  videoUrl: z.string().url("Video URL must be a valid URL"),
  thumbnailUrl: z.string().url("Thumbnail URL must be a valid URL").optional().nullable(),
  cuisine: z.string().max(50, "Cuisine must be less than 50 characters").optional().nullable(),
  hashtags: z.array(z.string().regex(/^#/, "Hashtags must start with #")).max(10, "Maximum 10 hashtags allowed").optional(),
});

export const insertStoryLikeSchema = createInsertSchema(storyLikes).omit({
  id: true,
  createdAt: true,
});

export const insertStoryCommentSchema = createInsertSchema(storyComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  text: z.string().min(1, "Comment text is required").max(500, "Comment must be less than 500 characters"),
});

export const insertStoryViewSchema = createInsertSchema(storyViews).omit({
  id: true,
  viewedAt: true,
}).extend({
  watchDuration: z.number().int().min(0).optional(),
});

export const insertStoryAwardSchema = createInsertSchema(storyAwards).omit({
  id: true,
  awardedAt: true,
}).extend({
  awardType: z.enum(['bronze_fork', 'silver_fork', 'gold_fork', 'platinum_fork']),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User-specific data types
export type FacebookUserData = {
  facebookId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  facebookAccessToken?: string | null;
};

export type GoogleUserData = {
  googleId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  googleAccessToken?: string | null;
};

export type EmailUserData = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  passwordHash: string;
};
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDealClaim = z.infer<typeof insertDealClaimSchema>;
export type DealClaim = typeof dealClaims.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;

export type InsertDealView = z.infer<typeof insertDealViewSchema>;
export type DealView = typeof dealViews.$inferSelect;

export type InsertFoodTruckSession = z.infer<typeof insertFoodTruckSessionSchema>;
export type FoodTruckSession = typeof foodTruckSessions.$inferSelect;

export type InsertFoodTruckLocation = z.infer<typeof insertFoodTruckLocationSchema>;
export type FoodTruckLocation = typeof foodTruckLocations.$inferSelect;

export type UpdateRestaurantMobileSettings = z.infer<typeof updateRestaurantMobileSettingsSchema>;

export type InsertRestaurantFavorite = z.infer<typeof insertRestaurantFavoriteSchema>;
export type RestaurantFavorite = typeof restaurantFavorites.$inferSelect;

export type InsertRestaurantRecommendation = z.infer<typeof insertRestaurantRecommendationSchema>;
export type RestaurantRecommendation = typeof restaurantRecommendations.$inferSelect;

export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type InsertDealFeedback = z.infer<typeof insertDealFeedbackSchema>;
export type DealFeedback = typeof dealFeedback.$inferSelect;

// Video Stories types
export type InsertVideoStory = z.infer<typeof insertVideoStorySchema>;
export type VideoStory = typeof videoStories.$inferSelect;

export type InsertStoryLike = z.infer<typeof insertStoryLikeSchema>;
export type StoryLike = typeof storyLikes.$inferSelect;

export type InsertStoryComment = z.infer<typeof insertStoryCommentSchema>;
export type StoryComment = typeof storyComments.$inferSelect;

export type InsertStoryView = z.infer<typeof insertStoryViewSchema>;
export type StoryView = typeof storyViews.$inferSelect;

export type InsertStoryAward = z.infer<typeof insertStoryAwardSchema>;
export type StoryAward = typeof storyAwards.$inferSelect;

export type UserReviewerLevel = typeof userReviewerLevels.$inferSelect;

// Support tickets for user help requests
export const supportTickets = pgTable(
  'support_tickets',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    subject: varchar('subject').notNull(),
    description: text('description').notNull(),
    category: varchar('category').notNull(), // 'bug' | 'feature' | 'payment' | 'account' | 'other'
    priority: varchar('priority').default('normal'), // 'low' | 'normal' | 'high' | 'critical'
    status: varchar('status').default('open'), // 'open' | 'in-progress' | 'resolved' | 'closed'
    adminNotes: text('admin_notes'),
    assignedToAdminId: varchar('assigned_to_admin_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
    resolvedAt: timestamp('resolved_at'),
    resolvedByAdminId: varchar('resolved_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    index('idx_support_tickets_user_id').on(table.userId),
    index('idx_support_tickets_status').on(table.status),
    index('idx_support_tickets_created_at').on(table.createdAt),
  ]
);

// Moderation events for tracking content flags, abuse, policy violations
export const moderationEvents = pgTable(
  'moderation_events',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    eventType: varchar('event_type').notNull(), // 'deal_flagged' | 'review_flagged' | 'user_reported' | 'content_removed' | 'user_warned' | 'user_suspended'
    severity: varchar('severity').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
    reportedUserId: varchar('reported_user_id').references(() => users.id, { onDelete: 'cascade' }),
    reportedResourceType: varchar('reported_resource_type'), // 'deal' | 'review' | 'user' | 'comment'
    reportedResourceId: varchar('reported_resource_id'),
    reporterUserId: varchar('reporter_user_id').references(() => users.id, { onDelete: 'set null' }),
    reason: varchar('reason').notNull(),
    description: text('description'),
    metadata: jsonb('metadata'), // Additional context
    status: varchar('status').default('open'), // 'open' | 'under-review' | 'dismissed' | 'action-taken'
    actionTaken: varchar('action_taken'), // 'none' | 'warning' | 'content-removed' | 'suspension' | 'ban'
    reviewedByAdminId: varchar('reviewed_by_admin_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    reviewedAt: timestamp('reviewed_at'),
  },
  (table) => [
    index('idx_moderation_events_status').on(table.status),
    index('idx_moderation_events_severity').on(table.severity),
    index('idx_moderation_events_created_at').on(table.createdAt),
    index('idx_moderation_events_reported_user').on(table.reportedUserId),
  ]
);

// Affiliate tracking for user-generated referrals
export const affiliateLinks = pgTable(
  'affiliate_links',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateUserId: varchar('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    code: varchar('code').notNull().unique(), // Short unique code like "UX72A91"
    resourceType: varchar('resource_type').notNull(), // 'deal' | 'restaurant' | 'page' | 'collection' | 'search'
    resourceId: varchar('resource_id'), // Optional - the thing being shared
    sourceUrl: text('source_url').notNull(), // Original URL they shared from
    fullUrl: text('full_url').notNull(), // Full URL with ref param
    clickCount: integer('click_count').default(0),
    conversions: integer('conversions').default(0), // Number of signups attributed
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_affiliate_links_user').on(table.affiliateUserId),
    index('idx_affiliate_links_code').on(table.code),
    index('idx_affiliate_links_created').on(table.createdAt),
  ]
);

// Track affiliate clicks and conversions
export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateLinkId: varchar('affiliate_link_id').notNull().references(() => affiliateLinks.id, { onDelete: 'cascade' }),
    visitorIp: varchar('visitor_ip'),
    visitorUserAgent: text('visitor_user_agent'),
    referrerSource: varchar('referrer_source'), // 'organic' | 'direct' | 'referrer_url'
    clickedAt: timestamp('clicked_at').defaultNow(),
    convertedAt: timestamp('converted_at'), // Null until they signup
    restaurantSignupId: varchar('restaurant_signup_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id'), // First-click attribution
  },
  (table) => [
    index('idx_affiliate_clicks_link').on(table.affiliateLinkId),
    index('idx_affiliate_clicks_session').on(table.sessionId),
    index('idx_affiliate_clicks_created').on(table.clickedAt),
  ]
);

// Commission tracking - monthly record of earnings
export const affiliateCommissions = pgTable(
  'affiliate_commissions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateUserId: varchar('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    restaurantUserId: varchar('restaurant_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    affiliateLinkId: varchar('affiliate_link_id').references(() => affiliateLinks.id, { onDelete: 'set null' }),
    commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(), // Dollar amount earned
    commissionPercent: integer('commission_percent').notNull(), // e.g., 10 for 10%
    basedOn: varchar('based_on').notNull(), // 'restaurant_subscription' | 'subscription_value'
    subscriptionValue: decimal('subscription_value', { precision: 10, scale: 2 }), // What restaurant paid
    billingCycle: varchar('billing_cycle').notNull(), // 'month' | '3-month' | 'year'
    forMonth: varchar('for_month').notNull(), // YYYY-MM for which month this commission is for
    status: varchar('status').notNull().default('pending'), // 'pending' | 'paid' | 'rejected'
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_commissions_affiliate').on(table.affiliateUserId),
    index('idx_commissions_restaurant').on(table.restaurantUserId),
    index('idx_commissions_status').on(table.status),
    index('idx_commissions_month').on(table.forMonth),
  ]
);

// Affiliate wallet - tracks balance, credits, and cash outs
export const affiliateWallet = pgTable(
  'affiliate_wallet',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    totalEarned: decimal('total_earned', { precision: 12, scale: 2 }).default('0'),
    availableBalance: decimal('available_balance', { precision: 12, scale: 2 }).default('0'),
    pendingCommissions: decimal('pending_commissions', { precision: 12, scale: 2 }).default('0'),
    totalWithdrawn: decimal('total_withdrawn', { precision: 12, scale: 2 }).default('0'),
    totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).default('0'),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_wallet_user').on(table.userId),
  ]
);

// Withdrawal requests / Cash out requests
export const affiliateWithdrawals = pgTable(
  'affiliate_withdrawals',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    method: varchar('method').notNull(), // 'bank_transfer' | 'paypal' | 'store_credit'
    status: varchar('status').notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
    methodDetails: jsonb('method_details'), // Bank account, PayPal email, etc
    requestedAt: timestamp('requested_at').defaultNow(),
    processedAt: timestamp('processed_at'),
    notes: text('notes'),
  },
  (table) => [
    index('idx_withdrawals_user').on(table.userId),
    index('idx_withdrawals_status').on(table.status),
    index('idx_withdrawals_created').on(table.requestedAt),
  ]
);

// PHASE 1: Referral tracking - "who brought who"
export const referrals = pgTable(
  'referrals',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateUserId: varchar('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    referredRestaurantId: varchar('referred_restaurant_id').references(() => restaurants.id, { onDelete: 'set null' }),
    clickedAt: timestamp('clicked_at').notNull(),
    signedUpAt: timestamp('signed_up_at'),
    activatedAt: timestamp('activated_at'),
    commissionEligibleAt: timestamp('commission_eligible_at'),
    status: varchar('status').notNull().default('clicked'), // 'clicked' | 'signed_up' | 'activated' | 'paid'
  },
  (table) => [
    index('idx_referrals_affiliate').on(table.affiliateUserId),
    index('idx_referrals_restaurant').on(table.referredRestaurantId),
    index('idx_referrals_status').on(table.status),
    index('idx_referrals_clicked').on(table.clickedAt),
  ]
);

// PHASE 1: Referral click tracking - records every click on an affiliate link
export const referralClicks = pgTable(
  'referral_clicks',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateUserId: varchar('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    userAgent: text('user_agent'),
    ip: varchar('ip'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_referral_clicks_affiliate').on(table.affiliateUserId),
    index('idx_referral_clicks_created').on(table.createdAt),
  ]
);

// PHASE 3: Commission ledger - tracks all commissions earned
export const affiliateCommissionLedger = pgTable(
  'affiliate_commission_ledger',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    affiliateUserId: varchar('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    referralId: varchar('referral_id').references(() => referrals.id, { onDelete: 'set null' }),
    restaurantId: varchar('restaurant_id').references(() => restaurants.id, { onDelete: 'set null' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    commissionSource: varchar('commission_source').notNull(), // 'subscription_payment' | 'restaurant_signup' etc
    stripeInvoiceId: varchar('stripe_invoice_id'), // For referencing the invoice that triggered this
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_commission_ledger_affiliate').on(table.affiliateUserId),
    index('idx_commission_ledger_referral').on(table.referralId),
    index('idx_commission_ledger_created').on(table.createdAt),
  ]
);

// PHASE 4: Credit ledger - tracks user credits (balance never stored, derived from SUM)
export const creditLedger = pgTable(
  'credit_ledger',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // Positive or negative
    sourceType: varchar('source_type').notNull(), // 'commission' | 'redemption' | 'adjustment' etc
    sourceId: varchar('source_id'), // ID of the commission, redemption, etc
    redeemedAt: timestamp('redeemed_at'), // NULL if unused
    redeemedFor: varchar('redeemed_for'), // 'restaurant' | 'cash_payout' etc when redeemed
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_credit_ledger_user').on(table.userId),
    index('idx_credit_ledger_source').on(table.sourceType),
    index('idx_credit_ledger_redeemed').on(table.redeemedAt),
  ]
);

// PHASE 5: User payout preferences
export const userPayoutPreferences = pgTable(
  'user_payout_preferences',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    method: varchar('method').notNull().default('credit'), // 'cash' | 'credit'
    stripeConnectedId: varchar('stripe_connected_id'), // For Stripe Connect payouts
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_payout_prefs_user').on(table.userId),
  ]
);

// PHASE R1: Restaurant credit redemptions - tracks when users spend credits at restaurants
export const restaurantCreditRedemptions = pgTable(
  'restaurant_credit_redemptions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
    userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    creditAmount: decimal('credit_amount', { precision: 10, scale: 2 }).notNull(),
    orderReference: varchar('order_reference'), // Optional: "Order #12345" or similar
    notes: text('notes'), // Optional: details about the redemption
    redeemedAt: timestamp('redeemed_at').defaultNow(),
    settlementStatus: varchar('settlement_status').notNull().default('pending'), // 'pending' | 'queued' | 'paid'
    settlementBatchId: varchar('settlement_batch_id'), // Links to restaurantSettlementBatch
    disputeUntil: timestamp('dispute_until').defaultNow(), // 7-day dispute window starts at creation
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_redemptions_restaurant').on(table.restaurantId),
    index('idx_redemptions_user').on(table.userId),
    index('idx_redemptions_status').on(table.settlementStatus),
    index('idx_redemptions_batch').on(table.settlementBatchId),
    index('idx_redemptions_created').on(table.createdAt),
  ]
);

// PHASE R2 (preview): Restaurant settlement batches - groups redemptions for payout
export const restaurantSettlementBatch = pgTable(
  'restaurant_settlement_batch',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    batchId: varchar('batch_id').notNull().unique(), // Human-readable: "BATCH-2025-01-06-001"
    periodStart: timestamp('period_start').notNull(),
    periodEnd: timestamp('period_end').notNull(),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    transactionCount: integer('transaction_count').notNull().default(0),
    payoutDate: timestamp('payout_date'),
    status: varchar('status').notNull().default('queued'), // 'queued' | 'processing' | 'paid'
    stripePayoutId: varchar('stripe_payout_id'), // Stripe payout ID for tracking
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_batch_id').on(table.batchId),
    index('idx_batch_status').on(table.status),
    index('idx_batch_period').on(table.periodStart, table.periodEnd),
  ]
);

// Community restaurant submissions (for empty counties)
export const restaurantSubmissions = pgTable(
  'restaurant_submissions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    submittedByUserId: varchar('submitted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    restaurantName: varchar('restaurant_name').notNull(),
    address: text('address'),
    website: varchar('website'),
    phoneNumber: varchar('phone_number'),
    category: varchar('category'), // 'pizza' | 'burger' | 'chinese', etc
    county: varchar('county'),
    state: varchar('state'),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    description: text('description'), // Why they like it
    photoUrl: varchar('photo_url'),
    status: varchar('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected' | 'converted'
    approvedAt: timestamp('approved_at'),
    convertedToRestaurantId: varchar('converted_to_restaurant_id').references(() => restaurants.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('idx_submissions_status').on(table.status),
    index('idx_submissions_county').on(table.county),
    index('idx_submissions_created').on(table.createdAt),
  ]
);

// Award History - Track Golden Plate awards given every 90 days
export const awardHistory = pgTable(
  'award_history',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    awardType: varchar('award_type').notNull(), // 'golden_plate' | 'golden_fork'
    recipientId: varchar('recipient_id').notNull(), // User ID or Restaurant ID
    recipientType: varchar('recipient_type').notNull(), // 'user' | 'restaurant'
    awardPeriodStart: timestamp('award_period_start').notNull(),
    awardPeriodEnd: timestamp('award_period_end').notNull(),
    rankingScore: integer('ranking_score').notNull(),
    rankPosition: integer('rank_position'), // Their position in rankings when awarded
    geographicArea: varchar('geographic_area'), // County/city for Golden Plate
    metadata: jsonb('metadata'), // Additional award context
    awardedAt: timestamp('awarded_at').defaultNow(),
  },
  (table) => [
    index('idx_award_recipient').on(table.recipientId, table.recipientType),
    index('idx_award_type').on(table.awardType),
    index('idx_award_period').on(table.awardPeriodStart, table.awardPeriodEnd),
    index('idx_award_area').on(table.geographicArea),
  ]
);

// Image uploads - Track all uploaded images for restaurants and users
export const imageUploads = pgTable(
  'image_uploads',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    uploadedByUserId: varchar('uploaded_by_user_id').notNull().references(() => users.id),
    imageType: varchar('image_type').notNull(), // 'restaurant_logo' | 'restaurant_cover' | 'deal' | 'user_profile'
    entityId: varchar('entity_id'), // ID of restaurant, deal, or user
    entityType: varchar('entity_type'), // 'restaurant' | 'deal' | 'user'
    cloudinaryPublicId: varchar('cloudinary_public_id'), // For Cloudinary
    cloudinaryUrl: varchar('cloudinary_url').notNull(),
    thumbnailUrl: varchar('thumbnail_url'),
    width: integer('width'),
    height: integer('height'),
    fileSize: integer('file_size'), // bytes
    mimeType: varchar('mime_type'),
    uploadedAt: timestamp('uploaded_at').defaultNow(),
  },
  (table) => [
    index('idx_image_entity').on(table.entityId, table.entityType),
    index('idx_image_uploader').on(table.uploadedByUserId),
    index('idx_image_type').on(table.imageType),
  ]
);

// Featured Video Slots - Fair rotation of restaurant's featured videos (3 slots max)
export const featuredVideoSlots = pgTable(
  'featured_video_slots',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
    slotNumber: integer('slot_number').notNull(), // 1, 2, or 3
    currentVideoId: varchar('current_video_id').references(() => videoStories.id, { onDelete: 'set null' }),
    cycleStartDate: timestamp('cycle_start_date').defaultNow(),
    cycleEndDate: timestamp('cycle_end_date').default(sql`NOW() + INTERVAL '1 day'`), // 24hr rotation
    previousVideoIds: text('previous_video_ids').array().default([]), // Last 5 videos for variety
    engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }).default('0.00'), // Score for cycling algorithm
    impressions: integer('impressions').default(0), // Times shown
    clicks: integer('clicks').default(0), // Clicks to story details
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_featured_restaurant').on(table.restaurantId, table.slotNumber),
    index('idx_featured_cycle').on(table.cycleEndDate),
  ],
);

// Restaurant Subscriptions - Monetization tiers for restaurants
export const restaurantSubscriptions = pgTable(
  'restaurant_subscriptions',
  {
    id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
    tier: varchar('tier').notNull().default('free'), // 'free' | 'basic' | 'premium'
    // Basic: $29/mo - 1 featured slot, post deals, video stories, basic analytics
    // Premium: $99/mo - 3 featured slots, priority rotation, advanced analytics, deal scheduling
    status: varchar('status').notNull().default('active'), // 'active' | 'canceled' | 'past_due'
    // Features
    canPostVideos: boolean('can_post_videos').default(true), // All tiers can post after signup
    canPostDeals: boolean('can_post_deals').default(false), // Free: no, Basic/Premium: yes
    canUseFeaturedSlots: boolean('can_use_featured_slots').default(false), // Free: no, Basic/Premium: yes
    maxFeaturedSlots: integer('max_featured_slots').default(0), // Free: 0, Basic: 1, Premium: 3
    hasAnalytics: boolean('has_analytics').default(false), // Free: no, Basic/Premium: yes
    hasDealScheduling: boolean('has_deal_scheduling').default(false), // Free: no, Premium: yes
    // Billing
    stripeCustomerId: varchar('stripe_customer_id'),
    stripeSubscriptionId: varchar('stripe_subscription_id'),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    canceledAt: timestamp('canceled_at'),
    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_subscription_restaurant').on(table.restaurantId),
    index('idx_subscription_tier').on(table.tier),
    index('idx_subscription_status').on(table.status),
  ],
);

// Minimal relations for query builder support on admin/SOC/affiliate tables
export const incidentsRelations = relations(incidents, ({ one }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
}));

export const oncallRotationRelations = relations(oncallRotation, ({ one }) => ({
  user: one(users, {
    fields: [oncallRotation.userId],
    references: [users.id],
  }),
}));

export const securityAuditLogRelations = relations(securityAuditLog, ({ one }) => ({
  user: one(users, {
    fields: [securityAuditLog.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignedToAdmin: one(users, {
    fields: [supportTickets.assignedToAdminId],
    references: [users.id],
  }),
  resolvedByAdmin: one(users, {
    fields: [supportTickets.resolvedByAdminId],
    references: [users.id],
  }),
}));

export const moderationEventsRelations = relations(moderationEvents, ({ one }) => ({
  reportedUser: one(users, {
    fields: [moderationEvents.reportedUserId],
    references: [users.id],
  }),
  reporter: one(users, {
    fields: [moderationEvents.reporterUserId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [moderationEvents.reviewedByAdminId],
    references: [users.id],
  }),
}));

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  affiliateUser: one(users, {
    fields: [affiliateLinks.affiliateUserId],
    references: [users.id],
  }),
  clicks: many(affiliateClicks),
  commissions: many(affiliateCommissions),
}));

export const affiliateClicksRelations = relations(affiliateClicks, ({ one }) => ({
  link: one(affiliateLinks, {
    fields: [affiliateClicks.affiliateLinkId],
    references: [affiliateLinks.id],
  }),
  restaurantUser: one(users, {
    fields: [affiliateClicks.restaurantSignupId],
    references: [users.id],
  }),
}));

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  affiliateUser: one(users, {
    fields: [affiliateCommissions.affiliateUserId],
    references: [users.id],
  }),
  restaurantUser: one(users, {
    fields: [affiliateCommissions.restaurantUserId],
    references: [users.id],
  }),
  affiliateLink: one(affiliateLinks, {
    fields: [affiliateCommissions.affiliateLinkId],
    references: [affiliateLinks.id],
  }),
}));

export const affiliateWalletRelations = relations(affiliateWallet, ({ one }) => ({
  user: one(users, {
    fields: [affiliateWallet.userId],
    references: [users.id],
  }),
}));

export const affiliateWithdrawalsRelations = relations(affiliateWithdrawals, ({ one }) => ({
  user: one(users, {
    fields: [affiliateWithdrawals.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  affiliateUser: one(users, {
    fields: [referrals.affiliateUserId],
    references: [users.id],
  }),
  referredRestaurant: one(restaurants, {
    fields: [referrals.referredRestaurantId],
    references: [restaurants.id],
  }),
}));

export const referralClicksRelations = relations(referralClicks, ({ one }) => ({
  affiliateUser: one(users, {
    fields: [referralClicks.affiliateUserId],
    references: [users.id],
  }),
}));

export const restaurantSubmissionsRelations = relations(restaurantSubmissions, ({ one }) => ({
  submittedBy: one(users, {
    fields: [restaurantSubmissions.submittedByUserId],
    references: [users.id],
  }),
  convertedRestaurant: one(restaurants, {
    fields: [restaurantSubmissions.convertedToRestaurantId],
    references: [restaurants.id],
  }),
}));

export const affiliateCommissionLedgerRelations = relations(affiliateCommissionLedger, ({ one }) => ({
  affiliateUser: one(users, {
    fields: [affiliateCommissionLedger.affiliateUserId],
    references: [users.id],
  }),
  referral: one(referrals, {
    fields: [affiliateCommissionLedger.referralId],
    references: [referrals.id],
  }),
  restaurant: one(restaurants, {
    fields: [affiliateCommissionLedger.restaurantId],
    references: [restaurants.id],
  }),
}));

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  user: one(users, {
    fields: [creditLedger.userId],
    references: [users.id],
  }),
}));

export const userPayoutPreferencesRelations = relations(userPayoutPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPayoutPreferences.userId],
    references: [users.id],
  }),
}));

export const restaurantCreditRedemptionsRelations = relations(restaurantCreditRedemptions, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantCreditRedemptions.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantCreditRedemptions.userId],
    references: [users.id],
  }),
}));

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export type InsertModerationEvent = z.infer<typeof insertModerationEventSchema>;
export type ModerationEvent = typeof moderationEvents.$inferSelect;

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissions.$inferSelect;
export type AffiliateWallet = typeof affiliateWallet.$inferSelect;
export type AffiliateWithdrawal = typeof affiliateWithdrawals.$inferSelect;
export type RestaurantSubmission = typeof restaurantSubmissions.$inferSelect;
export type InsertRestaurantSubmission = z.infer<typeof insertRestaurantSubmissionSchema>;

// PHASE 1: Referral types
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
export type ReferralClick = typeof referralClicks.$inferSelect;
export type InsertReferralClick = typeof referralClicks.$inferInsert;

// PHASE 3: Commission ledger types
export type AffiliateCommissionLedger = typeof affiliateCommissionLedger.$inferSelect;
export type InsertAffiliateCommissionLedger = typeof affiliateCommissionLedger.$inferInsert;

// PHASE 4: Credit ledger types
export type CreditLedger = typeof creditLedger.$inferSelect;
export type InsertCreditLedger = typeof creditLedger.$inferInsert;

// PHASE 5: Payout preferences types
export type UserPayoutPreferences = typeof userPayoutPreferences.$inferSelect;
export type InsertUserPayoutPreferences = typeof userPayoutPreferences.$inferInsert;

// PHASE R1: Restaurant credit redemption types
export type RestaurantCreditRedemption = typeof restaurantCreditRedemptions.$inferSelect;
export type InsertRestaurantCreditRedemption = typeof restaurantCreditRedemptions.$inferInsert;

// PHASE R2: Settlement batch types
export type RestaurantSettlementBatch = typeof restaurantSettlementBatch.$inferSelect;
export type InsertRestaurantSettlementBatch = typeof restaurantSettlementBatch.$inferInsert;

export type OperatingHoursTimeSlot = z.infer<typeof operatingHoursTimeSlotSchema>;
export type OperatingHours = z.infer<typeof operatingHoursSchema>;
export type UpdateRestaurantLocation = z.infer<typeof updateRestaurantLocationSchema>;
export type UpdateRestaurantOperatingHours = z.infer<typeof updateRestaurantOperatingHoursSchema>;

// Schemas for support tickets
export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
  assignedToAdminId: true,
  resolvedByAdminId: true,
  adminNotes: true,
});

// Schemas for moderation events
export const insertModerationEventSchema = createInsertSchema(moderationEvents).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedByAdminId: true,
});

// Schemas for affiliate system
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({
  id: true,
  code: true,
  clickCount: true,
  conversions: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRestaurantSubmissionSchema = createInsertSchema(restaurantSubmissions).omit({
  id: true,
  approvedAt: true,
  convertedToRestaurantId: true,
  createdAt: true,
});

// Schemas for award system
export const insertAwardHistorySchema = createInsertSchema(awardHistory).omit({
  id: true,
  awardedAt: true,
});

export type AwardHistory = typeof awardHistory.$inferSelect;
export type InsertAwardHistory = z.infer<typeof insertAwardHistorySchema>;

// Schemas for image uploads
export const insertImageUploadSchema = createInsertSchema(imageUploads).omit({
  id: true,
  uploadedAt: true,
});

export type ImageUpload = typeof imageUploads.$inferSelect;
export type InsertImageUpload = z.infer<typeof insertImageUploadSchema>;

// Schemas for featured video slots
export const insertFeaturedVideoSlotSchema = createInsertSchema(featuredVideoSlots).omit({
  id: true,
  cycleStartDate: true,
  updatedAt: true,
});

export type FeaturedVideoSlot = typeof featuredVideoSlots.$inferSelect;
export type InsertFeaturedVideoSlot = z.infer<typeof insertFeaturedVideoSlotSchema>;

// Schemas for restaurant subscriptions
export const insertRestaurantSubscriptionSchema = createInsertSchema(restaurantSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RestaurantSubscription = typeof restaurantSubscriptions.$inferSelect;
export type InsertRestaurantSubscription = z.infer<typeof insertRestaurantSubscriptionSchema>;

