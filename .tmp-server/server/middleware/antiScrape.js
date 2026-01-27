// Allow TradeScout crawler and common browsers; block obvious scrapers
var allowedBots = ['TradeScout', 'tradescout'];
var allowedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'OPR', 'Brave'];
var bannedSignatures = ['curl', 'python', 'wget', 'httpclient', 'libwww', 'scrapy', 'postman'];
export function antiScrape(req, res, next) {
    var ua = (req.headers['user-agent'] || '').toLowerCase();
    // Always allow API routes that require auth
    if (req.path.startsWith('/api/'))
        return next();
    // Allow known browser UAs
    var isBrowser = allowedBrowsers.some(function (b) { return ua.includes(b.toLowerCase()); });
    // Allow TradeScout crawler explicitly
    var isTradeScout = allowedBots.some(function (b) { return ua.includes(b.toLowerCase()); });
    // Block obvious scraper signatures
    var isBanned = bannedSignatures.some(function (b) { return ua.includes(b); });
    if (isTradeScout)
        return next();
    if (isBanned && !isBrowser) {
        return res.status(403).send('Scraping is not permitted.');
    }
    // Allow indexing for legitimate browsers and bots; do not set noindex
    // Keep middleware as a guard without blocking search engines
    return next();
}
