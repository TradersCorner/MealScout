/**
 * PHASE R1: Restaurant Credit Redemption Service
 * 
 * Handles:
 * 1. Recording credit redemptions at restaurants
 * 2. Deducting credits from user ledger
 * 3. Creating immutable redemption records
 * 4. Managing dispute windows (7-day reversal period)
 */

import { db } from './db';
import { restaurantCreditRedemptions, creditLedger, restaurants, users } from '@shared/schema';
import { eq, sum } from 'drizzle-orm';

/**
 * Process credit redemption at a restaurant
 * 
 * Called when restaurant accepts credit payment from user
 * 
 * Creates TWO ledger entries:
 * 1. restaurantCreditRedemptions (liability for restaurant)
 * 2. creditLedger (debit from user's balance)
 */
export async function redeemCreditAtRestaurant(
  restaurantId: string,
  userId: string,
  creditAmount: number,
  orderReference?: string,
  notes?: string,
): Promise<{
  redemption: any;
  creditEntry: any;
}> {
  try {
    // Verify restaurant exists
    const restaurant = (await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1))[0];

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    // Verify user has sufficient credits
    const userCredits = await db
      .select({ total: sum(creditLedger.amount) })
      .from(creditLedger)
      .where(eq(creditLedger.userId, userId));

    const balance = userCredits[0]?.total
      ? parseFloat(userCredits[0].total.toString())
      : 0;

    if (balance < creditAmount) {
      throw new Error(`Insufficient credits. Available: $${balance}, Requested: $${creditAmount}`);
    }

    // Create redemption record (immutable)
    const disputeUntilDate = new Date();
    disputeUntilDate.setDate(disputeUntilDate.getDate() + 7); // 7-day dispute window

    const redemption = await db.insert(restaurantCreditRedemptions).values({
      restaurantId,
      userId,
      creditAmount: creditAmount.toString(),
      orderReference: orderReference || undefined,
      notes: notes || undefined,
      disputeUntil: disputeUntilDate,
    }).returning();

    // Create credit ledger debit entry (immutable)
    const creditEntry = await db.insert(creditLedger).values({
      userId,
      amount: (-creditAmount).toString(),
      sourceType: 'redemption',
      sourceId: redemption[0].id,
      redeemedAt: new Date(),
      redeemedFor: 'restaurant',
    }).returning();

    console.log('[Phase R1] Credit redeemed at restaurant:', {
      redemptionId: redemption[0].id,
      restaurantId,
      userId,
      amount: creditAmount,
      disputeUntil: disputeUntilDate,
    });

    return {
      redemption: redemption[0],
      creditEntry: creditEntry[0],
    };
  } catch (error) {
    console.error('[redemptionService] Error redeeming credit:', error);
    throw error;
  }
}

/**
 * Get all redemptions for a restaurant
 * 
 * Used by restaurant dashboard to show pending payments
 */
export async function getRestaurantRedemptions(
  restaurantId: string,
  status?: 'pending' | 'queued' | 'paid',
) {
  try {
    const redemptions = await db
      .select()
      .from(restaurantCreditRedemptions)
      .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId));

    return status ? redemptions.filter((item: any) => item.settlementStatus === status) : redemptions;
  } catch (error) {
    console.error('[redemptionService] Error getting redemptions:', error);
    throw error;
  }
}

/**
 * Get restaurant credit summary
 * 
 * Returns pending credits, queued for settlement, and already paid
 */
export async function getRestaurantCreditSummary(restaurantId: string) {
  try {
    const redemptions = await db
      .select()
      .from(restaurantCreditRedemptions)
      .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId));

    const pending = redemptions
      .filter((r: any) => r.settlementStatus === 'pending')
      .reduce((sum: number, r: any) => sum + parseFloat(r.creditAmount.toString()), 0);

    const queued = redemptions
      .filter((r: any) => r.settlementStatus === 'queued')
      .reduce((sum: number, r: any) => sum + parseFloat(r.creditAmount.toString()), 0);

    const paid = redemptions
      .filter((r: any) => r.settlementStatus === 'paid')
      .reduce((sum: number, r: any) => sum + parseFloat(r.creditAmount.toString()), 0);

    return {
      pendingCredits: pending,
      queuedForSettlement: queued,
      alreadyPaid: paid,
      totalRedemptions: pending + queued + paid,
      transactionCount: redemptions.length,
    };
  } catch (error) {
    console.error('[redemptionService] Error getting credit summary:', error);
    throw error;
  }
}

/**
 * Get redemption history with user details
 * 
 * Used for restaurant transaction history view
 */
export async function getRedemptionHistory(
  restaurantId: string,
  limit: number = 50,
  offset: number = 0,
) {
  try {
    const redemptions = await db
      .select()
      .from(restaurantCreditRedemptions)
      .where(eq(restaurantCreditRedemptions.restaurantId, restaurantId))
      .limit(limit)
      .offset(offset);

    // Fetch user details for each redemption
    const withUsers = await Promise.all(
      redemptions.map(async (r: any) => {
        const user = (await db
          .select()
          .from(users)
          .where(eq(users.id, r.userId))
          .limit(1))[0];
        return {
          ...r,
          user,
        };
      }),
    );

    return withUsers;
  } catch (error) {
    console.error('[redemptionService] Error getting history:', error);
    throw error;
  }
}

/**
 * Flag redemption for dispute (7-day window)
 * 
 * Restaurant can flag if fraudulent, duplicate, or mistaken
 */
export async function flagRedemptionForDispute(
  redemptionId: string,
  reason: string,
) {
  try {
    const redemption = (await db
      .select()
      .from(restaurantCreditRedemptions)
      .where(eq(restaurantCreditRedemptions.id, redemptionId))
      .limit(1))[0];

    if (!redemption) {
      throw new Error('Redemption not found');
    }

    // Check if still within dispute window
    if (!redemption.disputeUntil || new Date() > new Date(redemption.disputeUntil)) {
      throw new Error('Dispute window expired (7 days). Contact admin for override.');
    }

    // For MVP: just log the dispute flag
    // In full version: create dispute record and hold settlement
    console.log('[Phase R1] Redemption flagged for dispute:', {
      redemptionId,
      reason,
      restaurantId: redemption.restaurantId,
    });

    return {
      success: true,
      message: 'Dispute flagged. Admin will review within 24 hours.',
      redemptionId,
    };
  } catch (error) {
    console.error('[redemptionService] Error flagging dispute:', error);
    throw error;
  }
}

export default {
  redeemCreditAtRestaurant,
  getRestaurantRedemptions,
  getRestaurantCreditSummary,
  getRedemptionHistory,
  flagRedemptionForDispute,
};
