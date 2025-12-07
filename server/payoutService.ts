/**
 * PHASE 5: Payout Preferences Service
 * 
 * Manages user choice of cash vs credit payouts
 */

import { db } from './db';
import { userPayoutPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Get or create user payout preferences
 */
export async function getUserPayoutPreferences(userId: string) {
  try {
    let prefs = await db.query.userPayoutPreferences.findFirst({
      where: eq(userPayoutPreferences.userId, userId),
    });

    if (!prefs) {
      // Create default (credit mode)
      const created = await db.insert(userPayoutPreferences).values({
        userId,
        method: 'credit',
      }).returning();
      prefs = created[0];
    }

    return prefs;
  } catch (error) {
    console.error('[payoutService] Error getting payout preferences:', error);
    throw error;
  }
}

/**
 * Update payout method preference
 * 
 * @param userId - User ID
 * @param method - 'cash' or 'credit'
 * @param stripeConnectedId - Optional Stripe Connected Account ID for cash payouts
 */
export async function setPayoutMethod(
  userId: string,
  method: 'cash' | 'credit',
  stripeConnectedId?: string,
) {
  try {
    let prefs = await db.query.userPayoutPreferences.findFirst({
      where: eq(userPayoutPreferences.userId, userId),
    });

    if (!prefs) {
      // Create new preference
      const created = await db.insert(userPayoutPreferences).values({
        userId,
        method,
        stripeConnectedId: stripeConnectedId || undefined,
      }).returning();
      prefs = created[0];
    } else {
      // Update existing
      const updated = await db.update(userPayoutPreferences)
        .set({
          method,
          stripeConnectedId: stripeConnectedId || undefined,
          updatedAt: new Date(),
        })
        .where(eq(userPayoutPreferences.userId, userId))
        .returning();
      prefs = updated[0];
    }

    console.log('[Phase 5] Payout method updated:', {
      userId,
      method,
    });

    return prefs;
  } catch (error) {
    console.error('[payoutService] Error setting payout method:', error);
    throw error;
  }
}

export default {
  getUserPayoutPreferences,
  setPayoutMethod,
};
