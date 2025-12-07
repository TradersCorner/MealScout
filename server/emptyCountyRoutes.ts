/**
 * PHASE 6: Empty County Experience Routes
 */

import type { Express } from 'express';
import { getEmptyCountyExperience, getNearbyCountyFallback } from './emptyCountyPhase6Service';
import { appendReferralParam } from './referralService';

export default function setupEmptyCountyRoutes(app: Express) {
  /**
   * GET /api/counties/:state/:county/empty-experience
   * Get empty county experience messaging and CTAs
   * 
   * Shows 4-step funnel if county is empty:
   * 1. Acknowledgement (no partners yet)
   * 2. Reframe (you're early, earn money)
   * 3. Community submission (tell us about restaurants)
   * 4. Affiliate CTA (earn when they sign up)
   */
  app.get('/api/counties/:state/:county/empty-experience', async (req: any, res) => {
    try {
      const { state, county } = req.params;

      const experience = await getEmptyCountyExperience(county, state);

      // Add user's referral link if logged in
      if (req.user?.id && experience.isEmpty) {
        const baseUrl = `${req.protocol}://${req.get('host')}/restaurants?county=${county}&state=${state}`;
        experience.shareLink = appendReferralParam(baseUrl, req.user.id);
        experience.shareMessage = `Help ${county} find great restaurants. Share this link and earn when restaurants join!`;
      }

      res.json(experience);
    } catch (error: any) {
      console.error('[emptyCounty routes] Error getting experience:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/counties/:state/:county/fallback
   * Get fallback content (restaurants from nearby counties)
   * 
   * Called if county is empty to show something to the user
   */
  app.get('/api/counties/:state/:county/fallback', async (req: any, res) => {
    try {
      const { state, county } = req.params;

      const fallback = await getNearbyCountyFallback(county, state);

      res.json(fallback);
    } catch (error: any) {
      console.error('[emptyCounty routes] Error getting fallback:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
