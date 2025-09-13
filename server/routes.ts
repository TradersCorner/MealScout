import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth } from "./facebookAuth";
import { setupUnifiedAuth, isAuthenticated, isRestaurantOwner } from "./unifiedAuth";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema, insertVerificationRequestSchema, insertDealViewSchema, insertFoodTruckLocationSchema, updateRestaurantMobileSettingsSchema, insertFoodTruckSessionSchema } from "@shared/schema";
import { z } from "zod";
import { validateDocuments, checkRateLimit } from "./documentValidation";
import { broadcastLocationUpdate, broadcastStatusUpdate } from "./websocket";

// Optional Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

// Environment validation for production
function validateEnvironment() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
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
      // Use cached version for better performance
      const deals = await storage.getFeaturedDealsCached();
      
      // Add cache headers for client-side caching
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': `"deals-${Date.now()}"`,
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
    if (!stripe) {
      return res.status(503).json({ error: { message: 'Payment processing is not configured' } });
    }

    const user = req.user;
    const { billingInterval } = req.body; // 'month' | '3-month' | 'year'
    const interval = billingInterval === 'year' ? 'year' : billingInterval === '3-month' ? 'month' : 'month';

    // Check if user is eligible for quarterly plan (new users only)
    if (billingInterval === '3-month' && user.stripeSubscriptionId) {
      return res.status(400).json({ 
        error: { 
          message: 'Quarterly plan is only available for new users. Please choose monthly or yearly subscription.' 
        } 
      });
    }

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent']
        });
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

      // Calculate pricing based on billing interval
      // Monthly: $49/month, 3-Month: $100/3 months (new users only), Yearly: $450/year (23% discount)
      let unitAmount: number;
      let productName: string;
      let intervalCount = 1;
      
      if (billingInterval === '3-month') {
        unitAmount = 10000; // $100 for 3 months
        intervalCount = 3; // Bill every 3 months
        productName = 'DealScout Restaurant Plan (Quarterly - Save 32%)';
      } else if (billingInterval === 'year') {
        unitAmount = 45000; // $450 yearly
        productName = 'DealScout Restaurant Plan (Annual - Save 23%)';
      } else {
        unitAmount = 4900; // $49 monthly
        productName = 'DealScout Restaurant Plan (Monthly)';
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

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id, billingInterval);
  
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
          message: `Just claimed this amazing deal at ${restaurant.name}! 🍽️\n\n${deal.title}\n\nFound this through TradeScout - check it out! #TradeScout #FoodDeals`,
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

  app.patch('/api/admin/deals/:id/featured', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { isFeatured } = req.body;
      await storage.updateDealFeatured(req.params.id, isFeatured);
      res.json({ message: "Deal featured status updated successfully" });
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({ message: "Failed to update deal" });
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
