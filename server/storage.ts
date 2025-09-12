import {
  users,
  restaurants,
  deals,
  dealClaims,
  reviews,
  verificationRequests,
  dealViews,
  foodTruckSessions,
  foodTruckLocations,
  type User,
  type UpsertUser,
  type Restaurant,
  type InsertRestaurant,
  type Deal,
  type InsertDeal,
  type DealClaim,
  type InsertDealClaim,
  type Review,
  type InsertReview,
  type VerificationRequest,
  type InsertVerificationRequest,
  type DealView,
  type InsertDealView,
  type FoodTruckSession,
  type InsertFoodTruckSession,
  type FoodTruckLocation,
  type InsertFoodTruckLocation,
  type UpdateRestaurantMobileSettings,
  type GoogleUserData,
  type EmailUserData,
  type FacebookUserData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, asc, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserByAuth(authType: 'google' | 'email' | 'facebook', userData: GoogleUserData | EmailUserData | FacebookUserData, userType?: 'customer' | 'restaurant_owner'): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string, subscriptionBillingInterval?: string): Promise<User>;
  
  // Restaurant operations
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant>;
  getNearbyRestaurants(lat: number, lng: number, radiusKm: number): Promise<Restaurant[]>;
  verifyRestaurantOwnership(restaurantId: string, userId: string): Promise<boolean>;
  
  // Deal operations
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsByRestaurant(restaurantId: string): Promise<Deal[]>;
  getActiveDeals(): Promise<Deal[]>;
  getFeaturedDeals(): Promise<Deal[]>;
  getNearbyDeals(lat: number, lng: number, radiusKm: number): Promise<Deal[]>;
  searchDeals(filters: {
    query?: string;
    cuisineType?: string;
    minPrice?: number;
    maxPrice?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    sortBy?: string;
  }): Promise<Deal[]>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  incrementDealUses(id: string): Promise<void>;
  deactivateUserDeals(userId: string): Promise<void>;
  
  // Deal claim operations
  claimDeal(claim: InsertDealClaim): Promise<DealClaim>;
  getUserDealClaims(userId: string): Promise<DealClaim[]>;
  getDealClaimsCount(dealId: string, userId?: string): Promise<number>;
  getRestaurantDealClaims(restaurantId: string, status?: string): Promise<any[]>;
  verifyRestaurantOwnershipByClaim(claimId: string, userId: string): Promise<boolean>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getRestaurantReviews(restaurantId: string): Promise<Review[]>;
  getRestaurantAverageRating(restaurantId: string): Promise<number>;
  
  // Admin operations
  ensureAdminExists(): Promise<void>;
  
  // Verification operations
  createVerificationRequest(verificationRequest: InsertVerificationRequest): Promise<VerificationRequest>;
  getVerificationRequestsByOwner(ownerId: string): Promise<VerificationRequest[]>;
  getVerificationRequests(): Promise<(VerificationRequest & { restaurant: { id: string; name: string; address: string; ownerId: string } })[]>;
  approveVerificationRequest(id: string, reviewerId: string): Promise<void>;
  rejectVerificationRequest(id: string, reviewerId: string, reason: string): Promise<void>;
  setRestaurantVerified(restaurantId: string, isVerified: boolean): Promise<void>;
  hasPendingVerificationRequest(restaurantId: string): Promise<boolean>;
  
  // Deal view tracking operations
  recordDealView(view: InsertDealView): Promise<DealView>;
  getDealViewsCount(dealId: string, dateRange?: { start: Date; end: Date }): Promise<number>;
  hasRecentDealView(dealId: string, userId?: string, sessionId?: string, timeWindowMs?: number): Promise<boolean>;
  
  // Deal claim revenue operations
  markClaimAsUsed(claimId: string, orderAmount: number): Promise<DealClaim>;
  
  // Advanced analytics operations
  getRestaurantAnalyticsSummary(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalViews: number;
    totalClaims: number;
    totalRevenue: number;
    conversionRate: number;
    topDeals: Array<{ dealId: string; title: string; views: number; claims: number; revenue: number }>;
  }>;
  
  getRestaurantAnalyticsTimeseries(restaurantId: string, dateRange: { start: Date; end: Date }, interval: 'day' | 'week'): Promise<Array<{
    date: string;
    views: number;
    claims: number;
    revenue: number;
  }>>;
  
  getRestaurantCustomerInsights(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<{
    repeatCustomers: number;
    averageOrderValue: number;
    peakHours: Array<{ hour: number; count: number }>;
    demographics: {
      ageGroups: Array<{ range: string; count: number }>;
      genderBreakdown: Array<{ gender: string; count: number }>;
    };
  }>;
  
  getRestaurantAnalyticsExport(restaurantId: string, dateRange: { start: Date; end: Date }): Promise<Array<{
    dealTitle: string;
    date: string;
    views: number;
    claims: number;
    revenue: number;
  }>>;
  
  // Food truck operations
  setRestaurantMobileSettings(restaurantId: string, settings: UpdateRestaurantMobileSettings): Promise<Restaurant>;
  startTruckSession(restaurantId: string, deviceId: string, userId: string): Promise<FoodTruckSession>;
  endTruckSession(restaurantId: string, userId: string): Promise<void>;
  getActiveTruckSession(restaurantId: string): Promise<FoodTruckSession | undefined>;
  upsertLiveLocation(location: InsertFoodTruckLocation): Promise<FoodTruckLocation>;
  getLiveTrucksNearby(lat: number, lng: number, radiusKm: number): Promise<Array<Restaurant & { distance: number; sessionId?: string }>>;
  getTruckLocationHistory(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<FoodTruckLocation[]>;
  hasRecentLocationUpdate(restaurantId: string, lat: number, lng: number, timeWindowMs?: number, distanceThreshold?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Stripe helpers
  async updateUserStripeCustomerId(userId: string, customerId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string, subscriptionBillingInterval?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionBillingInterval,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }


  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.facebookId,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUserByAuth(authType: 'google' | 'email' | 'facebook', userData: GoogleUserData | EmailUserData | FacebookUserData, userType: 'customer' | 'restaurant_owner' | 'admin' = 'customer'): Promise<User> {
    if (authType === 'google') {
      const googleData = userData as GoogleUserData;
      const [user] = await db
        .insert(users)
        .values({
          userType,
          googleId: googleData.googleId,
          email: googleData.email,
          firstName: googleData.firstName,
          lastName: googleData.lastName,
          profileImageUrl: googleData.profileImageUrl,
          googleAccessToken: googleData.googleAccessToken,
        })
        .onConflictDoUpdate({
          target: users.googleId,
          set: {
            email: googleData.email,
            firstName: googleData.firstName,
            lastName: googleData.lastName,
            profileImageUrl: googleData.profileImageUrl,
            googleAccessToken: googleData.googleAccessToken,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } else if (authType === 'facebook') {
      const facebookData = userData as FacebookUserData;
      const [user] = await db
        .insert(users)
        .values({
          userType,
          facebookId: facebookData.facebookId,
          email: facebookData.email,
          firstName: facebookData.firstName,
          lastName: facebookData.lastName,
          profileImageUrl: facebookData.profileImageUrl,
          facebookAccessToken: facebookData.facebookAccessToken,
        })
        .onConflictDoUpdate({
          target: users.facebookId,
          set: {
            email: facebookData.email,
            firstName: facebookData.firstName,
            lastName: facebookData.lastName,
            profileImageUrl: facebookData.profileImageUrl,
            facebookAccessToken: facebookData.facebookAccessToken,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } else {
      const emailData = userData as EmailUserData;
      const [user] = await db
        .insert(users)
        .values({
          userType,
          email: emailData.email,
          firstName: emailData.firstName,
          lastName: emailData.lastName,
          passwordHash: emailData.passwordHash,
          emailVerified: true,
        })
        .returning();
      return user;
    }
  }


  // Restaurant operations
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurant)
      .returning();
    return newRestaurant;
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    return restaurant;
  }

  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    return await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));
  }

  async updateRestaurant(id: string, restaurant: Partial<InsertRestaurant>): Promise<Restaurant> {
    const [updated] = await db
      .update(restaurants)
      .set({
        ...restaurant,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, id))
      .returning();
    return updated;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants);
  }

  async getNearbyRestaurants(lat: number, lng: number, radiusKm: number): Promise<Restaurant[]> {
    // Using simple distance calculation - in production, consider PostGIS
    return await db
      .select()
      .from(restaurants)
      .where(
        and(
          eq(restaurants.isActive, true),
          sql`
            (6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(${restaurants.latitude})) * 
              cos(radians(${restaurants.longitude}) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(${restaurants.latitude}))
            )) <= ${radiusKm}
          `
        )
      );
  }

  async verifyRestaurantOwnership(restaurantId: string, userId: string): Promise<boolean> {
    const [restaurant] = await db
      .select({ ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);
    
    return restaurant?.ownerId === userId;
  }

  // Deal operations
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db
      .insert(deals)
      .values(deal)
      .returning();
    return newDeal;
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.id, id));
    return deal;
  }

  async getDealsByRestaurant(restaurantId: string): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId))
      .orderBy(desc(deals.createdAt));
  }

  async updateDeal(id: string, updates: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db
      .update(deals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();
    return updated;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async getActiveDeals(): Promise<Deal[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    
    return await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          lte(deals.startTime, currentTime),
          gte(deals.endTime, currentTime)
        )
      )
      .orderBy(desc(deals.isFeatured), desc(deals.createdAt))
      .limit(50); // Limit results for better performance
  }

  async getFeaturedDeals(): Promise<any[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Get all active deals and randomly select a subset as "featured"
    return await db
      .select({
        id: deals.id,
        restaurantId: deals.restaurantId,
        title: deals.title,
        description: deals.description,
        dealType: deals.dealType,
        discountValue: deals.discountValue,
        minOrderAmount: deals.minOrderAmount,
        imageUrl: deals.imageUrl,
        startDate: deals.startDate,
        endDate: deals.endDate,
        startTime: deals.startTime,
        endTime: deals.endTime,
        totalUsesLimit: deals.totalUsesLimit,
        perCustomerLimit: deals.perCustomerLimit,
        currentUses: deals.currentUses,
        isFeatured: deals.isFeatured,
        isActive: deals.isActive,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        restaurant: {
          name: restaurants.name,
          cuisineType: restaurants.cuisineType,
          phone: restaurants.phone,
          latitude: restaurants.latitude,
          longitude: restaurants.longitude,
        }
      })
      .from(deals)
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(
        and(
          eq(deals.isActive, true),
          eq(restaurants.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          lte(deals.startTime, currentTime),
          gte(deals.endTime, currentTime)
        )
      )
      .orderBy(sql`RANDOM()`) // Random order each time
      .limit(6); // Limit to 6 random featured deals
  }

  // Cache frequently accessed data
  private featuredDealsCache: { data: any[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getFeaturedDealsCached(): Promise<any[]> {
    const now = Date.now();
    
    if (this.featuredDealsCache && now - this.featuredDealsCache.timestamp < this.CACHE_TTL) {
      return this.featuredDealsCache.data;
    }
    
    const data = await this.getFeaturedDeals();
    this.featuredDealsCache = { data, timestamp: now };
    
    return data;
  }

  // Admin specific methods
  async getAdminStats(): Promise<any> {
    const [
      totalUsers,
      totalRestaurants,
      totalDeals,
      activeDeals,
      totalClaims,
      todayClaims,
      newUsersToday
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(restaurants),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(deals),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(deals).where(eq(deals.isActive, true)),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(dealClaims),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(dealClaims)
        .where(gte(dealClaims.claimedAt, new Date(new Date().setHours(0, 0, 0, 0)))),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users)
        .where(gte(users.createdAt, new Date(new Date().setHours(0, 0, 0, 0))))
    ]);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalRestaurants: totalRestaurants[0]?.count || 0,
      totalDeals: totalDeals[0]?.count || 0,
      activeDeals: activeDeals[0]?.count || 0,
      totalClaims: totalClaims[0]?.count || 0,
      todayClaims: todayClaims[0]?.count || 0,
      newUsersToday: newUsersToday[0]?.count || 0,
      revenue: 0 // Placeholder for revenue calculation
    };
  }

  async getPendingRestaurants(): Promise<Restaurant[]> {
    return await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.isActive, false))
      .orderBy(desc(restaurants.createdAt));
  }

  async approveRestaurant(restaurantId: string): Promise<void> {
    await db
      .update(restaurants)
      .set({ isActive: true })
      .where(eq(restaurants.id, restaurantId));
  }

  async deleteRestaurant(restaurantId: string): Promise<void> {
    await db
      .delete(restaurants)
      .where(eq(restaurants.id, restaurantId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    // Note: Users table doesn't have isActive field, this is a placeholder
    // Would need to add isActive field to users schema first
    console.log(`Would update user ${userId} status to ${isActive}`);
  }

  async getAllDealsWithRestaurants(): Promise<any[]> {
    return await db
      .select({
        id: deals.id,
        title: deals.title,
        discountValue: deals.discountValue,
        isActive: deals.isActive,
        isFeatured: deals.isFeatured,
        restaurant: {
          id: restaurants.id,
          name: restaurants.name,
        }
      })
      .from(deals)
      .leftJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .orderBy(desc(deals.createdAt));
  }

  async updateDealFeatured(dealId: string, isFeatured: boolean): Promise<void> {
    await db
      .update(deals)
      .set({ isFeatured })
      .where(eq(deals.id, dealId));
  }

  async getNearbyDeals(lat: number, lng: number, radiusKm: number): Promise<any[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    return await db
      .select({
        id: deals.id,
        restaurantId: deals.restaurantId,
        title: deals.title,
        description: deals.description,
        dealType: deals.dealType,
        discountValue: deals.discountValue,
        minOrderAmount: deals.minOrderAmount,
        imageUrl: deals.imageUrl,
        startDate: deals.startDate,
        endDate: deals.endDate,
        startTime: deals.startTime,
        endTime: deals.endTime,
        totalUsesLimit: deals.totalUsesLimit,
        perCustomerLimit: deals.perCustomerLimit,
        currentUses: deals.currentUses,
        isFeatured: deals.isFeatured,
        isActive: deals.isActive,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        restaurant: {
          name: restaurants.name,
          cuisineType: restaurants.cuisineType,
          phone: restaurants.phone,
          latitude: restaurants.latitude,
          longitude: restaurants.longitude,
        },
        distance: sql<number>`
          (6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(${restaurants.latitude})) * 
            cos(radians(${restaurants.longitude}) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(${restaurants.latitude}))
          ))
        `.as('distance')
      })
      .from(deals)
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(
        and(
          eq(deals.isActive, true),
          eq(restaurants.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          lte(deals.startTime, currentTime),
          gte(deals.endTime, currentTime),
          sql`
            (6371 * acos(
              cos(radians(${lat})) * 
              cos(radians(${restaurants.latitude})) * 
              cos(radians(${restaurants.longitude}) - radians(${lng})) + 
              sin(radians(${lat})) * 
              sin(radians(${restaurants.latitude}))
            )) <= ${radiusKm}
          `
        )
      )
      .orderBy(sql`distance ASC, RANDOM()`);
  }


  async incrementDealUses(id: string): Promise<void> {
    await db
      .update(deals)
      .set({
        currentUses: sql`${deals.currentUses} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id));
  }

  async deactivateUserDeals(userId: string): Promise<void> {
    // First get all restaurants owned by the user
    const userRestaurants = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, userId));
    
    // Deactivate all deals for those restaurants
    if (userRestaurants.length > 0) {
      const restaurantIds = userRestaurants.map(r => r.id);
      await db
        .update(deals)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(inArray(deals.restaurantId, restaurantIds));
    }
  }

  async searchDeals(filters: {
    query?: string;
    cuisineType?: string;
    minPrice?: number;
    maxPrice?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
    sortBy?: string;
  }): Promise<any[]> {
    // For now, return the same as getFeaturedDeals to ensure it works
    // We'll enhance this gradually
    return await this.getFeaturedDeals();
  }

  // Deal claim operations
  async claimDeal(claim: InsertDealClaim): Promise<DealClaim> {
    const [newClaim] = await db
      .insert(dealClaims)
      .values(claim)
      .returning();
    return newClaim;
  }

  async getUserDealClaims(userId: string): Promise<DealClaim[]> {
    return await db
      .select()
      .from(dealClaims)
      .where(eq(dealClaims.userId, userId))
      .orderBy(desc(dealClaims.claimedAt));
  }

  async getDealClaimsCount(dealId: string, userId?: string): Promise<number> {
    const conditions = [eq(dealClaims.dealId, dealId)];
    if (userId) {
      conditions.push(eq(dealClaims.userId, userId));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dealClaims)
      .where(and(...conditions));
    
    return result.count;
  }

  async getRestaurantDealClaims(restaurantId: string, status?: string): Promise<any[]> {
    let query = db
      .select({
        claimId: dealClaims.id,
        dealId: dealClaims.dealId,
        userId: dealClaims.userId,
        claimedAt: dealClaims.claimedAt,
        usedAt: dealClaims.usedAt,
        orderAmount: dealClaims.orderAmount,
        dealTitle: deals.title,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userEmail: users.email,
      })
      .from(dealClaims)
      .innerJoin(deals, eq(dealClaims.dealId, deals.id))
      .innerJoin(users, eq(dealClaims.userId, users.id))
      .where(eq(deals.restaurantId, restaurantId))
      .orderBy(desc(dealClaims.claimedAt));

    if (status === 'pending') {
      query = query.where(and(eq(deals.restaurantId, restaurantId), isNull(dealClaims.usedAt)));
    } else if (status === 'used') {
      query = query.where(and(eq(deals.restaurantId, restaurantId), isNotNull(dealClaims.usedAt)));
    }

    return await query;
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getRestaurantReviews(restaurantId: string): Promise<any[]> {
    return await db
      .select({
        id: reviews.id,
        restaurantId: reviews.restaurantId,
        userId: reviews.userId,
        rating: reviews.rating,
        reviewText: reviews.comment,
        createdAt: reviews.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        }
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.restaurantId, restaurantId))
      .orderBy(desc(reviews.createdAt));
  }

  async getRestaurantAverageRating(restaurantId: string): Promise<number> {
    const [result] = await db
      .select({ avg: sql<number>`avg(${reviews.rating})` })
      .from(reviews)
      .where(eq(reviews.restaurantId, restaurantId));
    
    return result.avg || 0;
  }

  // Admin operations
  async ensureAdminExists(): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      console.log('⚠️  Admin credentials not configured - skipping admin creation');
      return;
    }

    try {
      // Check if admin already exists
      const existingAdmin = await this.getUserByEmail(adminEmail);
      
      if (existingAdmin) {
        console.log('✅ Admin account already exists');
        return;
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      await this.upsertUserByAuth('email', {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        passwordHash
      }, 'admin');

      console.log('✅ Admin account created successfully');
    } catch (error) {
      console.error('❌ Failed to create admin account:', error);
    }
  }

  // Verification operations
  async createVerificationRequest(verificationRequest: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db
      .insert(verificationRequests)
      .values(verificationRequest)
      .returning();
    return newRequest;
  }

  async getVerificationRequestsByOwner(ownerId: string): Promise<VerificationRequest[]> {
    return await db
      .select({
        id: verificationRequests.id,
        restaurantId: verificationRequests.restaurantId,
        status: verificationRequests.status,
        documents: verificationRequests.documents,
        submittedAt: verificationRequests.submittedAt,
        reviewedAt: verificationRequests.reviewedAt,
        reviewerId: verificationRequests.reviewerId,
        rejectionReason: verificationRequests.rejectionReason,
        createdAt: verificationRequests.createdAt,
        updatedAt: verificationRequests.updatedAt,
      })
      .from(verificationRequests)
      .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
      .where(eq(restaurants.ownerId, ownerId))
      .orderBy(desc(verificationRequests.createdAt));
  }

  async getVerificationRequests(): Promise<(VerificationRequest & { restaurant: { id: string; name: string; address: string; ownerId: string } })[]> {
    return await db
      .select({
        id: verificationRequests.id,
        restaurantId: verificationRequests.restaurantId,
        status: verificationRequests.status,
        documents: verificationRequests.documents,
        submittedAt: verificationRequests.submittedAt,
        reviewedAt: verificationRequests.reviewedAt,
        reviewerId: verificationRequests.reviewerId,
        rejectionReason: verificationRequests.rejectionReason,
        createdAt: verificationRequests.createdAt,
        updatedAt: verificationRequests.updatedAt,
        restaurant: {
          id: restaurants.id,
          name: restaurants.name,
          address: restaurants.address,
          ownerId: restaurants.ownerId,
        }
      })
      .from(verificationRequests)
      .innerJoin(restaurants, eq(verificationRequests.restaurantId, restaurants.id))
      .orderBy(desc(verificationRequests.submittedAt));
  }

  async approveVerificationRequest(id: string, reviewerId: string): Promise<void> {
    // Start transaction to update both tables
    await db.transaction(async (tx) => {
      // Update verification request status
      const [request] = await tx
        .update(verificationRequests)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          reviewerId,
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      if (!request) {
        throw new Error('Verification request not found');
      }

      // Set restaurant as verified
      await tx
        .update(restaurants)
        .set({
          isVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, request.restaurantId));
    });
  }

  async rejectVerificationRequest(id: string, reviewerId: string, reason: string): Promise<void> {
    // Start transaction to update both tables atomically
    await db.transaction(async (tx) => {
      // Update verification request status
      const [request] = await tx
        .update(verificationRequests)
        .set({
          status: 'rejected',
          reviewedAt: new Date(),
          reviewerId,
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      if (!request) {
        throw new Error('Verification request not found');
      }

      // Ensure restaurant remains unverified on rejection
      await tx
        .update(restaurants)
        .set({
          isVerified: false,
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, request.restaurantId));
    });
  }

  async setRestaurantVerified(restaurantId: string, isVerified: boolean): Promise<void> {
    await db
      .update(restaurants)
      .set({
        isVerified,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));
  }

  async hasPendingVerificationRequest(restaurantId: string): Promise<boolean> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(
        and(
          eq(verificationRequests.restaurantId, restaurantId),
          eq(verificationRequests.status, 'pending')
        )
      )
      .limit(1);
    return !!request;
  }

  // Deal view tracking operations
  async recordDealView(view: InsertDealView): Promise<DealView> {
    const [newView] = await db
      .insert(dealViews)
      .values(view)
      .returning();
    return newView;
  }

  async getDealViewsCount(dealId: string, dateRange?: { start: Date; end: Date }): Promise<number> {
    const conditions = [eq(dealViews.dealId, dealId)];
    
    if (dateRange) {
      conditions.push(gte(dealViews.viewedAt, dateRange.start));
      conditions.push(lte(dealViews.viewedAt, dateRange.end));
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dealViews)
      .where(and(...conditions));
    
    return result.count;
  }

  async hasRecentDealView(dealId: string, userId?: string, sessionId?: string, timeWindowMs: number = 3600000): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    const conditions = [
      eq(dealViews.dealId, dealId),
      gte(dealViews.viewedAt, cutoffTime)
    ];
    
    // Check for either userId OR sessionId to handle both logged-in and anonymous users
    if (userId) {
      conditions.push(eq(dealViews.userId, userId));
    } else if (sessionId) {
      conditions.push(eq(dealViews.sessionId, sessionId));
    } else {
      // If no identity provided, can't rate limit properly - allow the view
      return false;
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dealViews)
      .where(and(...conditions))
      .limit(1);
    
    return result.count > 0;
  }

  // Deal claim revenue operations
  async markClaimAsUsed(claimId: string, orderAmount: number): Promise<DealClaim> {
    const [claim] = await db
      .update(dealClaims)
      .set({
        isUsed: true,
        usedAt: new Date(),
        orderAmount: orderAmount.toString(),
      })
      .where(eq(dealClaims.id, claimId))
      .returning();
    return claim;
  }

  async verifyRestaurantOwnershipByClaim(claimId: string, userId: string): Promise<boolean> {
    const result = await db
      .select({ ownerId: restaurants.ownerId })
      .from(dealClaims)
      .innerJoin(deals, eq(dealClaims.dealId, deals.id))
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(eq(dealClaims.id, claimId))
      .limit(1);
    
    return result.length > 0 && result[0].ownerId === userId;
  }

  // Advanced analytics operations
  async getRestaurantAnalyticsSummary(restaurantId: string, dateRange?: { start: Date; end: Date }) {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));
    
    const dealIdArray = dealIds.map(d => d.id);
    
    if (dealIdArray.length === 0) {
      return {
        totalViews: 0,
        totalClaims: 0,
        totalRevenue: 0,
        conversionRate: 0,
        topDeals: [],
      };
    }

    // Build conditions for date range
    const viewConditions = [inArray(dealViews.dealId, dealIdArray)];
    const claimConditions = [inArray(dealClaims.dealId, dealIdArray)];
    
    if (dateRange) {
      viewConditions.push(gte(dealViews.viewedAt, dateRange.start));
      viewConditions.push(lte(dealViews.viewedAt, dateRange.end));
      claimConditions.push(gte(dealClaims.claimedAt, dateRange.start));
      claimConditions.push(lte(dealClaims.claimedAt, dateRange.end));
    }

    // Get totals
    const [viewsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dealViews)
      .where(and(...viewConditions));

    const [claimsResult] = await db
      .select({ 
        count: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(cast(order_amount as decimal)), 0)`
      })
      .from(dealClaims)
      .where(and(...claimConditions, eq(dealClaims.isUsed, true)));

    const totalViews = viewsResult.count || 0;
    const totalClaims = claimsResult.count || 0;
    const totalRevenue = claimsResult.revenue || 0;
    const conversionRate = totalViews > 0 ? (totalClaims / totalViews) * 100 : 0;

    // Get top deals
    const topDeals = await db
      .select({
        dealId: deals.id,
        title: deals.title,
        views: sql<number>`count(distinct ${dealViews.id})`,
        claims: sql<number>`count(distinct ${dealClaims.id})`,
        revenue: sql<number>`coalesce(sum(cast(${dealClaims.orderAmount} as decimal)), 0)`,
      })
      .from(deals)
      .leftJoin(dealViews, eq(deals.id, dealViews.dealId))
      .leftJoin(dealClaims, and(eq(deals.id, dealClaims.dealId), eq(dealClaims.isUsed, true)))
      .where(eq(deals.restaurantId, restaurantId))
      .groupBy(deals.id, deals.title)
      .orderBy(desc(sql`count(distinct ${dealViews.id})`))
      .limit(5);

    return {
      totalViews,
      totalClaims,
      totalRevenue,
      conversionRate,
      topDeals,
    };
  }

  async getRestaurantAnalyticsTimeseries(restaurantId: string, dateRange: { start: Date; end: Date }, interval: 'day' | 'week') {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));
    
    const dealIdArray = dealIds.map(d => d.id);
    
    if (dealIdArray.length === 0) {
      return [];
    }

    const dateFormat = interval === 'day' ? 'YYYY-MM-DD' : 'YYYY-"W"WW';
    
    const timeseries = await db
      .select({
        date: sql<string>`to_char(${dealViews.viewedAt}, '${dateFormat}')`,
        views: sql<number>`count(distinct ${dealViews.id})`,
        claims: sql<number>`count(distinct ${dealClaims.id})`,
        revenue: sql<number>`coalesce(sum(cast(${dealClaims.orderAmount} as decimal)), 0)`,
      })
      .from(dealViews)
      .leftJoin(dealClaims, and(
        eq(dealViews.dealId, dealClaims.dealId),
        eq(dealClaims.isUsed, true),
        gte(dealClaims.claimedAt, dateRange.start),
        lte(dealClaims.claimedAt, dateRange.end)
      ))
      .where(and(
        inArray(dealViews.dealId, dealIdArray),
        gte(dealViews.viewedAt, dateRange.start),
        lte(dealViews.viewedAt, dateRange.end)
      ))
      .groupBy(sql`to_char(${dealViews.viewedAt}, '${dateFormat}')`)
      .orderBy(sql`to_char(${dealViews.viewedAt}, '${dateFormat}')`);

    return timeseries;
  }

  async getRestaurantCustomerInsights(restaurantId: string, dateRange?: { start: Date; end: Date }) {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));
    
    const dealIdArray = dealIds.map(d => d.id);
    
    if (dealIdArray.length === 0) {
      return {
        repeatCustomers: 0,
        averageOrderValue: 0,
        peakHours: [],
        demographics: {
          ageGroups: [],
          genderBreakdown: [],
        },
      };
    }

    const conditions = [inArray(dealClaims.dealId, dealIdArray), eq(dealClaims.isUsed, true)];
    
    if (dateRange) {
      conditions.push(gte(dealClaims.usedAt, dateRange.start));
      conditions.push(lte(dealClaims.usedAt, dateRange.end));
    }

    // Get repeat customers
    const [repeatResult] = await db
      .select({ 
        count: sql<number>`count(distinct user_id) filter (where claim_count > 1)` 
      })
      .from(sql`(
        select user_id, count(*) as claim_count
        from ${dealClaims}
        where ${and(...conditions)}
        group by user_id
      ) as user_claims`);

    // Get average order value
    const [avgResult] = await db
      .select({ 
        avg: sql<number>`avg(cast(order_amount as decimal))` 
      })
      .from(dealClaims)
      .where(and(...conditions));

    // Get peak hours
    const peakHours = await db
      .select({
        hour: sql<number>`extract(hour from used_at)`,
        count: sql<number>`count(*)`,
      })
      .from(dealClaims)
      .where(and(...conditions))
      .groupBy(sql`extract(hour from used_at)`)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Get age demographics (calculate from birth year)
    const ageGroups = await db
      .select({
        range: sql<string>`
          case 
            when extract(year from now()) - birth_year < 25 then '18-24'
            when extract(year from now()) - birth_year < 35 then '25-34'  
            when extract(year from now()) - birth_year < 45 then '35-44'
            when extract(year from now()) - birth_year < 55 then '45-54'
            when extract(year from now()) - birth_year >= 55 then '55+'
            else 'Unknown'
          end
        `,
        count: sql<number>`count(distinct ${users.id})`,
      })
      .from(dealClaims)
      .innerJoin(users, eq(dealClaims.userId, users.id))
      .where(and(...conditions))
      .groupBy(sql`
        case 
          when extract(year from now()) - birth_year < 25 then '18-24'
          when extract(year from now()) - birth_year < 35 then '25-34'  
          when extract(year from now()) - birth_year < 45 then '35-44'
          when extract(year from now()) - birth_year < 55 then '45-54'
          when extract(year from now()) - birth_year >= 55 then '55+'
          else 'Unknown'
        end
      `);

    // Get gender breakdown
    const genderBreakdown = await db
      .select({
        gender: sql<string>`coalesce(gender, 'Unknown')`,
        count: sql<number>`count(distinct ${users.id})`,
      })
      .from(dealClaims)
      .innerJoin(users, eq(dealClaims.userId, users.id))
      .where(and(...conditions))
      .groupBy(users.gender);

    return {
      repeatCustomers: repeatResult.count || 0,
      averageOrderValue: avgResult.avg || 0,
      peakHours,
      demographics: {
        ageGroups,
        genderBreakdown,
      },
    };
  }

  async getRestaurantAnalyticsExport(restaurantId: string, dateRange: { start: Date; end: Date }) {
    const exportData = await db
      .select({
        dealTitle: deals.title,
        date: sql<string>`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`,
        views: sql<number>`count(distinct ${dealViews.id})`,
        claims: sql<number>`count(distinct ${dealClaims.id})`,
        revenue: sql<number>`coalesce(sum(cast(${dealClaims.orderAmount} as decimal)), 0)`,
      })
      .from(deals)
      .leftJoin(dealViews, and(
        eq(deals.id, dealViews.dealId),
        gte(dealViews.viewedAt, dateRange.start),
        lte(dealViews.viewedAt, dateRange.end)
      ))
      .leftJoin(dealClaims, and(
        eq(deals.id, dealClaims.dealId),
        eq(dealClaims.isUsed, true),
        gte(dealClaims.usedAt, dateRange.start),
        lte(dealClaims.usedAt, dateRange.end)
      ))
      .where(eq(deals.restaurantId, restaurantId))
      .groupBy(deals.id, deals.title, sql`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`)
      .orderBy(deals.title, sql`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`);

    return exportData;
  }

  // Food truck operations
  async setRestaurantMobileSettings(restaurantId: string, settings: UpdateRestaurantMobileSettings): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({
        ...settings,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId))
      .returning();
    return restaurant;
  }

  async startTruckSession(restaurantId: string, deviceId: string, userId: string): Promise<FoodTruckSession> {
    // End any existing active session first
    await db
      .update(foodTruckSessions)
      .set({
        isActive: false,
        endedAt: new Date(),
      })
      .where(and(
        eq(foodTruckSessions.restaurantId, restaurantId),
        eq(foodTruckSessions.isActive, true)
      ));

    // Start new session
    const [session] = await db
      .insert(foodTruckSessions)
      .values({
        restaurantId,
        deviceId,
        startedByUserId: userId,
      })
      .returning();

    // Update restaurant mobile status
    await db
      .update(restaurants)
      .set({
        mobileOnline: true,
        lastBroadcastAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));

    return session;
  }

  async endTruckSession(restaurantId: string, userId: string): Promise<void> {
    await db
      .update(foodTruckSessions)
      .set({
        isActive: false,
        endedAt: new Date(),
      })
      .where(and(
        eq(foodTruckSessions.restaurantId, restaurantId),
        eq(foodTruckSessions.startedByUserId, userId),
        eq(foodTruckSessions.isActive, true)
      ));

    // Update restaurant mobile status
    await db
      .update(restaurants)
      .set({
        mobileOnline: false,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));
  }

  async getActiveTruckSession(restaurantId: string): Promise<FoodTruckSession | undefined> {
    const [session] = await db
      .select()
      .from(foodTruckSessions)
      .where(and(
        eq(foodTruckSessions.restaurantId, restaurantId),
        eq(foodTruckSessions.isActive, true)
      ))
      .orderBy(desc(foodTruckSessions.startedAt))
      .limit(1);
    return session;
  }

  async hasRecentLocationUpdate(
    restaurantId: string, 
    lat: number, 
    lng: number, 
    timeWindowMs: number = 10000, // 10 seconds
    distanceThreshold: number = 10 // 10 meters
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    
    const [recentLocation] = await db
      .select({
        latitude: foodTruckLocations.latitude,
        longitude: foodTruckLocations.longitude,
      })
      .from(foodTruckLocations)
      .where(and(
        eq(foodTruckLocations.restaurantId, restaurantId),
        gte(foodTruckLocations.recordedAt, cutoffTime)
      ))
      .orderBy(desc(foodTruckLocations.recordedAt))
      .limit(1);

    if (!recentLocation) return false;

    // Calculate distance using Haversine formula (simplified for short distances)
    const latDiff = Math.abs(parseFloat(recentLocation.latitude) - lat);
    const lngDiff = Math.abs(parseFloat(recentLocation.longitude) - lng);
    const distanceM = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111320; // Rough conversion to meters

    return distanceM < distanceThreshold;
  }

  async upsertLiveLocation(location: InsertFoodTruckLocation): Promise<FoodTruckLocation> {
    // Check for recent duplicate location
    const hasRecent = await this.hasRecentLocationUpdate(
      location.restaurantId,
      location.latitude,
      location.longitude
    );

    if (hasRecent) {
      // Return the most recent location instead of inserting duplicate
      const [recent] = await db
        .select()
        .from(foodTruckLocations)
        .where(eq(foodTruckLocations.restaurantId, location.restaurantId))
        .orderBy(desc(foodTruckLocations.recordedAt))
        .limit(1);
      return recent;
    }

    // Get active session for the restaurant
    const activeSession = await this.getActiveTruckSession(location.restaurantId);

    // Insert new location record
    const [newLocation] = await db
      .insert(foodTruckLocations)
      .values({
        ...location,
        sessionId: activeSession?.id,
      })
      .returning();

    // Update restaurant's current location
    await db
      .update(restaurants)
      .set({
        currentLatitude: location.latitude.toString(),
        currentLongitude: location.longitude.toString(),
        lastBroadcastAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, location.restaurantId));

    return newLocation;
  }

  async getLiveTrucksNearby(lat: number, lng: number, radiusKm: number): Promise<Array<Restaurant & { distance: number; sessionId?: string }>> {
    // Use Haversine formula for distance calculation
    const results = await db
      .select({
        id: restaurants.id,
        ownerId: restaurants.ownerId,
        name: restaurants.name,
        address: restaurants.address,
        phone: restaurants.phone,
        cuisineType: restaurants.cuisineType,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        isFoodTruck: restaurants.isFoodTruck,
        mobileOnline: restaurants.mobileOnline,
        currentLatitude: restaurants.currentLatitude,
        currentLongitude: restaurants.currentLongitude,
        lastBroadcastAt: restaurants.lastBroadcastAt,
        isActive: restaurants.isActive,
        isVerified: restaurants.isVerified,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt,
        sessionId: foodTruckSessions.id,
        distance: sql<number>`
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(cast(current_latitude as float))) * 
            cos(radians(cast(current_longitude as float)) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(cast(current_latitude as float)))
          )
        `,
      })
      .from(restaurants)
      .leftJoin(foodTruckSessions, and(
        eq(restaurants.id, foodTruckSessions.restaurantId),
        eq(foodTruckSessions.isActive, true)
      ))
      .where(and(
        eq(restaurants.isFoodTruck, true),
        eq(restaurants.mobileOnline, true),
        eq(restaurants.isActive, true),
        sql`current_latitude IS NOT NULL`,
        sql`current_longitude IS NOT NULL`,
        // Only include trucks that have broadcast location recently (within last 5 minutes)
        gte(restaurants.lastBroadcastAt, new Date(Date.now() - 5 * 60 * 1000)),
        // Distance filter using Haversine formula  
        sql`
          6371 * acos(
            cos(radians(${lat})) * 
            cos(radians(cast(current_latitude as float))) * 
            cos(radians(cast(current_longitude as float)) - radians(${lng})) + 
            sin(radians(${lat})) * 
            sin(radians(cast(current_latitude as float)))
          ) <= ${radiusKm}
        `
      ))
      .orderBy(sql`distance`);

    return results.map(result => ({
      ...result,
      sessionId: result.sessionId || undefined,
    }));
  }

  async getTruckLocationHistory(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<FoodTruckLocation[]> {
    let query = db
      .select()
      .from(foodTruckLocations)
      .where(eq(foodTruckLocations.restaurantId, restaurantId));

    if (dateRange) {
      query = query.where(and(
        eq(foodTruckLocations.restaurantId, restaurantId),
        gte(foodTruckLocations.recordedAt, dateRange.start),
        lte(foodTruckLocations.recordedAt, dateRange.end)
      ));
    }

    const locations = await query
      .orderBy(desc(foodTruckLocations.recordedAt))
      .limit(1000); // Reasonable limit to prevent huge responses

    return locations;
  }
}

export const storage = new DatabaseStorage();
