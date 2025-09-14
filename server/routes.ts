import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth } from "./facebookAuth";
import { setupUnifiedAuth, isAuthenticated, isRestaurantOwner } from "./unifiedAuth";
import { emailService } from "./emailService";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema, insertVerificationRequestSchema, insertDealViewSchema, insertFoodTruckLocationSchema, updateRestaurantMobileSettingsSchema, insertFoodTruckSessionSchema, insertRestaurantFavoriteSchema, insertRestaurantRecommendationSchema, insertUserAddressSchema, insertPasswordResetTokenSchema } from "@shared/schema";
import { z } from "zod";
import { validateDocuments, checkRateLimit } from "./documentValidation";
import { randomBytes, timingSafeEqual, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { broadcastLocationUpdate, broadcastStatusUpdate } from "./websocket";

// Optional Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Beta mode flag - when enabled, all users get free access to all features
const BETA_MODE = process.env.BETA_MODE === 'true';

// Production safety check: warn if beta mode is enabled in production
if (process.env.NODE_ENV === 'production' && BETA_MODE) {
  console.warn('⚠️  WARNING: BETA_MODE is enabled in production environment! All users will have free access to premium features.');
}

// Password reset rate limiting (similar to document submission rate limiting)
const passwordResetAttempts = new Map<string, number[]>();

function checkPasswordResetRateLimit(key: string): { allowed: boolean; nextAllowedTime?: Date; remainingAttempts?: number } {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 3; // Max 3 attempts per 15 minutes per IP/email combo
  
  // Get existing attempts for this key (IP+email combination)
  const attempts = passwordResetAttempts.get(key) || [];
  
  // Remove attempts older than 15 minutes
  const recentAttempts = attempts.filter(timestamp => now - timestamp < fifteenMinutes);
  
  // Update the map with cleaned attempts
  passwordResetAttempts.set(key, recentAttempts);
  
  // Check if rate limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const nextAllowedTime = new Date(oldestAttempt + fifteenMinutes);
    
    return {
      allowed: false,
      nextAllowedTime,
      remainingAttempts: 0
    };
  }
  
  // Record this attempt
  recentAttempts.push(now);
  passwordResetAttempts.set(key, recentAttempts);
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - recentAttempts.length 
  };
}

// Clean up old password reset rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  
  for (const [key, attempts] of Array.from(passwordResetAttempts.entries())) {
    const recentAttempts = attempts.filter((timestamp: number) => now - timestamp < fifteenMinutes);
    if (recentAttempts.length === 0) {
      passwordResetAttempts.delete(key);
    } else {
      passwordResetAttempts.set(key, recentAttempts);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Environment validation for production
function validateEnvironment() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
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

    // Return subscription tier for different feature access
    const tier = user.subscriptionBillingInterval === 'multiple-deals' ? 'multiple-deals' : 
                 user.subscriptionBillingInterval === 'single-deal' ? 'single-deal' :
                 user.subscriptionBillingInterval === 'year' ? 'yearly' : 
                 user.subscriptionBillingInterval === '3-month' ? 'quarterly' : 
                 'monthly'; // legacy fallback

    return { 
      hasAccess: true, 
      subscriptionTier: tier
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

// Subscription validation function
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

    // During beta testing, all users get unlimited deals
    if (BETA_MODE) {
      return { isValid: true, currentCount: 0, maxDeals: 999 };
    }

    // Check if user has beta access (free)
    if (user.subscriptionBillingInterval && !user.stripeSubscriptionId) {
      // Beta user - allow unlimited deals for now
      return { isValid: true, currentCount: 0, maxDeals: 999 };
    }

    // Check if user has active subscription
    if (!stripe || !user.stripeSubscriptionId) {
      return { 
        isValid: false, 
        error: "Active subscription required to create deals. Please upgrade your plan.",
        currentCount: 0,
        maxDeals: 0
      };
    }

    // Verify subscription status with Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    if (!subscription || subscription.status !== 'active') {
      return { 
        isValid: false, 
        error: "Your subscription is not active. Please check your payment method and try again.",
        currentCount: 0,
        maxDeals: 0
      };
    }

    // Get user's restaurants and count active deals
    const restaurants = await storage.getRestaurantsByOwner(userId);
    let activeDealsCount = 0;
    
    for (const restaurant of restaurants) {
      const deals = await storage.getDealsByRestaurant(restaurant.id);
      const activeDeals = deals.filter(d => d.isActive && (!excludeDealId || d.id !== excludeDealId));
      activeDealsCount += activeDeals.length;
    }

    // Define deal limits based on subscription plan
    const maxDeals = user.subscriptionBillingInterval === 'multiple-deals' ? 3 : 1; // 3 deals for addon, 1 for base

    if (activeDealsCount >= maxDeals) {
      return { 
        isValid: false, 
        error: `You've reached your limit of ${maxDeals} active deals. Upgrade your plan or deactivate existing deals.`,
        currentCount: activeDealsCount,
        maxDeals
      };
    }

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
  // Validate environment in production
  if (process.env.NODE_ENV === 'production') {
    validateEnvironment();
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
      // Validate request body
      const schema = z.object({
        email: z.string().email("Valid email is required").toLowerCase(),
      });
      
      const { email } = schema.parse(req.body);
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      
      // Rate limiting by IP+email combination for security
      const rateLimitKey = `${clientIp}:${email}`;
      const rateLimit = checkPasswordResetRateLimit(rateLimitKey);
      
      if (!rateLimit.allowed) {
        const resetTimeMinutes = Math.ceil((rateLimit.nextAllowedTime!.getTime() - Date.now()) / (1000 * 60));
        return res.status(429).json({
          error: "Too many password reset attempts",
          message: `Please try again in ${resetTimeMinutes} minutes`,
          nextAllowedTime: rateLimit.nextAllowedTime
        });
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
      
      // Look up user by email
      const user = await storage.getUserByEmail(email);
      
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
        message: "If an account with that email exists, a password reset link has been sent.",
        remainingAttempts: rateLimit.remainingAttempts
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

  app.patch('/api/deals/:dealId', isAuthenticated, async (req: any, res) => {
    try {
      const { dealId } = req.params;
      const updates = req.body;
      const userId = req.user.id;
      
      // Get current deal to check ownership
      const currentDeal = await storage.getDeal(dealId);
      if (!currentDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Verify restaurant ownership
      const restaurant = await storage.getRestaurant(currentDeal.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
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

  app.delete('/api/deals/:dealId', isAuthenticated, async (req: any, res) => {
    try {
      const { dealId } = req.params;
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
      const { orderAmount } = req.body;
      
      // Validate order amount
      const amountSchema = z.object({
        orderAmount: z.number().positive().min(0.01).max(10000),
      });
      
      const { orderAmount: validatedAmount } = amountSchema.parse({ orderAmount });
      
      // Verify that the user owns the restaurant associated with this claim
      const isAuthorized = await storage.verifyRestaurantOwnershipByClaim(claimId, req.user.id);
      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: You can only mark claims as used for your own restaurants" });
      }
      
      const updatedClaim = await storage.markClaimAsUsed(claimId, validatedAmount);
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
        const csvRows = exportData.map(row => {
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

  // Restaurant routes (require restaurant owner authentication)
  app.post('/api/restaurants', isRestaurantOwner, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const restaurantData = insertRestaurantSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const restaurant = await storage.createRestaurant(restaurantData);
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
      const userId = req.user.id;
      const dealData = insertDealSchema.parse(req.body);
      
      // Verify restaurant ownership
      const restaurant = await storage.getRestaurant(dealData.restaurantId);
      if (!restaurant || restaurant.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Validate subscription limits
      const subscriptionValidation = await validateSubscriptionLimits(userId);
      if (!subscriptionValidation.isValid) {
        return res.status(402).json({ 
          message: subscriptionValidation.error,
          currentCount: subscriptionValidation.currentCount,
          maxDeals: subscriptionValidation.maxDeals
        });
      }
      
      const deal = await storage.createDeal(dealData);
      res.json(deal);
    } catch (error: any) {
      console.error("Error creating deal:", error);
      res.status(400).json({ message: error.message });
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


  app.get('/api/deals/restaurant/:restaurantId', async (req, res) => {
    try {
      const deals = await storage.getDealsByRestaurant(req.params.restaurantId);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching restaurant deals:", error);
      res.status(500).json({ message: "Failed to fetch restaurant deals" });
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

  // Stripe subscription route for restaurant fees
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    const user = req.user;
    const { hasMultipleDealsAddon, promoCode } = req.body; // boolean for multiple deals addon
    
    // Check for valid promo codes first (skip payment for beta users)
    if (promoCode && promoCode.toUpperCase() === 'BETA') {
      // Grant free beta access without Stripe subscription
      try {
        await storage.updateUser(user.id, {
          subscriptionBillingInterval: hasMultipleDealsAddon ? 'multiple-deals' : 'single-deal',
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

    if (!stripe) {
      return res.status(503).json({ error: { message: 'Payment processing is not configured' } });
    }

    const interval = 'month'; // Always monthly billing

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent']
        });
        
        // If subscription is incomplete, update it with the new plan
        if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
          const unitAmount = hasMultipleDealsAddon ? 7400 : 4900; // $74 or $49
          const productName = hasMultipleDealsAddon 
            ? 'MealScout Restaurant Plan - Multiple Deals (3 deals)'
            : 'MealScout Restaurant Plan - Single Deal (1 deal)';
          
          const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            items: [{
              id: subscription.items.data[0].id,
              price_data: {
                currency: 'usd',
                product_data: {
                  name: productName,
                },
                unit_amount: unitAmount,
                recurring: {
                  interval: 'month',
                  interval_count: 1,
                },
              } as any,
            }],
            expand: ['latest_invoice.payment_intent'],
          });
          
          // Update user billing interval
          await storage.updateUser(user.id, {
            subscriptionBillingInterval: hasMultipleDealsAddon ? 'multiple-deals' : 'single-deal'
          });
          
          const latestInvoice = updatedSubscription.latest_invoice;
          const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
          
          res.send({
            subscriptionId: updatedSubscription.id,
            clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
          });
          return;
        }
        
        // If subscription is active, return existing
        const latestInvoice = subscription.latest_invoice;
        const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
        });
        return;
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

      // Calculate pricing based on deal addon
      // Base: $49/month (1 deal), Multiple: $74/month (3 deals total)
      let unitAmount: number;
      let productName: string;
      const intervalCount = 1; // Always monthly
      
      if (hasMultipleDealsAddon) {
        unitAmount = 7400; // $74 monthly for multiple deals (3 total)
        productName = 'MealScout Restaurant Plan - Multiple Deals (3 deals)';
      } else {
        unitAmount = 4900; // $49 monthly for single deal
        productName = 'MealScout Restaurant Plan - Single Deal (1 deal)';
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: interval as 'month' | 'year',
              interval_count: intervalCount,
            },
          } as any,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id, hasMultipleDealsAddon ? 'multiple-deals' : 'single-deal');
  
      // Send payment confirmation email asynchronously
      const amount = hasMultipleDealsAddon ? 7400 : 4900; // $74 or $49 per month
      const planType = hasMultipleDealsAddon ? 'multiple-deals' : 'single-deal';
      emailService.sendPaymentConfirmation(user, amount, planType, subscription.id).catch(err => 
        console.error('Failed to send payment confirmation email:', err)
      );
  
      const latestInvoice = subscription.latest_invoice;
      const paymentIntent = typeof latestInvoice === 'object' && latestInvoice ? (latestInvoice as any).payment_intent : null;
      res.send({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent === 'object' && paymentIntent ? paymentIntent.client_secret : null,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Check subscription status  
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment service unavailable" });
    }

    try {
      const user = req.user;
      
      if (!user.stripeSubscriptionId) {
        return res.json({ status: 'none' });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
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
      
      // Create the deal claim
      await storage.claimDeal({
        dealId,
        userId,
      });
      
      // Increment deal uses
      await storage.incrementDealUses(dealId);
      
      // Return Facebook post data
      res.json({
        success: true,
        dealTitle: deal.title,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        facebookPostData: {
          message: `Just claimed this amazing deal at ${restaurant.name}! 🍽️\n\n${deal.title}\n\nFound this through MealScout - check it out! #MealScout #FoodDeals`,
          place: restaurant.name,
          link: `${req.protocol}://${req.get('host')}/deal/${dealId}`,
          name: deal.title,
          description: `${deal.description} - Available at ${restaurant.name}`,
        }
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
  app.get('/api/auth/admin/verify', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType === 'admin') {
        res.json(user);
      } else {
        res.status(403).json({ message: "Admin access required" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to verify admin" });
    }
  });

  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/restaurants/pending', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const restaurants = await storage.getPendingRestaurants();
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching pending restaurants:", error);
      res.status(500).json({ message: "Failed to fetch pending restaurants" });
    }
  });

  app.post('/api/admin/restaurants/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.approveRestaurant(req.params.id);
      res.json({ message: "Restaurant approved successfully" });
    } catch (error) {
      console.error("Error approving restaurant:", error);
      res.status(500).json({ message: "Failed to approve restaurant" });
    }
  });

  app.delete('/api/admin/restaurants/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      await storage.deleteRestaurant(req.params.id);
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/admin/users/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { isActive } = req.body;
      await storage.updateUserStatus(req.params.id, isActive);
      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  app.get('/api/admin/deals', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const deals = await storage.getAllDealsWithRestaurants();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });


  // Admin verification routes
  app.get('/api/admin/verifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { status } = req.query;
      let verifications = await storage.getVerificationRequests();
      
      // Filter by status if provided
      if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
        verifications = verifications.filter(v => v.status === status);
      }
      
      res.json(verifications);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      res.status(500).json({ message: "Failed to fetch verification requests" });
    }
  });

  app.post('/api/admin/verifications/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      await storage.approveVerificationRequest(id, user.id);
      res.json({ success: true, message: "Verification request approved" });
    } catch (error) {
      console.error("Error approving verification request:", error);
      res.status(500).json({ message: "Failed to approve verification request" });
    }
  });

  app.post('/api/admin/verifications/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      await storage.rejectVerificationRequest(id, user.id, reason);
      res.json({ success: true, message: "Verification request rejected" });
    } catch (error) {
      console.error("Error rejecting verification request:", error);
      res.status(500).json({ message: "Failed to reject verification request" });
    }
  });

  // Handle frequent HEAD /api requests efficiently (likely from monitoring)
  app.head('/api', (req, res) => {
    res.status(200).end();
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

  const httpServer = createServer(app);
  return httpServer;
}
