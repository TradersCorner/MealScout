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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, sql, desc, asc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
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
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  incrementDealUses(id: string): Promise<void>;
  
  // Deal claim operations
  claimDeal(claim: InsertDealClaim): Promise<DealClaim>;
  getUserDealClaims(userId: string): Promise<DealClaim[]>;
  getDealClaimsCount(dealId: string, userId?: string): Promise<number>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getRestaurantReviews(restaurantId: string): Promise<Review[]>;
  getRestaurantAverageRating(restaurantId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
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

  async updateUserStripeInfo(id: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
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
      .orderBy(desc(deals.isFeatured), desc(deals.createdAt));
  }

  async getFeaturedDeals(): Promise<any[]> {
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
        }
      })
      .from(deals)
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(
        and(
          eq(deals.isActive, true),
          eq(deals.isFeatured, true),
          eq(restaurants.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          lte(deals.startTime, currentTime),
          gte(deals.endTime, currentTime)
        )
      )
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
      .orderBy(desc(deals.isFeatured), desc(deals.createdAt));
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updated] = await db
      .update(deals)
      .set({
        ...deal,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();
    return updated;
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

  async getRestaurantReviews(restaurantId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
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
}

export const storage = new DatabaseStorage();
