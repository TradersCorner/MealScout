/**
 * PHASE 7: Share Link Routes
 * 
 * Endpoints for generating shareable links with affiliate params
 */

import type { Express } from 'express';
import { isAuthenticated } from './unifiedAuth';
import { generateShareLink } from './shareMiddleware';
import { db } from "./db";
import { affiliateShareEvents } from "@shared/schema";

export default function setupShareRoutes(app: Express) {
  /**
   * POST /api/share/generate
   * Generate a shareable link with affiliate param
   * 
   * Body: { path: '/restaurants/123' | '/deals/456' | etc }
   * Returns: { shareLink, shortPath, copied: true }
   */
  app.post('/api/share/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: 'Path required' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const result = await generateShareLink(path, baseUrl, req.user?.id);

      if (req.user?.id) {
        await db.insert(affiliateShareEvents).values({
          affiliateUserId: req.user.id,
          sourcePath: path,
        });
      }

      res.json({
        ...result,
        message: 'Share link generated',
      });
    } catch (error: any) {
      console.error('[share routes] Error generating link:', error);
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/share/info
   * Get info about sharing capabilities
   * 
   * Returns copy templates, platform info, etc
   */
  app.get('/api/share/info', async (req: any, res) => {
    try {
      res.json({
        shareChannels: [
          {
            name: 'Email',
            icon: 'mail',
            template: 'Check out {name} on MealScout: {link}',
          },
          {
            name: 'SMS',
            icon: 'message',
            template: 'MealScout: {link}',
          },
          {
            name: 'Facebook',
            icon: 'facebook',
            template: 'Found something great on MealScout: {link}',
          },
          {
            name: 'Twitter',
            icon: 'twitter',
            template: 'Check this out on @MealScout: {link}',
          },
          {
            name: 'WhatsApp',
            icon: 'message-circle',
            template: 'Hey! Check this on MealScout: {link}',
          },
        ],
        message: 'Share and earn! When restaurants you refer sign up, you get credits.',
        earnMessage: 'Every share brings potential earnings. No limits, never expires.',
      });
    } catch (error: any) {
      console.error('[share routes] Error getting info:', error);
      res.status(500).json({ error: error.message });
    }
  });
}
