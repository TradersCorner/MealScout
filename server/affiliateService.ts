/**
 * Affiliate Service
 * 
 * Manages affiliate link generation, tracking, click attribution, and commission calculation.
 * Every user is automatically an affiliate - any shared link becomes trackable.
 */

import { db } from './db';
import {
  affiliateLinks,
  affiliateClicks,
  affiliateCommissions,
  affiliateWallet,
  users,
} from '@shared/schema';
import { eq, and, sum, sql } from 'drizzle-orm';

const AFFILIATE_CODE_LENGTH = 8;

/**
 * Generate random 8-character affiliate code
 * Format: UX72A91 (mix of letters and numbers)
 */
function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < AFFILIATE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create an affiliate link for a shared resource
 * If the user shares a deal, restaurant, or page, their ID is automatically tracked
 */
export async function createAffiliateLink(
  userId: string,
  resourceType: 'deal' | 'restaurant' | 'page' | 'collection' | 'search',
  sourceUrl: string,
  resourceId?: string,
) {
  // Generate unique code
  let code: string;
  let attempts = 0;
  do {
    code = generateAffiliateCode();
    const existing = await db.query.affiliateLinks.findFirst({
      where: eq(affiliateLinks.code, code),
    });
    if (!existing) break;
    attempts++;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Failed to generate unique affiliate code');
  }

  // Build full URL with ref parameter
  const separator = sourceUrl.includes('?') ? '&' : '?';
  const fullUrl = `${sourceUrl}${separator}ref=${code}`;

  const link = await db.insert(affiliateLinks).values({
    affiliateUserId: userId,
    code,
    resourceType,
    resourceId,
    sourceUrl,
    fullUrl,
  }).returning();

  return link[0];
}

/**
 * Track a click on an affiliate link
 * First-click attribution: only count if no previous conversion in this session
 */
export async function trackAffiliateClick(
  code: string,
  visitorIp: string,
  visitorUserAgent: string,
  referrerSource: string,
  sessionId: string,
) {
  // Find the affiliate link
  const link = await db.query.affiliateLinks.findFirst({
    where: eq(affiliateLinks.code, code),
  });

  if (!link) {
    return null;
  }

  // Check if this session already converted for this link (prevent double-counting)
  const existingClick = await db.query.affiliateClicks.findFirst({
    where: and(
      eq(affiliateClicks.affiliateLinkId, link.id),
      eq(affiliateClicks.sessionId, sessionId),
    ),
  });

  if (existingClick) {
    return existingClick; // Return existing, don't create duplicate
  }

  // Record the click
  const click = await db.insert(affiliateClicks).values({
    affiliateLinkId: link.id,
    visitorIp,
    visitorUserAgent,
    referrerSource,
    sessionId,
  }).returning();

  // Increment click count on affiliate link
  await db.update(affiliateLinks)
    .set({ clickCount: sql`${affiliateLinks.clickCount} + 1` })
    .where(eq(affiliateLinks.id, link.id));

  return click[0];
}

/**
 * Attribute a signup to an affiliate link via first-click
 * Called when a restaurant completes signup after clicking an affiliate link
 */
export async function attributeSignupToAffiliate(
  sessionId: string,
  restaurantUserId: string,
) {
  // Find first click in this session (first-click wins)
  const firstClick = await db.query.affiliateClicks.findFirst({
    where: and(
      eq(affiliateClicks.sessionId, sessionId),
      sql`${affiliateClicks.convertedAt} IS NULL`, // Not yet converted
    ),
    orderBy: (table) => [table.clickedAt],
    limit: 1,
  });

  if (!firstClick) {
    return null;
  }

  // Update click with conversion
  const converted = await db.update(affiliateClicks)
    .set({
      convertedAt: new Date(),
      restaurantSignupId: restaurantUserId,
    })
    .where(eq(affiliateClicks.id, firstClick.id))
    .returning();

  // Increment conversions on the link
  const click = await db.query.affiliateClicks.findFirst({
    where: eq(affiliateClicks.id, firstClick.id),
  });

  if (click) {
    await db.update(affiliateLinks)
      .set({ conversions: sql`${affiliateLinks.conversions} + 1` })
      .where(eq(affiliateLinks.id, click.affiliateLinkId));
  }

  return converted[0];
}

/**
 * Calculate and create commission when restaurant becomes a paid subscriber
 * Commission tiers:
 * - Monthly: 10% of monthly subscription ($10/month = $1 commission)
 * - 3-month: 10% of total paid upfront ($30 = $3 commission/month for 3 months)
 * - Yearly: 10% of total paid upfront ($120 = $10 commission/month for 12 months)
 */
export async function createCommission(
  affiliateUserId: string,
  restaurantUserId: string,
  subscriptionValue: string,
  billingCycle: 'month' | '3-month' | 'year',
  affiliateLinkId?: string,
) {
  const commissionPercent = 10; // 10% recurring
  const value = parseFloat(subscriptionValue);

  // Calculate commission amount based on billing cycle
  let monthlyCommission: number;
  let monthsOfCommission: number;

  if (billingCycle === 'month') {
    monthlyCommission = value * (commissionPercent / 100);
    monthsOfCommission = 1;
  } else if (billingCycle === '3-month') {
    // $30 paid upfront = $1 commission per month for 3 months
    monthlyCommission = (value / 3) * (commissionPercent / 100);
    monthsOfCommission = 3;
  } else {
    // $120 paid upfront = $10 commission per month for 12 months
    monthlyCommission = (value / 12) * (commissionPercent / 100);
    monthsOfCommission = 12;
  }

  const currentDate = new Date();
  const commissions_result: typeof affiliateCommissions.$inferSelect[] = [];

  for (let month = 0; month < monthsOfCommission; month++) {
    const commissionDate = new Date(currentDate);
    commissionDate.setMonth(commissionDate.getMonth() + month);
    const forMonth = commissionDate.toISOString().slice(0, 7); // YYYY-MM

    const commission = await db.insert(affiliateCommissions).values({
      affiliateUserId,
      restaurantUserId,
      affiliateLinkId: affiliateLinkId || undefined,
      commissionAmount: monthlyCommission.toString(),
      commissionPercent,
      basedOn: 'subscription_value',
      subscriptionValue,
      billingCycle,
      forMonth,
    }).returning();

    commissions_result.push(commission[0]);

    // Update wallet with pending commission
    await updateAffiliateWallet(affiliateUserId, {
      pendingCommissions: monthlyCommission,
    });
  }

  return commissions_result;
}

/**
 * Process pending commissions to available balance (e.g., monthly payout)
 */
export async function processPendingCommissions(forMonth: string) {
  // Find all pending commissions for this month
  const pending = await db.query.affiliateCommissions.findMany({
    where: and(
      eq(affiliateCommissions.forMonth, forMonth),
      eq(affiliateCommissions.status, 'pending'),
    ),
  });

  const updated = [];

  for (const commission of pending) {
    // Update commission status
    const updatedCommission = await db.update(affiliateCommissions)
      .set({
        status: 'paid',
        paidAt: new Date(),
      })
      .where(eq(affiliateCommissions.id, commission.id))
      .returning();

    // Move from pending to available in wallet
    const amount = parseFloat(commission.commissionAmount.toString());
    await updateAffiliateWallet(commission.affiliateUserId, {
      pendingCommissions: -amount,
      availableBalance: amount,
      totalEarned: amount,
    });

    updated.push(updatedCommission[0]);
  }

  return updated;
}

/**
 * Update affiliate wallet balances
 */
export async function updateAffiliateWallet(
  userId: string,
  updates: {
    availableBalance?: number;
    pendingCommissions?: number;
    totalEarned?: number;
    totalWithdrawn?: number;
    totalSpent?: number;
  },
) {
  // Ensure wallet exists
  let wallet = await db.query.affiliateWallet.findFirst({
    where: eq(affiliateWallet.userId, userId),
  });

  if (!wallet) {
    const created = await db.insert(affiliateWallet).values({
      userId,
    }).returning();
    wallet = created[0];
  }

  // Build update object
  const updateData: any = { updatedAt: new Date() };

  if (updates.availableBalance !== undefined) {
    const current = parseFloat(wallet.availableBalance?.toString() || '0');
    updateData.availableBalance = (current + updates.availableBalance).toString();
  }

  if (updates.pendingCommissions !== undefined) {
    const current = parseFloat(wallet.pendingCommissions?.toString() || '0');
    updateData.pendingCommissions = (current + updates.pendingCommissions).toString();
  }

  if (updates.totalEarned !== undefined) {
    const current = parseFloat(wallet.totalEarned?.toString() || '0');
    updateData.totalEarned = (current + updates.totalEarned).toString();
  }

  if (updates.totalWithdrawn !== undefined) {
    const current = parseFloat(wallet.totalWithdrawn?.toString() || '0');
    updateData.totalWithdrawn = (current + updates.totalWithdrawn).toString();
  }

  if (updates.totalSpent !== undefined) {
    const current = parseFloat(wallet.totalSpent?.toString() || '0');
    updateData.totalSpent = (current + updates.totalSpent).toString();
  }

  const updated = await db.update(affiliateWallet)
    .set(updateData)
    .where(eq(affiliateWallet.userId, userId))
    .returning();

  return updated[0];
}

/**
 * Get affiliate stats for a user
 */
export async function getAffiliateStats(userId: string) {
  const wallet = await db.query.affiliateWallet.findFirst({
    where: eq(affiliateWallet.userId, userId),
  });

  const links = await db.query.affiliateLinks.findMany({
    where: eq(affiliateLinks.affiliateUserId, userId),
  });

  const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
  const totalConversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0);

  // Get pending commissions for next 30 days
  const pendingCommissions = await db.query.affiliateCommissions.findMany({
    where: and(
      eq(affiliateCommissions.affiliateUserId, userId),
      eq(affiliateCommissions.status, 'pending'),
    ),
  });

  return {
    wallet: wallet || {
      totalEarned: 0,
      availableBalance: 0,
      pendingCommissions: 0,
      totalWithdrawn: 0,
      totalSpent: 0,
    },
    stats: {
      totalLinks: links.length,
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(2) : '0',
      pendingMonthlyCount: pendingCommissions.length,
    },
    recentLinks: links.slice(-5),
  };
}

export default {
  generateAffiliateCode,
  createAffiliateLink,
  trackAffiliateClick,
  attributeSignupToAffiliate,
  createCommission,
  processPendingCommissions,
  updateAffiliateWallet,
  getAffiliateStats,
};
