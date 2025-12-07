/**
 * PHASE R1: Restaurant Credit Redemption Routes
 * 
 * Endpoints:
 * POST   /api/restaurants/:restaurantId/accept-credits  - Accept credit payment
 * GET    /api/restaurants/:restaurantId/redemptions     - View credit history
 * GET    /api/restaurants/:restaurantId/credit-summary  - Pending/settled totals
 * POST   /api/redemptions/:redemptionId/dispute         - Flag for dispute
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated } from './unifiedAuth';
import {
  redeemCreditAtRestaurant,
  getRestaurantRedemptions,
  getRestaurantCreditSummary,
  getRedemptionHistory,
  flagRedemptionForDispute,
} from './redemptionService';
import { getUserCreditBalance } from './creditService';
import { z } from 'zod';

const router = Router();

// Validation schemas
const acceptCreditsSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  creditAmount: z.number().positive('Credit amount must be positive'),
  orderReference: z.string().optional(),
  notes: z.string().optional(),
});

const disputeSchema = z.object({
  reason: z.string().min(10, 'Dispute reason must be at least 10 characters'),
});

/**
 * POST /api/restaurants/:restaurantId/accept-credits
 * 
 * Restaurant submits credit redemption form
 * Creates immutable ledger entries for credit deduction
 */
router.get('/users/:userId/balance', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const balance = await getUserCreditBalance(userId);

    res.json({
      userId,
      balance,
    });
  } catch (error) {
    console.error('[redemptionRoutes] Error getting user balance:', error);
    res.status(500).json({
      error: 'Failed to fetch user balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/restaurants/:restaurantId/accept-credits
 * 
 * Restaurant submits credit redemption form
 * Creates immutable ledger entries for credit deduction
 */
router.post('/:restaurantId/accept-credits', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const validation = acceptCreditsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten(),
      });
    }

    const { userId, creditAmount, orderReference, notes } = validation.data;

    // Verify restaurant ownership (simple check)
    const restaurantOwnerId = req.user?.id; // Assuming middleware sets req.user
    // In production: verify restaurantOwnerId matches req.user.id via restaurant ownership check

    // Get user's current balance
    const userBalance = await getUserCreditBalance(userId);

    if (userBalance < creditAmount) {
      return res.status(400).json({
        error: 'Insufficient user credits',
        available: userBalance,
        requested: creditAmount,
      });
    }

    // Create redemption
    const { redemption, creditEntry } = await redeemCreditAtRestaurant(
      restaurantId,
      userId,
      creditAmount,
      orderReference,
      notes,
    );

    // Get updated user balance
    const updatedBalance = await getUserCreditBalance(userId);

    res.status(201).json({
      success: true,
      redemption: {
        id: redemption.id,
        restaurantId: redemption.restaurantId,
        userId: redemption.userId,
        creditAmount: redemption.creditAmount,
        orderReference: redemption.orderReference,
        status: redemption.settlementStatus,
        disputeUntil: redemption.disputeUntil,
        createdAt: redemption.redeemedAt,
      },
      creditEntry: {
        id: creditEntry.id,
        userId: creditEntry.userId,
        amountDeducted: creditAmount,
        source: 'redemption',
      },
      userBalance: {
        previous: userBalance,
        updated: updatedBalance,
      },
      message: 'Credit redeemed successfully. User balance updated.',
    });

    console.log('[Phase R1 API] Credit accepted:', {
      redemptionId: redemption.id,
      restaurantId,
      creditAmount,
    });
  } catch (error) {
    console.error('[redemptionRoutes] Error accepting credits:', error);
    res.status(500).json({
      error: 'Failed to redeem credit',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/restaurants/:restaurantId/redemptions
 * 
 * Restaurant dashboard: View all credit redemptions
 * Optional filter by status (pending|queued|paid)
 */
router.get('/:restaurantId/redemptions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query as { status?: 'pending' | 'queued' | 'paid' };

    const redemptions = await getRedemptionHistory(restaurantId);

    // Filter by status if provided
    const filtered = status
      ? redemptions.filter((r) => r.settlementStatus === status)
      : redemptions;

    res.json({
      restaurantId,
      count: filtered.length,
      redemptions: filtered.map((r) => ({
        id: r.id,
        userId: r.userId,
        userEmail: r.user?.email,
        creditAmount: r.creditAmount,
        orderReference: r.orderReference,
        status: r.settlementStatus,
        redeemedAt: r.redeemedAt,
        disputeUntil: r.disputeUntil,
        batchId: r.settlementBatchId,
      })),
    });
  } catch (error) {
    console.error('[redemptionRoutes] Error fetching redemptions:', error);
    res.status(500).json({
      error: 'Failed to fetch redemptions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/restaurants/:restaurantId/credit-summary
 * 
 * Restaurant dashboard: Summary of pending, queued, and paid credits
 */
router.get('/:restaurantId/credit-summary', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    const summary = await getRestaurantCreditSummary(restaurantId);

    res.json({
      restaurantId,
      summary: {
        pending: {
          amount: summary.pendingCredits,
          description: 'Credits redeemed, awaiting weekly settlement',
        },
        queued: {
          amount: summary.queuedForSettlement,
          description: 'Queued for this week\'s settlement batch',
        },
        paid: {
          amount: summary.alreadyPaid,
          description: 'Already settled via Stripe payout',
        },
        totals: {
          totalRedeemed: summary.totalRedemptions,
          transactionCount: summary.transactionCount,
        },
      },
      nextSettlement: 'Every Sunday UTC (Phase R2)',
    });
  } catch (error) {
    console.error('[redemptionRoutes] Error fetching credit summary:', error);
    res.status(500).json({
      error: 'Failed to fetch credit summary',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/redemptions/:redemptionId/dispute
 * 
 * Restaurant flags redemption for dispute (within 7-day window)
 * Triggers admin review for potential reversal
 */
router.post('/:redemptionId/dispute', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { redemptionId } = req.params;
    const validation = disputeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten(),
      });
    }

    const result = await flagRedemptionForDispute(redemptionId, validation.data.reason);

    res.json(result);
  } catch (error) {
    console.error('[redemptionRoutes] Error flagging dispute:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Dispute window expired')) {
      return res.status(410).json({
        error: 'Dispute window expired',
        message: errorMessage,
      });
    }

    res.status(500).json({
      error: 'Failed to flag dispute',
      message: errorMessage,
    });
  }
});

export default router;
