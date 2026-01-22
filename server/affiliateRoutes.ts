/**
 * Affiliate Routes
 * 
 * Public routes for:
 * - Affiliate link tracking (ref param)
 * - Commission dashboards
 * - Withdrawal requests
 * - Commission history
 */

import { Router } from 'express';
import { db } from './db';
import { isAuthenticated } from './unifiedAuth';
import affiliateService from './affiliateService';
import shareService from './shareService';
import emptyCountyService from './emptyCountyService';
import { logAudit } from './auditLogger';
import { eq, desc } from 'drizzle-orm';
import { affiliateWithdrawals, affiliateLinks, affiliateCommissions, affiliateWallet } from '@shared/schema';
import { ensureAffiliateTag, setAffiliateTag } from "./affiliateTagService";

const router = Router();

/**
 * GET /api/affiliate/tag
 * Get or create the user's affiliate tag
 */
router.get('/tag', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const tag = await ensureAffiliateTag(userId);
    res.json({ tag, sharePath: `/ref/${tag}` });
  } catch (error: any) {
    console.error('Failed to fetch affiliate tag:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tag' });
  }
});

/**
 * PUT /api/affiliate/tag
 * Update the user's affiliate tag
 */
router.put('/tag', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { tag } = req.body;
    if (!userId || !tag) {
      return res.status(400).json({ error: 'Tag is required' });
    }

    const updated = await setAffiliateTag(userId, tag);
    res.json({ tag: updated, sharePath: `/ref/${updated}` });
  } catch (error: any) {
    console.error('Failed to update affiliate tag:', error);
    res.status(400).json({ error: error.message || 'Failed to update tag' });
  }
});

/**
 * POST /api/affiliate/generate-link
 * Create an affiliate link for any shared resource
 */
router.post('/generate-link', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { baseUrl, resourceType, resourceId } = req.body;

    if (!userId || !baseUrl || !resourceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const link = await affiliateService.createAffiliateLink(
      userId,
      resourceType,
      baseUrl,
      resourceId,
    );

    await logAudit(
      userId,
      'affiliate_link_created',
      'affiliate_link',
      link.id,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      { resourceType, baseUrl },
    );

    res.json(link);
  } catch (error) {
    console.error('Failed to generate affiliate link:', error);
    res.status(500).json({ error: 'Failed to generate link' });
  }
});

/**
 * GET /api/affiliate/click/:code
 * Track click on affiliate link (public, no auth required)
 * Stores tracking data and redirects to original URL
 */
router.get('/click/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const sessionId = req.sessionID || `anonymous-${Date.now()}`;

    // Track the click
    const click = await affiliateService.trackAffiliateClick(
      code,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      req.get('referer') || 'direct',
      sessionId,
    );

    if (!click) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Get the affiliate link
    const link = (await db
      .select()
      .from(affiliateLinks)
      .where(eq(affiliateLinks.id, click.affiliateLinkId))
      .limit(1))[0];

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Redirect to original URL
    res.redirect(link.sourceUrl);
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * GET /api/affiliate/stats
 * Get affiliate dashboard stats for logged-in user
 */
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const stats = await affiliateService.getAffiliateStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch affiliate stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/affiliate/commissions
 * Get commission history with pagination
 */
router.get('/commissions', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const offset = (page - 1) * limit;

    const commissions = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateUserId, userId))
      .orderBy(desc(affiliateCommissions.createdAt))
      .offset(offset)
      .limit(limit);

    const total = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateUserId, userId));

    res.json({
      commissions,
      pagination: {
        page,
        limit,
        total: total.length,
        pages: Math.ceil(total.length / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

/**
 * POST /api/affiliate/withdraw
 * Request a withdrawal (cash out)
 */
router.post('/withdraw', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { amount, method, methodDetails } = req.body;

    if (!userId || !amount || !method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate amount
    const amountNum = parseFloat(amount);
    if (amountNum < 5) {
      return res.status(400).json({ error: 'Minimum withdrawal is $5' });
    }

    // Check available balance
    const wallet = (await db
      .select()
      .from(affiliateWallet)
      .where(eq(affiliateWallet.userId, userId))
      .limit(1))[0];

    if (!wallet || parseFloat(wallet.availableBalance?.toString() || '0') < amountNum) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal request
    const withdrawal = await db.insert(affiliateWithdrawals).values({
      userId,
      amount,
      method,
      methodDetails,
    }).returning();

    // Update wallet
    await affiliateService.updateAffiliateWallet(userId, {
      availableBalance: -amountNum,
      totalWithdrawn: amountNum,
    });

    await logAudit(
      userId,
      'affiliate_withdrawal_requested',
      'withdrawal',
      withdrawal[0].id,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown',
      { amount, method },
    );

    res.json(withdrawal[0]);
  } catch (error) {
    console.error('Failed to create withdrawal:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

/**
 * POST /api/affiliate/submit-restaurant
 * Community submission for empty counties
 */
router.post('/submit-restaurant', async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const {
      restaurantName,
      address,
      county,
      state,
      website,
      phoneNumber,
      category,
      latitude,
      longitude,
      description,
      photoUrl,
    } = req.body;

    if (!restaurantName || !county || !state) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await emptyCountyService.submitRestaurant(
      userId,
      restaurantName,
      address,
      county,
      state,
      {
        website,
        phoneNumber,
        category,
        latitude,
        longitude,
        description,
        photoUrl,
      },
    );

    if (userId) {
      await logAudit(
        userId,
        'restaurant_submitted',
        'submission',
        result.submission.id,
        req.ip || 'unknown',
        req.get('user-agent') || 'unknown',
        { restaurantName, county },
      );
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to submit restaurant:', error);
    res.status(500).json({ error: 'Failed to submit restaurant' });
  }
});

/**
 * GET /api/affiliate/county/empty-check
 * Check if a county has content (no affiliate auth needed)
 */
router.get('/county/empty-check', async (req, res) => {
  try {
    const { county, state } = req.query;

    if (!county || !state) {
      return res.status(400).json({ error: 'County and state required' });
    }

    const isEmpty = await emptyCountyService.isCountyEmpty(
      county as string,
      state as string,
    );

    const metrics = await emptyCountyService.getCountyEngagementMetrics(
      county as string,
      state as string,
    );

    res.json({
      isEmpty,
      metrics,
    });
  } catch (error) {
    console.error('Failed to check county:', error);
    res.status(500).json({ error: 'Failed to check county' });
  }
});

/**
 * GET /api/affiliate/county/fallback
 * Get content fallback chain for empty county
 */
router.get('/county/fallback', async (req, res) => {
  try {
    const { county, state, category } = req.query;

    if (!county || !state) {
      return res.status(400).json({ error: 'County and state required' });
    }

    const content = await emptyCountyService.getCountyContentFallback(
      county as string,
      state as string,
      category as string,
    );

    res.json(content);
  } catch (error) {
    console.error('Failed to fetch fallback content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

export default router;
