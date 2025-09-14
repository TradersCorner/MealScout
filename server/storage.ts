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
  restaurantFavorites,
  restaurantRecommendations,
  userAddresses,
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
  type RestaurantFavorite,
  type InsertRestaurantFavorite,
  type RestaurantRecommendation,
  type InsertRestaurantRecommendation,
  type UserAddress,
  type InsertUserAddress,
  type GoogleUserData,
  type EmailUserData,
  type FacebookUserData,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, asc, inArray, isNull, isNotNull } from "drizzle-orm";
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
  updateUser(id: string, updates: Partial<Pick<User, 'subscriptionBillingInterval' | 'stripeCustomerId' | 'stripeSubscriptionId'>>): Promise<User>;
  
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

  // Restaurant favorites operations
  createRestaurantFavorite(favorite: { restaurantId: string; userId: string }): Promise<any>;
  removeRestaurantFavorite(restaurantId: string, userId: string): Promise<void>;
  getUserRestaurantFavorites(userId: string): Promise<any[]>;
  getRestaurantFavoritesAnalytics(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalFavorites: number;
    favoritesTrend: Array<{ date: string; count: number }>;
    recentFavorites: Array<{ userId: string; favoritedAt: Date }>;
  }>;

  // Restaurant recommendations operations
  trackRestaurantRecommendation(recommendation: {
    restaurantId: string;
    userId?: string;
    sessionId: string;
    recommendationType: 'homepage' | 'search' | 'nearby' | 'personalized';
    recommendationContext?: string;
  }): Promise<any>;
  markRecommendationClicked(recommendationId: string): Promise<void>;
  getRestaurantRecommendationsAnalytics(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalRecommendations: number;
    totalClicks: number;
    clickThroughRate: number;
    recommendationsByType: Array<{ type: string; count: number; clicks: number }>;
    recommendationsTrend: Array<{ date: string; count: number; clicks: number }>;
  }>;

  // User address operations
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  getUserAddress(id: string): Promise<UserAddress | undefined>;
  updateUserAddress(id: string, address: Partial<InsertUserAddress>): Promise<UserAddress>;
  deleteUserAddress(id: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
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

  async updateUser(id: string, updates: Partial<Pick<User, 'subscriptionBillingInterval' | 'stripeCustomerId' | 'stripeSubscriptionId'>>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
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
      .orderBy(desc(deals.createdAt))
      .limit(50); // Limit results for better performance
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
        restaurant: {
          id: restaurants.id,
          name: restaurants.name,
        }
      })
      .from(deals)
      .leftJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .orderBy(desc(deals.createdAt));
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
    // For now, return active deals to ensure it works
    // We'll enhance this gradually with proper filtering
    return await this.getActiveDeals();
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
    const conditions = [eq(deals.restaurantId, restaurantId)];
    
    if (status === 'pending') {
      conditions.push(isNull(dealClaims.usedAt));
    } else if (status === 'used') {
      conditions.push(isNotNull(dealClaims.usedAt));
    }

    return await db
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
      .where(and(...conditions))
      .orderBy(desc(dealClaims.claimedAt));
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

  // Seed data for development and testing
  async seedDevelopmentData(): Promise<void> {
    try {
      // Check if data already exists
      const existingRestaurants = await db.select().from(restaurants).limit(1);
      if (existingRestaurants.length > 0) {
        console.log('✅ Seed data already exists');
        return;
      }

      console.log('🌱 Seeding development data...');

      // Create sample restaurant owners
      const owner1 = await this.upsertUserByAuth('email', {
        email: 'owner1@example.com',
        firstName: 'Mario',
        lastName: 'Rossi',
        passwordHash: await bcrypt.hash('password123', 10)
      }, 'restaurant_owner');

      const owner2 = await this.upsertUserByAuth('email', {
        email: 'owner2@example.com',
        firstName: 'Luigi',
        lastName: 'Verde',
        passwordHash: await bcrypt.hash('password123', 10)
      }, 'restaurant_owner');

      const owner3 = await this.upsertUserByAuth('email', {
        email: 'owner3@example.com',
        firstName: 'Giuseppe',
        lastName: 'Bianchi',
        passwordHash: await bcrypt.hash('password123', 10)
      }, 'restaurant_owner');

      // Create sample customer
      const customer1 = await this.upsertUserByAuth('email', {
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
        passwordHash: await bcrypt.hash('password123', 10)
      }, 'customer');

      // Create sample restaurants
      const restaurant1 = await this.createRestaurant({
        name: 'Tony\'s Pizza Palace',
        address: '123 Main Street, Downtown, NY 10001',
        phone: '+1 (555) 123-4567',
        cuisineType: 'Italian',
        latitude: '40.7128',
        longitude: '-74.0060',
        ownerId: owner1.id
      });

      const restaurant2 = await this.createRestaurant({
        name: 'Sakura Sushi Express',
        address: '456 Oak Avenue, Midtown, NY 10002',
        phone: '+1 (555) 234-5678',
        cuisineType: 'Japanese',
        latitude: '40.7614',
        longitude: '-73.9776',
        ownerId: owner2.id
      });

      // Create food truck
      const foodTruck = await this.createRestaurant({
        name: 'Gourmet Burger Truck',
        address: 'Mobile - Follow social media for locations',
        phone: '+1 (555) 345-6789',
        cuisineType: 'American',
        isFoodTruck: true,
        latitude: '40.7505',
        longitude: '-73.9934',
        ownerId: owner3.id
      });

      // Create sample deals
      const deal1 = await this.createDeal({
        restaurantId: restaurant1.id,
        title: 'Buy One Get One Free Pizza',
        description: 'Order any large pizza and get a second one of equal or lesser value absolutely free! Perfect for sharing or taking home leftovers.',
        dealType: 'percentage',
        discountValue: '50.00',
        minOrderAmount: '24.99',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: '11:00',
        endTime: '22:00',
        totalUsesLimit: 100,
        perCustomerLimit: 2,

        isActive: true
      });

      const deal2 = await this.createDeal({
        restaurantId: restaurant2.id,
        title: '50% Off Sushi Lunch Special',
        description: 'Enjoy our premium sushi lunch sets at half price. Includes miso soup, salad, and your choice of sushi roll.',
        dealType: 'percentage',
        discountValue: '50.00',
        minOrderAmount: '15.00',
        imageUrl: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startTime: '11:30',
        endTime: '15:00',
        totalUsesLimit: 50,
        perCustomerLimit: 1,

        isActive: true
      });

      const deal3 = await this.createDeal({
        restaurantId: foodTruck.id,
        title: 'Gourmet Burger Combo Deal',
        description: 'Get our signature gourmet burger with hand-cut fries and a drink for an unbeatable price!',
        dealType: 'fixed',
        discountValue: '4.00',
        minOrderAmount: '10.00',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '20:00',
        totalUsesLimit: 75,
        perCustomerLimit: 1,
        isActive: true
      });

      // Create sample reviews
      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant1.id,
        rating: 5,
        comment: 'Amazing pizza! The crust was perfect and the toppings were so fresh. Will definitely be back!'
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant2.id,
        rating: 5,
        comment: 'Best sushi in the city! Super fresh fish and great presentation. The lunch special is a steal!'
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: foodTruck.id,
        rating: 4,
        comment: 'Great burgers! Found them at the park and the food was delicious. Worth tracking them down!'
      });

      // Start a food truck session for demo
      await this.startTruckSession(foodTruck.id, 'demo-device-123', owner3.id);

      console.log('✅ Development seed data created successfully');
      console.log('📊 Created:');
      console.log('   - 3 restaurant owners (password: password123)');
      console.log('   - 1 customer (customer@example.com, password: password123)');
      console.log('   - 3 restaurants (including 1 food truck)');
      console.log('   - 3 deals');
      console.log('   - 3 reviews');
      console.log('   - 1 active food truck session');
    } catch (error) {
      console.error('❌ Failed to seed development data:', error);
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
        restaurantId: location.restaurantId,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
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
    // Simple query first - just return food trucks with valid locations
    const results = await db
      .select({
        id: restaurants.id,
        ownerId: restaurants.ownerId,
        name: restaurants.name,
        address: restaurants.address,
        phone: restaurants.phone,
        businessType: restaurants.businessType,
        cuisineType: restaurants.cuisineType,
        promoCode: restaurants.promoCode,
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
        sql`current_longitude IS NOT NULL`
      ));

    // Calculate distance in JavaScript for now (simpler than complex SQL)
    const trucksWithDistance = results.map(truck => {
      if (!truck.currentLatitude || !truck.currentLongitude) {
        return { ...truck, distance: 999999, sessionId: truck.sessionId || undefined };
      }
      
      const truckLat = parseFloat(truck.currentLatitude);
      const truckLng = parseFloat(truck.currentLongitude);
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = (truckLat - lat) * Math.PI / 180;
      const dLng = (truckLng - lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(truckLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return {
        ...truck,
        distance,
        sessionId: truck.sessionId || undefined,
      };
    });

    // Filter by radius and sort by distance
    return trucksWithDistance
      .filter(truck => truck.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async getTruckLocationHistory(restaurantId: string, dateRange?: { start: Date; end: Date }): Promise<FoodTruckLocation[]> {
    const conditions = [eq(foodTruckLocations.restaurantId, restaurantId)];
    
    if (dateRange) {
      conditions.push(gte(foodTruckLocations.recordedAt, dateRange.start));
      conditions.push(lte(foodTruckLocations.recordedAt, dateRange.end));
    }

    const locations = await db
      .select()
      .from(foodTruckLocations)
      .where(and(...conditions))
      .orderBy(desc(foodTruckLocations.recordedAt))
      .limit(1000); // Reasonable limit to prevent huge responses

    return locations;
  }
  // Restaurant favorites operations
  async createRestaurantFavorite(favorite: { restaurantId: string; userId: string }): Promise<RestaurantFavorite> {
    const [result] = await db
      .insert(restaurantFavorites)
      .values(favorite)
      .returning();
    return result;
  }

  async removeRestaurantFavorite(restaurantId: string, userId: string): Promise<void> {
    await db
      .delete(restaurantFavorites)
      .where(and(
        eq(restaurantFavorites.restaurantId, restaurantId),
        eq(restaurantFavorites.userId, userId)
      ));
  }

  async getUserRestaurantFavorites(userId: string): Promise<(RestaurantFavorite & { restaurant: Restaurant })[]> {
    const result = await db
      .select({
        id: restaurantFavorites.id,
        restaurantId: restaurantFavorites.restaurantId,
        userId: restaurantFavorites.userId,
        favoritedAt: restaurantFavorites.favoritedAt,
        createdAt: restaurantFavorites.createdAt,
        restaurant: restaurants,
      })
      .from(restaurantFavorites)
      .innerJoin(restaurants, eq(restaurantFavorites.restaurantId, restaurants.id))
      .where(eq(restaurantFavorites.userId, userId))
      .orderBy(desc(restaurantFavorites.favoritedAt));
    
    return result;
  }

  async getRestaurantFavoritesAnalytics(restaurantId: string, dateRange?: { start: Date; end: Date }) {
    const baseQuery = db
      .select({
        id: restaurantFavorites.id,
        favoritedAt: restaurantFavorites.favoritedAt,
        userId: restaurantFavorites.userId,
      })
      .from(restaurantFavorites)
      .where(eq(restaurantFavorites.restaurantId, restaurantId));

    let favorites;
    if (dateRange) {
      favorites = await baseQuery.where(
        and(
          eq(restaurantFavorites.restaurantId, restaurantId),
          gte(restaurantFavorites.favoritedAt, dateRange.start),
          lte(restaurantFavorites.favoritedAt, dateRange.end)
        )
      );
    } else {
      favorites = await baseQuery;
    }

    // Calculate trend data (group by day)
    const favoritesTrend = await db
      .select({
        date: sql<string>`DATE(${restaurantFavorites.favoritedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(restaurantFavorites)
      .where(
        dateRange 
          ? and(
              eq(restaurantFavorites.restaurantId, restaurantId),
              gte(restaurantFavorites.favoritedAt, dateRange.start),
              lte(restaurantFavorites.favoritedAt, dateRange.end)
            )
          : eq(restaurantFavorites.restaurantId, restaurantId)
      )
      .groupBy(sql`DATE(${restaurantFavorites.favoritedAt})`)
      .orderBy(sql`DATE(${restaurantFavorites.favoritedAt})`);

    return {
      totalFavorites: favorites.length,
      favoritesTrend,
      recentFavorites: favorites.slice(0, 10).map(f => ({
        userId: f.userId,
        favoritedAt: f.favoritedAt,
      })),
    };
  }

  // Restaurant recommendations operations
  async trackRestaurantRecommendation(recommendation: {
    restaurantId: string;
    userId?: string;
    sessionId: string;
    recommendationType: 'homepage' | 'search' | 'nearby' | 'personalized';
    recommendationContext?: string;
  }): Promise<RestaurantRecommendation> {
    const [result] = await db
      .insert(restaurantRecommendations)
      .values(recommendation)
      .returning();
    return result;
  }

  async markRecommendationClicked(recommendationId: string): Promise<void> {
    await db
      .update(restaurantRecommendations)
      .set({
        isClicked: true,
        clickedAt: new Date(),
      })
      .where(eq(restaurantRecommendations.id, recommendationId));
  }

  async getRestaurantRecommendationsAnalytics(restaurantId: string, dateRange?: { start: Date; end: Date }) {
    const baseQuery = db
      .select({
        id: restaurantRecommendations.id,
        recommendationType: restaurantRecommendations.recommendationType,
        isClicked: restaurantRecommendations.isClicked,
        showedAt: restaurantRecommendations.showedAt,
        clickedAt: restaurantRecommendations.clickedAt,
      })
      .from(restaurantRecommendations)
      .where(eq(restaurantRecommendations.restaurantId, restaurantId));

    let recommendations;
    if (dateRange) {
      recommendations = await baseQuery.where(
        and(
          eq(restaurantRecommendations.restaurantId, restaurantId),
          gte(restaurantRecommendations.showedAt, dateRange.start),
          lte(restaurantRecommendations.showedAt, dateRange.end)
        )
      );
    } else {
      recommendations = await baseQuery;
    }

    const totalClicks = recommendations.filter(r => r.isClicked).length;
    const clickThroughRate = recommendations.length > 0 ? (totalClicks / recommendations.length) * 100 : 0;

    // Group by recommendation type
    const recommendationsByType = recommendations.reduce((acc, rec) => {
      const existing = acc.find(item => item.type === rec.recommendationType);
      if (existing) {
        existing.count++;
        if (rec.isClicked) existing.clicks++;
      } else {
        acc.push({
          type: rec.recommendationType,
          count: 1,
          clicks: rec.isClicked ? 1 : 0,
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; clicks: number }>);

    // Calculate trend data (group by day)
    const recommendationsTrend = await db
      .select({
        date: sql<string>`DATE(${restaurantRecommendations.showedAt})`,
        count: sql<number>`COUNT(*)`,
        clicks: sql<number>`SUM(CASE WHEN ${restaurantRecommendations.isClicked} = true THEN 1 ELSE 0 END)`,
      })
      .from(restaurantRecommendations)
      .where(
        dateRange 
          ? and(
              eq(restaurantRecommendations.restaurantId, restaurantId),
              gte(restaurantRecommendations.showedAt, dateRange.start),
              lte(restaurantRecommendations.showedAt, dateRange.end)
            )
          : eq(restaurantRecommendations.restaurantId, restaurantId)
      )
      .groupBy(sql`DATE(${restaurantRecommendations.showedAt})`)
      .orderBy(sql`DATE(${restaurantRecommendations.showedAt})`);

    return {
      totalRecommendations: recommendations.length,
      totalClicks,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100, // Round to 2 decimal places
      recommendationsByType,
      recommendationsTrend,
    };
  }

  // User address operations
  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const [createdAddress] = await db
      .insert(userAddresses)
      .values(address)
      .returning();
    return createdAddress;
  }

  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.userId, userId))
      .orderBy(desc(userAddresses.isDefault), asc(userAddresses.createdAt));
  }

  async getUserAddress(id: string): Promise<UserAddress | undefined> {
    const [address] = await db
      .select()
      .from(userAddresses)
      .where(eq(userAddresses.id, id));
    return address;
  }

  async updateUserAddress(id: string, address: Partial<InsertUserAddress>): Promise<UserAddress> {
    const [updatedAddress] = await db
      .update(userAddresses)
      .set({
        ...address,
        updatedAt: new Date(),
      })
      .where(eq(userAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteUserAddress(id: string): Promise<void> {
    await db
      .delete(userAddresses)
      .where(eq(userAddresses.id, id));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // First, unset all default addresses for the user
    await db
      .update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(userAddresses.userId, userId));
    
    // Then set the specified address as default
    await db
      .update(userAddresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, userId)
      ));
  }
}

export const storage = new DatabaseStorage();
