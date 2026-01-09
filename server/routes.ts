import type { Express } from "express";
import { createServer, type Server } from "http";
import cron from "node-cron";
import { DigestService } from "./digestService";
import { notifyUnbookedEvents } from "./eventNotificationCron";
import Stripe from "stripe";
import { storage } from "./storage";
import { getHostByUserId, getEventAndHostForUser, getInterestEventAndHostForUser, hostOwnsEvent } from "./services/hostOwnership";
import { assertMaxSpan180Days, generateOccurrences, filterFutureOccurrences } from "./services/openCallSeries";
import { computeAcceptedCount, shouldBlockAcceptance, buildCapacityFullError, computeFillRate } from "./services/interestDecision";
import { registerHostRoutes } from "./routes/hostRoutes";
import { registerOpenCallSeriesRoutes } from "./routes/openCallSeriesRoutes";
import { registerEventRoutes } from "./routes/eventRoutes";
import { registerAdminManagementRoutes } from "./routes/adminManagementRoutes";
import { registerStaffRoutes } from "./staffRoutes";
import { setupUnifiedAuth, isAuthenticated, isRestaurantOwner, isRestaurantOwnerOrAdmin, isAdmin, verifyResourceOwnership } from "./unifiedAuth";
import { emailService } from "./emailService";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema, insertVerificationRequestSchema, insertDealViewSchema, insertFoodTruckLocationSchema, updateRestaurantMobileSettingsSchema, insertFoodTruckSessionSchema, insertRestaurantFavoriteSchema, insertRestaurantRecommendationSchema, insertUserAddressSchema, insertPasswordResetTokenSchema, updateRestaurantLocationSchema, updateRestaurantOperatingHoursSchema, insertDealFeedbackSchema, insertLocationRequestSchema, insertTruckInterestSchema, insertHostSchema, insertEventSchema, insertEventSeriesSchema, insertEventInterestSchema, type User, type InsertEvent, deals, events, eventSeries, insertImageUploadSchema, insertAwardHistorySchema, imageUploads, passwordResetTokens, users, restaurants, awardHistory } from "@shared/schema";
import { z } from "zod";
import { validateDocuments, checkRateLimit } from "./documentValidation";
import { randomBytes, timingSafeEqual, createHash } from "crypto";
import { upload, uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from "./imageUpload";
import { 
  calculateUserInfluenceScore, 
  checkGoldenForkEligibility, 
  awardGoldenFork,
  calculateRestaurantRankingScore,
  awardGoldenPlatesForArea,
  getAreaLeaderboard,
  getUserRecommendationCount,
} from "./awardCalculations";
import { 
  sendGoldenForkAwardEmail,
  sendGoldenPlateAwardEmail,
  sendDealClaimedNotification,
  sendWelcomeEmail,
  sendTruckInterestNotification
} from "./emailNotifications";

// SECURITY AUDIT STATUS
// ✅ All critical endpoints require authentication
// ✅ Rate limiting applied to sensitive endpoints (login, password reset, bug reports)
// ✅ Password reset tokens stored in database (persistent across restarts)
// ✅ Database-backed rate limiting prevents brute force attacks
// ✅ Drizzle ORM prevents SQL injection
// ⚠️  Recommendation: Add admin role checks for critical operations
// ⚠️  Recommendation: Add API key authentication for service-to-service communication

// Environment validation - ensures critical configuration is present at startup
function validateRequiredEnv() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    const errorMsg = `❌ FATAL: Missing required environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(errorMsg);
    }
  }
  
  // Validate ALLOWED_ORIGINS format if set
  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    if (origins.length === 0) {
      console.warn('⚠️  ALLOWED_ORIGINS is empty, using default: http://localhost:5000');
    } else {
      console.log('✅ ALLOWED_ORIGINS configured:', origins.join(', '));
    }
  } else {
    console.warn('⚠️  ALLOWED_ORIGINS not set, defaulting to: http://localhost:5000');
  }
}

// Validate environment at module load time
validateRequiredEnv();

import bcrypt from "bcryptjs";
import auditLogger, { logAudit } from "./auditLogger";
import incidentManager, { createIncident, ANOMALY_RULES } from "./incidentManager";
import { vacEvaluateRestaurantSignup } from "./vacLite";
import { broadcastLocationUpdate, broadcastStatusUpdate } from "./websocket";
import { db } from "./db";
import { and, inArray, eq, sql, gte, desc, like } from "drizzle-orm";
import { registerStoryCronJobs } from "./storiesCronJobs";

// Optional Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Beta mode flag - when enabled, all users get free access to all features
// Defaults to false - set BETA_MODE=true to enable (NOT recommended for production)
const BETA_MODE = process.env.BETA_MODE === 'true';

console.log('🎯 BETA_MODE is', BETA_MODE ? 'ENABLED ✅' : 'DISABLED ❌');
console.log('🎯 process.env.BETA_MODE =', process.env.BETA_MODE);

// Production safety check: warn if beta mode is enabled in production
if (process.env.NODE_ENV === 'production' && BETA_MODE) {
  console.warn('⚠️  WARNING: BETA_MODE is enabled in production environment! All users will have free access to premium features.');
}

// Pricing helpers: lock-in logic + Stripe Price IDs
const PROMO_DEADLINE = new Date('2026-03-01T00:00:00Z');

async function getLockedPriceForUser(userId: string): Promise<{
  locked: boolean;
  priceId: string;
  label: string;
}> {
  const price25 = process.env.PRICE_MONTHLY_25;
  const price50 = process.env.PRICE_MONTHLY_50;
  if (!price25 || !price50) {
    throw new Error('Stripe Price IDs not configured (PRICE_MONTHLY_25 / PRICE_MONTHLY_50)');
  }

  const user = await storage.getUser(userId);
  const signupDate = user?.subscriptionSignupDate || null;
  const locked = !!(signupDate && signupDate < PROMO_DEADLINE);
  const priceId = locked ? price25 : price50;
  const label = locked ? 'locked-in $25' : 'standard $50';
  return { locked, priceId, label };
}

// Password reset rate limiting - database-backed for persistence across server restarts
async function checkPasswordResetRateLimit(userId: string): Promise<{ allowed: boolean; nextAllowedTime?: Date; remainingAttempts?: number }> {
  const fifteenMinutes = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3; // Max 3 attempts per 15 minutes
  const cutoffTime = new Date(Date.now() - fifteenMinutes);
  
  // Clean up expired tokens
  await storage.deleteExpiredResetTokens();
  
  // Get recent reset attempts
  const user = await storage.getUser(userId);
  if (!user) {
    return { allowed: false, nextAllowedTime: undefined, remainingAttempts: 0 };
  }
  
  // Count recent password reset attempts (by checking passwordResetTokens table)
  const recentAttempts = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        gte(passwordResetTokens.createdAt, cutoffTime)
      )
    );
  
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = recentAttempts[0].createdAt;
    const nextAllowedTime = new Date(oldestAttempt.getTime() + fifteenMinutes);
    
    // Trigger anomaly detection incident
    await createIncident({
      ruleId: ANOMALY_RULES.PASSWORD_RESET_ABUSE.id,
      severity: ANOMALY_RULES.PASSWORD_RESET_ABUSE.severity,
      userId,
      metadata: { attempts: recentAttempts.length, cutoffTime },
    });
    
    return {
      allowed: false,
      nextAllowedTime,
      remainingAttempts: 0
    };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - recentAttempts.length 
  };
}

// Environment validation for production - BLOCKING to prevent startup with missing config
function validateEnvironment() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    const errorMsg = `❌ FATAL: Missing required environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Production mode: Cannot start without required configuration');
      process.exit(1);
    } else {
      console.warn('⚠️  Development mode: Server starting with incomplete configuration. This may cause runtime errors.');
    }
    return false;
  }
  console.log('✅ All required environment variables present');
  return true;
}

// Subscription validation function for analytics access
async function validateAnalyticsAccess(userId: string): Promise<{
  hasAccess: boolean;
  error?: string;
  subscriptionTier?: string;
}> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { hasAccess: false, error: "User not found" };
    }

    // During beta testing, all users get free access to analytics
    if (BETA_MODE) {
      return { hasAccess: true, subscriptionTier: "beta" };
    }

    // Check if user has beta access (free analytics for beta users)
    if (user.subscriptionBillingInterval && !user.stripeSubscriptionId) {
      // Beta user - allow analytics access
      return { hasAccess: true, subscriptionTier: "beta" };
    }

    // Check if user has active subscription
    if (!stripe || !user.stripeSubscriptionId) {
      return { 
        hasAccess: false, 
        error: "Premium subscription required to access analytics. Please upgrade your plan.",
        subscriptionTier: "free"
      };
    }

    // Verify subscription status with Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return { 
        hasAccess: false, 
        error: "Your subscription is not active. Please check your payment method and try again.",
        subscriptionTier: "inactive"
      };
    }

    // Return subscription tier (monthly only)
    return { 
      hasAccess: true, 
      subscriptionTier: 'monthly'
    };
  } catch (error) {
    console.error("Analytics access validation error:", error);
    return { 
      hasAccess: false, 
      error: "Unable to verify subscription status. Please try again.",
      subscriptionTier: "error"
    };
  }
}

// Subscription validation function - Now allows unlimited deals for all paid subscriptions
async function validateSubscriptionLimits(userId: string, excludeDealId?: string): Promise<{
  isValid: boolean;
  error?: string;
  currentCount?: number;
  maxDeals?: number;
}> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { isValid: false, error: "User not found" };
    }

    console.log('🔍 validateSubscriptionLimits - BETA_MODE:', BETA_MODE);
    console.log('🔍 validateSubscriptionLimits - User ID:', userId);

    // During beta testing, all users get unlimited deals
    if (BETA_MODE) {
      console.log('✅ BETA_MODE enabled - granting unlimited deals');
      return { isValid: true, currentCount: 0, maxDeals: 999 };
    }

    // Check if user has beta access (free)
    if (user.subscriptionBillingInterval && !user.stripeSubscriptionId) {
      // Beta user - allow unlimited deals for now
      return { isValid: true, currentCount: 0, maxDeals: 999 };
    }

    // Check if user has active subscription
    if (!stripe) {
      return { 
        isValid: false, 
        error: "Active subscription required to create deals. Please upgrade your plan.",
        currentCount: 0,
        maxDeals: 0
      };
    }

    const subscriptionId = user.stripeSubscriptionId || user.stripeCustomerId;
    
    // Removed legacy billing interval checks
    // Only monthly billing supported
    const validIntervals = ['month'];
    const intervalCount = 1;
    
    if (!subscriptionId) {
      return { 
        isValid: false, 
        error: "Active subscription required to create deals. Please upgrade your plan.",
        currentCount: 0,
        maxDeals: 0
      };
    }

    // Verify subscription status with Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return { 
        isValid: false, 
        error: "Your subscription is not active. Please check your payment method and try again.",
        currentCount: 0,
        maxDeals: 0
      };
    }

    // Get user's restaurants and count active deals (for reporting purposes)
    const restaurants = await storage.getRestaurantsByOwner(userId);
    let activeDealsCount = 0;
    
    for (const restaurant of restaurants) {
      const deals = await storage.getDealsByRestaurant(restaurant.id);
      const activeDeals = deals.filter(d => d.isActive && (!excludeDealId || d.id !== excludeDealId));
      activeDealsCount += activeDeals.length;
    }

    // All paid subscriptions now get unlimited deals
    const maxDeals = 999; // Unlimited deals for all paid plans

    return { 
      isValid: true, 
      currentCount: activeDealsCount, 
      maxDeals 
    };
  } catch (error) {
    console.error("Subscription validation error:", error);
    return { 
      isValid: false, 
      error: "Unable to verify subscription status. Please try again.",
      currentCount: 0,
      maxDeals: 0
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint - responds immediately with 200 for deployment health checks
  app.get('/health', (_req, res) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'MealScout API'
    });
  });

  // Static HTML routes for crawlers (Facebook, Google) - must come before SPA routes
  // These serve crawler-friendly HTML with content embedded directly in the page
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

  // Validate environment in production - log issues but don't block startup
  if (process.env.NODE_ENV === 'production') {
    const envValid = validateEnvironment();
    if (!envValid) {
      console.log('🚀 Server starting despite environment validation issues to allow health checks');
    }
  }

  // Auth middleware
  await setupUnifiedAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Password reset endpoints
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      await logAudit(
        undefined,
        'password_reset_request',
        'user',
        req.body.email,
        req.ip,
        req.headers['user-agent'],
        { email: req.body.email }
      );
      // Validate request body
      const schema = z.object({
        email: z.string().email("Valid email is required").toLowerCase(),
      });
      
      const { email } = schema.parse(req.body);
      
      // Look up user by email (do this once upfront)
      const user = await storage.getUserByEmail(email);
      
      // Rate limiting by user ID for security
      if (user) {
        const rateLimit = await checkPasswordResetRateLimit(user.id);
        
        if (!rateLimit.allowed) {
          const resetTimeMinutes = Math.ceil((rateLimit.nextAllowedTime!.getTime() - Date.now()) / (1000 * 60));
          return res.status(429).json({
            error: "Too many password reset attempts",
            message: `Please try again in ${resetTimeMinutes} minutes`,
            nextAllowedTime: rateLimit.nextAllowedTime
          });
        }
      }
      
      // Check if email service is available
      if (!emailService.isAvailable()) {
        console.error("Password reset failed: Email service not configured");
        // Still return success to prevent account enumeration
        return res.json({ 
          success: true, 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }
      
      if (user && user.passwordHash) {
        // Only allow password reset for users with email/password authentication
        try {
          // Clean up existing tokens for this user
          await storage.deleteUserResetTokens(user.id);
          
          // Generate secure token: tokenId.randomVerifier
          const tokenId = randomBytes(16).toString('hex');
          const verifier = randomBytes(32).toString('hex');
          const fullToken = `${tokenId}.${verifier}`;
          
          // Hash the verifier for secure storage using SHA-256 for exact lookup capability
          const tokenHash = createHash('sha256').update(verifier).digest('hex');
          
          // Token expires in 1 hour
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          
          // Get client info
          const clientIp = req.ip;
          const userAgent = req.headers['user-agent'] || '';
          
          // Store token in database
          const tokenData = insertPasswordResetTokenSchema.parse({
            userId: user.id,
            tokenHash,
            expiresAt,
            requestIp: clientIp,
            userAgent: userAgent.substring(0, 500), // Truncate to fit DB constraint
          });
          
          await storage.createPasswordResetToken(tokenData);
          
          // Create reset URL with full token
          const resetUrl = `${req.get('Origin') || req.protocol + '://' + req.get('host')}/reset-password?token=${encodeURIComponent(fullToken)}`;
          
          // Send password reset email
          const emailSent = await emailService.sendPasswordResetEmail(user, resetUrl);
          
          if (!emailSent) {
            console.error("Failed to send password reset email for user:", user.email);
          }
          
        } catch (error) {
          console.error("Error processing password reset for user:", user.email, error);
          // Don't expose error details
        }
      }
      
      // Always return success to prevent account enumeration
      res.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent."
      });
      
    } catch (error) {
      console.error("Password reset request error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid request", 
          message: "Valid email is required",
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          error: "Internal server error", 
          message: "Unable to process password reset request" 
        });
      }
    }
  });

  app.get('/api/auth/reset-password/validate', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({
          valid: false,
          error: "Token is required"
        });
      }
      
      // Parse token format: tokenId.verifier
      const tokenParts = token.split('.');
      if (tokenParts.length !== 2) {
        return res.status(400).json({
          valid: false,
          error: "Invalid token format"
        });
      }
      
      const [tokenId, verifier] = tokenParts;
      
      if (!tokenId || !verifier || 
          tokenId.length !== 32 || verifier.length !== 64 ||
          !/^[a-f0-9]+$/.test(tokenId) || !/^[a-f0-9]+$/.test(verifier)) {
        return res.status(400).json({
          valid: false,
          error: "Invalid token format"
        });
      }
      
      try {
        // Hash the verifier for database lookup using SHA-256
        const verifierHash = createHash('sha256').update(verifier).digest('hex');
        
        // Look up the token in the database
        const tokenRecord = await storage.getPasswordResetTokenByTokenHash(verifierHash);
        
        // Return validation result with timing-safe response
        const isValid = !!tokenRecord;
        
        res.json({
          valid: isValid
        });
        
      } catch (error) {
        console.error("Token validation error:", error);
        res.json({
          valid: false,
          error: "Invalid token"
        });
      }
      
    } catch (error) {
      console.error("Reset password validation error:", error);
      res.status(500).json({
        valid: false,
        error: "Unable to validate token"
      });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      // Validate request body
      const schema = z.object({
        token: z.string().min(1, "Token is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      });
      
      const { token, password } = schema.parse(req.body);
      
      // Parse token format: tokenId.verifier
      const tokenParts = token.split('.');
      if (tokenParts.length !== 2) {
        return res.status(400).json({
          success: false,
          error: "Invalid token format"
        });
      }
      
      const [tokenId, verifier] = tokenParts;
      
      if (!tokenId || !verifier || 
          tokenId.length !== 32 || verifier.length !== 64 ||
          !/^[a-f0-9]+$/.test(tokenId) || !/^[a-f0-9]+$/.test(verifier)) {
        return res.status(400).json({
          success: false,
          error: "Invalid token format"
        });
      }
      
      try {
        // Hash the verifier for database lookup using SHA-256
        const verifierHash = createHash('sha256').update(verifier).digest('hex');
        
        // Look up the token in the database
        const tokenRecord = await storage.getPasswordResetTokenByTokenHash(verifierHash);
        
        if (!tokenRecord) {
          return res.status(400).json({
            success: false,
            error: "Invalid or expired token"
          });
        }
        
        // Get the user for this token
        const user = await storage.getUser(tokenRecord.userId);
        
        if (!user || !user.passwordHash) {
          return res.status(400).json({
            success: false,
            error: "Invalid user account or authentication method"
          });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update the user's password - we need to use the updateUser method or create a new one
        // Since updateUser might not handle passwordHash, we'll need to use the upsertUser method
        await storage.upsertUser({
          id: user.id,
          userType: user.userType,
          email: user.email!,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          passwordHash: hashedPassword,
          emailVerified: user.emailVerified,
          facebookId: user.facebookId,
          facebookAccessToken: user.facebookAccessToken,
          googleId: user.googleId,
          googleAccessToken: user.googleAccessToken,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId,
          subscriptionBillingInterval: user.subscriptionBillingInterval,
          birthYear: user.birthYear,
          gender: user.gender,
          postalCode: user.postalCode,
        });
        
        // Mark the token as used
        await storage.markPasswordResetTokenUsed(tokenRecord.id);
        
        // Clean up any other reset tokens for this user for security
        await storage.deleteUserResetTokens(user.id);
        
        res.json({
          success: true,
          message: "Password has been successfully reset"
        });
        
      } catch (error) {
        console.error("Password reset error:", error);
        return res.status(400).json({
          success: false,
          error: "Invalid or expired token"
        });
      }
      
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid request",
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Unable to reset password"
        });
      }
    }
  });

  // User address routes
  app.get('/api/user/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching user addresses:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post('/api/user/addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const addressData = insertUserAddressSchema.parse({
        ...req.body,
        userId,
      });
      
      const address = await storage.createUserAddress(addressData);
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid address data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create address" });
      }
    }
  });

  app.put('/api/user/addresses/:addressId', isAuthenticated, async (req: any, res) => {
    try {
      const { addressId } = req.params;
      const userId = req.user.id;
      
      // Verify the address belongs to the user
      const existingAddress = await storage.getUserAddress(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      const updates = insertUserAddressSchema.partial().parse(req.body);
      const updatedAddress = await storage.updateUserAddress(addressId, updates);
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid address data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update address" });
      }
    }
  });

  app.delete('/api/user/addresses/:addressId', isAuthenticated, async (req: any, res) => {
    try {
      const { addressId } = req.params;
      const userId = req.user.id;
      
      // Verify the address belongs to the user
      const existingAddress = await storage.getUserAddress(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      await storage.deleteUserAddress(addressId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  app.post('/api/user/addresses/:addressId/set-default', isAuthenticated, async (req: any, res) => {
    try {
      const { addressId } = req.params;
      const userId = req.user.id;
      
      // Verify the address belongs to the user
      const existingAddress = await storage.getUserAddress(addressId);
      if (!existingAddress || existingAddress.userId !== userId) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      await storage.setDefaultAddress(userId, addressId);
      res.status(200).json({ message: "Default address updated" });
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ message: "Failed to set default address" });
    }
  });

  // Host location request routes
  app.post('/api/location-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const parsed = insertLocationRequestSchema.parse({
        ...req.body,
        postedByUserId: userId,
      });

      const created = await storage.createLocationRequest(parsed);
      res.status(201).json({ message: 'Location request submitted', request: created });
    } catch (error: any) {
      console.error('Error creating location request:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid location request data', errors: error.errors });
      }
      res.status(400).json({ message: error.message || 'Failed to create location request' });
    }
  });

  app.post('/api/location-requests/:id/interests', isRestaurantOwner, async (req: any, res) => {
    try {
      const { id: locationRequestId } = req.params;
      const { restaurantId, message } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID is required' });
      }

      const ownsRestaurant = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!ownsRestaurant) {
        return res.status(403).json({ message: 'You can only respond for restaurants you own' });
      }

      const parsed = insertTruckInterestSchema.parse({
        locationRequestId,
        restaurantId,
        message,
      });

      const result = await storage.createTruckInterest(parsed);
      await sendTruckInterestNotification(result.locationRequest, restaurantId, message);

      res.status(201).json({ message: 'Interest sent to host', interestId: result.interestId });
    } catch (error: any) {
      console.error('Error expressing truck interest:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid truck interest data', errors: error.errors });
      }

      if (error.message === 'Location request not found') {
        return res.status(404).json({ message: 'Location request not found' });
      }
      if (error.message === 'Location request is not open') {
        return res.status(400).json({ message: 'Location request is not accepting new interest' });
      }

      res.status(500).json({ message: 'Failed to submit interest' });
    }
  });

  // Host Profile & Events
  registerHostRoutes(app);

  // =====================================================================
  // EVENT SERIES (OPEN CALLS) ENDPOINTS
  // =====================================================================
  registerOpenCallSeriesRoutes(app);

  // =====================================================================
  // END EVENT SERIES ENDPOINTS
  // ====================================================================

  // Truck Discovery
  registerEventRoutes(app);

  app.patch('/api/hosts/interests/:interestId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { interestId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Verify host owns the event associated with this interest
      const { interest, event, host } = await getInterestEventAndHostForUser(interestId, userId);

      if (!interest) {
        return res.status(404).json({ message: 'Interest not found' });
      }

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!hostOwnsEvent(host, event)) {
        return res.status(403).json({ message: 'Not authorized to manage this event' });
      }

      // Idempotency Check: If already in desired status, return success
      if (interest.status === status) {
        return res.json(interest);
      }

      // CAPACITY GUARD v2.2
      // If hard cap is enabled, block acceptance if full
      if (status === 'accepted' && event.hardCapEnabled) {
        const currentInterests = await storage.getEventInterestsByEventId(event.id);
        // Note: interest.status is definitely NOT 'accepted' here due to idempotency check above
        const acceptedCount = computeAcceptedCount(currentInterests);

        if (shouldBlockAcceptance({
          hardCapEnabled: event.hardCapEnabled,
          acceptedCount,
          maxTrucks: event.maxTrucks,
        })) {
          // Telemetry: Blocked Attempt
          await storage.createTelemetryEvent({
            eventName: 'interest_accept_blocked',
            userId: req.user.id,
            properties: {
              eventId: event.id,
              truckId: interest.truckId,
              reason: 'capacity_guard_limit_reached',
              maxTrucks: event.maxTrucks,
              acceptedCount
            }
          });

          const capacityError = buildCapacityFullError();

          return res.status(400).json(capacityError);
        }
      }

      const updatedInterest = await storage.updateEventInterestStatus(interestId, status);

      // Send notification to truck (fire and forget)
      (async () => {
        try {
          // Telemetry: Interest Status Changed
          const allInterests = await storage.getEventInterestsByEventId(event.id);
          const acceptedCount = computeAcceptedCount(allInterests);
          const isOverCap = acceptedCount >= event.maxTrucks;

          await storage.createTelemetryEvent({
            eventName: status === 'accepted' ? 'interest_accepted' : 'interest_declined',
            userId: req.user.id,
            properties: {
              eventId: event.id,
              truckId: interest.truckId,
              fillRate: computeFillRate({ acceptedCount, maxTrucks: event.maxTrucks }),
              acceptedCount,
              maxTrucks: event.maxTrucks,
              isOverCap
            }
          });

          const truck = await storage.getRestaurant(interest.truckId);
          if (truck) {
            // Get truck owner's email
            // Note: getRestaurant doesn't return ownerId directly in all schemas, but let's check schema.ts
            // restaurants table has ownerId.
            const owner = await storage.getUser(truck.ownerId);
            if (owner && owner.email) {
              await emailService.sendInterestStatusUpdate(
                owner.email,
                truck.name,
                host!.businessName,
                new Date(event.date).toLocaleDateString(),
                status as 'accepted' | 'declined'
              );
            }
          }
        } catch (err) {
          console.error('Failed to send status update notification:', err);
        }
      })();

      res.json(updatedInterest);
    } catch (error: any) {
      console.error('Error updating interest status:', error);
      res.status(500).json({ message: 'Failed to update status' });
    }
  });

  app.get('/api/hosts/events/:eventId/interests', isAuthenticated, async (req: any, res) => {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      
      // Verify host owns this event (indirectly via host profile)
      const host = await getHostByUserId(userId);
      if (!host) {
        return res.status(403).json({ message: 'Not a host' });
      }

      const { event } = await getEventAndHostForUser(eventId, userId);
      if (!event || !hostOwnsEvent(host, event)) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const interests = await storage.getEventInterestsByEventId(eventId);
      res.json(interests);
    } catch (error: any) {
      console.error('Error fetching event interests:', error);
      res.status(500).json({ message: 'Failed to fetch interests' });
    }
  });

  // Restaurant routes
  // Get subscribed restaurants (public endpoint)
  app.get('/api/restaurants/subscribed/:lat/:lng', async (req: any, res) => {
    try {
      const { lat, lng } = req.params;
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      // Default radius is 50km, max 100km
      const radius = req.query.radius ? Math.min(parseFloat(req.query.radius as string), 100) : 50;
      
      if (isNaN(radius) || radius <= 0) {
        return res.status(400).json({ message: "Invalid radius" });
      }
      
      const restaurants = await storage.getSubscribedRestaurants(latitude, longitude, radius);
      
      // Get all restaurant IDs to fetch deal counts efficiently
      const restaurantIds = restaurants.map(r => r.id);
      
      // Fetch all active deal counts in one query
      const dealCounts: { [restaurantId: string]: number } = {};
      if (restaurantIds.length > 0) {
        const allDeals = await db
          .select({
            restaurantId: deals.restaurantId,
            count: sql<number>`count(*)::integer`
          })
          .from(deals)
          .where(
            and(
              inArray(deals.restaurantId, restaurantIds),
              eq(deals.isActive, true)
            )
          )
          .groupBy(deals.restaurantId);
        
        allDeals.forEach(({ restaurantId, count }: { restaurantId: string; count: number }) => {
          dealCounts[restaurantId] = count;
        });
      }
      
      // Add active deal count for each restaurant
      const restaurantsWithDeals = restaurants.map(restaurant => ({
        ...restaurant,
        activeDealsCount: dealCounts[restaurant.id] || 0
      }));
      
      res.json(restaurantsWithDeals);
    } catch (error) {
      console.error("Error fetching subscribed restaurants:", error);
      res.status(500).json({ message: "Failed to fetch subscribed restaurants" });
    }
  });

  // Restaurant owner routes
  app.get('/api/restaurants/my-restaurants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const restaurants = await storage.getRestaurantsByOwner(userId);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching user restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  app.get('/api/restaurants/:restaurantId/stats', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const deals = await storage.getDealsByRestaurant(restaurantId);
      
      const stats = {
        totalDeals: deals.length,
        activeDeals: deals.filter(d => d.isActive).length,
        totalViews: deals.reduce((sum, d) => sum + ((d as any).viewCount || 0), 0),
        totalClaims: deals.reduce((sum, d) => sum + (d.currentUses || 0), 0),
        conversionRate: 0,
        averageRating: await storage.getRestaurantAverageRating(restaurantId) || 0
      };
      
      if (stats.totalViews > 0) {
        stats.conversionRate = (stats.totalClaims / stats.totalViews) * 100;
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching restaurant stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // 🔒 SECURITY: Update deal - requires ownership of restaurant
  app.patch('/api/deals/:dealId', isAuthenticated, verifyResourceOwnership('deal'), async (req: any, res) => {
    try {
      await logAudit(
        req.user.id,
        'deal_edit',
        'deal',
        req.params.dealId,
        req.ip,
        req.headers['user-agent'],
        req.body
      );
      const { dealId } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      
      // Get current deal (ownership already verified by middleware)
      const currentDeal = await storage.getDeal(dealId);
      if (!currentDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // If activating a deal, validate subscription limits
      if (updates.isActive === true && !currentDeal.isActive) {
        const subscriptionValidation = await validateSubscriptionLimits(userId, dealId);
        if (!subscriptionValidation.isValid) {
          return res.status(402).json({ 
            message: subscriptionValidation.error,
            currentCount: subscriptionValidation.currentCount,
            maxDeals: subscriptionValidation.maxDeals
          });
        }
      }
      
      const updatedDeal = await storage.updateDeal(dealId, updates);
      res.json(updatedDeal);
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  // 🔒 SECURITY: Delete deal - requires ownership of restaurant
  app.delete('/api/deals/:dealId', isAuthenticated, verifyResourceOwnership('deal'), async (req: any, res) => {
    try {
      await logAudit(
        req.user.id,
        'deal_delete',
        'deal',
        req.params.dealId,
        req.ip,
        req.headers['user-agent'],
        {}
      );
      const { dealId } = req.params;
      // Ownership verified by middleware - safe to delete
      await storage.deleteDeal(dealId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  // Event ingestion endpoints
  // Deal view tracking endpoint with proper per-identity rate limiting
  app.post('/api/deals/:dealId/view', async (req: any, res) => {
    try {
      const { dealId } = req.params;
      const userId = req.user?.id; // Optional for anonymous views
      const sessionId = req.sessionID;

      // Skip tracking if the deal does not exist (prevents noisy 500s on stale IDs)
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        console.warn(`[deals:view] deal not found for id ${dealId} - skipping view tracking`);
        return res.json({ success: true, message: "Deal not found; view skipped" });
      }
      
      // Proper per-identity rate limiting: check if this specific user/session has already viewed this deal recently
      const hasRecentView = await storage.hasRecentDealView(dealId, userId, sessionId, 3600000); // 1 hour window
      
      if (hasRecentView) {
        return res.json({ success: true, message: "View already recorded recently" });
      }
      
      const viewData = insertDealViewSchema.parse({
        dealId,
        userId,
        sessionId,
      });
      
      const view = await storage.recordDealView(viewData);
      res.json({ success: true, view });
    } catch (error) {
      console.error("Error recording deal view:", error);
      res.status(500).json({ message: "Failed to record view" });
    }
  });

  // Mark deal claim as used with order amount
  app.patch('/api/deal-claims/:claimId/use', isAuthenticated, async (req: any, res) => {
    try {
      const { claimId } = req.params;
      
      // Validate optional order amount
      const amountSchema = z.object({
        orderAmount: z.number().positive().min(0.01).max(10000).optional(),
      });
      
      const { orderAmount } = amountSchema.parse(req.body ?? {});
      
      // Verify that the user owns the restaurant associated with this claim
      const isAuthorized = await storage.verifyRestaurantOwnershipByClaim(claimId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only mark claims as used for your own restaurants" });
      }
      
      const updatedClaim = await storage.markClaimAsUsed(claimId, orderAmount ?? null);
      if (!updatedClaim) {
        return res.status(400).json({ message: "Claim not found or already used" });
      }
      res.json({ success: true, claim: updatedClaim });
    } catch (error) {
      console.error("Error marking claim as used:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to mark claim as used" });
    }
  });

  // Food truck endpoints
  // Update restaurant mobile settings (owner only)
  app.patch('/api/restaurants/:restaurantId/mobile-settings', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only update settings for restaurants you own" });
      }
      
      const settings = updateRestaurantMobileSettingsSchema.parse(req.body);
      const updatedRestaurant = await storage.setRestaurantMobileSettings(restaurantId, settings);
      
      // Broadcast status update via WebSocket if mobile status changed
      if (settings.mobileOnline !== undefined) {
        broadcastStatusUpdate(restaurantId, {
          isOnline: updatedRestaurant.mobileOnline || false,
          mobileOnline: updatedRestaurant.mobileOnline || false,
        });
      }
      
      res.json({ success: true, restaurant: updatedRestaurant });
    } catch (error) {
      console.error("Error updating mobile settings:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update mobile settings" });
    }
  });

  // Update restaurant location (owner only)
  app.patch('/api/restaurants/:restaurantId/location', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only update location for restaurants you own" });
      }
      
      const locationData = updateRestaurantLocationSchema.parse(req.body);
      const updatedRestaurant = await storage.updateRestaurantLocation(restaurantId, locationData);
      
      // Broadcast location update via WebSocket
      broadcastLocationUpdate(restaurantId, {
        latitude: updatedRestaurant.currentLatitude ? parseFloat(updatedRestaurant.currentLatitude) : 0,
        longitude: updatedRestaurant.currentLongitude ? parseFloat(updatedRestaurant.currentLongitude) : 0,
        mobileOnline: updatedRestaurant.mobileOnline || false,
        lastBroadcastAt: updatedRestaurant.lastBroadcastAt || new Date(),
      });
      
      res.json({ success: true, restaurant: updatedRestaurant });
    } catch (error) {
      console.error("Error updating restaurant location:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update location" });
    }
  });

  // Update restaurant operating hours (owner only)
  app.patch('/api/restaurants/:restaurantId/operating-hours', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only update operating hours for restaurants you own" });
      }
      
      const hoursData = updateRestaurantOperatingHoursSchema.parse(req.body);
      const updatedRestaurant = await storage.setRestaurantOperatingHours(restaurantId, hoursData.operatingHours);
      
      res.json({ success: true, restaurant: updatedRestaurant });
    } catch (error) {
      console.error("Error updating operating hours:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update operating hours" });
    }
  });

  // Check if restaurant is currently open (public endpoint)
  app.get('/api/restaurants/:restaurantId/is-open', async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const isOpen = await storage.isRestaurantOpenNow(restaurantId);
      
      res.json({ success: true, isOpen });
    } catch (error) {
      console.error("Error checking restaurant hours:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to check restaurant hours" });
    }
  });

  // Start food truck session
  app.post('/api/restaurants/:restaurantId/truck-session/start', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { deviceId } = req.body;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only start sessions for restaurants you own" });
      }
      
      if (!deviceId) {
        return res.status(400).json({ message: "deviceId is required" });
      }
      
      const session = await storage.startTruckSession(restaurantId, deviceId, req.user.id);
      res.json({ success: true, session });
    } catch (error) {
      console.error("Error starting truck session:", error);
      res.status(500).json({ message: "Failed to start truck session" });
    }
  });

  // End food truck session
  app.post('/api/restaurants/:restaurantId/truck-session/end', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only end sessions for restaurants you own" });
      }
      
      await storage.endTruckSession(restaurantId, req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending truck session:", error);
      res.status(500).json({ message: "Failed to end truck session" });
    }
  });

  // Update food truck location with rate limiting
  app.post('/api/restaurants/:restaurantId/location', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only update location for restaurants you own" });
      }
      
      // Rate limiting: check if too many requests from this user/restaurant
      const rateLimitResult = checkRateLimit(`location_update_${req.user.id}_${restaurantId}`);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({ 
          message: "Too many location updates. Please wait before trying again.",
          nextAllowedTime: rateLimitResult.nextAllowedTime
        });
      }
      
      const locationData = insertFoodTruckLocationSchema.parse({
        ...req.body,
        restaurantId,
      });
      
      const location = await storage.upsertLiveLocation(locationData);
      
      // Broadcast location update via WebSocket
      broadcastLocationUpdate(restaurantId, location);
      
      res.json({ success: true, location });
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update location" });
    }
  });

  // Get live food trucks nearby (public endpoint)
  app.get('/api/trucks/live', async (req: any, res) => {
    try {
      const { lat, lng, radiusKm = 5 } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ message: "lat and lng query parameters are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radius = Math.min(parseFloat(radiusKm as string), 50); // Max 50km radius
      
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
        return res.status(400).json({ message: "Invalid coordinates or radius" });
      }
      
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Invalid coordinates range" });
      }
      
      const trucks = await storage.getLiveTrucksNearby(latitude, longitude, radius);
      res.json({ trucks });
    } catch (error) {
      console.error("Error fetching live trucks:", error);
      res.status(500).json({ message: "Failed to fetch live trucks" });
    }
  });

  // Get food truck location history (owner only)
  app.get('/api/restaurants/:restaurantId/locations', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access location history for restaurants you own" });
      }
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      const locations = await storage.getTruckLocationHistory(restaurantId, dateRange);
      res.json({ locations });
    } catch (error) {
      console.error("Error fetching location history:", error);
      res.status(500).json({ message: "Failed to fetch location history" });
    }
  });

  // Analytics API endpoints (require authentication to verify restaurant ownership)
  app.get('/api/restaurants/:restaurantId/analytics/summary', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(req.user.id);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      const summary = await storage.getRestaurantAnalyticsSummary(restaurantId, dateRange);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching analytics summary:", error);
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  app.get('/api/restaurants/:restaurantId/analytics/timeseries', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { startDate, endDate, interval = 'day' } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(req.user.id);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
      
      const timeseries = await storage.getRestaurantAnalyticsTimeseries(
        restaurantId, 
        dateRange, 
        interval as 'day' | 'week'
      );
      res.json(timeseries);
    } catch (error) {
      console.error("Error fetching analytics timeseries:", error);
      res.status(500).json({ message: "Failed to fetch analytics timeseries" });
    }
  });

  app.get('/api/restaurants/:restaurantId/analytics/customers', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(req.user.id);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      const insights = await storage.getRestaurantCustomerInsights(restaurantId, dateRange);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching customer insights:", error);
      res.status(500).json({ message: "Failed to fetch customer insights" });
    }
  });

  app.get('/api/restaurants/:restaurantId/analytics/compare', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { 
        currentStart, 
        currentEnd, 
        previousStart, 
        previousEnd 
      } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(req.user.id);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
        return res.status(400).json({ 
          message: "currentStart, currentEnd, previousStart, and previousEnd are required" 
        });
      }
      
      const [currentPeriod, previousPeriod] = await Promise.all([
        storage.getRestaurantAnalyticsSummary(restaurantId, {
          start: new Date(currentStart as string),
          end: new Date(currentEnd as string),
        }),
        storage.getRestaurantAnalyticsSummary(restaurantId, {
          start: new Date(previousStart as string),
          end: new Date(previousEnd as string),
        }),
      ]);
      
      // Calculate percentage changes
      const comparison = {
        current: currentPeriod,
        previous: previousPeriod,
        changes: {
          viewsChange: previousPeriod.totalViews > 0 
            ? ((currentPeriod.totalViews - previousPeriod.totalViews) / previousPeriod.totalViews) * 100 
            : 0,
          claimsChange: previousPeriod.totalClaims > 0
            ? ((currentPeriod.totalClaims - previousPeriod.totalClaims) / previousPeriod.totalClaims) * 100
            : 0,
          revenueChange: previousPeriod.totalRevenue > 0
            ? ((currentPeriod.totalRevenue - previousPeriod.totalRevenue) / previousPeriod.totalRevenue) * 100
            : 0,
          conversionRateChange: currentPeriod.conversionRate - previousPeriod.conversionRate,
        },
      };
      
      res.json(comparison);
    } catch (error) {
      console.error("Error fetching analytics comparison:", error);
      res.status(500).json({ message: "Failed to fetch analytics comparison" });
    }
  });

  app.get('/api/restaurants/:restaurantId/analytics/export', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { startDate, endDate, format = 'csv' } = req.query;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(req.user.id);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
      
      const exportData = await storage.getRestaurantAnalyticsExport(restaurantId, dateRange);
      
      if (format === 'csv') {
        // Generate CSV with proper security measures to prevent injection attacks
        const csvHeader = 'Deal Title,Date,Views,Claims,Revenue\n';
        const csvRows = exportData.map((row: any) => {
          // Secure CSV sanitization to prevent injection attacks
          const sanitizeCSV = (value: any): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            
            // If cell starts with dangerous characters, prefix with apostrophe to prevent formula execution
            if (/^[=+@-]/.test(str)) {
              return `"'${str.replace(/"/g, '""')}"`;
            }
            
            // Always quote strings and escape internal quotes
            return `"${str.replace(/"/g, '""')}"`;
          };
          
          return [
            sanitizeCSV(row.dealTitle),
            sanitizeCSV(row.date),
            sanitizeCSV(row.views),
            sanitizeCSV(row.claims),
            sanitizeCSV(row.revenue),
          ].join(',');
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        
        // Secure headers with proper MIME type and safe filename
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${encodeURIComponent(restaurantId)}-${encodeURIComponent(startDate as string)}-${encodeURIComponent(endDate as string)}.csv"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(csv);
      } else {
        res.json(exportData);
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Failed to export analytics" });
    }
  });

  // Restaurant owner signup endpoint (creates user account + restaurant in one flow)
  app.post('/api/restaurants/signup', async (req: any, res) => {
    try {
      const { userData, restaurantData, subscriptionPlan } = req.body;
      
      let user: User;
      
      // Check if user is already authenticated (e.g., via Google OAuth)
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        // User is already authenticated, use existing user
        user = req.user as User;
        console.log('Using authenticated user for restaurant signup:', { userId: user.id, userType: user.userType });
        
        // If user is currently a customer, upgrade them to restaurant_owner
        if (user.userType === 'customer') {
          console.log('Converting customer account to restaurant owner:', user.id);
          await storage.updateUserType(user.id, 'restaurant_owner');
          // Update the user object to reflect the change
          user = await storage.getUserById(user.id) || user;
        }
      } else {
        // User is not authenticated, create new account
        // Validate user data with password required
        const userValidation = z.object({
          email: z.string().email(),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          phone: z.string().min(10),
          password: z.string().min(6),
        });
        
        const validatedUserData = userValidation.parse(userData);
        
        // Check if user already exists
        const existingUser = await storage.getUserByEmail(validatedUserData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
        
        // Hash password
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(validatedUserData.password, 10);
        
        // Create restaurant owner user account using email auth
        user = await storage.upsertUserByAuth('email', {
          ...validatedUserData,
          passwordHash
        }, 'restaurant_owner');
        
        // Log the new user in by setting up session
        await new Promise<User>((resolve, reject) => {
          req.login(user, (err: any) => {
            if (err) reject(err);
            else resolve(user);
          });
        });
      }
      
      // Validate restaurant data
      const restaurantValidation = insertRestaurantSchema.omit({ ownerId: true });
      const validatedRestaurantData = restaurantValidation.parse(restaurantData);
      
      // Create restaurant profile
      const restaurant = await storage.createRestaurant({
        ...validatedRestaurantData,
        ownerId: user.id,
      });

      // VAC-lite auto-verify (with fallback to manual verification request)
      try {
        const enabled = String(process.env.VAC_AUTO_VERIFY_ENABLED || "true").toLowerCase() !== "false";
        if (enabled) {
          const vac = await vacEvaluateRestaurantSignup({ user, restaurant, req });
          console.log('🔍 VAC-lite evaluation:', {
            restaurantId: restaurant.id,
            restaurantName: (restaurant as any).name,
            score: vac.score,
            threshold: vac.threshold,
            shouldAutoVerify: vac.shouldAutoVerify,
            signals: vac.signals
          });

          if (vac.shouldAutoVerify) {
            console.log('✅ Auto-verifying restaurant:', restaurant.id);
            await storage.setRestaurantVerified(restaurant.id, true);
            (restaurant as any).isVerified = true;
          } else {
            console.log('⚠️  Creating manual verification request for:', restaurant.id);
            const hasPending = await storage.hasPendingVerificationRequest(restaurant.id);
            if (!hasPending) {
              await storage.createVerificationRequest({
                restaurantId: restaurant.id,
                documents: []
              });
            } else {
              console.log('ℹ️  Pending verification request already exists');
            }
          }
        }
      } catch (e) {
        console.warn("VAC-lite failed", e);
        // Never block signup due to VAC issues
      }

      // PHASE 2: Attach referral if present in request
      const referralId = req.body?.referralId || req.query?.referralId || req.cookies?.referralId;
      if (referralId) {
        try {
          const { attachReferralToSignup } = await import('./referralService');
          await attachReferralToSignup(referralId, restaurant.id);
          console.log('[Phase 2] Referral attached:', { referralId, restaurantId: restaurant.id });
        } catch (err) {
          console.error('[Phase 2] Error attaching referral:', err);
          // Don't fail signup if referral attachment fails
        }
      }
      
      res.json({
        user,
        restaurant,
        message: "Restaurant owner account created successfully",
        subscriptionPlan
      });
      
    } catch (error: any) {
      console.error("Error in restaurant signup:", error);
      res.status(400).json({ message: error.message || "Failed to create restaurant account" });
    }
  });

  // Restaurant routes (require restaurant owner authentication)
  app.post('/api/restaurants', isRestaurantOwner, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const restaurantData = insertRestaurantSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const restaurant = await storage.createRestaurant(restaurantData);

      // VAC-lite auto-verify (with fallback to manual verification request)
      try {
        const enabled = String(process.env.VAC_AUTO_VERIFY_ENABLED || "true").toLowerCase() !== "false";
        if (enabled) {
          const vac = await vacEvaluateRestaurantSignup({ user: req.user, restaurant, req });
          console.log('🔍 VAC-lite evaluation:', {
            restaurantId: restaurant.id,
            restaurantName: (restaurant as any).name,
            score: vac.score,
            threshold: vac.threshold,
            shouldAutoVerify: vac.shouldAutoVerify,
            signals: vac.signals
          });

          if (vac.shouldAutoVerify) {
            console.log('✅ Auto-verifying restaurant:', restaurant.id);
            await storage.setRestaurantVerified(restaurant.id, true);
            (restaurant as any).isVerified = true;
          } else {
            console.log('⚠️  Creating manual verification request for:', restaurant.id);
            const hasPending = await storage.hasPendingVerificationRequest(restaurant.id);
            if (!hasPending) {
              await storage.createVerificationRequest({
                restaurantId: restaurant.id,
                documents: []
              });
            } else {
              console.log('ℹ️  Pending verification request already exists');
            }
          }
        }
      } catch (e) {
        console.warn("VAC-lite failed", e);
        // Never block creation due to VAC issues
      }

      res.json(restaurant);
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/restaurants/my', isRestaurantOwner, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const restaurants = await storage.getRestaurantsByOwner(userId);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });

  // Restaurant owner authentication check endpoint
  app.get('/api/auth/restaurant/user', isRestaurantOwner, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching restaurant owner:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Restaurant search endpoint (returns restaurants matching search query)
  // Must come before /:id route to avoid matching "search" as an ID
  app.get('/api/restaurants/search', async (req, res) => {
    try {
      const { q: query, lat, lng, radius = 10 } = req.query;

      console.log('🔍 Restaurant search request:', { query, lat, lng, radius });

      if (!query || typeof query !== 'string' || query.length < 2) {
        console.log('⚠️  Empty or short query, returning empty array');
        return res.json([]);
      }

      const searchTerm = query.toLowerCase();
      const restaurants = await storage.getAllRestaurants();
      
      let filteredRestaurants = restaurants.filter((restaurant: any) => 
        restaurant.isActive &&
        (restaurant.name.toLowerCase().includes(searchTerm) ||
         restaurant.cuisineType?.toLowerCase().includes(searchTerm) ||
         restaurant.address?.toLowerCase().includes(searchTerm))
      );

      // Filter by distance if coordinates provided
      if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const radiusKm = parseFloat(radius as string);

        filteredRestaurants = filteredRestaurants.filter((restaurant: any) => {
          if (!restaurant.latitude || !restaurant.longitude) return false;
          
          // Calculate distance using Haversine formula
          const R = 6371; // Earth's radius in km
          const dLat = (restaurant.latitude - userLat) * Math.PI / 180;
          const dLng = (restaurant.longitude - userLng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(restaurant.latitude * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          return distance <= radiusKm;
        });
      }

      res.json(filteredRestaurants);
    } catch (error) {
      console.error("Error searching restaurants:", error);
      res.status(500).json({ message: "Failed to search restaurants" });
    }
  });

  app.get('/api/restaurants/:id', async (req, res) => {
    try {
      const restaurant = await storage.getRestaurant(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });

  app.get('/api/restaurants/nearby/:lat/:lng', async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      const radius = parseFloat(req.query.radius as string) || 5; // Default 5km radius
      
      const restaurants = await storage.getNearbyRestaurants(lat, lng, radius);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching nearby restaurants:", error);
      res.status(500).json({ message: "Failed to fetch nearby restaurants" });
    }
  });

  // Restaurant favorites endpoints
  app.post('/api/restaurants/:restaurantId/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user.id;
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const favoriteData = insertRestaurantFavoriteSchema.parse({
        restaurantId,
        userId,
      });
      
      const favorite = await storage.createRestaurantFavorite(favoriteData);
      res.json(favorite);
    } catch (error: any) {
      console.error("Error adding restaurant favorite:", error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ message: "Restaurant already favorited" });
      }
      res.status(400).json({ message: error.message || "Failed to add favorite" });
    }
  });

  app.delete('/api/restaurants/:restaurantId/favorite', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user.id;
      
      await storage.removeRestaurantFavorite(restaurantId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing restaurant favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/restaurants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const favorites = await storage.getUserRestaurantFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching user restaurant favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  // Analytics endpoint for restaurant owners to see favorites (paid feature)
  app.get('/api/restaurants/:restaurantId/analytics/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user.id;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, userId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(userId);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      const { startDate, endDate } = req.query;
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      const favoritesAnalytics = await storage.getRestaurantFavoritesAnalytics(restaurantId, dateRange);
      res.json(favoritesAnalytics);
    } catch (error) {
      console.error("Error fetching favorites analytics:", error);
      res.status(500).json({ message: "Failed to fetch favorites analytics" });
    }
  });

  // Analytics endpoint for restaurant owners to see recommendations (paid feature)
  app.get('/api/restaurants/:restaurantId/analytics/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user.id;
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, userId);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      // Validate analytics access (paid feature)
      const analyticsAccess = await validateAnalyticsAccess(userId);
      if (!analyticsAccess.hasAccess) {
        return res.status(402).json({ 
          message: analyticsAccess.error,
          subscriptionTier: analyticsAccess.subscriptionTier
        });
      }
      
      const { startDate, endDate } = req.query;
      let dateRange: { start: Date; end: Date } | undefined;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }
      
      const recommendationsAnalytics = await storage.getRestaurantRecommendationsAnalytics(restaurantId, dateRange);
      res.json(recommendationsAnalytics);
    } catch (error) {
      console.error("Error fetching recommendations analytics:", error);
      res.status(500).json({ message: "Failed to fetch recommendations analytics" });
    }
  });

  // Track recommendation click-through (public endpoint for tracking)
  app.post('/api/restaurants/:restaurantId/recommendation/click', async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { recommendationId } = req.body;
      
      if (recommendationId) {
        await storage.markRecommendationClicked(recommendationId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking recommendation click:", error);
      res.status(500).json({ message: "Failed to track recommendation click" });
    }
  });

  // Verification routes for restaurant owners
  app.post('/api/restaurants/:id/verification/request', isAuthenticated, async (req: any, res) => {
    try {
      const restaurantId = req.params.id;
      const userId = req.user.id;
      
      // Verify restaurant ownership
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Check rate limiting
      const rateLimit = checkRateLimit(restaurantId);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          message: "Rate limit exceeded. Only one verification request per restaurant per hour is allowed.",
          nextAllowedTime: rateLimit.nextAllowedTime
        });
      }
      
      // Check for existing pending requests (dedupe)
      const hasPendingRequest = await storage.hasPendingVerificationRequest(restaurantId);
      if (hasPendingRequest) {
        return res.status(409).json({
          message: "A verification request is already pending for this restaurant. Please wait for admin review."
        });
      }
      
      // Validate request body with schema first
      const verificationData = insertVerificationRequestSchema.parse({
        ...req.body,
        restaurantId,
      });
      
      // Additional server-side document validation for security
      const documentValidation = validateDocuments(verificationData.documents);
      if (!documentValidation.valid) {
        return res.status(400).json({
          message: "Document validation failed",
          errors: documentValidation.errors
        });
      }
      
      const verificationRequest = await storage.createVerificationRequest(verificationData);
      res.json(verificationRequest);
    } catch (error: any) {
      console.error("Error creating verification request:", error);
      res.status(400).json({ message: error.message || "Failed to create verification request" });
    }
  });

  app.get('/api/restaurants/my/verifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const verifications = await storage.getVerificationRequestsByOwner(userId);
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      res.status(500).json({ message: "Failed to fetch verification requests" });
    }
  });

  // Deal routes
  app.post('/api/deals', isAuthenticated, async (req: any, res) => {
    try {
      console.log('🟢 POST /api/deals - incoming request', {
        userId: req.user?.id,
        ip: req.ip,
        ua: req.headers['user-agent'],
      });
      await logAudit(
        req.user.id,
        'deal_create',
        'deal',
        undefined,
        req.ip,
        req.headers['user-agent'],
        req.body
      );
      const userId = req.user.id;

      // Normalize incoming payload to expected types to avoid Zod parse hangs
      const raw = req.body || {};
      const normalized = {
        ...raw,
        // discountValue should remain as string for decimal type
        discountValue:
          typeof raw.discountValue === 'number'
            ? raw.discountValue.toString()
            : raw.discountValue,
        minOrderAmount:
          raw.minOrderAmount === '' || raw.minOrderAmount == null
            ? null
            : typeof raw.minOrderAmount === 'number'
              ? raw.minOrderAmount.toString()
              : raw.minOrderAmount,
        totalUsesLimit:
          raw.totalUsesLimit === '' || raw.totalUsesLimit == null
            ? null
            : typeof raw.totalUsesLimit === 'string'
              ? parseInt(raw.totalUsesLimit)
              : raw.totalUsesLimit,
        perCustomerLimit:
          raw.perCustomerLimit === '' || raw.perCustomerLimit == null
            ? 1
            : typeof raw.perCustomerLimit === 'string'
              ? parseInt(raw.perCustomerLimit)
              : raw.perCustomerLimit,
        // Convert date strings to Date objects
        startDate:
          typeof raw.startDate === 'string'
            ? new Date(raw.startDate)
            : raw.startDate,
        endDate:
          raw.isOngoing || raw.endDate === '' || raw.endDate == null
            ? null
            : typeof raw.endDate === 'string'
              ? new Date(raw.endDate)
              : raw.endDate,
        // Times nullable if business hours
        startTime: raw.availableDuringBusinessHours ? null : raw.startTime,
        endTime: raw.availableDuringBusinessHours ? null : raw.endTime,
      };

      console.log('🧭 Normalized deal payload', {
        restaurantId: normalized.restaurantId,
        title: normalized.title,
        dealType: normalized.dealType,
        discountValue: normalized.discountValue,
        startDate: normalized.startDate,
        endDate: normalized.endDate,
      });

      const dealData = insertDealSchema.parse(normalized);

      // Verify restaurant ownership
      const restaurant = await storage.getRestaurant(dealData.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        console.warn('🚫 Deal creation rejected - unauthorized restaurant ownership', {
          userId,
          restaurantId: dealData.restaurantId,
          ownerId: restaurant?.ownerId,
        });
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Validate subscription limits
      const subscriptionValidation = await validateSubscriptionLimits(userId);
      console.log('📊 Subscription validation', subscriptionValidation);
      if (!subscriptionValidation.isValid) {
        return res.status(402).json({ 
          message: subscriptionValidation.error,
          currentCount: subscriptionValidation.currentCount,
          maxDeals: subscriptionValidation.maxDeals
        });
      }
      
      const deal = await storage.createDeal(dealData);
      console.log('✅ Deal created', { id: deal.id, restaurantId: deal.restaurantId, title: deal.title });
      res.json(deal);
    } catch (error: any) {
      console.error("❌ Error creating deal:", error?.message || error);
      if (error?.stack) {
        console.error(error.stack);
      }
      res.status(400).json({ message: error?.message || "Failed to create deal" });
    }
  });

  app.get('/api/deals/active', async (req, res) => {
    try {
      const deals = await storage.getActiveDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching active deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  // Get all active deals for the authenticated restaurant owner's restaurants
  app.get('/api/deals/my-active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get all restaurants owned by this user
      const restaurants = await storage.getRestaurantsByOwner(userId);
      
      // Get all active deals for all restaurants
      const allDeals = await Promise.all(
        restaurants.map(async (restaurant) => {
          const deals = await storage.getDealsByRestaurant(restaurant.id);
          return deals.filter(deal => deal.isActive);
        })
      );
      
      // Flatten the array of arrays into a single array
      const activeDeals = allDeals.flat();
      
      res.json(activeDeals);
    } catch (error) {
      console.error("Error fetching my active deals:", error);
      res.status(500).json({ message: "Failed to fetch active deals" });
    }
  });

  app.get('/api/deals/featured', async (req, res) => {
    try {
      // Support filtering: ?filter=limited-time for limited time deals only, or no filter for all deals
      const filter = req.query.filter as string;
      const showLimitedTimeOnly = filter === 'limited-time';
      
      const deals = await storage.getFilteredDeals(showLimitedTimeOnly);
      
      // Add cache headers for client-side caching
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': `"deals-${filter || 'all'}-${Date.now()}"`,
      });
      
      res.json(deals);
    } catch (error) {
      console.error("Error fetching featured deals:", error);
      res.status(500).json({ message: "Failed to fetch featured deals" });
    }
  });

  // New endpoint: Get all active deals for a specific restaurant
  app.get('/api/deals/restaurant/:restaurantId', async (req, res) => {
    try {
      // Validate restaurant ID parameter
      const restaurantIdSchema = z.string().uuid("Invalid restaurant ID format");
      const restaurantId = restaurantIdSchema.parse(req.params.restaurantId);
      
      // Get restaurant info first
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Get all active deals for this restaurant with restaurant data included
      const allRestaurantDeals = await storage.getDealsByRestaurant(restaurantId);
      const activeDeals = allRestaurantDeals
        .filter(deal => deal.isActive)
        .map(deal => ({
          ...deal,
          restaurant: {
            name: restaurant.name,
            cuisineType: restaurant.cuisineType,
            phone: restaurant.phone,
          }
        }));
      
      // Add cache headers
      res.set({
        'Cache-Control': 'public, max-age=180', // 3 minutes
        'ETag': `"restaurant-deals-${restaurantId}-${Date.now()}"`,
      });
      
      res.json(activeDeals);
    } catch (error: any) {
      console.error("Error fetching restaurant deals:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid restaurant ID format" });
      }
      res.status(500).json({ message: "Failed to fetch restaurant deals" });
    }
  });

  app.get('/api/deals/nearby/:lat/:lng', async (req, res) => {
    try {
      const lat = parseFloat(req.params.lat);
      const lng = parseFloat(req.params.lng);
      const radius = parseFloat(req.query.radius as string) || 5;
      
      const deals = await storage.getNearbyDeals(lat, lng, radius);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching nearby deals:", error);
      res.status(500).json({ message: "Failed to fetch nearby deals" });
    }
  });

  // Advanced search endpoint with filters
  app.get('/api/deals/search', async (req, res) => {
    try {
      const {
        q: query,
        cuisine,
        minPrice,
        maxPrice,
        radius = 10,
        lat,
        lng,
        sortBy = 'relevance'
      } = req.query;

      const deals = await storage.searchDeals({
        query: query as string,
        cuisineType: cuisine as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        latitude: lat ? parseFloat(lat as string) : undefined,
        longitude: lng ? parseFloat(lng as string) : undefined,
        radius: parseFloat(radius as string),
        sortBy: sortBy as string
      });

      res.json(deals);
    } catch (error) {
      console.error("Error searching deals:", error);
      res.status(500).json({ message: "Failed to search deals" });
    }
  });

  // Deals recommendations endpoint (missing implementation)
  app.get('/api/deals/recommended', async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const sessionId = req.sessionID || 'anonymous';
      
      // For now, return featured deals (active deals)
      // In a real implementation, this would use ML/AI recommendations
      const recommendedDeals = await storage.getActiveDeals();
      
      // Track restaurant recommendations for analytics (background task)
      if (recommendedDeals.length > 0) {
        // Track recommendations for analytics (don't wait for completion)
        Promise.all(
          recommendedDeals.slice(0, 10).map(async (deal: any) => {
            try {
              await storage.trackRestaurantRecommendation({
                restaurantId: deal.restaurantId,
                userId,
                sessionId,
                recommendationType: 'personalized',
                recommendationContext: 'deals_recommended_endpoint',
              });
            } catch (err) {
              console.error('Error tracking recommendation:', err);
            }
          })
        ).catch(err => console.error('Error tracking recommendations batch:', err));
      }
      
      res.json(recommendedDeals);
    } catch (error) {
      console.error("Error fetching recommended deals:", error);
      res.status(500).json({ message: "Failed to fetch recommended deals" });
    }
  });

  app.get('/api/deals/:id', async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });



  // Review routes
  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId,
      });
      
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error: any) {
      console.error("Error creating review:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/reviews/restaurant/:restaurantId', async (req, res) => {
    try {
      const reviews = await storage.getRestaurantReviews(req.params.restaurantId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/reviews/restaurant/:restaurantId/rating', async (req, res) => {
    try {
      const rating = await storage.getRestaurantAverageRating(req.params.restaurantId);
      res.json({ rating });
    } catch (error) {
      console.error("Error fetching rating:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  // New idempotent subscription initialization endpoint (read-only: no Stripe mutation)
  app.post('/api/subscriptions/initialize', isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const { hasMultipleDealsAddon = false, billingInterval = 'month', promoCode = '' } = req.body;

    console.log('=== Subscription Initialize Request ===');
    console.log('User ID:', user?.id);
    console.log('User Email:', user?.email);
    console.log('Promo Code:', promoCode);
    console.log('Billing Interval:', billingInterval);

    // Validate billing interval
    const validIntervals = ['month', 'quarter', 'year'];
    const interval = validIntervals.includes(billingInterval) ? billingInterval : 'month';

    // Check for BETA promo code
    if (promoCode.toUpperCase() === 'BETA') {
      console.log('✅ BETA code detected, granting free access');

      // Grant free beta access without Stripe subscription
      try {
        console.log('Updating user with BETA access...');
        await storage.updateUser(user.id, {
          subscriptionBillingInterval: `standard-${interval}`,
          // We don't set stripeSubscriptionId for beta users
        });
        console.log('✅ User updated successfully with BETA access');
        
        const response = {
          status: 'active',
          subscriptionId: null,
          betaAccess: true,
          message: 'BETA access granted! You can now create deals without payment.'
        };
        console.log('Sending response:', response);
        return res.send(response);
      } catch (error) {
        console.error("❌ Error granting beta access:", error);
        return res.status(400).send({ error: { message: 'Failed to grant beta access' } });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: { message: 'Payment processing is not configured' } });
    }

    // TEST1: read-only preview; actual subscription created in /api/create-subscription
    if (promoCode.toUpperCase() === 'TEST1') {
      if (!user.email) {
        return res.status(400).json({ error: { message: 'No user email on file' } });
      }
      return res.send({
        status: 'quote',
        promo: 'TEST1',
        testPricing: true,
        label: '$1 test plan',
        billingInterval: 'month'
      });
    }

    if (!user.email) {
      return res.status(400).json({ error: { message: 'No user email on file' } });
    }

    // Read-only quote: select Price ID by stored signup date (no mutation)
    try {
      const { locked, priceId, label } = await getLockedPriceForUser(user.id);
      return res.send({
        status: 'quote',
        priceId,
        locked,
        label,
        billingInterval: 'month'
      });
    } catch (error: any) {
      console.error('Initialize quote error:', error);
      return res.status(503).json({ error: { message: error.message || 'Unable to provide pricing quote' } });
    }
  });

  // Legacy Stripe subscription route for restaurant fees (kept for backward compatibility)
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const { hasMultipleDealsAddon, promoCode, billingInterval = 'month' } = req.body; // boolean for multiple deals addon, billing interval
    
    // Check for valid promo codes first (skip payment for beta users)
    if (promoCode && promoCode.toUpperCase() === 'BETA') {
      // Grant free beta access without Stripe subscription
      try {
        await storage.updateUser(user.id, {
          subscriptionBillingInterval: `standard-${billingInterval}`,
          // We don't set stripeSubscriptionId for beta users
        });
        
        return res.json({
          success: true,
          message: 'Beta access granted! You can now create deals without payment.',
          betaAccess: true
        });
      } catch (error) {
        console.error("Error granting beta access:", error);
        return res.status(500).json({ error: { message: 'Failed to grant beta access' } });
      }
    }

    // Check for test promo code (charges $1 for testing)
    if (promoCode && promoCode.toUpperCase() === 'TEST1') {
      if (!stripe) {
        return res.status(503).json({ error: { message: "Payment service temporarily unavailable" } });
      }
      
      if (!user.email) {
        return res.status(400).json({ error: { message: 'No user email on file' } });
      }

      try {
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          });
          customerId = customer.id;
        }

        // Create a $1 test subscription directly
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price_data: {
              currency: 'usd',
              product: (await stripe.products.create({ name: 'MealScout Test $1' })).id,
              unit_amount: 100,
              recurring: { interval: 'month', interval_count: 1 },
            },
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(user.id, customerId, subscription.id, `standard-${billingInterval}`);
    
        const latestInvoice = subscription.latest_invoice;
        const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
        return res.send({
          subscriptionId: subscription.id,
          clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
          testPricing: true,
          message: "Test pricing applied - $1 charge"
        });
      } catch (error: any) {
        console.error("Error creating test subscription:", error);
        return res.status(400).send({ error: { message: error.message } });
      }
    }

    if (!stripe) {
      return res.status(503).json({ error: { message: 'Payment processing is not configured' } });
    }

    // Support monthly, quarterly, and yearly billing
    const validIntervals = ['month', 'quarter', 'year'];
    const interval = validIntervals.includes(billingInterval) ? billingInterval : 'month';

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent']
        });
        
        // If subscription is incomplete or incomplete_expired, cancel it and create a new one
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          console.log(`Canceling incomplete subscription ${subscription.id} to create new one`);
          await stripe.subscriptions.cancel(subscription.id);
          // Clear the subscription ID so we create a new one below
          await storage.updateUser(user.id, { stripeSubscriptionId: null });
        } else {
          // If subscription is active, return existing
          const latestInvoice = subscription.latest_invoice;
          const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
          
          res.send({
            subscriptionId: subscription.id,
            clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
          });
          return;
        }
      } catch (error) {
        console.error("Error retrieving subscription:", error);
      }
    }
    
    if (!user.email) {
      return res.status(400).json({ error: { message: 'No user email on file' } });
    }

    try {
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
        });
        customerId = customer.id;
      }

      // Record signup date at first actual subscription creation
      if (!user.subscriptionSignupDate) {
        await storage.updateUser(user.id, { subscriptionSignupDate: new Date() });
      }

      // Select Stripe Price by stored signup date
      const { locked, priceId, label } = await getLockedPriceForUser(user.id);
      const amount = locked ? 2500 : 5000; // for email display only

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id, `standard-${interval}`);

      // Send payment confirmation email asynchronously
      const planType = `standard-${interval}`;
      emailService.sendPaymentConfirmation(user, amount, planType, subscription.id).catch(err => 
        console.error('Failed to send payment confirmation email:', err)
      );

      const latestInvoice = subscription.latest_invoice;
      const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
      res.send({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
        priceId,
        locked,
        label
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Check subscription status  
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    // Disable caching for subscription status
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // BETA MODE: Grant all users active subscription status
    if (BETA_MODE) {
      console.log('✅ BETA_MODE: Granting active subscription status to all users');
      return res.json({ 
        status: 'active',
        hasAccess: true,
        betaMode: true,
        message: 'BETA MODE - Free access for all users'
      });
    }
    
    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    try {
      const user = req.user;
      
      // Check for BETA users (have billing interval but no Stripe subscription)
      if (!user.stripeSubscriptionId && user.subscriptionBillingInterval) {
        return res.json({ 
          status: 'active',
          hasAccess: true,
          betaAccess: true,
          message: 'BETA user with free access'
        });
      }
      
      if (!user.stripeSubscriptionId) {
        return res.json({ status: 'none', hasAccess: false });
      }

      // SECURITY FIX: Do NOT grant access based on billing interval alone
      // This field is set during initialization, NOT after payment confirmation
      // Only Stripe subscription status can confirm actual payment

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });
      
      // If subscription is incomplete, try to pay the invoice directly 
      if (subscription.status === 'incomplete') {
        // For test mode, force pay the invoice to complete the subscription
        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice && typeof latestInvoice === 'object') {
          const invoice = latestInvoice as any;
          console.log(`Force paying invoice ${invoice.id} to complete subscription...`);
          
          try {
            const paidInvoice = await stripe.invoices.pay(invoice.id);
            console.log(`Successfully paid invoice ${invoice.id}, status: ${paidInvoice.status}`);
            
            // Check subscription status after payment
            const refreshedSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            console.log(`After paying invoice, subscription status: ${refreshedSubscription.status}`);
            
            res.json({
              status: refreshedSubscription.status,
              currentPeriodEnd: (refreshedSubscription as any).current_period_end,
              cancelAtPeriodEnd: (refreshedSubscription as any).cancel_at_period_end,
            });
            return;
          } catch (payError: any) {
            console.log(`Error paying invoice: ${payError.message}`);
            // If paying fails, continue with status check below
          }
        }
      }
      
      res.json({
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Pause subscription endpoint
  app.post('/api/subscription/pause', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    try {
      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription" });
      }

      // Pause subscription by setting pause collection
      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { 
          pause_collection: {
            behavior: 'keep_as_draft'
          }
        }
      );
      
      res.json({
        message: "Subscription paused successfully",
        status: subscription.status,
      });
    } catch (error: any) {
      console.error('Pause subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Webhook Handler
  app.post('/api/stripe/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event;

    try {
      // For development, we'll accept any webhook without signature verification
      // In production, you should verify the webhook signature for security
      if (process.env.NODE_ENV === 'development') {
        event = JSON.parse(req.body);
      } else {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!stripe || !endpointSecret) {
          return res.status(400).send('Webhook secret not configured');
        }
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[WEBHOOK] Received event: ${event.type}`);

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          console.log(`[WEBHOOK] Invoice ${invoice.id} payment succeeded`);
          
          if (invoice.subscription && stripe) {
            // Retrieve the subscription to get full details
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            if (subscription && subscription.status === 'active') {
              console.log(`[WEBHOOK] Subscription ${subscription.id} is now active for customer ${subscription.customer}`);
              
              // Find user by subscription ID (more reliable than customer ID)
              const user = await storage.getUserByStripeSubscriptionId(subscription.id);
              
              // PHASE 3: Process affiliate commissions when restaurant pays
              if (user && user.userType === 'restaurant_owner') {
                try {
                  // Find restaurant owned by this user
                  const ownedRestaurants = await storage.getRestaurantsByOwner(user.id);
                  if (ownedRestaurants.length > 0) {
                    const { createCommissionForRestaurantPayment } = await import('./referralService');
                    for (const restaurant of ownedRestaurants) {
                      // Create commission for this restaurant payment
                      await createCommissionForRestaurantPayment(
                        restaurant.id,
                        invoice.total, // Total in cents
                        invoice.id,
                      );
                    }
                  }
                } catch (commissionError) {
                  console.error('[WEBHOOK] Error processing affiliate commissions:', commissionError);
                  // Don't fail the webhook if commission processing fails
                }
              }
              
              if (user) {
                console.log(`[WEBHOOK] Found user ${user.id} (${user.email}) - ensuring subscription is active`);
                
                // Make sure the user has the subscription ID stored
                // (it should already be there from initialization, but this ensures consistency)
                if (!user.stripeSubscriptionId || user.stripeSubscriptionId !== subscription.id) {
                  await storage.updateUser(user.id, {
                    stripeSubscriptionId: subscription.id,
                    stripeCustomerId: subscription.customer as string,
                  });
                  console.log(`[WEBHOOK] Updated user ${user.id} with subscription ID ${subscription.id}`);
                } else {
                  console.log(`[WEBHOOK] User ${user.id} subscription already properly configured`);
                }
              } else {
                console.log(`[WEBHOOK] Warning: No user found for subscription ${subscription.id}`);
              }
            }
          }
          break;

        case 'customer.subscription.updated':
          const subscriptionUpdated = event.data.object;
          console.log(`[WEBHOOK] Subscription ${subscriptionUpdated.id} updated to status: ${subscriptionUpdated.status}`);
          
          // Find user by subscription ID
          const userForUpdate = await storage.getUserByStripeSubscriptionId(subscriptionUpdated.id);
          
          if (userForUpdate) {
            console.log(`[WEBHOOK] Found user ${userForUpdate.id} for subscription ${subscriptionUpdated.id}`);
            
            // If subscription becomes inactive or canceled, we might want to handle it
            // For now, we rely on real-time checks in validateSubscriptionLimits
            if (subscriptionUpdated.status === 'canceled' || subscriptionUpdated.status === 'incomplete_expired') {
              console.log(`[WEBHOOK] Subscription ${subscriptionUpdated.id} is now ${subscriptionUpdated.status} for user ${userForUpdate.id}`);
              // The validateSubscriptionLimits function will catch this on next deal creation attempt
            } else if (subscriptionUpdated.status === 'active') {
              console.log(`[WEBHOOK] Subscription ${subscriptionUpdated.id} is active for user ${userForUpdate.id}`);
            }
          } else {
            console.log(`[WEBHOOK] Warning: No user found for subscription ${subscriptionUpdated.id}`);
          }
          break;

        case 'customer.subscription.deleted':
          const subscriptionDeleted = event.data.object;
          console.log(`[WEBHOOK] Subscription ${subscriptionDeleted.id} was deleted`);
          
          // Find user and clear their subscription
          const userForDeletion = await storage.getUserByStripeSubscriptionId(subscriptionDeleted.id);
          
          if (userForDeletion) {
            console.log(`[WEBHOOK] Clearing subscription for user ${userForDeletion.id}`);
            await storage.updateUser(userForDeletion.id, {
              stripeSubscriptionId: null,
            });
            console.log(`[WEBHOOK] Subscription cleared for user ${userForDeletion.id} (${userForDeletion.email})`);
          } else {
            console.log(`[WEBHOOK] Warning: No user found for deleted subscription ${subscriptionDeleted.id}`);
          }
          break;

        default:
          console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
      }

      res.json({received: true});
    } catch (error) {
      console.error('[WEBHOOK] Error processing webhook:', error);
      res.status(500).json({error: 'Webhook processing failed'});
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    try {
      const user = req.user;
      const { keepAdsLive } = req.body;
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription" });
      }

      const subscription = await stripe.subscriptions.update(
        user.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      // If keepAdsLive is false, deactivate deals immediately
      if (!keepAdsLive) {
        await storage.deactivateUserDeals(user.id);
      }
      
      res.json({
        message: keepAdsLive 
          ? "Subscription will be cancelled at the end of the billing period. Your deals remain active until then."
          : "Subscription will be cancelled at the end of the billing period. Your deals have been deactivated.",
        cancelAt: subscription.cancel_at,
        keepAdsLive,
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Deal claiming route with Facebook integration
  app.post('/api/deals/:dealId/claim', isAuthenticated, async (req: any, res) => {
    try {
      const dealId = req.params.dealId;
      const userId = req.user.id;
      
      // Get deal and restaurant info
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      const restaurant = await storage.getRestaurant(deal.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has already claimed this deal
      const existingClaims = await storage.getDealClaimsCount(dealId, userId);
      if (existingClaims >= (deal.perCustomerLimit || 1)) {
        return res.status(400).json({ message: "Deal already claimed by user" });
      }
      
      // Check if deal is still available
      if (deal.totalUsesLimit && (deal.currentUses || 0) >= deal.totalUsesLimit) {
        return res.status(400).json({ message: "Deal is no longer available" });
      }
      
      // Create the deal claim and capture the identifier so the client can show/QR it
      const claim = await storage.claimDeal({
        dealId,
        userId,
      });
      
      // Increment deal uses after successful claim write
      await storage.incrementDealUses(dealId);
      
      // Send notification to restaurant owner (best effort)
      try {
        await sendDealClaimedNotification(dealId, userId);
      } catch (emailError) {
        console.error('Failed to send deal claimed notification:', emailError);
      }
      
      res.json({
        success: true,
        claimId: claim.id,
        dealTitle: deal.title,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address
      });
    } catch (error: any) {
      console.error("Error claiming deal:", error);
      res.status(500).json({ message: "Failed to claim deal" });
    }
  });

  // Get claimed deals for user
  app.get('/api/deals/claimed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const claimedDeals = await storage.getUserDealClaims(userId);
      res.json(claimedDeals);
    } catch (error) {
      console.error("Error fetching claimed deals:", error);
      res.status(500).json({ message: "Failed to fetch claimed deals" });
    }
  });

  // Get claims for restaurant owner's deals
  app.get('/api/restaurants/:restaurantId/claims', isAuthenticated, async (req: any, res) => {
    try {
      const { restaurantId } = req.params;
      const { status } = req.query; // pending, used, all
      
      // Verify user owns this restaurant
      const isAuthorized = await storage.verifyRestaurantOwnership(restaurantId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only access analytics for restaurants you own" });
      }
      
      const claims = await storage.getRestaurantDealClaims(restaurantId, status as string);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching restaurant claims:", error);
      res.status(500).json({ message: "Failed to fetch restaurant claims" });
    }
  });

  // Search suggestions endpoint
  app.get("/api/search/suggestions/:query", async (req, res) => {
    try {
      const { query } = req.params;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const searchTerm = query.toLowerCase();
      
      // Get all deals and restaurants for suggestions
      const deals = await storage.getAllDeals();
      const restaurants = await storage.getAllRestaurants();
      
      const suggestions: any[] = [];
      
      // Restaurant suggestions
      restaurants.forEach((restaurant: any) => {
        if (restaurant.name.toLowerCase().includes(searchTerm)) {
          suggestions.push({
            id: `restaurant-${restaurant.id}`,
            text: restaurant.name,
            type: "restaurant",
            subtitle: `${restaurant.cuisineType} • ${restaurant.address || 'Restaurant'}`,
          });
        }
        
        // Cuisine type suggestions
        if (restaurant.cuisineType && restaurant.cuisineType.toLowerCase().includes(searchTerm)) {
          const existing = suggestions.find(s => s.text.toLowerCase() === restaurant.cuisineType.toLowerCase());
          if (!existing) {
            suggestions.push({
              id: `cuisine-${restaurant.cuisineType}`,
              text: restaurant.cuisineType,
              type: "cuisine",
              subtitle: "Food category",
            });
          }
        }
      });
      
      // Deal suggestions
      deals.forEach((deal: any) => {
        if (deal.title.toLowerCase().includes(searchTerm)) {
          suggestions.push({
            id: `deal-${deal.id}`,
            text: deal.title,
            type: "deal",
            subtitle: `${deal.restaurant?.name || 'Restaurant'} • ${deal.discountValue}% off`,
          });
        }
      });
      
      // Limit to 8 suggestions and sort by relevance
      const limitedSuggestions = suggestions
        .slice(0, 8)
        .sort((a, b) => {
          // Prioritize exact matches
          const aExact = a.text.toLowerCase().startsWith(searchTerm) ? 1 : 0;
          const bExact = b.text.toLowerCase().startsWith(searchTerm) ? 1 : 0;
          return bExact - aExact;
        });
      
      res.json(limitedSuggestions);
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({ message: "Failed to get search suggestions" });
    }
  });

  // Admin API endpoints
  registerAdminManagementRoutes(app);

  // Staff management and user creation endpoints
  registerStaffRoutes(app);

  // Bug report endpoint
  app.post('/api/bug-report', async (req, res) => {
    try {
      const { screenshot, currentUrl, userAgent } = req.body;
      
      if (!currentUrl || !userAgent) {
        return res.status(400).json({ message: "Missing required bug report data" });
      }

      const user = req.user as User | undefined;
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;
      const userEmail = user?.email || undefined;

      const bugReportData = {
        userEmail,
        userName,
        userAgent,
        currentUrl,
        timestamp: new Date().toLocaleString(),
        screenshotUrl: screenshot || undefined,
      };

      // Log bug report to console if email service not configured
      console.log('🐛 Bug Report Received:');
      console.log('   User:', userName || 'Anonymous');
      console.log('   Email:', userEmail || 'N/A');
      console.log('   URL:', currentUrl);
      console.log('   User Agent:', userAgent);
      console.log('   Time:', bugReportData.timestamp);
      console.log('   Screenshot:', screenshot ? `${screenshot.substring(0, 50)}...` : 'None');

      const success = await emailService.sendBugReport(bugReportData);

      // Always return success even if email fails (logged to console)
      res.json({ 
        success: true, 
        message: success ? "Bug report sent successfully" : "Bug report logged (email service not configured)" 
      });
    } catch (error) {
      console.error("Error submitting bug report:", error);
      res.status(500).json({ message: "Failed to submit bug report" });
    }
  });

  // Deal feedback endpoints
  app.post('/api/deals/:dealId/feedback', async (req: any, res) => {
    try {
      const { dealId } = req.params;
      const feedbackData = req.body;
      
      const validatedData = insertDealFeedbackSchema.parse({
        ...feedbackData,
        dealId,
        userId: req.user?.id || null,
      });

      const feedback = await storage.createDealFeedback(validatedData);
      res.json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid feedback data", errors: error.errors });
      }
      console.error("Error creating deal feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get('/api/deals/:dealId/feedback', async (req, res) => {
    try {
      const { dealId } = req.params;
      const feedback = await storage.getDealFeedback(dealId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching deal feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.get('/api/deals/:dealId/feedback/stats', async (req, res) => {
    try {
      const { dealId } = req.params;
      const stats = await storage.getDealFeedbackStats(dealId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ message: "Failed to fetch feedback stats" });
    }
  });

  // Handle frequent HEAD /api requests efficiently (likely from monitoring)
  app.head('/api', (req, res) => {
    res.status(200).end();
  });

  // OAuth configuration status check
  app.get('/api/admin/oauth/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
      
      const status = {
        google: {
          configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          clientIdPresent: !!process.env.GOOGLE_CLIENT_ID,
          clientSecretPresent: !!process.env.GOOGLE_CLIENT_SECRET,
          callbackUrls: {
            customer: `${baseUrl}/api/auth/google/customer/callback`,
            restaurant: `${baseUrl}/api/auth/google/restaurant/callback`,
          },
        },
        facebook: {
          configured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
          appIdPresent: !!process.env.FACEBOOK_APP_ID,
          appSecretPresent: !!process.env.FACEBOOK_APP_SECRET,
          callbackUrl: `${baseUrl}/api/auth/facebook/callback`,
        },
        requiredUrls: {
          privacyPolicy: `${baseUrl}/privacy-policy`,
          dataDeletion: `${baseUrl}/data-deletion`,
          termsOfService: `${baseUrl}/terms-of-service`,
        },
        baseUrl,
        environment: process.env.NODE_ENV || 'development',
      };

      res.json(status);
    } catch (error) {
      console.error('Error checking OAuth status:', error);
      res.status(500).json({ error: 'Failed to check OAuth status' });
    }
  });

  // Health check endpoint for monitoring
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connectivity
      await storage.getUser('health-check');
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // ==================== IMAGE UPLOAD ROUTES ====================
  
  // Upload restaurant logo
  app.post('/api/upload/restaurant-logo', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: 'Image upload service not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const restaurantId = req.body.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID required' });
      }

      // Verify user owns this restaurant
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        req.file.buffer,
        'restaurant-logos',
        `restaurant-${restaurantId}-logo`
      );

      // Save to database
      const imageUpload = await db.insert(imageUploads).values({
        uploadedByUserId: req.user.id,
        imageType: 'restaurant_logo',
        entityId: restaurantId,
        entityType: 'restaurant',
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: req.file.mimetype,
      }).returning();

      // Update restaurant with new logo URL
      await storage.updateRestaurant(restaurantId, { logoUrl: result.secureUrl });

      res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
    } catch (error) {
      console.error('Error uploading restaurant logo:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Upload restaurant cover image
  app.post('/api/upload/restaurant-cover', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: 'Image upload service not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const restaurantId = req.body.restaurantId;
      if (!restaurantId) {
        return res.status(400).json({ message: 'Restaurant ID required' });
      }

      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        'restaurant-covers',
        `restaurant-${restaurantId}-cover`
      );

      const imageUpload = await db.insert(imageUploads).values({
        uploadedByUserId: req.user.id,
        imageType: 'restaurant_cover',
        entityId: restaurantId,
        entityType: 'restaurant',
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: req.file.mimetype,
      }).returning();

      await storage.updateRestaurant(restaurantId, { coverImageUrl: result.secureUrl });

      res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
    } catch (error) {
      console.error('Error uploading restaurant cover:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Upload deal image
  app.post('/api/upload/deal-image', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: 'Image upload service not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const dealId = req.body.dealId;
      if (!dealId) {
        return res.status(400).json({ message: 'Deal ID required' });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: 'Deal not found' });
      }

      const restaurant = await storage.getRestaurant(deal.restaurantId);
      if (!restaurant || restaurant.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        'deal-images',
        `deal-${dealId}`
      );

      const imageUpload = await db.insert(imageUploads).values({
        uploadedByUserId: req.user.id,
        imageType: 'deal',
        entityId: dealId,
        entityType: 'deal',
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: req.file.mimetype,
      }).returning();

      // Update deal with image URL
      await storage.updateDeal(dealId, { imageUrl: result.secureUrl });

      res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
    } catch (error) {
      console.error('Error uploading deal image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Upload user profile image
  app.post('/api/upload/user-profile', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!isCloudinaryConfigured()) {
        return res.status(503).json({ message: 'Image upload service not configured' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const result = await uploadToCloudinary(
        req.file.buffer,
        'user-profiles',
        `user-${req.user.id}`
      );

      const imageUpload = await db.insert(imageUploads).values({
        uploadedByUserId: req.user.id,
        imageType: 'user_profile',
        entityId: req.user.id,
        entityType: 'user',
        cloudinaryPublicId: result.publicId,
        cloudinaryUrl: result.secureUrl,
        thumbnailUrl: result.thumbnailUrl,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: req.file.mimetype,
      }).returning();

      // Update user profile image
      await storage.upsertUser({
        ...req.user,
        profileImageUrl: result.secureUrl,
      });

      res.json({ imageUpload: imageUpload[0], url: result.secureUrl });
    } catch (error) {
      console.error('Error uploading user profile image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Delete uploaded image
  app.delete('/api/upload/:imageId', isAuthenticated, async (req: any, res) => {
    try {
      const imageId = req.params.imageId;
      const images = await db
        .select()
        .from(imageUploads)
        .where(eq(imageUploads.id, imageId))
        .limit(1);
      const image = images[0];

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Check authorization
      if (image.uploadedByUserId !== req.user.id && req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Delete from Cloudinary
      if (image.cloudinaryPublicId) {
        await deleteFromCloudinary(image.cloudinaryPublicId);
      }

      // Delete from database
      await db.delete(imageUploads).where({ id: imageId });

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Failed to delete image' });
    }
  });

  // ==================== GOLDEN FORK AWARD ROUTES ====================

  // Check Golden Fork eligibility
  app.get('/api/awards/golden-fork/eligibility', isAuthenticated, async (req: any, res) => {
    try {
      const eligibility = await checkGoldenForkEligibility(req.user.id);
      res.json(eligibility);
    } catch (error) {
      console.error('Error checking Golden Fork eligibility:', error);
      res.status(500).json({ message: 'Failed to check eligibility' });
    }
  });

  // Claim Golden Fork award
  app.post('/api/awards/golden-fork/claim', isAuthenticated, async (req: any, res) => {
    try {
      const awarded = await awardGoldenFork(req.user.id);
      if (awarded) {
        res.json({ message: 'Golden Fork awarded!', awarded: true });
      } else {
        res.status(400).json({ message: 'Not eligible for Golden Fork', awarded: false });
      }
    } catch (error) {
      console.error('Error claiming Golden Fork:', error);
      res.status(500).json({ message: 'Failed to claim award' });
    }
  });

  // Get all Golden Fork holders
  app.get('/api/awards/golden-fork/holders', async (req, res) => {
    try {
      const holders = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          influenceScore: users.influenceScore,
          reviewCount: users.reviewCount,
          goldenForkEarnedAt: users.goldenForkEarnedAt,
        })
        .from(users)
        .where(eq(users.hasGoldenFork, true));
      const holdersWithRecommendations = await Promise.all(
        holders.map(async (holder: (typeof holders)[number]) => {
          const recommendationCount = await getUserRecommendationCount(holder.id);
          return { ...holder, recommendationCount };
        }),
      );

      res.json(holdersWithRecommendations);
    } catch (error) {
      console.error('Error fetching Golden Fork holders:', error);
      res.status(500).json({ message: 'Failed to fetch holders' });
    }
  });

  // Get user influence stats
  app.get('/api/user/:userId/influence-stats', async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const influenceScore = await calculateUserInfluenceScore(userId);
      const recommendationCount = await getUserRecommendationCount(userId);
      
      res.json({
        userId: user.id,
        hasGoldenFork: user.hasGoldenFork,
        goldenForkEarnedAt: user.goldenForkEarnedAt,
        reviewCount: user.reviewCount || 0,
        recommendationCount,
        influenceScore,
      });
    } catch (error) {
      console.error('Error fetching influence stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // ==================== GOLDEN PLATE AWARD ROUTES ====================

  // Get all Golden Plate winners
  app.get('/api/awards/golden-plate/winners', async (req, res) => {
    try {
      const winners = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.hasGoldenPlate, true));
      res.json(winners);
    } catch (error) {
      console.error('Error fetching Golden Plate winners:', error);
      res.status(500).json({ message: 'Failed to fetch winners' });
    }
  });

  // Get Golden Plate winners by area
  app.get('/api/awards/golden-plate/winners/:area', async (req, res) => {
    try {
      const area = req.params.area;
      const winners = await db
        .select()
        .from(restaurants)
        .where(
          and(
            eq(restaurants.hasGoldenPlate, true),
            like(restaurants.address, `%${area}%`)
          )
        );
      res.json(winners);
    } catch (error) {
      console.error('Error fetching area Golden Plate winners:', error);
      res.status(500).json({ message: 'Failed to fetch winners' });
    }
  });

  // Get leaderboard for an area
  app.get('/api/awards/golden-plate/leaderboard/:area', async (req, res) => {
    try {
      const area = req.params.area;
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await getAreaLeaderboard(area, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  // Get restaurant ranking stats
  app.get('/api/restaurants/:restaurantId/ranking-stats', async (req, res) => {
    try {
      const restaurantId = req.params.restaurantId;
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      const rankingScore = await calculateRestaurantRankingScore(restaurantId);

      res.json({
        restaurantId: restaurant.id,
        hasGoldenPlate: restaurant.hasGoldenPlate,
        goldenPlateCount: restaurant.goldenPlateCount || 0,
        goldenPlateEarnedAt: restaurant.goldenPlateEarnedAt,
        rankingScore,
      });
    } catch (error) {
      console.error('Error fetching ranking stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Admin: Award Golden Plates for a specific area (manual trigger)
  app.post('/api/admin/awards/golden-plate/:area', isAdmin, async (req: any, res) => {
    try {
      const area = req.params.area;
      const awardedCount = await awardGoldenPlatesForArea(area);
      res.json({ 
        message: `Awarded Golden Plates to ${awardedCount} restaurants in ${area}`,
        awardedCount 
      });
    } catch (error) {
      console.error('Error awarding Golden Plates:', error);
      res.status(500).json({ message: 'Failed to award Golden Plates' });
    }
  });

  // Get award history
  app.get('/api/awards/history', async (req, res) => {
    try {
      const awardType = req.query.awardType as string;
      const recipientId = req.query.recipientId as string;
      
      const query = await db
        .select()
        .from(awardHistory)
        .orderBy(desc(awardHistory.awardedAt))
        .limit(100);

      res.json(query);
    } catch (error) {
      console.error('Error fetching award history:', error);
      res.status(500).json({ message: 'Failed to fetch award history' });
    }
  });

  // Register video stories routes (MVP Phase 1)
  const setupStoriesRoutes = (await import('./storiesRoutes')).default;
  setupStoriesRoutes(app);

  // Register story cron jobs (cleanup and level recalculation)
  registerStoryCronJobs(app);

  // Schedule Weekly Digest (Monday 8:00 AM)
  cron.schedule('0 8 * * 1', async () => {
    console.log('⏰ Triggering Weekly Digest Cron Job');
    try {
      await DigestService.getInstance().sendWeeklyDigests();
      console.log('✅ Weekly Digest Cron Job Completed');
    } catch (error) {
      console.error('❌ Weekly Digest Cron Job Failed:', error);
    }
  });

  // Schedule Unbooked Event Notifications (Every hour)
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Triggering Unbooked Event Notification Check');
    try {
      const stats = await notifyUnbookedEvents();
      console.log('✅ Unbooked Event Notification Check Completed:', stats);
    } catch (error) {
      console.error('❌ Unbooked Event Notification Check Failed:', error);
    }
  });

  // Register incident management routes (admin-only)
  const incidentRoutes = (await import('./incidentRoutes')).default;
  app.use('/api/incidents', incidentRoutes);

  // Register admin control center routes (admin-only)
  const adminRoutes = (await import('./adminRoutes')).default;
  app.use('/api/admin', adminRoutes);

  // Register admin telemetry routes (admin-only)
  const telemetryRoutes = (await import('./telemetryRoutes')).default;
  app.use('/api/admin/telemetry', telemetryRoutes);

  // Register evidence export routes (admin-only)
  const evidenceExportRoutes = (await import('./evidenceExportRoutes')).default;
  app.use('/api/admin', evidenceExportRoutes);

  // Register affiliate system routes
  const affiliateRoutes = (await import('./affiliateRoutes')).default;
  app.use('/api/affiliate', affiliateRoutes);

  // Register payout preferences routes
  const setupPayoutRoutes = (await import('./payoutRoutes')).default;
  setupPayoutRoutes(app);

  // Register empty county experience routes (Phase 6)
  const setupEmptyCountyRoutes = (await import('./emptyCountyRoutes')).default;
  setupEmptyCountyRoutes(app);

  // Register share link routes (Phase 7)
  const setupShareRoutes = (await import('./shareRoutes')).default;
  setupShareRoutes(app);

  // Register user routes (balance, search)
  const userRoutes = (await import('./userRoutes')).default;
  app.use('/api/users', userRoutes);

  // Register redemption routes (Phase R1)
  const redemptionRoutes = (await import('./redemptionRoutes')).default;
  app.use('/api/restaurants', redemptionRoutes);

  // Add share middleware (Phase 7) - adds shareUrl helpers to all handlers
  const { shareUrlMiddleware } = await import('./shareMiddleware');
  app.use(shareUrlMiddleware);

  // Register cron/scheduler endpoints
  app.post('/api/cron/escalations', incidentRoutes.stack.find((layer: any) => 
    layer.route?.path === '/cron/escalations'
  )?.handle || ((_req, res) => res.status(404).json({ error: 'Not found' })));

  app.post('/api/cron/auto-close', incidentRoutes.stack.find((layer: any) => 
    layer.route?.path === '/cron/auto-close'
  )?.handle || ((_req, res) => res.status(404).json({ error: 'Not found' })));

  const httpServer = createServer(app);
  return httpServer;
}

