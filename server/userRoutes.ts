/**
 * User API Routes
 * 
 * Handles user-related endpoints including credit balance
 */

import { Router, Request, Response } from 'express';
import { getUserCreditBalance } from './creditService';

const router = Router();

/**
 * GET /api/users/:userId/balance
 * 
 * Get user's current credit balance (for form validation)
 */
router.get('/:userId/balance', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const balance = await getUserCreditBalance(userId);

    res.json({
      userId,
      balance,
    });
  } catch (error) {
    console.error('[userRoutes] Error getting user balance:', error);
    res.status(500).json({
      error: 'Failed to fetch user balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/users/search
 * 
 * Search for users by email (for restaurant credit redemption form)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query required' });
    }

    // Note: This is a placeholder implementation
    // In production, implement actual user search against database
    res.json({
      users: [],
      message: 'User search not yet implemented - use user ID autocomplete instead',
    });
  } catch (error) {
    console.error('[userRoutes] Error searching users:', error);
    res.status(500).json({
      error: 'Failed to search users',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
