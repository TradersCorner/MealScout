import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import passport from "passport";
import { registerRoutes } from "./routes";
import actionRoutes from "./routes/actionRoutes";
import { verifyTradeScoutToken, rateLimitActions } from "./middleware/actionAuth";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { antiScrape } from "./middleware/antiScrape";
import { getSession } from "./unifiedAuth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { validateEnv } from "./utils/env";
import { healthRouter } from "./routes/health";

validateEnv();

const app = express();

// Enhanced global error handlers to prevent server crashes during deployment
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Production mode: Server continuing despite uncaught exception to maintain service availability');
    console.log('🔍 Error details logged for debugging. Service remains operational.');
  } else {
    console.error('💥 Development mode: Exiting process due to uncaught exception');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('Rejection reason:', reason);
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Production mode: Server continuing despite unhandled rejection');
    console.log('🔍 Rejection details logged for debugging. Service remains operational.');
  } else {
    console.warn('⚠️  Development mode: Unhandled rejection detected - consider adding proper error handling');
  }
});

// Enhanced graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`🔄 ${signal} received again. Forcing immediate shutdown...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(`🔄 ${signal} received. Initiating graceful shutdown...`);
  
  // Give the server a few seconds to finish processing current requests
  setTimeout(() => {
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Add warning handler for potential memory leaks
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('⚠️  Memory leak warning:', warning.message);
    console.warn('🔍 Consider investigating event listener usage');
  }
});

// Production security and performance middleware
if (process.env.NODE_ENV === "production") {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "ws:", "wss:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
}

// Anti-scrape middleware: allow TradeScout crawler, block obvious scrapers
app.use(antiScrape);

// Basic health endpoints (no auth)
app.use(healthRouter);

// CSP for development - permissive to allow Vite HMR and inline scripts
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.setHeader(
      'Content-Security-Policy', 
      "default-src 'self' data: https: http: blob:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:; " +
      "connect-src 'self' https: http: wss: ws: " +
      "https://geocoding.census.gov " +
      "https://api.zippopotam.us " +
      "https://api.bigdatacloud.net " +
      "https://nominatim.openstreetmap.org " +
      "https://ipapi.co; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' https: data:; " +
      "worker-src 'self' blob:;"
    );
    next();
  });
}

// Rate limiting middleware for sensitive endpoints
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

// Helper to create rate limit middleware
function createRateLimiter(options: { windowMs: number; maxRequests: number; keyGenerator?: (req: Request) => string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();
    
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = { count: 0, resetTime: now + options.windowMs };
    }
    
    // Reset if window expired
    if (now > rateLimitStore[key].resetTime) {
      rateLimitStore[key] = { count: 0, resetTime: now + options.windowMs };
    }
    
    rateLimitStore[key].count++;
    
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - rateLimitStore[key].count));
    res.setHeader('X-RateLimit-Reset', new Date(rateLimitStore[key].resetTime).toISOString());
    
    if (rateLimitStore[key].count > options.maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${Math.ceil((rateLimitStore[key].resetTime - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000)
      });
    }
    
    next();
  };
}

// RATE LIMIT POLICIES - Optimized per endpoint type
// Strategy: "Fast first click, slow spam" - generous for normal users, strict for attackers

// 1. Authentication endpoints - Very strict (prevent brute force)
const strictAuthLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 3, // 3 attempts max
  keyGenerator: (req) => `${req.ip}:${req.path}`
});

// 2. General authentication (moderate)
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
  keyGenerator: (req) => `${req.ip}:${req.path}`
});

// 3. Search and discovery (generous for normal users)
const searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50, // 50 searches per minute
  keyGenerator: (req) => req.ip || 'unknown'
});

// 4. Deal views and engagement (very generous)
const viewLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120, // 120 views per minute
  keyGenerator: (req) => req.ip || 'unknown'
});

// 5. Content updates (strict for restaurant owners)
const updateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 edits per hour
  keyGenerator: (req) => `${req.user?.id}:${req.path}` // Per-user limit
});

// 6. General API (moderate baseline)
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 requests per window
  keyGenerator: (req) => req.ip || 'unknown'
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  // Basic database connection test - non-blocking to prevent health check failures
  try {
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not connect to database during startup:', error instanceof Error ? error.message : String(error));
    console.log('🚀 Server will continue starting, database initialization will be performed after startup');
    
    // Log connection details for debugging (without exposing credentials)
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@');
      console.log('📋 Database URL format:', dbUrl);
    } else {
      console.warn('⚠️  DATABASE_URL environment variable not set');
    }
  }
  
  // Setup session configuration before routes
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Apply granular rate limiting - optimized per endpoint
  
  // 🔒 STRICT - Authentication (prevent brute force)
  app.use('/api/auth/forgot-password', strictAuthLimiter);
  app.use('/api/auth/reset-password', strictAuthLimiter);
  
  // 🔐 MODERATE - Auth attempts (login, signup)
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);
  app.use('/api/auth/tradescout/sso', authLimiter);
  
  // 🔍 GENEROUS - Search and discovery
  app.use('/api/restaurants/search', searchLimiter);
  app.use('/api/restaurants/nearby', searchLimiter);
  
  // 👀 VERY GENEROUS - Deal views (engagement tracking)
  app.use('/api/deals/:dealId/view', viewLimiter);
  app.use('/api/restaurants/:restaurantId/locations', viewLimiter);
  
  // ✏️  STRICT - Content updates (prevent spam editing)
  app.use('/api/deals', updateLimiter);
  app.use('/api/restaurants/:restaurantId/location', updateLimiter);
  app.use('/api/restaurants/:restaurantId/operating-hours', updateLimiter);
  app.use('/api/restaurants/:restaurantId/mobile-settings', updateLimiter);
  
  // 📞 MODERATE - General API and reports
  app.use('/api/bug-report', apiLimiter);
  
  // OAuth normalization middleware - DISABLED because it breaks OAuth flow
  // The redirect was interfering with the Passport.js OAuth flow by redirecting before authentication
  // OAuth works correctly as long as callback URLs are properly configured in Google Cloud Console
  // app.use((req, res, next) => {
  //   const publicBaseUrl = process.env.PUBLIC_BASE_URL;
  //   if (publicBaseUrl && req.path.startsWith('/api/auth/google')) {
  //     const canonicalHost = new URL(publicBaseUrl).hostname;
  //     if (req.hostname !== canonicalHost) {
  //       const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  //       const redirectUrl = `${publicBaseUrl}${req.path}${queryString}`;
  //       log(`Redirecting Google OAuth ${req.hostname} to canonical domain: ${redirectUrl}`);
  //       return res.redirect(307, redirectUrl);
  //     }
  //   }
  //   next();
  // });

    //       return res.redirect(302, redirectUrl);
  //     }
  //   }
  //   next();
  // });
  
  // Crawler-friendly static HTML routes for Facebook/Google compliance
  // MUST be registered before any SPA routing or Vite middleware
  app.get('/privacy-policy', (_req, res) => {
    console.log('🔍 Privacy policy route HIT');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - MealScout</title>
  <meta name="description" content="Learn how MealScout collects, uses, and protects your personal information.">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
    h2 { color: #1e40af; margin-top: 30px; }
    h3 { color: #1e3a8a; }
    .section { margin: 20px 0; }
    ul { margin: 10px 0; padding-left: 25px; }
    .highlight { background: #eff6ff; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated: January 13, 2025</strong></p>
  <p>How MealScout collects, uses, and protects your personal information.</p>

  <div class="section">
    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly to us, information we obtain automatically when you use our Service, and information from third parties.</p>
    
    <div class="highlight">
      <h3>Personal Information:</h3>
      <ul>
        <li>Name and email address (from account registration)</li>
        <li>Profile information from Google/Facebook OAuth</li>
        <li>Business information (for restaurant owners)</li>
        <li>Payment information (processed securely via Stripe)</li>
      </ul>
    </div>

    <div class="highlight">
      <h3>Location Data:</h3>
      <ul>
        <li>GPS coordinates for deal discovery</li>
        <li>Real-time location for food truck tracking</li>
        <li>Address information for business verification</li>
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>Provide, maintain, and improve our Service</li>
      <li>Provide location-based deal recommendations</li>
      <li>Process subscription payments and billing</li>
      <li>Enable real-time food truck tracking</li>
      <li>Verify business credentials and documents</li>
      <li>Send important service communications and updates</li>
      <li>Monitor and analyze trends, usage, and activities</li>
      <li>Detect, investigate, and prevent fraudulent activities</li>
      <li>Personalize and improve your experience</li>
    </ul>
  </div>

  <div class="section">
    <h2>3. Information Sharing</h2>
    <p>We may share your information in the following situations:</p>
    <ul>
      <li><strong>With Business Partners:</strong> General location data with restaurants</li>
      <li><strong>With Service Providers:</strong> Third-party payment processing and analytics</li>
      <li><strong>For Legal Requirements:</strong> When required by law or legal process</li>
      <li><strong>With Your Consent:</strong> When you explicitly agree</li>
      <li><strong>Aggregated Data:</strong> De-identified data that cannot be linked to individuals</li>
    </ul>
    <p><strong>We do not sell, trade, or rent your personal information to third parties.</strong></p>
  </div>

  <div class="section">
    <h2>4. Third-Party Services</h2>
    <p>Our Service integrates with:</p>
    <ul>
      <li><strong>Google OAuth:</strong> For secure authentication</li>
      <li><strong>Facebook Login:</strong> For social authentication</li>
      <li><strong>Stripe:</strong> For secure payment processing</li>
      <li><strong>BigDataCloud:</strong> For location geocoding services</li>
    </ul>
  </div>

  <div class="section">
    <h2>5. Data Security</h2>
    <p>We implement appropriate technical and organizational measures including:</p>
    <ul>
      <li>Encryption of data in transit and at rest</li>
      <li>Regular security assessments and updates</li>
      <li>Access controls and authentication requirements</li>
      <li>Secure payment processing through PCI-compliant providers</li>
      <li>Regular backups and disaster recovery procedures</li>
    </ul>
  </div>

  <div class="section">
    <h2>6. Your Rights</h2>
    <ul>
      <li>Access and update your personal information</li>
      <li>Delete your account and associated data</li>
      <li>Control location services through device settings</li>
      <li>Unsubscribe from marketing communications</li>
      <li>Request data portability (GDPR)</li>
      <li>Opt-out of data sale/sharing (CCPA)</li>
    </ul>
  </div>

  <div class="section">
    <h2>7. Data Retention</h2>
    <ul>
      <li><strong>Account Information:</strong> Until deletion, plus 30 days</li>
      <li><strong>Payment Information:</strong> As required by law (typically 7 years)</li>
      <li><strong>Location Data:</strong> Anonymized after 90 days</li>
      <li><strong>Analytics Data:</strong> Aggregated data may be retained indefinitely</li>
    </ul>
  </div>

  <div class="section">
    <h2>8. Contact Us</h2>
    <div class="contact">
      <p><strong>Email:</strong> <a href="mailto:info.mealscout@gmail.com">info.mealscout@gmail.com</a></p>
      <p><strong>Phone:</strong> <a href="tel:+19856626247">(985) 662-6247</a></p>
      <p>We will respond to your inquiry within 30 days.</p>
    </div>
  </div>

  <p style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;">
    <small>This Privacy Policy is compliant with GDPR, CCPA/CPRA, and other major privacy regulations.</small>
  </p>

  <p style="text-align: center; margin-top: 30px;">
    <a href="https://mealscout.us" style="color: #2563eb; text-decoration: none;">← Back to MealScout</a>
  </p>
</body>
</html>
    `);
  });

  app.get('/data-deletion', (_req, res) => {
    console.log('🔍 Data deletion route HIT');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Deletion Instructions - MealScout</title>
  <meta name="description" content="Learn how to request deletion of your personal data from MealScout.">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px; }
    h2 { color: #b91c1c; margin-top: 30px; }
    .section { margin: 20px 0; }
    ul, ol { margin: 10px 0; padding-left: 25px; }
    .highlight { background: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0; }
    .contact { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .warning { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
  </style>
</head>
<body>
  <h1>Data Deletion Instructions</h1>
  <p><strong>Last updated: January 13, 2025</strong></p>
  <p>How to request deletion of your personal data from MealScout</p>

  <div class="section">
    <h2>Quick Account Deletion</h2>
    <p>You can delete your MealScout account directly from your profile settings:</p>
    
    <div class="highlight">
      <h3>Self-Service Deletion:</h3>
      <ol>
        <li>Log into your MealScout account</li>
        <li>Navigate to Profile → Settings</li>
        <li>Scroll to "Account Management"</li>
        <li>Click "Delete Account"</li>
        <li>Confirm deletion by typing your email address</li>
      </ol>
      <p class="warning">⚠️ This action is permanent and cannot be undone.</p>
    </div>
  </div>

  <div class="section">
    <h2>Manual Deletion Request</h2>
    <p>If you're unable to access your account, contact us directly:</p>
    
    <div class="contact">
      <h3>Contact Information:</h3>
      <p><strong>Email:</strong> <a href="mailto:privacy@mealscout.com">privacy@mealscout.com</a></p>
      <p><strong>General Support:</strong> <a href="mailto:info.mealscout@gmail.com">info.mealscout@gmail.com</a></p>
      <p><strong>Subject Line:</strong> "Data Deletion Request"</p>
    </div>
  </div>

  <div class="section">
    <h2>Required Information</h2>
    <p>To process your deletion request, please provide:</p>
    <ul>
      <li>Full name associated with your account</li>
      <li>Email address used for registration</li>
      <li>Phone number (if provided)</li>
      <li>Reason for deletion (optional but helpful)</li>
      <li>Any additional account identifiers</li>
    </ul>
  </div>

  <div class="section">
    <h2>What Gets Deleted</h2>
    <div class="highlight">
      <h3>Personal Data Removed:</h3>
      <ul>
        <li>Profile information and photos</li>
        <li>Email address and contact details</li>
        <li>Location data and preferences</li>
        <li>Order history and favorites</li>
        <li>Reviews and ratings</li>
        <li>Payment information</li>
        <li>Communication records</li>
      </ul>
    </div>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
      <h3>Data We May Retain:</h3>
      <ul>
        <li>Anonymous usage analytics</li>
        <li>Financial records (tax requirements)</li>
        <li>Legal compliance data</li>
        <li>Fraud prevention records</li>
      </ul>
      <p><small>*Retained data is anonymized and cannot be linked back to you</small></p>
    </div>
  </div>

  <div class="section">
    <h2>Deletion Timeline</h2>
    <div class="highlight">
      <ol>
        <li><strong>Immediate:</strong> Account access disabled</li>
        <li><strong>Within 7 days:</strong> Personal data removed from active systems</li>
        <li><strong>Within 30 days:</strong> Data purged from backups</li>
        <li><strong>Confirmation:</strong> Email notification when deletion is complete</li>
      </ol>
    </div>
  </div>

  <div class="section">
    <h2>Facebook Login Data</h2>
    <p>If you signed up using Facebook Login, deleting your MealScout account will:</p>
    <ul>
      <li>Remove all data MealScout obtained from Facebook</li>
      <li>Revoke MealScout's access to your Facebook account</li>
      <li>Delete any Facebook-sourced profile information</li>
      <li>Remove integration with Facebook's sharing features</li>
    </ul>
    <p><small>Note: This does not affect your Facebook account itself. To fully disconnect, also revoke MealScout's permissions in your Facebook app settings.</small></p>
  </div>

  <div class="section">
    <h2>Need Help?</h2>
    <div class="contact">
      <p><strong>Privacy Team:</strong> privacy@mealscout.com</p>
      <p><strong>Support Team:</strong> info.mealscout@gmail.com</p>
      <p>We typically respond to deletion requests within 1-2 business days.</p>
    </div>
  </div>

  <p style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;">
    <small>This page complies with GDPR, CCPA, and other privacy regulations. You have the right to request deletion of your personal data at any time.</small>
  </p>

  <p style="text-align: center; margin-top: 30px;">
    <a href="https://mealscout.us" style="color: #dc2626; text-decoration: none;">← Back to MealScout</a>
  </p>
</body>
</html>
    `);
  });
  
  // ==================== ACTION API FOR TRADESCOUT LLM ====================
  // Unified endpoint that TradeScout LLM calls to perform actions
  // Requires authentication via TRADESCOUT_API_TOKEN
  app.use("/api/actions", rateLimitActions, verifyTradeScoutToken, actionRoutes);
  
  const server = await registerRoutes(app);

  // Setup WebSocket server for food truck GPS tracking
  setupWebSocketServer(server);
  console.log("[express] WebSocket server initialized for food truck tracking");

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging
    console.error('❌ Express error middleware:', err);
    
    // Send response if not already sent
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // Don't throw after responding to avoid triggering uncaughtException
    // In production, log and continue; in development, we can be more strict
    if (process.env.NODE_ENV !== 'production') {
      console.error('💥 Development error - check logs above');
    }
  });

  // Root endpoint health guard - handles health checks while preserving SPA functionality  
  app.use('/', (req, res, next) => {
    // Only handle root path, let other paths go through
    if (req.path !== '/') {
      return next();
    }

    // Handle HEAD requests (common for health checks) - always return 200
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    // Handle GET requests based on Accept header
    if (req.method === 'GET') {
      const acceptHeader = req.get('Accept') || '';
      
      // If not requesting HTML, return JSON status (for API health checks)
      if (!acceptHeader.includes('text/html')) {
        return res.status(200).json({ 
          status: 'ok', 
          service: 'MealScout API',
          timestamp: new Date().toISOString()
        });
      }

      // For HTML requests in development, always let Vite handle it
      if (app.get("env") === "development") {
        return next();
      }

      // For HTML requests in production, check if built frontend exists
      // Use the same path logic as serveStatic function in vite.ts
      const indexPath = path.resolve(process.cwd(), 'dist', 'public', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        // SPA build exists, let serveStatic handle it
        return next();
      } else {
        // No build available, return minimal HTML fallback with 200 status
        res.status(200).set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }).send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>MealScout</title>
            </head>
            <body>
              <h1>MealScout</h1>
              <p>Service is running successfully.</p>
              <p>Status: OK</p>
              <p><a href="/health">Health Check</a></p>
            </body>
          </html>
        `);
        return;
      }
    }

    // For other methods, continue to next middleware
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  }
  // Production: frontend is served by Vercel, backend is API-only

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`[express] serving on port ${port}`);
    
    // Initialize database data after server startup - truly non-blocking
    setImmediate(async () => {
      try {
        await storage.ensureAdminExists();
        await storage.seedDevelopmentData();
        console.log('✅ Database initialization completed successfully');
      } catch (error) {
        console.warn('⚠️  Warning: Could not initialize storage after startup:', error instanceof Error ? error.message : String(error));
        console.warn('⚠️  Some features may not work properly until database is initialized');
      }
    });
    
    // Perform database validation after server startup - non-blocking
    setTimeout(async () => {
      try {
        const schemaCheck = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'phone'
        `);
        
        if (schemaCheck.rows.length === 0) {
          console.error('❌ CRITICAL: phone column missing from users table!');
          console.error('Database URL:', process.env.DATABASE_URL?.split('@')[0] + '@...');
          // Don't exit process in production - log error and continue
          if (process.env.NODE_ENV === 'production') {
            console.warn('⚠️  Server will continue running despite database schema issues');
          }
        } else {
          console.log('✅ Schema validation: phone column exists');
        }
      } catch (error) {
        console.error('❌ Schema validation failed:', error instanceof Error ? error.message : String(error));
        console.warn('⚠️  Server will continue running despite database validation failure');
      }
    }, 1000); // Delay 1 second to allow server to fully start
  });
})();
