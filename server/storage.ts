import {
  users,
  restaurants,
  deals,
  dealClaims,
  reviews,
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
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getRestaurantReviews(restaurantId: string): Promise<Review[]>;
  getRestaurantAverageRating(restaurantId: string): Promise<number>;
  
  // Admin operations
  ensureAdminExists(): Promise<void>;
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
}

export const storage = new DatabaseStorage();
