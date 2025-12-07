/**
 * PHASE 7: Share Anything = Affiliate Link Middleware
 * 
 * Global middleware that appends ?ref=<userId> to any shared URL
 * 
 * Catches:
 * - Share links
 * - Copy link
 * - Social share (SMS, email, etc)
 * - QR codes
 * - Restaurant profiles
 * - Deal pages
 * - Home page
 */

import { appendReferralParam } from './referralService';

/**
 * Generate shareable URL with affiliate param
 * 
 * Can be used for:
 * - Restaurant pages: /restaurants/:id
 * - Deal pages: /deals/:id
 * - Searches: /search?q=pizza
 * - County pages: /counties/san_diego/ca
 * - Collection pages: /collections/best-of-town
 * - Any other page
 */
export function generateShareableUrl(
  path: string,
  baseUrl: string,
  userId?: string,
): string {
  // Build full URL
  const fullUrl = baseUrl.startsWith('http')
    ? `${baseUrl}${path}`
    : `${baseUrl}${path}`;

  // Append affiliate param if user is logged in
  if (!userId) {
    return fullUrl;
  }

  return appendReferralParam(fullUrl, userId);
}

/**
 * Express middleware to add shareUrl to res.locals
 * 
 * Makes generateShareableUrl available in all route handlers
 * Usage: res.locals.generateShareableUrl(path)
 */
export function shareUrlMiddleware(req: any, res: any, next: any) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.locals.generateShareableUrl = (path: string) => {
    return generateShareableUrl(path, baseUrl, req.user?.id);
  };

  res.locals.appendAffiliateParam = (url: string) => {
    if (!req.user?.id) return url;
    return appendReferralParam(url, req.user.id);
  };

  next();
}

/**
 * API endpoint to generate share links
 * 
 * Called by frontend when user clicks share
 */
export async function generateShareLink(
  path: string,
  baseUrl: string,
  userId?: string,
): Promise<{
  shareLink: string;
  shortPath: string;
}> {
  const shareLink = generateShareableUrl(path, baseUrl, userId);

  return {
    shareLink,
    shortPath: path,
  };
}

export default {
  generateShareableUrl,
  shareUrlMiddleware,
  generateShareLink,
};
