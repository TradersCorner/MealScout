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
  locationRequests,
  truckInterests,
  userAddresses,
  passwordResetTokens,
  dealFeedback,
  apiKeys,
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
  type LocationRequest,
  type InsertLocationRequest,
  type InsertTruckInterest,
  type UserAddress,
  type InsertUserAddress,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type DealFeedback,
  type InsertDealFeedback,
  type GoogleUserData,
  type EmailUserData,
  type FacebookUserData,
  type TradeScoutUserData,
  type UpdateRestaurantLocation,
  type OperatingHours,
  hosts,
  events,
  eventSeries,
  type Host,
  type InsertHost,
  type Event,
  type InsertEvent,
  type EventSeries,
  type InsertEventSeries,
  eventInterests,
  type EventInterest,
  type InsertEventInterest,
  telemetryEvents,
  type InsertTelemetryEvent,
  lisaClaims,
  type LisaClaim,
  type InsertLisaClaim,
  type LisaClaimType,
  type LisaClaimSource,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  and,
  or,
  gte,
  lte,
  sql,
  desc,
  asc,
  inArray,
  isNull,
  isNotNull,
  not,
  ne,
} from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // Host operations
  createHost(host: InsertHost): Promise<Host>;
  getHost(id: string): Promise<Host | undefined>;
  getHostByUserId(userId: string): Promise<Host | undefined>;
  getAllHosts(): Promise<Host[]>;
  updateHostCoordinates(
    hostId: string,
    lat: number,
    lng: number
  ): Promise<Host>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByHost(
    hostId: string
  ): Promise<(Event & { interests: EventInterest[] })[]>;
  createEventInterest(interest: InsertEventInterest): Promise<EventInterest>;
  updateEventInterestStatus(id: string, status: string): Promise<EventInterest>;
  getEventInterest(id: string): Promise<EventInterest | undefined>;
  getEventInterestByTruckId(
    eventId: string,
    truckId: string
  ): Promise<EventInterest | undefined>;
  getEventInterestsByEventId(
    eventId: string
  ): Promise<(EventInterest & { truck: any })[]>;

  // Event Series (Open Calls)
  createEventSeries(series: InsertEventSeries): Promise<EventSeries>;
  getEventSeries(id: string): Promise<EventSeries | undefined>;
  getEventSeriesByHost(hostId: string): Promise<EventSeries[]>;
  updateEventSeries(
    id: string,
    updates: Partial<InsertEventSeries>
  ): Promise<EventSeries>;
  publishEventSeries(id: string): Promise<EventSeries>;
  getEventsBySeriesId(seriesId: string): Promise<Event[]>;

  // Telemetry
  createTelemetryEvent(event: InsertTelemetryEvent): Promise<void>;

  // LISA Phase 4A: Claim Persistence (write-only fact recording)
  emitClaim(claim: {
    subjectType: string;
    subjectId: string;
    actorType?: string;
    actorId?: string;
    app: "mealscout" | "tradescout";
    claimType: LisaClaimType | string;
    claimValue: Record<string, any>;
    source: LisaClaimSource | string;
    confidence?: number;
  }): Promise<void>;

  getClaims(filters: {
    subjectType?: string;
    subjectId?: string;
    actorType?: string;
    actorId?: string;
    app?: "mealscout" | "tradescout";
    claimType?: LisaClaimType | string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<LisaClaim[]>;

  // User operations
  // (IMPORTANT) these user operations are mandatory for authentication.
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserByAuth(
    authType: "google" | "email" | "facebook" | "tradescout",
    userData:
      | GoogleUserData
      | EmailUserData
      | FacebookUserData
      | TradeScoutUserData,
    userType?: "customer" | "restaurant_owner" | "admin",
    appContext?: "mealscout" | "tradescout"
  ): Promise<User>;
  updateUserStripeInfo(
    id: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    subscriptionBillingInterval?: string
  ): Promise<User>;
  updateUser(
    id: string,
    updates: Partial<
      Pick<
        User,
        | "subscriptionBillingInterval"
        | "stripeCustomerId"
        | "stripeSubscriptionId"
        | "subscriptionSignupDate"
      >
    >
  ): Promise<User>;

  // Restaurant operations
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
  getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]>;
  updateRestaurant(
    id: string,
    restaurant: Partial<InsertRestaurant>
  ): Promise<Restaurant>;
  getNearbyRestaurants(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Restaurant[]>;
  getSubscribedRestaurants(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Restaurant[]>;
  verifyRestaurantOwnership(
    restaurantId: string,
    userId: string
  ): Promise<boolean>;

  // Deal operations
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeal(id: string): Promise<Deal | undefined>;
  getDealsByRestaurant(restaurantId: string): Promise<Deal[]>;
  getActiveDeals(): Promise<Deal[]>;
  getFilteredDeals(showLimitedTimeOnly?: boolean): Promise<Deal[]>;
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
  deleteDeal(id: string): Promise<void>;
  duplicateDeal(id: string): Promise<Deal>;

  // Deal claim operations
  claimDeal(claim: InsertDealClaim): Promise<DealClaim>;
  getUserDealClaims(userId: string): Promise<DealClaim[]>;
  getDealClaimsCount(dealId: string, userId?: string): Promise<number>;
  getRestaurantDealClaims(
    restaurantId: string,
    status?: string
  ): Promise<any[]>;
  verifyRestaurantOwnershipByClaim(
    claimId: string,
    userId: string
  ): Promise<boolean>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getRestaurantReviews(restaurantId: string): Promise<Review[]>;
  getRestaurantAverageRating(restaurantId: string): Promise<number>;

  // Admin operations
  ensureAdminExists(): Promise<void>;

  // Verification operations
  createVerificationRequest(
    verificationRequest: InsertVerificationRequest
  ): Promise<VerificationRequest>;
  getVerificationRequestsByOwner(
    ownerId: string
  ): Promise<VerificationRequest[]>;
  getVerificationRequests(): Promise<
    (VerificationRequest & {
      restaurant: {
        id: string;
        name: string;
        address: string;
        ownerId: string;
      };
    })[]
  >;
  approveVerificationRequest(id: string, reviewerId: string): Promise<void>;
  rejectVerificationRequest(
    id: string,
    reviewerId: string,
    reason: string
  ): Promise<void>;
  setRestaurantVerified(
    restaurantId: string,
    isVerified: boolean
  ): Promise<void>;
  hasPendingVerificationRequest(restaurantId: string): Promise<boolean>;

  // Deal view tracking operations
  recordDealView(view: InsertDealView): Promise<DealView>;
  getDealViewsCount(
    dealId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<number>;
  hasRecentDealView(
    dealId: string,
    userId?: string,
    sessionId?: string,
    timeWindowMs?: number
  ): Promise<boolean>;

  // Deal claim revenue operations
  markClaimAsUsed(
    claimId: string,
    orderAmount?: number | null
  ): Promise<DealClaim | null>;

  // Advanced analytics operations
  getRestaurantAnalyticsSummary(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalViews: number;
    totalClaims: number;
    totalRevenue: number;
    conversionRate: number;
    topDeals: Array<{
      dealId: string;
      title: string;
      views: number;
      claims: number;
      revenue: number;
    }>;
  }>;

  getRestaurantAnalyticsTimeseries(
    restaurantId: string,
    dateRange: { start: Date; end: Date },
    interval: "day" | "week"
  ): Promise<
    Array<{
      date: string;
      views: number;
      claims: number;
      revenue: number;
    }>
  >;

  getRestaurantCustomerInsights(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    repeatCustomers: number;
    averageOrderValue: number;
    peakHours: Array<{ hour: number; count: number }>;
    demographics: {
      ageGroups: Array<{ range: string; count: number }>;
      genderBreakdown: Array<{ gender: string; count: number }>;
    };
  }>;

  getRestaurantAnalyticsExport(
    restaurantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<
    Array<{
      dealTitle: string;
      date: string;
      views: number;
      claims: number;
      revenue: number;
    }>
  >;

  // Food truck operations
  setRestaurantMobileSettings(
    restaurantId: string,
    settings: UpdateRestaurantMobileSettings
  ): Promise<Restaurant>;
  updateRestaurantLocation(
    restaurantId: string,
    location: UpdateRestaurantLocation
  ): Promise<Restaurant>;
  setRestaurantOperatingHours(
    restaurantId: string,
    operatingHours: OperatingHours
  ): Promise<Restaurant>;
  isRestaurantOpenNow(restaurantId: string): Promise<boolean>;
  startTruckSession(
    restaurantId: string,
    deviceId: string,
    userId: string
  ): Promise<FoodTruckSession>;
  endTruckSession(restaurantId: string, userId: string): Promise<void>;
  getActiveTruckSession(
    restaurantId: string
  ): Promise<FoodTruckSession | undefined>;
  upsertLiveLocation(
    location: InsertFoodTruckLocation
  ): Promise<FoodTruckLocation>;
  getLiveTrucksNearby(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Array<Restaurant & { distance: number; sessionId?: string }>>;
  getTruckLocationHistory(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<FoodTruckLocation[]>;
  hasRecentLocationUpdate(
    restaurantId: string,
    lat: number,
    lng: number,
    timeWindowMs?: number,
    distanceThreshold?: number
  ): Promise<boolean>;

  // Restaurant favorites operations
  createRestaurantFavorite(favorite: {
    restaurantId: string;
    userId: string;
  }): Promise<any>;
  removeRestaurantFavorite(restaurantId: string, userId: string): Promise<void>;
  getUserRestaurantFavorites(userId: string): Promise<any[]>;
  getRestaurantFavoritesAnalytics(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalFavorites: number;
    favoritesTrend: Array<{ date: string; count: number }>;
    recentFavorites: Array<{ userId: string; favoritedAt: Date }>;
  }>;

  // Restaurant recommendations operations
  trackRestaurantRecommendation(recommendation: {
    restaurantId: string;
    userId?: string;
    sessionId: string;
    recommendationType: "homepage" | "search" | "nearby" | "personalized";
    recommendationContext?: string;
  }): Promise<any>;
  markRecommendationClicked(recommendationId: string): Promise<void>;
  getRestaurantRecommendationsAnalytics(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalRecommendations: number;
    totalClicks: number;
    clickThroughRate: number;
    recommendationsByType: Array<{
      type: string;
      count: number;
      clicks: number;
    }>;
    recommendationsTrend: Array<{
      date: string;
      count: number;
      clicks: number;
    }>;
  }>;
  // Host location requests / truck interest
  createLocationRequest(
    request: InsertLocationRequest
  ): Promise<LocationRequest>;
  getLocationRequestById(id: string): Promise<LocationRequest | undefined>;
  expireStaleLocationRequests(): Promise<number>;
  createTruckInterest(
    interest: InsertTruckInterest
  ): Promise<{ interestId: string; locationRequest: LocationRequest }>;

  // User address operations
  createUserAddress(address: InsertUserAddress): Promise<UserAddress>;
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  getUserAddress(id: string): Promise<UserAddress | undefined>;
  updateUserAddress(
    id: string,
    address: Partial<InsertUserAddress>
  ): Promise<UserAddress>;
  deleteUserAddress(id: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;

  // Password reset token operations
  createPasswordResetToken(
    tokenData: InsertPasswordResetToken
  ): Promise<PasswordResetToken>;
  getPasswordResetToken(id: string): Promise<PasswordResetToken | undefined>;
  getPasswordResetTokenByTokenHash(
    tokenHash: string
  ): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: string): Promise<PasswordResetToken>;
  deleteUserResetTokens(userId: string): Promise<void>;
  deleteExpiredResetTokens(): Promise<number>;

  // API Key operations
  getActiveApiKeys(): Promise<any[]>;
  updateApiKeyLastUsed(keyId: string): Promise<void>;

  // Deal feedback operations
  createDealFeedback(feedback: InsertDealFeedback): Promise<DealFeedback>;
  getDealFeedback(dealId: string): Promise<DealFeedback[]>;
  getUserDealFeedback(userId: string): Promise<DealFeedback[]>;
  getDealAverageRating(dealId: string): Promise<number>;
  getDealFeedbackStats(dealId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: { [key: number]: number };
  }>;

  // Stripe lookup operations
  getUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<User | undefined>;
  getUserByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<User | undefined>;

  // Admin user operations
  getAllUsers(): Promise<User[]>;

  // Host operations
  createHost(host: InsertHost): Promise<Host>;
  getHost(id: string): Promise<Host | undefined>;
  getHostByUserId(userId: string): Promise<Host | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  getEventsByHost(
    hostId: string
  ): Promise<(Event & { interests: EventInterest[] })[]>;
  getAllUpcomingEvents(): Promise<
    (Event & { host: Host; series?: EventSeries | null })[]
  >;
  createEventInterest(interest: InsertEventInterest): Promise<EventInterest>;
  getEventInterestByTruckId(
    eventId: string,
    truckId: string
  ): Promise<EventInterest | undefined>;
  getEventInterestsByEventId(
    eventId: string
  ): Promise<(EventInterest & { truck: any })[]>;
  // Map surfacing
  getOpenLocationRequests(): Promise<LocationRequest[]>;
}

export class DatabaseStorage implements IStorage {
  // Host operations
  async createHost(host: InsertHost): Promise<Host> {
    const [newHost] = await db.insert(hosts).values(host).returning();
    return newHost;
  }

  async getHost(id: string): Promise<Host | undefined> {
    const [host] = await db.select().from(hosts).where(eq(hosts.id, id));
    return host;
  }

  async getHostByUserId(userId: string): Promise<Host | undefined> {
    const [host] = await db
      .select()
      .from(hosts)
      .where(eq(hosts.userId, userId));
    return host;
  }

  async getAllHosts(): Promise<Host[]> {
    return await db.select().from(hosts).orderBy(desc(hosts.createdAt));
  }

  async updateHostCoordinates(
    hostId: string,
    lat: number,
    lng: number
  ): Promise<Host> {
    const [updated] = await db
      .update(hosts)
      .set({
        latitude: lat.toString(),
        longitude: lng.toString(),
        updatedAt: new Date(),
      })
      .where(eq(hosts.id, hostId))
      .returning();
    return updated;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByHost(
    hostId: string
  ): Promise<(Event & { interests: EventInterest[] })[]> {
    return await db.query.events.findMany({
      where: eq(events.hostId, hostId),
      orderBy: asc(events.date),
      with: {
        interests: true,
      },
    });
  }

  async getAllUpcomingEvents(): Promise<
    (Event & { host: Host; series?: EventSeries | null })[]
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db.query.events.findMany({
      where: and(gte(events.date, today), ne(events.status, "cancelled")),
      orderBy: asc(events.date),
      with: {
        host: true,
        series: true,
      },
    });
  }

  async createEventInterest(
    interest: InsertEventInterest
  ): Promise<EventInterest> {
    const [newInterest] = await db
      .insert(eventInterests)
      .values(interest)
      .returning();
    return newInterest;
  }

  async updateEventInterestStatus(
    id: string,
    status: string
  ): Promise<EventInterest> {
    const [updated] = await db
      .update(eventInterests)
      .set({ status })
      .where(eq(eventInterests.id, id))
      .returning();
    return updated;
  }

  async getEventInterest(id: string): Promise<EventInterest | undefined> {
    const [interest] = await db
      .select()
      .from(eventInterests)
      .where(eq(eventInterests.id, id));
    return interest;
  }

  async getEventInterestByTruckId(
    eventId: string,
    truckId: string
  ): Promise<EventInterest | undefined> {
    const [interest] = await db
      .select()
      .from(eventInterests)
      .where(
        and(
          eq(eventInterests.eventId, eventId),
          eq(eventInterests.truckId, truckId)
        )
      );
    return interest;
  }

  async getOpenLocationRequests(): Promise<LocationRequest[]> {
    await this.expireStaleLocationRequests();
    return await db
      .select()
      .from(locationRequests)
      .where(eq(locationRequests.status, "open"))
      .orderBy(desc(locationRequests.createdAt));
  }

  async getEventInterestsByEventId(
    eventId: string
  ): Promise<(EventInterest & { truck: any })[]> {
    return await db.query.eventInterests.findMany({
      where: eq(eventInterests.eventId, eventId),
      with: {
        truck: true,
      },
      orderBy: desc(eventInterests.createdAt),
    });
  }

  // Event Series (Open Calls)
  async createEventSeries(series: InsertEventSeries): Promise<EventSeries> {
    const [newSeries] = await db.insert(eventSeries).values(series).returning();
    return newSeries;
  }

  async getEventSeries(id: string): Promise<EventSeries | undefined> {
    const [series] = await db
      .select()
      .from(eventSeries)
      .where(eq(eventSeries.id, id));
    return series;
  }

  async getEventSeriesByHost(hostId: string): Promise<EventSeries[]> {
    return await db
      .select()
      .from(eventSeries)
      .where(eq(eventSeries.hostId, hostId))
      .orderBy(desc(eventSeries.createdAt));
  }

  async updateEventSeries(
    id: string,
    updates: Partial<InsertEventSeries>
  ): Promise<EventSeries> {
    const [updated] = await db
      .update(eventSeries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(eventSeries.id, id))
      .returning();
    return updated;
  }

  async publishEventSeries(id: string): Promise<EventSeries> {
    const [published] = await db
      .update(eventSeries)
      .set({
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(eventSeries.id, id))
      .returning();
    return published;
  }

  async getEventsBySeriesId(seriesId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.seriesId, seriesId))
      .orderBy(asc(events.date));
  }

  async createTelemetryEvent(event: InsertTelemetryEvent): Promise<void> {
    await db.insert(telemetryEvents).values(event);
  }

  // Stripe helpers
  async updateUserStripeCustomerId(
    userId: string,
    customerId: string
  ): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  async updateUserStripeInfo(
    id: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    subscriptionBillingInterval?: string
  ): Promise<User> {
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

  async updateUser(
    id: string,
    updates: Partial<
      Pick<
        User,
        | "subscriptionBillingInterval"
        | "stripeCustomerId"
        | "stripeSubscriptionId"
        | "passwordHash"
        | "subscriptionSignupDate"
      >
    >
  ): Promise<User> {
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
  // (IMPORTANT) these user operations are mandatory for authentication.
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

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserType(
    id: string,
    userType: "customer" | "restaurant_owner" | "staff" | "admin"
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ userType, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUserByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    return user;
  }

  async getUserByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeSubscriptionId, stripeSubscriptionId));
    return user;
  }

  async upsertUserByAuth(
    authType: "google" | "email" | "facebook" | "tradescout",
    userData:
      | GoogleUserData
      | EmailUserData
      | FacebookUserData
      | TradeScoutUserData,
    userType: "customer" | "restaurant_owner" | "admin" = "customer",
    appContext: "mealscout" | "tradescout" = "mealscout"
  ): Promise<User> {
    try {
      if (authType === "tradescout") {
        const tsData = userData as TradeScoutUserData;
        console.log("🔍 upsertUserByAuth - TradeScout:", {
          tradescoutId: tsData.tradescoutId,
          email: tsData.email,
          userType,
          appContext,
        });

        // Step 1: Try to find existing user by TradeScout ID
        let existingUser = await db
          .select()
          .from(users)
          .where(eq(users.tradescoutId, tsData.tradescoutId))
          .limit(1);

        if (existingUser.length > 0) {
          console.log("✅ Found existing user by TradeScout ID, updating...");
          const current = existingUser[0];

          // Merge app contexts: if user previously used mealscout, now using tradescout → set to 'both'
          const newAppContext =
            current.appContext && current.appContext !== appContext
              ? "both"
              : appContext;

          const [user] = await db
            .update(users)
            .set({
              email: tsData.email ?? current.email,
              firstName: tsData.firstName ?? current.firstName,
              lastName: tsData.lastName ?? current.lastName,
              appContext: newAppContext,
              updatedAt: new Date(),
            })
            .where(eq(users.id, current.id))
            .returning();
          return user;
        }

        // Step 2: If email provided, try to find by email and link the TradeScout account
        if (tsData.email) {
          existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, tsData.email))
            .limit(1);

          if (existingUser.length > 0) {
            console.log(
              "✅ Found existing user by email, linking TradeScout account..."
            );
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const current = existingUser[0];

            const newAppContext =
              current.appContext && current.appContext !== appContext
                ? "both"
                : appContext;

            const [user] = await db
              .update(users)
              .set({
                tradescoutId: tsData.tradescoutId,
                firstName: tsData.firstName ?? current.firstName,
                lastName: tsData.lastName ?? current.lastName,
                appContext: newAppContext,
                updatedAt: new Date(),
              })
              .where(eq(users.id, current.id))
              .returning();
            return user;
          }
        }

        // Step 3: Create new user linked to TradeScout
        console.log("✅ Creating new TradeScout-linked user...");
        const [user] = await db
          .insert(users)
          .values({
            userType,
            tradescoutId: tsData.tradescoutId,
            email: tsData.email ?? undefined,
            firstName: tsData.firstName ?? undefined,
            lastName: tsData.lastName ?? undefined,
            appContext,
          })
          .returning();
        console.log("✅ TradeScout user created successfully:", {
          userId: user.id,
          email: user.email,
          appContext,
        });
        return user;
      } else if (authType === "google") {
        const googleData = userData as GoogleUserData;
        console.log("🔍 upsertUserByAuth - Google:", {
          googleId: googleData.googleId,
          email: googleData.email,
          userType,
          appContext,
        });

        // Step 1: Try to find existing user by Google ID
        let existingUser = await db
          .select()
          .from(users)
          .where(eq(users.googleId, googleData.googleId))
          .limit(1);

        if (existingUser.length > 0) {
          console.log("✅ Found existing user by Google ID, updating...");
          const current = existingUser[0];
          const newAppContext =
            current.appContext && current.appContext !== appContext
              ? "both"
              : appContext;

          const [user] = await db
            .update(users)
            .set({
              email: googleData.email,
              firstName: googleData.firstName,
              lastName: googleData.lastName,
              profileImageUrl: googleData.profileImageUrl,
              googleAccessToken: googleData.googleAccessToken,
              appContext: newAppContext,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser[0].id))
            .returning();
          return user;
        }

        // Step 2: If email provided, try to find by email and link the Google account
        if (googleData.email) {
          existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, googleData.email))
            .limit(1);

          if (existingUser.length > 0) {
            console.log(
              "✅ Found existing user by email, linking Google account..."
            );
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const current = existingUser[0];
            const newAppContext =
              current.appContext && current.appContext !== appContext
                ? "both"
                : appContext;

            const [user] = await db
              .update(users)
              .set({
                googleId: googleData.googleId,
                firstName: googleData.firstName || existingUser[0].firstName,
                lastName: googleData.lastName || existingUser[0].lastName,
                profileImageUrl:
                  googleData.profileImageUrl || existingUser[0].profileImageUrl,
                googleAccessToken: googleData.googleAccessToken,
                appContext: newAppContext,
                // Preserve existing userType to prevent account type changes
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser[0].id))
              .returning();
            return user;
          }
        }

        // Step 3: Create new user
        console.log("✅ Creating new Google user...");
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
            appContext,
          })
          .returning();
        console.log("✅ Google user created successfully:", {
          userId: user.id,
          email: user.email,
          appContext,
        });
        return user;
      } else if (authType === "facebook") {
        const facebookData = userData as FacebookUserData;
        console.log("🔍 upsertUserByAuth - Facebook:", {
          facebookId: facebookData.facebookId,
          email: facebookData.email,
          userType,
          appContext,
        });

        // Step 1: Try to find existing user by Facebook ID
        let existingUser = await db
          .select()
          .from(users)
          .where(eq(users.facebookId, facebookData.facebookId))
          .limit(1);

        if (existingUser.length > 0) {
          console.log("✅ Found existing user by Facebook ID, updating...");
          const current = existingUser[0];
          const newAppContext =
            current.appContext && current.appContext !== appContext
              ? "both"
              : appContext;

          const [user] = await db
            .update(users)
            .set({
              email: facebookData.email,
              firstName: facebookData.firstName,
              lastName: facebookData.lastName,
              profileImageUrl: facebookData.profileImageUrl,
              facebookAccessToken: facebookData.facebookAccessToken,
              appContext: newAppContext,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser[0].id))
            .returning();
          return user;
        }

        // Step 2: If email provided, try to find by email and link the Facebook account
        if (facebookData.email) {
          existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, facebookData.email))
            .limit(1);

          if (existingUser.length > 0) {
            console.log(
              "✅ Found existing user by email, linking Facebook account..."
            );
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const current = existingUser[0];
            const newAppContext =
              current.appContext && current.appContext !== appContext
                ? "both"
                : appContext;

            const [user] = await db
              .update(users)
              .set({
                facebookId: facebookData.facebookId,
                firstName: facebookData.firstName || existingUser[0].firstName,
                lastName: facebookData.lastName || existingUser[0].lastName,
                profileImageUrl:
                  facebookData.profileImageUrl ||
                  existingUser[0].profileImageUrl,
                facebookAccessToken: facebookData.facebookAccessToken,
                appContext: newAppContext,
                // Preserve existing userType to prevent account type changes
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser[0].id))
              .returning();
            return user;
          }
        }

        // Step 3: Create new user
        console.log("✅ Creating new Facebook user...");
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
            appContext,
          })
          .returning();
        console.log("✅ Facebook user created successfully:", {
          userId: user.id,
          email: user.email,
          appContext,
        });
        return user;
      } else {
        const emailData = userData as EmailUserData;
        console.log("🔍 upsertUserByAuth - Email:", {
          email: emailData.email,
          userType,
          appContext,
        });

        const [user] = await db
          .insert(users)
          .values({
            userType,
            email: emailData.email,
            firstName: emailData.firstName,
            lastName: emailData.lastName,
            phone: emailData.phone,
            passwordHash: emailData.passwordHash,
            emailVerified: true,
            appContext,
          })
          .returning();
        console.log("✅ Email user created successfully:", {
          userId: user.id,
          email: user.email,
          appContext,
        });
        return user;
      }
    } catch (error: any) {
      console.error("❌ upsertUserByAuth error:", {
        authType,
        userType,
        appContext,
        errorCode: error.code,
        errorMessage: error.message,
        errorConstraint: error.constraint,
        errorDetail: error.detail,
      });

      // Handle unique constraint violations (23505)
      if (error.code === "23505") {
        console.log(
          "🔄 Handling unique constraint violation, retrying with fetch-and-update..."
        );

        if (authType === "tradescout") {
          const tsData = userData as TradeScoutUserData;

          const existingUser = await db
            .select()
            .from(users)
            .where(
              tsData.email
                ? or(
                    eq(users.tradescoutId, tsData.tradescoutId),
                    eq(users.email, tsData.email)
                  )
                : eq(users.tradescoutId, tsData.tradescoutId)
            )
            .limit(1);

          if (existingUser.length > 0) {
            console.log(
              "✅ Found existing user during TradeScout retry, updating..."
            );
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const current = existingUser[0];
            const [user] = await db
              .update(users)
              .set({
                tradescoutId: tsData.tradescoutId,
                email: tsData.email ?? current.email,
                firstName: tsData.firstName ?? current.firstName,
                lastName: tsData.lastName ?? current.lastName,
                updatedAt: new Date(),
              })
              .where(eq(users.id, current.id))
              .returning();
            return user;
          }
        } else if (authType === "google") {
          const googleData = userData as GoogleUserData;

          // Retry: find by GoogleID or email and update
          const existingUser = await db
            .select()
            .from(users)
            .where(
              googleData.email
                ? or(
                    eq(users.googleId, googleData.googleId),
                    eq(users.email, googleData.email)
                  )
                : eq(users.googleId, googleData.googleId)
            )
            .limit(1);

          if (existingUser.length > 0) {
            console.log("✅ Found existing user during retry, updating...");
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const [user] = await db
              .update(users)
              .set({
                googleId: googleData.googleId,
                email: googleData.email,
                firstName: googleData.firstName,
                lastName: googleData.lastName,
                profileImageUrl: googleData.profileImageUrl,
                googleAccessToken: googleData.googleAccessToken,
                // Preserve existing userType to prevent account type changes
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser[0].id))
              .returning();
            return user;
          }
        } else if (authType === "facebook") {
          const facebookData = userData as FacebookUserData;

          // Retry: find by FacebookID or email and update
          const existingUser = await db
            .select()
            .from(users)
            .where(
              facebookData.email
                ? or(
                    eq(users.facebookId, facebookData.facebookId),
                    eq(users.email, facebookData.email)
                  )
                : eq(users.facebookId, facebookData.facebookId)
            )
            .limit(1);

          if (existingUser.length > 0) {
            console.log("✅ Found existing user during retry, updating...");
            console.log(
              "⚠️  Preserving existing userType:",
              existingUser[0].userType
            );
            const [user] = await db
              .update(users)
              .set({
                facebookId: facebookData.facebookId,
                email: facebookData.email,
                firstName: facebookData.firstName,
                lastName: facebookData.lastName,
                profileImageUrl: facebookData.profileImageUrl,
                facebookAccessToken: facebookData.facebookAccessToken,
                // Preserve existing userType to prevent account type changes
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingUser[0].id))
              .returning();
            return user;
          }
        }
      }

      // Re-throw the error if we can't handle it
      throw error;
    }
  }

  // Restaurant operations
  async createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant> {
    // NORTH STAR RULE: Apply pricing lock for restaurants (not trucks) created before March 1, 2026
    const now = new Date();
    const priceLockCutoff = new Date("2026-03-01");
    const isRestaurant = !restaurant.isFoodTruck;

    let restaurantData = { ...restaurant };

    if (isRestaurant && now < priceLockCutoff && !restaurant.lockedPriceCents) {
      // Apply the early rollout price lock: $25/month forever
      restaurantData = {
        ...restaurantData,
        lockedPriceCents: 2500,
        priceLockDate: now,
        priceLockReason: "early_rollout",
      };
    }

    const [newRestaurant] = await db
      .insert(restaurants)
      .values(restaurantData)
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

  async updateRestaurant(
    id: string,
    restaurant: Partial<InsertRestaurant>
  ): Promise<Restaurant> {
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

  async getNearbyRestaurants(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Restaurant[]> {
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

  async getSubscribedRestaurants(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Restaurant[]> {
    // Get nearby restaurants whose owners have active subscriptions
    const results = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        address: restaurants.address,
        phone: restaurants.phone,
        businessType: restaurants.businessType,
        latitude: restaurants.latitude,
        longitude: restaurants.longitude,
        cuisineType: restaurants.cuisineType,
        promoCode: restaurants.promoCode,
        isActive: restaurants.isActive,
        isVerified: restaurants.isVerified,
        ownerId: restaurants.ownerId,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt,
        isFoodTruck: restaurants.isFoodTruck,
        mobileOnline: restaurants.mobileOnline,
        currentLatitude: restaurants.currentLatitude,
        currentLongitude: restaurants.currentLongitude,
        lastBroadcastAt: restaurants.lastBroadcastAt,
        operatingHours: restaurants.operatingHours,
        subscriptionStatus: users.subscriptionBillingInterval,
      })
      .from(restaurants)
      .innerJoin(users, eq(restaurants.ownerId, users.id))
      .where(
        and(
          eq(restaurants.isActive, true),
          // Owner has subscription (either promo code or paid)
          isNotNull(users.subscriptionBillingInterval),
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

    // Map results back to Restaurant type (remove subscriptionStatus)
    return results.map(
      ({ subscriptionStatus, ...restaurant }: any) => restaurant as Restaurant
    );
  }

  async verifyRestaurantOwnership(
    restaurantId: string,
    userId: string
  ): Promise<boolean> {
    const [restaurant] = await db
      .select({ ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    return restaurant?.ownerId === userId;
  }

  // Deal operations
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
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

  async duplicateDeal(id: string): Promise<Deal> {
    const originalDeal = await this.getDeal(id);
    if (!originalDeal) {
      throw new Error("Deal not found");
    }

    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      currentUses: ____,
      ...dealData
    } = originalDeal;

    const [clonedDeal] = await db
      .insert(deals)
      .values({
        ...dealData,
        title: `${dealData.title} (Copy)`,
        currentUses: 0,
        isActive: false, // Start cloned deals as inactive
      })
      .returning();

    return clonedDeal;
  }

  async getAllDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }

  async getActiveDeals(): Promise<Deal[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    const activeDealsResult = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          // Time window logic: handles normal hours, overnight hours, and 24/7
          sql`(
            -- 24/7 deals (always active)
            (${deals.startTime} = '00:00' AND ${deals.endTime} = '23:59')
            OR
            -- Normal time window (startTime <= endTime)
            (${deals.startTime} <= ${deals.endTime} AND ${deals.startTime} <= ${currentTime} AND ${currentTime} <= ${deals.endTime})
            OR
            -- Overnight time window (startTime > endTime)
            (${deals.startTime} > ${deals.endTime} AND (${currentTime} >= ${deals.startTime} OR ${currentTime} <= ${deals.endTime}))
          )`
        )
      )
      .orderBy(desc(deals.createdAt))
      .limit(50); // Limit results for better performance

    // Filter by restaurant operating hours
    return await this.filterDealsByOperatingHours(activeDealsResult);
  }

  async getFilteredDeals(
    showLimitedTimeOnly: boolean = false
  ): Promise<Deal[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    let dealsQuery;

    if (showLimitedTimeOnly) {
      // Show only deals with specific time restrictions (not 24/7)
      dealsQuery = await db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.isActive, true),
            lte(deals.startDate, now),
            gte(deals.endDate, now),
            // Time window logic: handles normal hours and overnight hours (excludes 24/7)
            sql`(
              -- Normal time window (startTime <= endTime)
              (${deals.startTime} <= ${deals.endTime} AND ${deals.startTime} <= ${currentTime} AND ${currentTime} <= ${deals.endTime})
              OR
              -- Overnight time window (startTime > endTime)
              (${deals.startTime} > ${deals.endTime} AND (${currentTime} >= ${deals.startTime} OR ${currentTime} <= ${deals.endTime}))
            )`,
            // Exclude 24/7 deals - be more robust in detection
            sql`NOT (
              (${deals.startTime} = '00:00' AND ${deals.endTime} = '23:59')
              OR (${deals.startTime} = '00:00' AND ${deals.endTime} = '24:00')
              OR (${deals.startTime} = ${deals.endTime})
            )`
          )
        )
        .orderBy(desc(deals.createdAt))
        .limit(200); // Increase limit to get more deals for randomization
    } else {
      // Show all currently active deals (includes time-of-day filtering)
      dealsQuery = await db
        .select()
        .from(deals)
        .where(
          and(
            eq(deals.isActive, true),
            lte(deals.startDate, now),
            gte(deals.endDate, now),
            // Apply the same time window logic as getActiveDeals
            sql`(
              -- 24/7 deals (always active)
              (${deals.startTime} = '00:00' AND ${deals.endTime} = '23:59')
              OR
              -- Normal time window (startTime <= endTime)
              (${deals.startTime} <= ${deals.endTime} AND ${deals.startTime} <= ${currentTime} AND ${currentTime} <= ${deals.endTime})
              OR
              -- Overnight time window (startTime > endTime)
              (${deals.startTime} > ${deals.endTime} AND (${currentTime} >= ${deals.startTime} OR ${currentTime} <= ${deals.endTime}))
            )`
          )
        )
        .orderBy(desc(deals.createdAt))
        .limit(200); // Increase limit to get more deals for randomization
    }

    // Filter by restaurant operating hours
    const filteredDeals = await this.filterDealsByOperatingHours(dealsQuery);

    // Group deals by restaurant and randomly select one deal per restaurant
    return this.randomizeDealsPerRestaurant(filteredDeals);
  }

  // New method to randomly select one deal per restaurant for diverse feed display
  private randomizeDealsPerRestaurant(deals: Deal[]): Deal[] {
    const dealsByRestaurant: { [restaurantId: string]: Deal[] } = {};

    // Group deals by restaurant
    for (const deal of deals) {
      const restaurantId = deal.restaurantId;
      if (!dealsByRestaurant[restaurantId]) {
        dealsByRestaurant[restaurantId] = [];
      }
      dealsByRestaurant[restaurantId].push(deal);
    }

    // Randomly select one deal per restaurant
    const randomizedDeals: Deal[] = [];
    for (const restaurantId in dealsByRestaurant) {
      const restaurantDeals = dealsByRestaurant[restaurantId];
      const randomIndex = Math.floor(Math.random() * restaurantDeals.length);
      randomizedDeals.push(restaurantDeals[randomIndex]);
    }

    // Shuffle the final array to randomize restaurant order too
    for (let i = randomizedDeals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [randomizedDeals[i], randomizedDeals[j]] = [
        randomizedDeals[j],
        randomizedDeals[i],
      ];
    }

    return randomizedDeals.slice(0, 50); // Limit to 50 restaurants max
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
      newUsersToday,
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(restaurants),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(deals),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(deals)
        .where(eq(deals.isActive, true)),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(dealClaims),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(dealClaims)
        .where(
          gte(dealClaims.claimedAt, new Date(new Date().setHours(0, 0, 0, 0)))
        ),
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(users)
        .where(gte(users.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))),
    ]);

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalRestaurants: totalRestaurants[0]?.count || 0,
      totalDeals: totalDeals[0]?.count || 0,
      activeDeals: activeDeals[0]?.count || 0,
      totalClaims: totalClaims[0]?.count || 0,
      todayClaims: todayClaims[0]?.count || 0,
      newUsersToday: newUsersToday[0]?.count || 0,
      revenue: 0, // Placeholder for revenue calculation
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
    await db.delete(restaurants).where(eq(restaurants.id, restaurantId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
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
        },
      })
      .from(deals)
      .leftJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .orderBy(desc(deals.createdAt));
  }

  async getNearbyDeals(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<any[]> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    const dealsQuery = await db
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
        `.as("distance"),
      })
      .from(deals)
      .innerJoin(restaurants, eq(deals.restaurantId, restaurants.id))
      .where(
        and(
          eq(deals.isActive, true),
          eq(restaurants.isActive, true),
          lte(deals.startDate, now),
          gte(deals.endDate, now),
          // Time window logic: handles normal hours, overnight hours, and 24/7
          sql`(
            -- 24/7 deals (always active)
            (${deals.startTime} = '00:00' AND ${deals.endTime} = '23:59')
            OR
            -- Normal time window (startTime <= endTime)
            (${deals.startTime} <= ${deals.endTime} AND ${deals.startTime} <= ${currentTime} AND ${currentTime} <= ${deals.endTime})
            OR
            -- Overnight time window (startTime > endTime)
            (${deals.startTime} > ${deals.endTime} AND (${currentTime} >= ${deals.startTime} OR ${currentTime} <= ${deals.endTime}))
          )`,
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

    // Filter by restaurant operating hours
    return await this.filterDealsByOperatingHours(dealsQuery);
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
      const restaurantIds = userRestaurants.map((r: any) => r.id);
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
    // Start with active deals (which includes time filtering and operating hours filtering)
    let dealsResult = await this.getActiveDeals();

    // Convert to any[] type for additional filtering
    let searchResults: any[] = dealsResult.map((deal) => ({
      ...deal,
      // We'll need restaurant data for filtering, so let's fetch it
      restaurantData: null,
    }));

    // If we have filters that need restaurant data, fetch it
    const needsRestaurantData =
      filters.query ||
      filters.cuisineType ||
      (filters.latitude && filters.longitude && filters.radius);

    if (needsRestaurantData && searchResults.length > 0) {
      // Get unique restaurant IDs
      const restaurantIds = Array.from(
        new Set(searchResults.map((deal) => deal.restaurantId))
      );

      // Fetch restaurant data
      const restaurantData = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          address: restaurants.address,
          latitude: restaurants.latitude,
          longitude: restaurants.longitude,
          cuisineType: restaurants.cuisineType,
          isVerified: restaurants.isVerified,
        })
        .from(restaurants)
        .where(inArray(restaurants.id, restaurantIds));

      // Create restaurant lookup map
      const restaurantMap = new Map(restaurantData.map((r: any) => [r.id, r]));

      // Add restaurant data to results
      searchResults = searchResults.map((deal) => ({
        ...deal,
        restaurantData: restaurantMap.get(deal.restaurantId),
      }));
    }

    // Apply search filters
    if (filters.query && filters.query.trim()) {
      const searchTerm = filters.query.trim().toLowerCase();
      searchResults = searchResults.filter(
        (deal) =>
          deal.title.toLowerCase().includes(searchTerm) ||
          deal.description.toLowerCase().includes(searchTerm) ||
          deal.restaurantData?.name?.toLowerCase().includes(searchTerm) ||
          deal.restaurantData?.cuisineType?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply cuisine type filter
    if (filters.cuisineType && filters.cuisineType.trim()) {
      const cuisineFilter = filters.cuisineType.toLowerCase();
      searchResults = searchResults.filter((deal) =>
        deal.restaurantData?.cuisineType?.toLowerCase().includes(cuisineFilter)
      );
    }

    // Apply price range filters
    if (filters.minPrice !== undefined) {
      searchResults = searchResults.filter(
        (deal) => deal.discountedPrice >= filters.minPrice!
      );
    }
    if (filters.maxPrice !== undefined) {
      searchResults = searchResults.filter(
        (deal) => deal.discountedPrice <= filters.maxPrice!
      );
    }

    // Apply location filtering if coordinates provided
    if (filters.latitude && filters.longitude && filters.radius) {
      searchResults = searchResults.filter((deal) => {
        const lat1 = filters.latitude!;
        const lng1 = filters.longitude!;
        const lat2 = parseFloat(deal.restaurantData?.latitude || "0");
        const lng2 = parseFloat(deal.restaurantData?.longitude || "0");

        if (lat2 === 0 || lng2 === 0) return false;

        // Calculate distance using Haversine formula
        const R = 6371; // Earth's radius in kilometers
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance <= filters.radius!;
      });
    }

    // Apply sorting
    if (filters.sortBy === "price-low") {
      searchResults.sort((a, b) => a.discountedPrice - b.discountedPrice);
    } else if (filters.sortBy === "price-high") {
      searchResults.sort((a, b) => b.discountedPrice - a.discountedPrice);
    } else if (filters.sortBy === "discount") {
      searchResults.sort(
        (a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0)
      );
    } else if (filters.sortBy === "date") {
      searchResults.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // Default relevance sort (verified restaurants first, then by creation date)
      searchResults.sort((a, b) => {
        const aVerified = a.restaurantData?.isVerified ? 1 : 0;
        const bVerified = b.restaurantData?.isVerified ? 1 : 0;
        if (aVerified !== bVerified) return bVerified - aVerified;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    // Limit results for performance and remove restaurantData before returning
    const finalResults = searchResults.slice(0, 100).map((deal) => {
      const { restaurantData, ...dealWithoutRestaurantData } = deal;
      return dealWithoutRestaurantData;
    });

    return finalResults;
  }

  // Deal claim operations
  async claimDeal(claim: InsertDealClaim): Promise<DealClaim> {
    const [newClaim] = await db.insert(dealClaims).values(claim).returning();
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

  async getRestaurantDealClaims(
    restaurantId: string,
    status?: string
  ): Promise<any[]> {
    const conditions = [eq(deals.restaurantId, restaurantId)];

    if (status === "pending") {
      conditions.push(isNull(dealClaims.usedAt));
    } else if (status === "used") {
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
    const [newReview] = await db.insert(reviews).values(review).returning();
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
        },
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
      console.log(
        "⚠️  Admin credentials not configured - skipping admin creation"
      );
      return;
    }

    try {
      // Check if admin already exists
      const existingAdmin = await this.getUserByEmail(adminEmail);

      if (existingAdmin) {
        console.log("✅ Admin account already exists");
        // If an admin exists but the configured ADMIN_PASSWORD does not match,
        // update the stored hash to eliminate password drift between env and DB
        if (existingAdmin.passwordHash) {
          const matches = await bcrypt.compare(
            adminPassword,
            existingAdmin.passwordHash
          );
          if (!matches) {
            console.log(
              "🔄 Admin password differs from configured ADMIN_PASSWORD – updating hash"
            );
            const newHash = await bcrypt.hash(adminPassword, 12);
            await db
              .update(users)
              .set({ passwordHash: newHash, userType: "super_admin" })
              .where(eq(users.id, existingAdmin.id));
            console.log("✅ Admin password updated to match environment");
          } else if (existingAdmin.userType !== "super_admin") {
            // Ensure the admin is super_admin
            await db
              .update(users)
              .set({ userType: "super_admin" })
              .where(eq(users.id, existingAdmin.id));
            console.log("✅ Admin upgraded to super_admin");
          }
        } else {
          // If no password hash exists, set it now
          const newHash = await bcrypt.hash(adminPassword, 12);
          await db
            .update(users)
            .set({ passwordHash: newHash, userType: "super_admin" })
            .where(eq(users.id, existingAdmin.id));
          console.log("✅ Admin password initialized from environment");
        }
        return;
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      await this.upsertUserByAuth(
        "email",
        {
          email: adminEmail,
          firstName: "Admin",
          lastName: "User",
          phone: "+1 (555) 000-0000",
          passwordHash,
        },
        "super_admin"
      );

      console.log("✅ Super Admin account created successfully");
    } catch (error) {
      console.error("❌ Failed to create admin account:", error);
    }
  }

  // Seed data for development and testing
  async seedDevelopmentData(): Promise<void> {
    try {
      // Check if data already exists
      const existingRestaurants = await db.select().from(restaurants).limit(1);
      if (existingRestaurants.length > 0) {
        console.log("✅ Seed data already exists");
        return;
      }

      console.log("🌱 Seeding development data...");

      // Create sample restaurant owners
      const owner1 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner1@example.com",
          firstName: "Mario",
          lastName: "Rossi",
          phone: "+1 (985) 555-0001",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      const owner2 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner2@example.com",
          firstName: "Luigi",
          lastName: "Verde",
          phone: "+1 (985) 555-0002",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      const owner3 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner3@example.com",
          firstName: "Giuseppe",
          lastName: "Bianchi",
          phone: "+1 (985) 555-0003",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      // Create sample customer
      const customer1 = await this.upsertUserByAuth(
        "email",
        {
          email: "customer@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+1 (985) 555-0100",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "customer"
      );

      // Create additional owners for geographic diversity
      const owner4 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner4@example.com",
          firstName: "Maria",
          lastName: "Garcia",
          phone: "+1 (985) 555-0004",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      const owner5 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner5@example.com",
          firstName: "David",
          lastName: "Chen",
          phone: "+1 (985) 555-0005",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      const owner6 = await this.upsertUserByAuth(
        "email",
        {
          email: "owner6@example.com",
          firstName: "Sarah",
          lastName: "Johnson",
          phone: "+1 (985) 555-0006",
          passwordHash: await bcrypt.hash("password123", 10),
        },
        "restaurant_owner"
      );

      // Create restaurants across different US cities for testing

      // Hammond, LA (Local area)
      const restaurant1 = await this.createRestaurant({
        name: "Café du Monde Hammond",
        address: "315 W Thomas St, Hammond, LA 70401",
        phone: "+1 (985) 345-2233",
        cuisineType: "Cajun",
        latitude: "30.5047",
        longitude: "-90.4612",
        ownerId: owner1.id,
      });

      const restaurant2 = await this.createRestaurant({
        name: "Red Lobster Hammond",
        address: "1535 W Thomas St, Hammond, LA 70401",
        phone: "+1 (985) 419-1235",
        cuisineType: "Seafood",
        latitude: "30.5125",
        longitude: "-90.4897",
        ownerId: owner2.id,
      });

      // New York City
      const restaurant3 = await this.createRestaurant({
        name: "Joe's Pizza NYC",
        address: "7 Carmine St, New York, NY 10014",
        phone: "+1 (212) 366-1182",
        cuisineType: "Italian",
        latitude: "40.7303",
        longitude: "-74.0033",
        ownerId: owner3.id,
      });

      const restaurant4 = await this.createRestaurant({
        name: "Katz's Delicatessen",
        address: "205 E Houston St, New York, NY 10002",
        phone: "+1 (212) 254-2246",
        cuisineType: "Jewish",
        latitude: "40.7222",
        longitude: "-73.9876",
        ownerId: owner4.id,
      });

      // Los Angeles
      const restaurant5 = await this.createRestaurant({
        name: "In-N-Out Burger",
        address: "7009 Sunset Blvd, Hollywood, CA 90028",
        phone: "+1 (800) 786-1000",
        cuisineType: "American",
        latitude: "34.0985",
        longitude: "-118.3431",
        ownerId: owner5.id,
      });

      const restaurant6 = await this.createRestaurant({
        name: "Guelaguetza",
        address: "3014 W Olympic Blvd, Los Angeles, CA 90006",
        phone: "+1 (213) 427-0608",
        cuisineType: "Mexican",
        latitude: "34.0579",
        longitude: "-118.2951",
        ownerId: owner6.id,
      });

      // Chicago
      const restaurant7 = await this.createRestaurant({
        name: "Lou Malnati's Pizzeria",
        address: "439 N Wells St, Chicago, IL 60654",
        phone: "+1 (312) 828-9800",
        cuisineType: "Italian",
        latitude: "41.8906",
        longitude: "-87.6342",
        ownerId: owner1.id,
      });

      const restaurant8 = await this.createRestaurant({
        name: "Al's Beef",
        address: "1079 W Taylor St, Chicago, IL 60607",
        phone: "+1 (312) 226-4017",
        cuisineType: "American",
        latitude: "41.8690",
        longitude: "-87.6544",
        ownerId: owner2.id,
      });

      // Houston
      const restaurant9 = await this.createRestaurant({
        name: "The Original Ninfa's",
        address: "2704 Navigation Blvd, Houston, TX 77003",
        phone: "+1 (713) 228-1175",
        cuisineType: "Mexican",
        latitude: "29.7469",
        longitude: "-95.3352",
        ownerId: owner3.id,
      });

      const restaurant10 = await this.createRestaurant({
        name: "Franklin Barbecue",
        address: "900 E 11th St, Austin, TX 78702",
        phone: "+1 (512) 653-1187",
        cuisineType: "BBQ",
        latitude: "30.2669",
        longitude: "-97.7318",
        ownerId: owner4.id,
      });

      // Miami
      const restaurant11 = await this.createRestaurant({
        name: "Versailles Restaurant",
        address: "3555 SW 8th St, Miami, FL 33135",
        phone: "+1 (305) 444-0240",
        cuisineType: "Cuban",
        latitude: "25.7654",
        longitude: "-80.2534",
        ownerId: owner5.id,
      });

      // Seattle
      const restaurant12 = await this.createRestaurant({
        name: "Pike Place Chowder",
        address: "1530 Post Alley, Seattle, WA 98101",
        phone: "+1 (206) 267-2537",
        cuisineType: "Seafood",
        latitude: "47.6089",
        longitude: "-122.3403",
        ownerId: owner6.id,
      });

      // Food trucks in different cities
      const foodTruck1 = await this.createRestaurant({
        name: "Louisiana Po-Boy Express",
        address: "Mobile - Hammond & Ponchatoula area",
        phone: "+1 (985) 662-7823",
        cuisineType: "Cajun",
        isFoodTruck: true,
        latitude: "30.5123",
        longitude: "-90.4567",
        ownerId: owner1.id,
      });

      const foodTruck2 = await this.createRestaurant({
        name: "The Halal Guys NYC",
        address: "Mobile - Manhattan area",
        phone: "+1 (347) 527-1505",
        cuisineType: "Middle Eastern",
        isFoodTruck: true,
        latitude: "40.7589",
        longitude: "-73.9851",
        ownerId: owner2.id,
      });

      const foodTruck3 = await this.createRestaurant({
        name: "Kogi BBQ Truck",
        address: "Mobile - Los Angeles area",
        phone: "+1 (323) 582-8889",
        cuisineType: "Korean",
        isFoodTruck: true,
        latitude: "34.0522",
        longitude: "-118.2437",
        ownerId: owner3.id,
      });

      // Create diverse deals across different cities and cuisines

      // Hammond, LA deals
      const deal1 = await this.createDeal({
        restaurantId: restaurant1.id,
        title: "Free Beignets with Coffee Purchase",
        description:
          "Get 3 fresh, hot beignets absolutely free when you purchase any coffee or café au lait. Served with powdered sugar!",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "3.50",
        imageUrl:
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "06:00",
        endTime: "11:00",
        totalUsesLimit: 200,
        perCustomerLimit: 1,
        isActive: true,
      });

      const deal2 = await this.createDeal({
        restaurantId: restaurant2.id,
        title: "$5 Off Endless Shrimp",
        description:
          "Save $5 on our famous Endless Shrimp special! Choose from over 30 different shrimp preparations.",
        dealType: "fixed",
        discountValue: "5.00",
        minOrderAmount: "19.99",
        imageUrl:
          "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        startTime: "15:00",
        endTime: "21:00",
        totalUsesLimit: 100,
        perCustomerLimit: 1,
        isActive: true,
      });

      // NYC deals
      const deal3 = await this.createDeal({
        restaurantId: restaurant3.id,
        title: "Buy 1 Get 1 Half Off Pizza Slices",
        description:
          "Get the second pizza slice at 50% off! Valid on our famous NYC-style thin crust slices.",
        dealType: "percentage",
        discountValue: "25.00",
        minOrderAmount: "6.00",
        imageUrl:
          "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "23:00",
        totalUsesLimit: 150,
        perCustomerLimit: 2,
        isActive: true,
      });

      const deal4 = await this.createDeal({
        restaurantId: restaurant4.id,
        title: "Free Pickle with Pastrami Sandwich",
        description:
          "Get a complimentary full sour pickle with any pastrami sandwich order. A NYC classic!",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "18.00",
        imageUrl:
          "https://images.unsplash.com/photo-1567129937968-cdad8f07e2f8?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startTime: "08:00",
        endTime: "22:00",
        totalUsesLimit: 300,
        perCustomerLimit: 1,
        isActive: true,
      });

      // LA deals
      const deal5 = await this.createDeal({
        restaurantId: restaurant5.id,
        title: "Animal Style Fries Upgrade",
        description:
          "Free upgrade to Animal Style fries with any Double-Double burger purchase!",
        dealType: "fixed",
        discountValue: "2.50",
        minOrderAmount: "8.00",
        imageUrl:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "10:30",
        endTime: "01:00",
        totalUsesLimit: 200,
        perCustomerLimit: 1,
        isActive: true,
      });

      const deal6 = await this.createDeal({
        restaurantId: restaurant6.id,
        title: "Free Mole Tasting",
        description:
          "Try our seven traditional moles with any entree order over $20. Discover authentic Oaxacan flavors!",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "20.00",
        imageUrl:
          "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        startTime: "17:00",
        endTime: "22:00",
        totalUsesLimit: 75,
        perCustomerLimit: 1,
        isActive: true,
      });

      // Chicago deals
      const deal7 = await this.createDeal({
        restaurantId: restaurant7.id,
        title: "20% Off Deep Dish Pizza",
        description:
          "Save 20% on our famous Chicago deep dish pizza! Made with our signature buttery crust.",
        dealType: "percentage",
        discountValue: "20.00",
        minOrderAmount: "25.00",
        imageUrl:
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "23:00",
        totalUsesLimit: 100,
        perCustomerLimit: 2,
        isActive: true,
      });

      const deal8 = await this.createDeal({
        restaurantId: restaurant8.id,
        title: "Free Hot Peppers with Italian Beef",
        description:
          "Get a side of our spicy giardiniera hot peppers free with any Italian beef sandwich!",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "12.00",
        imageUrl:
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        startTime: "10:00",
        endTime: "22:00",
        totalUsesLimit: 250,
        perCustomerLimit: 1,
        isActive: true,
      });

      // Texas deals
      const deal9 = await this.createDeal({
        restaurantId: restaurant9.id,
        title: "Happy Hour Margaritas",
        description:
          "$3 off our famous frozen margaritas during happy hour! Made with fresh lime juice.",
        dealType: "fixed",
        discountValue: "3.00",
        minOrderAmount: "8.00",
        imageUrl:
          "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        startTime: "15:00",
        endTime: "18:00",
        totalUsesLimit: 500,
        perCustomerLimit: 2,
        isActive: true,
      });

      const deal10 = await this.createDeal({
        restaurantId: restaurant10.id,
        title: "Free Sauce with Brisket Plate",
        description:
          "Choose a complimentary sauce (Espresso BBQ, Hot, or Regular) with any brisket plate order.",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "16.00",
        imageUrl:
          "https://images.unsplash.com/photo-1544025162-d76694265947?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "21:00",
        totalUsesLimit: 200,
        perCustomerLimit: 1,
        isActive: true,
      });

      // Miami deal
      const deal11 = await this.createDeal({
        restaurantId: restaurant11.id,
        title: "Free Cuban Coffee with Breakfast",
        description:
          "Complimentary café cubano with any breakfast order before 11 AM.",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "12.00",
        imageUrl:
          "https://images.unsplash.com/photo-1512481844049-fce44975de78?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "07:00",
        endTime: "11:00",
        totalUsesLimit: 150,
        perCustomerLimit: 1,
        isActive: true,
      });

      // Seattle deal
      const deal12 = await this.createDeal({
        restaurantId: restaurant12.id,
        title: "25% Off Clam Chowder Friday",
        description:
          "Every Friday, save 25% on our award-winning New England clam chowder!",
        dealType: "percentage",
        discountValue: "25.00",
        minOrderAmount: "8.00",
        imageUrl:
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "21:00",
        totalUsesLimit: 100,
        perCustomerLimit: 1,
        isActive: true,
      });

      // Food truck deals
      const deal13 = await this.createDeal({
        restaurantId: foodTruck1.id,
        title: "Buy 2 Po-Boys, Get 1 Free",
        description:
          "Purchase any two po-boys and get a third one free! Choose from our authentic New Orleans-style shrimp, oyster, or roast beef po-boys.",
        dealType: "percentage",
        discountValue: "33.00",
        minOrderAmount: "16.00",
        imageUrl:
          "https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "19:00",
        totalUsesLimit: 75,
        perCustomerLimit: 1,
        isActive: true,
      });

      const deal14 = await this.createDeal({
        restaurantId: foodTruck2.id,
        title: "Free White Sauce with Combo",
        description:
          "Get our famous white sauce free with any combo platter! The secret recipe that made us famous.",
        dealType: "percentage",
        discountValue: "100.00",
        minOrderAmount: "10.00",
        imageUrl:
          "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: "11:00",
        endTime: "23:00",
        totalUsesLimit: 200,
        perCustomerLimit: 1,
        isActive: true,
      });

      const deal15 = await this.createDeal({
        restaurantId: foodTruck3.id,
        title: "$2 Off Korean BBQ Tacos",
        description:
          "Save $2 on our fusion Korean BBQ tacos! Marinated bulgogi with Korean spices in warm tortillas.",
        dealType: "fixed",
        discountValue: "2.00",
        minOrderAmount: "8.00",
        imageUrl:
          "https://images.unsplash.com/photo-1565299585323-38174c4a6303?w=500",
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        startTime: "11:30",
        endTime: "22:00",
        totalUsesLimit: 100,
        perCustomerLimit: 2,
        isActive: true,
      });

      // Create sample reviews across different cities
      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant1.id,
        rating: 5,
        comment:
          "Best beignets in Hammond! Just like being in New Orleans. The coffee is strong and perfect with the powdered sugar treats.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant2.id,
        rating: 4,
        comment:
          "Great seafood as always! The endless shrimp deal is amazing - so many varieties to try. Service was quick and friendly.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant3.id,
        rating: 5,
        comment:
          "Authentic NYC pizza! Thin crust perfection. The deal makes it even better - great value in the city.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant4.id,
        rating: 5,
        comment:
          "Iconic NYC deli! The pastrami sandwich is legendary. Worth the wait and every penny. A true New York experience.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant5.id,
        rating: 4,
        comment:
          "Classic LA burger joint! Fresh ingredients and the Animal Style fries are addictive. Great California vibes.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant6.id,
        rating: 5,
        comment:
          "Incredible authentic Oaxacan food! The mole varieties are amazing. Each one tells a story of traditional flavors.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant7.id,
        rating: 5,
        comment:
          "Best deep dish in Chicago! The crust is buttery perfection and loaded with cheese. A Chicago must-have!",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant8.id,
        rating: 4,
        comment:
          "True Chicago Italian beef! Messy but delicious. The juice and hot peppers make it perfect. Pure Chicago tradition.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant9.id,
        rating: 4,
        comment:
          "Great Tex-Mex in Houston! The margaritas are strong and the fajitas sizzle. Happy hour deals are fantastic.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant10.id,
        rating: 5,
        comment:
          "BBQ perfection in Austin! The brisket melts in your mouth. Worth the line - Texas BBQ at its finest.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant11.id,
        rating: 4,
        comment:
          "Authentic Cuban food in Miami! The café cubano is perfect and the breakfast is hearty. Real Cuban flavors.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: restaurant12.id,
        rating: 5,
        comment:
          "Amazing chowder in Seattle! Creamy, rich, and full of fresh clams. Perfect for the Pacific Northwest weather.",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: foodTruck1.id,
        rating: 5,
        comment:
          "Best po-boys outside of New Orleans! The shrimp po-boy is massive and perfectly seasoned. Worth finding wherever they are!",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: foodTruck2.id,
        rating: 5,
        comment:
          "NYC street food legend! The white sauce is incredible and the chicken is perfectly seasoned. Late night favorite!",
      });

      await this.createReview({
        userId: customer1.id,
        restaurantId: foodTruck3.id,
        rating: 4,
        comment:
          "Fusion done right in LA! Korean BBQ tacos are unique and delicious. Great mix of flavors and cultures.",
      });

      // Start food truck sessions for demo
      await this.startTruckSession(foodTruck1.id, "demo-device-123", owner1.id);
      await this.startTruckSession(foodTruck2.id, "demo-device-456", owner2.id);
      await this.startTruckSession(foodTruck3.id, "demo-device-789", owner3.id);

      console.log("✅ Development seed data created successfully");
      console.log("📊 Created:");
      console.log("   - 6 restaurant owners (password: password123)");
      console.log(
        "   - 1 customer (customer@example.com, password: password123)"
      );
      console.log(
        "   - 15 restaurants across 8+ US cities (Hammond, NYC, LA, Chicago, Houston, Austin, Miami, Seattle)"
      );
      console.log("   - 3 food trucks in different cities");
      console.log("   - 15 diverse deals with regional cuisine specialties");
      console.log("   - 15 authentic location-specific reviews");
      console.log("   - 3 active food truck sessions");
    } catch (error) {
      console.error("❌ Failed to seed development data:", error);
    }
  }

  // Verification operations
  async createVerificationRequest(
    verificationRequest: InsertVerificationRequest
  ): Promise<VerificationRequest> {
    const [newRequest] = await db
      .insert(verificationRequests)
      .values(verificationRequest)
      .returning();
    return newRequest;
  }

  async getVerificationRequestsByOwner(
    ownerId: string
  ): Promise<VerificationRequest[]> {
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
      .innerJoin(
        restaurants,
        eq(verificationRequests.restaurantId, restaurants.id)
      )
      .where(eq(restaurants.ownerId, ownerId))
      .orderBy(desc(verificationRequests.createdAt));
  }

  async getVerificationRequests(): Promise<
    (VerificationRequest & {
      restaurant: {
        id: string;
        name: string;
        address: string;
        ownerId: string;
      };
    })[]
  > {
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
        },
      })
      .from(verificationRequests)
      .innerJoin(
        restaurants,
        eq(verificationRequests.restaurantId, restaurants.id)
      )
      .orderBy(desc(verificationRequests.submittedAt));
  }

  async approveVerificationRequest(
    id: string,
    reviewerId: string
  ): Promise<void> {
    // Start transaction to update both tables
    await db.transaction(async (tx: any) => {
      // Update verification request status
      const [request] = await tx
        .update(verificationRequests)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewerId,
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      if (!request) {
        throw new Error("Verification request not found");
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

  async rejectVerificationRequest(
    id: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    // Start transaction to update both tables atomically
    await db.transaction(async (tx: any) => {
      // Update verification request status
      const [request] = await tx
        .update(verificationRequests)
        .set({
          status: "rejected",
          reviewedAt: new Date(),
          reviewerId,
          rejectionReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.id, id))
        .returning();

      if (!request) {
        throw new Error("Verification request not found");
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

  async setRestaurantVerified(
    restaurantId: string,
    isVerified: boolean
  ): Promise<void> {
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
          eq(verificationRequests.status, "pending")
        )
      )
      .limit(1);
    return !!request;
  }

  // Deal view tracking operations
  async recordDealView(view: InsertDealView): Promise<DealView> {
    const [newView] = await db.insert(dealViews).values(view).returning();
    return newView;
  }

  async getDealViewsCount(
    dealId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<number> {
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

  async hasRecentDealView(
    dealId: string,
    userId?: string,
    sessionId?: string,
    timeWindowMs: number = 3600000
  ): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    const conditions = [
      eq(dealViews.dealId, dealId),
      gte(dealViews.viewedAt, cutoffTime),
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
  async markClaimAsUsed(
    claimId: string,
    orderAmount?: number | null
  ): Promise<DealClaim | null> {
    const [claim] = await db
      .update(dealClaims)
      .set({
        isUsed: true,
        usedAt: new Date(),
        orderAmount: orderAmount == null ? null : orderAmount.toString(),
      })
      .where(and(eq(dealClaims.id, claimId), eq(dealClaims.isUsed, false)))
      .returning();
    return claim || null;
  }

  async verifyRestaurantOwnershipByClaim(
    claimId: string,
    userId: string
  ): Promise<boolean> {
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
  async getRestaurantAnalyticsSummary(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));

    const dealIdArray = dealIds.map((d: any) => d.id);

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
        revenue: sql<number>`coalesce(sum(cast(order_amount as decimal)), 0)`,
      })
      .from(dealClaims)
      .where(and(...claimConditions, eq(dealClaims.isUsed, true)));

    const totalViews = viewsResult.count || 0;
    const totalClaims = claimsResult.count || 0;
    const totalRevenue = claimsResult.revenue || 0;
    const conversionRate =
      totalViews > 0 ? (totalClaims / totalViews) * 100 : 0;

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
      .leftJoin(
        dealClaims,
        and(eq(deals.id, dealClaims.dealId), eq(dealClaims.isUsed, true))
      )
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

  async getRestaurantAnalyticsTimeseries(
    restaurantId: string,
    dateRange: { start: Date; end: Date },
    interval: "day" | "week"
  ) {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));

    const dealIdArray = dealIds.map((d: any) => d.id);

    if (dealIdArray.length === 0) {
      return [];
    }

    const dateFormat = interval === "day" ? "YYYY-MM-DD" : 'YYYY-"W"WW';

    const timeseries = await db
      .select({
        date: sql<string>`to_char(${dealViews.viewedAt}, '${dateFormat}')`,
        views: sql<number>`count(distinct ${dealViews.id})`,
        claims: sql<number>`count(distinct ${dealClaims.id})`,
        revenue: sql<number>`coalesce(sum(cast(${dealClaims.orderAmount} as decimal)), 0)`,
      })
      .from(dealViews)
      .leftJoin(
        dealClaims,
        and(
          eq(dealViews.dealId, dealClaims.dealId),
          eq(dealClaims.isUsed, true),
          gte(dealClaims.claimedAt, dateRange.start),
          lte(dealClaims.claimedAt, dateRange.end)
        )
      )
      .where(
        and(
          inArray(dealViews.dealId, dealIdArray),
          gte(dealViews.viewedAt, dateRange.start),
          lte(dealViews.viewedAt, dateRange.end)
        )
      )
      .groupBy(sql`to_char(${dealViews.viewedAt}, '${dateFormat}')`)
      .orderBy(sql`to_char(${dealViews.viewedAt}, '${dateFormat}')`);

    return timeseries;
  }

  async getRestaurantCustomerInsights(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    const dealIds = await db
      .select({ id: deals.id })
      .from(deals)
      .where(eq(deals.restaurantId, restaurantId));

    const dealIdArray = dealIds.map((d: any) => d.id);

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

    const conditions = [
      inArray(dealClaims.dealId, dealIdArray),
      eq(dealClaims.isUsed, true),
    ];

    if (dateRange) {
      conditions.push(gte(dealClaims.usedAt, dateRange.start));
      conditions.push(lte(dealClaims.usedAt, dateRange.end));
    }

    // Get repeat customers
    const [repeatResult] = await db.select({
      count: sql<number>`count(distinct user_id) filter (where claim_count > 1)`,
    }).from(sql`(
        select user_id, count(*) as claim_count
        from ${dealClaims}
        where ${and(...conditions)}
        group by user_id
      ) as user_claims`);

    // Get average order value
    const [avgResult] = await db
      .select({
        avg: sql<number>`avg(cast(order_amount as decimal))`,
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
      .where(and(...conditions)).groupBy(sql`
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

  async getRestaurantAnalyticsExport(
    restaurantId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const exportData = await db
      .select({
        dealTitle: deals.title,
        date: sql<string>`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`,
        views: sql<number>`count(distinct ${dealViews.id})`,
        claims: sql<number>`count(distinct ${dealClaims.id})`,
        revenue: sql<number>`coalesce(sum(cast(${dealClaims.orderAmount} as decimal)), 0)`,
      })
      .from(deals)
      .leftJoin(
        dealViews,
        and(
          eq(deals.id, dealViews.dealId),
          gte(dealViews.viewedAt, dateRange.start),
          lte(dealViews.viewedAt, dateRange.end)
        )
      )
      .leftJoin(
        dealClaims,
        and(
          eq(deals.id, dealClaims.dealId),
          eq(dealClaims.isUsed, true),
          gte(dealClaims.usedAt, dateRange.start),
          lte(dealClaims.usedAt, dateRange.end)
        )
      )
      .where(eq(deals.restaurantId, restaurantId))
      .groupBy(
        deals.id,
        deals.title,
        sql`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`
      )
      .orderBy(deals.title, sql`to_char(${dealViews.viewedAt}, 'YYYY-MM-DD')`);

    return exportData;
  }

  // Food truck operations
  async setRestaurantMobileSettings(
    restaurantId: string,
    settings: UpdateRestaurantMobileSettings
  ): Promise<Restaurant> {
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

  async updateRestaurantLocation(
    restaurantId: string,
    location: UpdateRestaurantLocation
  ): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({
        currentLatitude: location.latitude.toString(),
        currentLongitude: location.longitude.toString(),
        mobileOnline: location.mobileOnline,
        lastBroadcastAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId))
      .returning();
    return restaurant;
  }

  async setRestaurantOperatingHours(
    restaurantId: string,
    operatingHours: OperatingHours
  ): Promise<Restaurant> {
    const [restaurant] = await db
      .update(restaurants)
      .set({
        operatingHours: operatingHours as any, // JSONB field
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId))
      .returning();
    return restaurant;
  }

  async isRestaurantOpenNow(restaurantId: string): Promise<boolean> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (!restaurant || !restaurant.operatingHours) {
      return true; // Default to open if no hours set
    }

    const now = new Date();
    const currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
      now.getDay()
    ];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

    const todayHours = (restaurant.operatingHours as any)?.[currentDay];
    if (!todayHours || !Array.isArray(todayHours) || todayHours.length === 0) {
      return false; // Closed if no hours for today
    }

    // Check if current time falls within any of today's time slots
    for (const timeSlot of todayHours) {
      const [openHours, openMinutes] = timeSlot.open.split(":").map(Number);
      const [closeHours, closeMinutes] = timeSlot.close.split(":").map(Number);
      const openTime = openHours * 60 + openMinutes;
      const closeTime = closeHours * 60 + closeMinutes;

      // Handle overnight hours (close time is next day)
      if (closeTime < openTime) {
        // Overnight hours: open until midnight OR after midnight until close
        if (currentTime >= openTime || currentTime < closeTime) {
          return true;
        }
      } else {
        // Regular hours: within the same day
        if (currentTime >= openTime && currentTime < closeTime) {
          return true;
        }
      }
    }

    return false; // Not within any time slot
  }

  // Helper method to filter deals by restaurant operating hours
  private async filterDealsByOperatingHours(deals: any[]): Promise<any[]> {
    if (deals.length === 0) return deals;

    // Get unique restaurant IDs to batch check operating hours
    const restaurantIds = Array.from(
      new Set(deals.map((deal) => deal.restaurantId))
    ).filter((id) => id != null);

    // Return early if no valid restaurant IDs
    if (restaurantIds.length === 0) return deals;

    // Batch fetch restaurants with operating hours
    const restaurantsWithHours = await db
      .select({
        id: restaurants.id,
        operatingHours: restaurants.operatingHours,
      })
      .from(restaurants)
      .where(inArray(restaurants.id, restaurantIds));

    // Create a map for quick lookup
    const restaurantHoursMap = new Map(
      restaurantsWithHours.map((r: any) => [r.id, r.operatingHours])
    );

    // Filter deals where restaurants are currently open
    const now = new Date();
    const currentDay = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
      now.getDay()
    ];
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return deals.filter((deal) => {
      const operatingHours = restaurantHoursMap.get(deal.restaurantId);

      // Default to open if no hours set
      if (!operatingHours) return true;

      const todayHours = (operatingHours as any)?.[currentDay];
      if (
        !todayHours ||
        !Array.isArray(todayHours) ||
        todayHours.length === 0
      ) {
        return false; // Closed if no hours for today
      }

      // Check if current time falls within any of today's time slots
      for (const timeSlot of todayHours) {
        const [openHours, openMinutes] = timeSlot.open.split(":").map(Number);
        const [closeHours, closeMinutes] = timeSlot.close
          .split(":")
          .map(Number);
        const openTime = openHours * 60 + openMinutes;
        const closeTime = closeHours * 60 + closeMinutes;

        // Handle overnight hours (close time is next day)
        if (closeTime < openTime) {
          if (currentTime >= openTime || currentTime < closeTime) {
            return true;
          }
        } else {
          // Regular hours: within the same day
          if (currentTime >= openTime && currentTime < closeTime) {
            return true;
          }
        }
      }

      return false; // Not within any time slot
    });
  }

  async startTruckSession(
    restaurantId: string,
    deviceId: string,
    userId: string
  ): Promise<FoodTruckSession> {
    // End any existing active session first
    await db
      .update(foodTruckSessions)
      .set({
        isActive: false,
        endedAt: new Date(),
      })
      .where(
        and(
          eq(foodTruckSessions.restaurantId, restaurantId),
          eq(foodTruckSessions.isActive, true)
        )
      );

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
      .where(
        and(
          eq(foodTruckSessions.restaurantId, restaurantId),
          eq(foodTruckSessions.startedByUserId, userId),
          eq(foodTruckSessions.isActive, true)
        )
      );

    // Update restaurant mobile status
    await db
      .update(restaurants)
      .set({
        mobileOnline: false,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));
  }

  async getActiveTruckSession(
    restaurantId: string
  ): Promise<FoodTruckSession | undefined> {
    const [session] = await db
      .select()
      .from(foodTruckSessions)
      .where(
        and(
          eq(foodTruckSessions.restaurantId, restaurantId),
          eq(foodTruckSessions.isActive, true)
        )
      )
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
      .where(
        and(
          eq(foodTruckLocations.restaurantId, restaurantId),
          gte(foodTruckLocations.recordedAt, cutoffTime)
        )
      )
      .orderBy(desc(foodTruckLocations.recordedAt))
      .limit(1);

    if (!recentLocation) return false;

    // Calculate distance using Haversine formula (simplified for short distances)
    const latDiff = Math.abs(parseFloat(recentLocation.latitude) - lat);
    const lngDiff = Math.abs(parseFloat(recentLocation.longitude) - lng);
    const distanceM = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111320; // Rough conversion to meters

    return distanceM < distanceThreshold;
  }

  async upsertLiveLocation(
    location: InsertFoodTruckLocation
  ): Promise<FoodTruckLocation> {
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
    const activeSession = await this.getActiveTruckSession(
      location.restaurantId
    );

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

  async getLiveTrucksNearby(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Array<Restaurant & { distance: number; sessionId?: string }>> {
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
        operatingHours: restaurants.operatingHours,
        isActive: restaurants.isActive,
        isVerified: restaurants.isVerified,
        createdAt: restaurants.createdAt,
        updatedAt: restaurants.updatedAt,
        sessionId: foodTruckSessions.id,
      })
      .from(restaurants)
      .leftJoin(
        foodTruckSessions,
        and(
          eq(restaurants.id, foodTruckSessions.restaurantId),
          eq(foodTruckSessions.isActive, true)
        )
      )
      .where(
        and(
          eq(restaurants.isFoodTruck, true),
          eq(restaurants.mobileOnline, true),
          eq(restaurants.isActive, true),
          sql`current_latitude IS NOT NULL`,
          sql`current_longitude IS NOT NULL`
        )
      );

    // Calculate distance in JavaScript for now (simpler than complex SQL)
    const trucksWithDistance = results.map((truck: any) => {
      if (!truck.currentLatitude || !truck.currentLongitude) {
        return {
          ...truck,
          distance: 999999,
          sessionId: truck.sessionId || undefined,
        };
      }

      const truckLat = parseFloat(truck.currentLatitude);
      const truckLng = parseFloat(truck.currentLongitude);

      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((truckLat - lat) * Math.PI) / 180;
      const dLng = ((truckLng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((truckLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        ...truck,
        distance,
        sessionId: truck.sessionId || undefined,
      };
    });

    // Filter by radius and sort by distance
    return trucksWithDistance
      .filter((truck: any) => truck.distance <= radiusKm)
      .sort((a: any, b: any) => a.distance - b.distance);
  }

  async getTruckLocationHistory(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<FoodTruckLocation[]> {
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
  async createRestaurantFavorite(favorite: {
    restaurantId: string;
    userId: string;
  }): Promise<RestaurantFavorite> {
    const [result] = await db
      .insert(restaurantFavorites)
      .values(favorite)
      .returning();
    return result;
  }

  async removeRestaurantFavorite(
    restaurantId: string,
    userId: string
  ): Promise<void> {
    await db
      .delete(restaurantFavorites)
      .where(
        and(
          eq(restaurantFavorites.restaurantId, restaurantId),
          eq(restaurantFavorites.userId, userId)
        )
      );
  }

  async getUserRestaurantFavorites(
    userId: string
  ): Promise<(RestaurantFavorite & { restaurant: Restaurant })[]> {
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
      .innerJoin(
        restaurants,
        eq(restaurantFavorites.restaurantId, restaurants.id)
      )
      .where(eq(restaurantFavorites.userId, userId))
      .orderBy(desc(restaurantFavorites.favoritedAt));

    return result;
  }

  async getRestaurantFavoritesAnalytics(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    let favorites;
    if (dateRange) {
      favorites = await db
        .select({
          id: restaurantFavorites.id,
          favoritedAt: restaurantFavorites.favoritedAt,
          userId: restaurantFavorites.userId,
        })
        .from(restaurantFavorites)
        .where(
          and(
            eq(restaurantFavorites.restaurantId, restaurantId),
            gte(restaurantFavorites.favoritedAt, dateRange.start),
            lte(restaurantFavorites.favoritedAt, dateRange.end)
          )
        );
    } else {
      favorites = await db
        .select({
          id: restaurantFavorites.id,
          favoritedAt: restaurantFavorites.favoritedAt,
          userId: restaurantFavorites.userId,
        })
        .from(restaurantFavorites)
        .where(eq(restaurantFavorites.restaurantId, restaurantId));
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
      recentFavorites: favorites
        .slice(0, 10)
        .map((f: { userId: string; favoritedAt: Date | null }) => ({
          userId: f.userId,
          favoritedAt: f.favoritedAt || new Date(),
        })),
    };
  }

  // Restaurant recommendations operations
  async trackRestaurantRecommendation(recommendation: {
    restaurantId: string;
    userId?: string;
    sessionId: string;
    recommendationType: "homepage" | "search" | "nearby" | "personalized";
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

  async getRestaurantRecommendationsAnalytics(
    restaurantId: string,
    dateRange?: { start: Date; end: Date }
  ) {
    let recommendations;
    if (dateRange) {
      recommendations = await db
        .select({
          id: restaurantRecommendations.id,
          recommendationType: restaurantRecommendations.recommendationType,
          isClicked: restaurantRecommendations.isClicked,
          showedAt: restaurantRecommendations.showedAt,
          clickedAt: restaurantRecommendations.clickedAt,
        })
        .from(restaurantRecommendations)
        .where(
          and(
            eq(restaurantRecommendations.restaurantId, restaurantId),
            gte(restaurantRecommendations.showedAt, dateRange.start),
            lte(restaurantRecommendations.showedAt, dateRange.end)
          )
        );
    } else {
      recommendations = await db
        .select({
          id: restaurantRecommendations.id,
          recommendationType: restaurantRecommendations.recommendationType,
          isClicked: restaurantRecommendations.isClicked,
          showedAt: restaurantRecommendations.showedAt,
          clickedAt: restaurantRecommendations.clickedAt,
        })
        .from(restaurantRecommendations)
        .where(eq(restaurantRecommendations.restaurantId, restaurantId));
    }

    const totalClicks = recommendations.filter(
      (r: { isClicked: boolean | null }) => r.isClicked === true
    ).length;
    const clickThroughRate =
      recommendations.length > 0
        ? (totalClicks / recommendations.length) * 100
        : 0;

    // Group by recommendation type
    const recommendationsByType = recommendations.reduce(
      (
        acc: Array<{ type: string; count: number; clicks: number }>,
        rec: { recommendationType: string; isClicked: boolean | null }
      ) => {
        const existing = acc.find(
          (item: { type: string }) => item.type === rec.recommendationType
        );
        if (existing) {
          existing.count++;
          if (rec.isClicked === true) existing.clicks++;
        } else {
          acc.push({
            type: rec.recommendationType,
            count: 1,
            clicks: rec.isClicked === true ? 1 : 0,
          });
        }
        return acc;
      },
      [] as Array<{ type: string; count: number; clicks: number }>
    );

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

  // Host location request operations
  async createLocationRequest(
    request: InsertLocationRequest
  ): Promise<LocationRequest> {
    const payload = {
      ...request,
      status: "open",
      notes: request.notes?.trim() || null,
    };

    await this.expireStaleLocationRequests();

    const [created] = await db
      .insert(locationRequests)
      .values(payload)
      .returning();

    return created;
  }

  async getLocationRequestById(
    id: string
  ): Promise<LocationRequest | undefined> {
    const [request] = await db
      .select()
      .from(locationRequests)
      .where(eq(locationRequests.id, id));
    return request;
  }

  async expireStaleLocationRequests(): Promise<number> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .update(locationRequests)
      .set({ status: "expired" })
      .where(
        and(
          eq(locationRequests.status, "open"),
          lte(locationRequests.createdAt, cutoff)
        )
      );
    return result.rowCount || 0;
  }

  async createTruckInterest(
    interest: InsertTruckInterest
  ): Promise<{ interestId: string; locationRequest: LocationRequest }> {
    await this.expireStaleLocationRequests();

    const locationRequest = await this.getLocationRequestById(
      interest.locationRequestId
    );
    if (!locationRequest) {
      throw new Error("Location request not found");
    }
    if (locationRequest.status !== "open") {
      throw new Error("Location request is not open");
    }

    const [created] = await db
      .insert(truckInterests)
      .values({
        ...interest,
        message: interest.message?.trim() || null,
      })
      .returning({ id: truckInterests.id });

    return { interestId: created.id, locationRequest };
  }

  // User address operations
  async createUserAddress(address: InsertUserAddress): Promise<UserAddress> {
    const addressData: any = { ...address };

    // Convert numeric latitude/longitude to strings if present
    if (typeof addressData.latitude === "number") {
      addressData.latitude = addressData.latitude.toString();
    }
    if (typeof addressData.longitude === "number") {
      addressData.longitude = addressData.longitude.toString();
    }

    const [createdAddress] = await db
      .insert(userAddresses)
      .values([addressData])
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

  async updateUserAddress(
    id: string,
    address: Partial<InsertUserAddress>
  ): Promise<UserAddress> {
    const updateData: any = {
      ...address,
      updatedAt: new Date(),
    };

    // Convert numeric latitude/longitude to strings if present
    if (typeof updateData.latitude === "number") {
      updateData.latitude = updateData.latitude.toString();
    }
    if (typeof updateData.longitude === "number") {
      updateData.longitude = updateData.longitude.toString();
    }

    const [updatedAddress] = await db
      .update(userAddresses)
      .set(updateData)
      .where(eq(userAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteUserAddress(id: string): Promise<void> {
    await db.delete(userAddresses).where(eq(userAddresses.id, id));
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Use transaction to prevent race conditions where multiple addresses could be set as default
    await db.transaction(async (tx: any) => {
      // First, unset all default addresses for the user
      await tx
        .update(userAddresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(userAddresses.userId, userId));

      // Then set the specified address as default
      await tx
        .update(userAddresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(
          and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId))
        );
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Password reset token operations
  async createPasswordResetToken(
    tokenData: InsertPasswordResetToken
  ): Promise<PasswordResetToken> {
    const [token] = await db
      .insert(passwordResetTokens)
      .values(tokenData)
      .returning();
    return token;
  }

  async getPasswordResetToken(
    id: string
  ): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.id, id));
    return token;
  }

  async getPasswordResetTokenByTokenHash(
    tokenHash: string
  ): Promise<PasswordResetToken | undefined> {
    const [token] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gte(passwordResetTokens.expiresAt, new Date()),
          isNull(passwordResetTokens.usedAt)
        )
      );
    return token;
  }

  async markPasswordResetTokenUsed(id: string): Promise<PasswordResetToken> {
    const [token] = await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id))
      .returning();
    return token;
  }

  async deleteUserResetTokens(userId: string): Promise<void> {
    // Only delete expired or already used tokens to preserve valid ones
    const now = new Date();
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          or(
            lte(passwordResetTokens.expiresAt, now),
            isNotNull(passwordResetTokens.usedAt)
          )
        )
      );
  }

  async deleteExpiredResetTokens(): Promise<number> {
    const result = await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, new Date()));

    // Return the number of deleted rows
    return result.rowCount || 0;
  }

  // API Key operations
  async getActiveApiKeys(): Promise<any[]> {
    // Get all active, non-expired API keys
    const keys = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.isActive, true),
          or(isNull(apiKeys.expiresAt), gte(apiKeys.expiresAt, new Date()))
        )
      );
    return keys;
  }

  async updateApiKeyLastUsed(keyId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyId));
  }

  // Deal feedback operations
  async createDealFeedback(
    feedback: InsertDealFeedback
  ): Promise<DealFeedback> {
    const [createdFeedback] = await db
      .insert(dealFeedback)
      .values(feedback)
      .returning();
    return createdFeedback;
  }

  async getDealFeedback(dealId: string): Promise<DealFeedback[]> {
    return await db
      .select()
      .from(dealFeedback)
      .where(eq(dealFeedback.dealId, dealId))
      .orderBy(desc(dealFeedback.createdAt));
  }

  async getUserDealFeedback(userId: string): Promise<DealFeedback[]> {
    return await db
      .select()
      .from(dealFeedback)
      .where(eq(dealFeedback.userId, userId))
      .orderBy(desc(dealFeedback.createdAt));
  }

  async getDealAverageRating(dealId: string): Promise<number> {
    const result = await db
      .select({
        avgRating: sql<number>`AVG(${dealFeedback.rating})`,
      })
      .from(dealFeedback)
      .where(eq(dealFeedback.dealId, dealId));

    return result[0]?.avgRating || 0;
  }

  async getDealFeedbackStats(dealId: string): Promise<{
    averageRating: number;
    totalFeedback: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const feedback = await db
      .select()
      .from(dealFeedback)
      .where(eq(dealFeedback.dealId, dealId));

    const totalFeedback = feedback.length;
    const averageRating =
      totalFeedback > 0
        ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) /
          totalFeedback
        : 0;

    const ratingDistribution: { [key: number]: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    feedback.forEach((f: any) => {
      if (f.rating >= 1 && f.rating <= 5) {
        ratingDistribution[f.rating] = (ratingDistribution[f.rating] || 0) + 1;
      }
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedback,
      ratingDistribution,
    };
  }

  // ============================================
  // Staff Management Functions
  // ============================================

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.userType, role))
      .orderBy(desc(users.createdAt));
  }

  async createUserWithPassword(data: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    userType: "customer" | "restaurant_owner";
    passwordHash: string;
    mustResetPassword: boolean;
  }): Promise<{ userId: string }> {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userType: data.userType,
        passwordHash: data.passwordHash,
        mustResetPassword: data.mustResetPassword,
        emailVerified: false,
      })
      .returning();

    return { userId: user.id };
  }

  async updateUserPassword(
    userId: string,
    passwordHash: string,
    mustResetPassword: boolean
  ): Promise<void> {
    await db
      .update(users)
      .set({
        passwordHash,
        mustResetPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async disableUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isDisabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async enableUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isDisabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // ============================================
  // LISA Phase 4A: Claim Persistence
  // ============================================

  /**
   * emitClaim - Write-only fact recording
   *
   * Records an immutable observation about what happened in the system.
   * NO scoring, NO ranking, NO automation.
   *
   * Claims are facts, not conclusions.
   * Claims never mutate authority or user state.
   */
  async emitClaim(claim: {
    subjectType: string;
    subjectId: string;
    actorType?: string;
    actorId?: string;
    app: "mealscout" | "tradescout";
    claimType: LisaClaimType | string;
    claimValue: Record<string, any>;
    source: LisaClaimSource | string;
    confidence?: number;
  }): Promise<void> {
    try {
      await db.insert(lisaClaims).values({
        subjectType: claim.subjectType,
        subjectId: claim.subjectId,
        actorType: claim.actorType || null,
        actorId: claim.actorId || null,
        app: claim.app,
        claimType: claim.claimType,
        claimValue: claim.claimValue,
        source: claim.source,
        confidence: claim.confidence?.toString() || "1.0",
      });

      console.log("✅ LISA claim emitted:", {
        claimType: claim.claimType,
        app: claim.app,
        subjectType: claim.subjectType,
        subjectId: claim.subjectId,
      });
    } catch (error) {
      // Claim recording failures should NOT block business operations
      console.error("❌ LISA claim emission failed (non-blocking):", error);
    }
  }

  /**
   * getClaims - Read-only claim retrieval
   *
   * Filters claims by subject, actor, app, type, or time window.
   * Used for debugging and future deterministic resolution (Phase 4B+).
   *
   * NOT used for runtime decision-making yet.
   */
  async getClaims(filters: {
    subjectType?: string;
    subjectId?: string;
    actorType?: string;
    actorId?: string;
    app?: "mealscout" | "tradescout";
    claimType?: LisaClaimType | string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<LisaClaim[]> {
    let query = db.select().from(lisaClaims);

    const conditions = [];

    if (filters.subjectType) {
      conditions.push(eq(lisaClaims.subjectType, filters.subjectType));
    }
    if (filters.subjectId) {
      conditions.push(eq(lisaClaims.subjectId, filters.subjectId));
    }
    if (filters.actorType) {
      conditions.push(eq(lisaClaims.actorType, filters.actorType));
    }
    if (filters.actorId) {
      conditions.push(eq(lisaClaims.actorId, filters.actorId));
    }
    if (filters.app) {
      conditions.push(eq(lisaClaims.app, filters.app));
    }
    if (filters.claimType) {
      conditions.push(eq(lisaClaims.claimType, filters.claimType));
    }
    if (filters.startDate) {
      conditions.push(gte(lisaClaims.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(lisaClaims.createdAt, filters.endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    query = query.orderBy(desc(lisaClaims.createdAt)) as any;

    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
