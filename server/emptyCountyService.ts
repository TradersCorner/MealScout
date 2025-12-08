/**
 * Empty County Service
 * 
 * Handles the empty county experience:
 * 1. Acknowledge no partners yet
 * 2. Reframe as opportunity for early backers
 * 3. Enable community restaurant submissions
 * 4. Fall back to nearby/state/national content
 * 5. Incentivize with affiliate opportunity
 */

import { db } from './db';
import { restaurantSubmissions, restaurants } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

interface CountyBounds {
  county: string;
  state: string;
}

/**
 * Get content fallback chain for empty county
 * Order: Local (within X miles) -> Same State -> National
 */
export async function getCountyContentFallback(
  county: string,
  state: string,
  category?: string,
  limit: number = 20,
) {
  // For now, return empty array with fallback chain metadata
  // Actual implementation would query restaurants by county/state location
  // This is placeholder since deals table doesn't have county/state fields

  return {
    source: 'fallback',
    deals: [],
    fallbackChain: ['local', 'state', 'national'],
  };
}

/**
 * Submit a restaurant suggestion for an empty county
 * Turns "no data" into community-sourced pipeline
 */
export async function submitRestaurant(
  submittedByUserId: string | null,
  restaurantName: string,
  address: string,
  county: string,
  state: string,
  data: {
    website?: string;
    phoneNumber?: string;
    category?: string;
    latitude?: string;
    longitude?: string;
    description?: string;
    photoUrl?: string;
  },
) {
  // Check if already submitted recently
  const existing = (await db
    .select()
    .from(restaurantSubmissions)
    .where(
      and(
        sql`LOWER(${restaurantSubmissions.restaurantName}) = LOWER(${restaurantName})`,
        eq(restaurantSubmissions.county, county),
        eq(restaurantSubmissions.state, state),
      ),
    )
    .limit(1))[0];

  if (existing) {
    return {
      success: false,
      message: 'This restaurant has already been submitted',
      submission: existing,
    };
  }

  const submission = await db.insert(restaurantSubmissions).values({
    submittedByUserId,
    restaurantName,
    address,
    county,
    state,
    website: data.website,
    phoneNumber: data.phoneNumber,
    category: data.category,
    latitude: data.latitude,
    longitude: data.longitude,
    description: data.description,
    photoUrl: data.photoUrl,
  }).returning();

  return {
    success: true,
    message: 'Restaurant submitted! Our team will review and contact the owner.',
    submission: submission[0],
  };
}

/**
 * Get pending submissions for moderation
 */
export async function getPendingSubmissions(county?: string, state?: string) {
  const submissions = await db
    .select()
    .from(restaurantSubmissions)
    .where(
      and(
        eq(restaurantSubmissions.status, 'pending'),
        county ? eq(restaurantSubmissions.county, county) : undefined,
        state ? eq(restaurantSubmissions.state, state) : undefined,
      ),
    )
    .orderBy(restaurantSubmissions.createdAt);

  return submissions;
}

/**
 * Approve a restaurant submission (admin)
 * Can either create a new restaurant or link to existing
 */
export async function approveSubmission(
  submissionId: string,
  linkToRestaurantId?: string,
) {
  const submission = (await db
    .select()
    .from(restaurantSubmissions)
    .where(eq(restaurantSubmissions.id, submissionId))
    .limit(1))[0];

  if (!submission) {
    throw new Error('Submission not found');
  }

  // If linking to existing restaurant, just update the submission
  if (linkToRestaurantId) {
    const updated = await db.update(restaurantSubmissions)
      .set({
        status: 'converted',
        convertedToRestaurantId: linkToRestaurantId,
        approvedAt: new Date(),
      })
      .where(eq(restaurantSubmissions.id, submissionId))
      .returning();

    return { success: true, submission: updated[0] };
  }

  // Otherwise, mark as approved for outreach
  const updated = await db.update(restaurantSubmissions)
    .set({
      status: 'approved',
      approvedAt: new Date(),
    })
    .where(eq(restaurantSubmissions.id, submissionId))
    .returning();

  return { success: true, submission: updated[0] };
}

/**
 * Reject a submission (admin)
 */
export async function rejectSubmission(submissionId: string, reason?: string) {
  const updated = await db.update(restaurantSubmissions)
    .set({
      status: 'rejected',
    })
    .where(eq(restaurantSubmissions.id, submissionId))
    .returning();

  return { success: true, submission: updated[0] };
}

/**
 * Check if a county has content (restaurants or deals)
 */
export async function isCountyEmpty(county: string, state: string): Promise<boolean> {
  // For now, always return true since we don't have county/state fields in deals
  // In a real implementation, would check:
  // 1. Restaurants with location matching county/state
  // 2. Deals from those restaurants
  // For MVP, we'll consider empty if few restaurants exist in database

  const restaurantCount = await db.select().from(restaurants).limit(1);

  // If no restaurants at all, county is empty
  return restaurantCount.length === 0;
}

/**
 * Get engagement metrics for a county
 * Used to show "You're early" messaging
 */
export async function getCountyEngagementMetrics(county: string, state: string) {
  const restaurantList = await db.select().from(restaurants);

  const submissions = await db
    .select()
    .from(restaurantSubmissions)
    .where(
      and(
        eq(restaurantSubmissions.county, county),
        eq(restaurantSubmissions.state, state),
        eq(restaurantSubmissions.status, 'pending'),
      ),
    );

  return {
    restaurantCount: restaurantList.length,
    submissionCount: submissions.length,
    isEmpty: restaurantList.length === 0,
    isEarlyStage: restaurantList.length < 10,
    message:
      restaurantList.length === 0
        ? 'Be first — help shape your local food scene'
        : `You're early — only ${restaurantList.length} restaurants here so far`,
  };
}

export default {
  getCountyContentFallback,
  submitRestaurant,
  getPendingSubmissions,
  approveSubmission,
  rejectSubmission,
  isCountyEmpty,
  getCountyEngagementMetrics,
};
