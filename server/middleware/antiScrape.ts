import { Request, Response, NextFunction } from 'express';

// Allow TradeScout crawler and common browsers; block obvious scrapers
const allowedBots = ['TradeScout', 'tradescout'];
const allowedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'OPR', 'Brave'];
const bannedSignatures = ['curl', 'python', 'wget', 'httpclient', 'libwww', 'scrapy', 'postman'];

export function antiScrape(req: Request, res: Response, next: NextFunction) {
  const ua = (req.headers['user-agent'] || '').toLowerCase();

  // Always allow API routes that require auth
  if (req.path.startsWith('/api/')) return next();

  // Allow known browser UAs
  const isBrowser = allowedBrowsers.some((b) => ua.includes(b.toLowerCase()));

  // Allow TradeScout crawler explicitly
  const isTradeScout = allowedBots.some((b) => ua.includes(b.toLowerCase()));

  // Block obvious scraper signatures
  const isBanned = bannedSignatures.some((b) => ua.includes(b));

  if (isTradeScout) return next();
  if (isBanned && !isBrowser) {
    return res.status(403).send('Scraping is not permitted.');
  }

  // Allow indexing for legitimate browsers and bots; do not set noindex
  // Keep middleware as a guard without blocking search engines
  return next();
}
