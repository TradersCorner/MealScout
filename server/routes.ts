import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./facebookAuth";
import { insertRestaurantSchema, insertDealSchema, insertReviewSchema } from "@shared/schema";
import { z } from "zod";

// Optional Stripe integration
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  // Restaurant routes
  app.post('/api/restaurants', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/restaurants/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const restaurants = await storage.getRestaurantsByOwner(userId);
      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
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
      const deals = await storage.getFeaturedDeals();
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

  app.post('/api/deals/:id/claim', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dealId = req.params.id;
      
      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Check per-customer limit
      const userClaims = await storage.getDealClaimsCount(dealId, userId);
      if (deal.perCustomerLimit && userClaims >= deal.perCustomerLimit) {
        return res.status(400).json({ message: "Deal limit reached for this customer" });
      }
      
      // Check total uses limit
      if (deal.totalUsesLimit && deal.currentUses >= deal.totalUsesLimit) {
        return res.status(400).json({ message: "Deal limit reached" });
      }
      
      const claim = await storage.claimDeal({ dealId, userId });
      await storage.incrementDealUses(dealId);
      
      res.json(claim);
    } catch (error: any) {
      console.error("Error claiming deal:", error);
      res.status(400).json({ message: error.message });
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

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const paymentIntent = subscription.latest_invoice?.payment_intent;
        
        res.send({
          subscriptionId: subscription.id,
          clientSecret: typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null,
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

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MealScout Restaurant Plan',
              description: 'Monthly subscription for restaurant deal promotions',
            },
            unit_amount: 4900, // $49.00 in cents
            recurring: {
              interval: 'month',
            },
          },
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
  
      const paymentIntent = subscription.latest_invoice?.payment_intent;
      res.send({
        subscriptionId: subscription.id,
        clientSecret: typeof paymentIntent === 'object' ? paymentIntent?.client_secret : null,
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
      if (deal.totalUsesLimit && deal.currentUses >= deal.totalUsesLimit) {
        return res.status(400).json({ message: "Deal is no longer available" });
      }
      
      // Create the deal claim
      await storage.claimDeal({
        dealId,
        userId,
        claimedAt: new Date(),
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

  const httpServer = createServer(app);
  return httpServer;
}
