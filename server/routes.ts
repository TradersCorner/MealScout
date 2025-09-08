import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth } from "./facebookAuth";
import { setupUnifiedAuth, isAuthenticated, isRestaurantOwner } from "./unifiedAuth";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

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
  await setupAuth(app);
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
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ error: { message: 'Payment processing is not configured' } });
    }

    const user = req.user;
    const { billingInterval } = req.body; // 'month' or 'year'
    const interval = billingInterval === 'year' ? 'year' : 'month';

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
      // Monthly: $49/month, Yearly: $441/year (25% discount = $588 - $147 = $441)
      const unitAmount = interval === 'year' ? 44100 : 4900; // $441 yearly or $49 monthly
      const productName = interval === 'year' 
        ? 'MealScout Restaurant Plan (Annual - Save 25%)'
        : 'MealScout Restaurant Plan (Monthly)';

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product: productName,
            unit_amount: unitAmount,
            recurring: {
              interval: interval,
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id, interval);
  
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
