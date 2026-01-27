/**
 * PHASE 5: Payout Preferences Routes
 */

import type { Express } from 'express';
import { isAuthenticated } from './unifiedAuth';
import { getUserPayoutPreferences, setPayoutMethod } from './payoutService';
import { getUserCreditBalance } from './creditService';

export default function setupPayoutRoutes(app: Express) {
  /**
   * GET /api/payout/preferences
   * Get current user's payout preferences and credit balance
   */
  app.get('/api/payout/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      const prefs = await getUserPayoutPreferences(userId);
      const creditBalance = await getUserCreditBalance(userId);

      res.json({
        preferences: prefs,
        creditBalance,
      });
    } catch (error: any) {
      console.error('[payout routes] Error getting preferences:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/payout/preferences
   * Update payout method preference
   */
  app.post('/api/payout/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { method, stripeConnectedId, methodDetails } = req.body;

      if (!['credit', 'paypal', 'ach', 'other'].includes(method)) {
        return res.status(400).json({ error: 'Invalid payout method' });
      }

      if (method === 'credit' && stripeConnectedId) {
        return res.status(400).json({ error: 'Stripe Connected ID not allowed for credit payouts' });
      }

      const prefs = await setPayoutMethod(
        userId,
        method,
        methodDetails,
        stripeConnectedId
      );

      res.json({
        message: 'Payout preferences updated',
        preferences: prefs,
      });
    } catch (error: any) {
      console.error('[payout routes] Error setting preferences:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/payout/balance
   * Get user's available credit balance
   */
  app.get('/api/payout/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const balance = await getUserCreditBalance(userId);

      res.json({
        balance,
        currency: 'USD',
      });
    } catch (error: any) {
      console.error('[payout routes] Error getting balance:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
