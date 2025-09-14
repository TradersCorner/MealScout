import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table supporting multiple authentication methods
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userType: varchar("user_type").notNull().default("customer"), // 'customer' | 'restaurant_owner' | 'admin'
  // Facebook authentication (for regular users)
  facebookId: varchar("facebook_id").unique(),
  facebookAccessToken: text("facebook_access_token"),
  // Google authentication (for all users)
  googleId: varchar("google_id").unique(),
  googleAccessToken: text("google_access_token"),
  // Email/password authentication (for all users)
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false),
  // Common fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionBillingInterval: varchar("subscription_billing_interval"), // 'month' | '3-month' | 'year'
  // Optional demographics for aggregated analytics insights (privacy-conscious)
  birthYear: integer("birth_year"),
  gender: varchar("gender"), // 'male' | 'female' | 'other' | 'prefer_not_to_say'
  postalCode: varchar("postal_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  address: text("address").notNull(),
  phone: varchar("phone"),
  businessType: varchar("business_type").notNull().default("restaurant"), // 'restaurant' | 'bar' | 'food_truck'
  cuisineType: varchar("cuisine_type"),
  promoCode: varchar("promo_code"), // For tracking beta access and special offers
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  // Food truck specific fields
  isFoodTruck: boolean("is_food_truck").default(false),
  mobileOnline: boolean("mobile_online").default(false),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  lastBroadcastAt: timestamp("last_broadcast_at"),
  isActive: boolean("is_active").default(true),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  dealType: varchar("deal_type").notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 5, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 8, scale: 2 }),
  imageUrl: varchar("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  startTime: varchar("start_time").notNull(), // Format: "HH:MM"
  endTime: varchar("end_time").notNull(), // Format: "HH:MM"
  totalUsesLimit: integer("total_uses_limit"),
  perCustomerLimit: integer("per_customer_limit").default(1),
  currentUses: integer("current_uses").default(0),
  facebookPageUrl: varchar("facebook_page_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dealClaims = pgTable(
  "deal_claims",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dealId: varchar("deal_id").notNull().references(() => deals.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    claimedAt: timestamp("claimed_at").defaultNow(),
    usedAt: timestamp("used_at"),
    isUsed: boolean("is_used").default(false),
    orderAmount: decimal("order_amount", { precision: 10, scale: 2 }), // For revenue tracking
  },
  (table) => [
    index("IDX_deal_claims_deal_used").on(table.dealId, table.usedAt),
    index("IDX_deal_claims_deal_status").on(table.dealId, table.isUsed),
    index("IDX_deal_claims_user_claimed").on(table.userId, table.claimedAt),
  ],
);

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  status: varchar("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  documents: text("documents").array(), // Array of base64 data URLs or file paths
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal views table for tracking impressions and analytics
export const dealViews = pgTable(
  "deal_views",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dealId: varchar("deal_id").notNull().references(() => deals.id),
    userId: varchar("user_id").references(() => users.id), // Nullable for anonymous views
    sessionId: varchar("session_id").notNull(), // Track anonymous sessions
    viewedAt: timestamp("viewed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_deal_views_deal_viewed").on(table.dealId, table.viewedAt),
    index("IDX_deal_views_user_deal").on(table.userId, table.dealId),
    index("IDX_deal_views_session").on(table.sessionId),
  ],
);

// Restaurant favorites tracking
export const restaurantFavorites = pgTable(
  "restaurant_favorites",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    userId: varchar("user_id").notNull().references(() => users.id),
    favoritedAt: timestamp("favorited_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_restaurant_favorites_restaurant").on(table.restaurantId, table.favoritedAt.desc()),
    index("IDX_restaurant_favorites_user").on(table.userId, table.favoritedAt.desc()),
    index("IDX_restaurant_favorites_unique").on(table.restaurantId, table.userId),
  ],
);

// Restaurant recommendations tracking - when a restaurant appears in recommendation feeds
export const restaurantRecommendations = pgTable(
  "restaurant_recommendations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    userId: varchar("user_id").references(() => users.id), // Nullable for anonymous users
    sessionId: varchar("session_id").notNull(), // Track anonymous sessions
    recommendationType: varchar("recommendation_type").notNull(), // 'homepage' | 'search' | 'nearby' | 'personalized'
    recommendationContext: text("recommendation_context"), // Additional context like search query, location, etc.
    isClicked: boolean("is_clicked").default(false),
    clickedAt: timestamp("clicked_at"),
    showedAt: timestamp("showed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_restaurant_recommendations_restaurant").on(table.restaurantId, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_user").on(table.userId, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_session").on(table.sessionId),
    index("IDX_restaurant_recommendations_type").on(table.recommendationType, table.showedAt.desc()),
    index("IDX_restaurant_recommendations_clicked").on(table.isClicked, table.clickedAt),
  ],
);

// Food truck session management
export const foodTruckSessions = pgTable(
  "food_truck_sessions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    startedAt: timestamp("started_at").defaultNow(),
    endedAt: timestamp("ended_at"),
    deviceId: varchar("device_id").notNull(),
    startedByUserId: varchar("started_by_user_id").notNull().references(() => users.id),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_food_truck_sessions_restaurant").on(table.restaurantId),
    index("IDX_food_truck_sessions_active").on(table.isActive, table.startedAt),
  ],
);

// Food truck location history for tracking and analytics
export const foodTruckLocations = pgTable(
  "food_truck_locations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
    sessionId: varchar("session_id").references(() => foodTruckSessions.id),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    heading: decimal("heading", { precision: 5, scale: 2 }), // 0-360 degrees
    speed: decimal("speed", { precision: 5, scale: 2 }), // km/h
    accuracy: decimal("accuracy", { precision: 8, scale: 2 }), // meters
    source: varchar("source").default("gps"), // 'gps' | 'network' | 'manual'
    recordedAt: timestamp("recorded_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_food_truck_locations_restaurant_time").on(table.restaurantId, table.recordedAt.desc()),
    index("IDX_food_truck_locations_time").on(table.recordedAt.desc()),
    index("IDX_food_truck_locations_geo").on(table.restaurantId, table.latitude, table.longitude),
    index("IDX_food_truck_locations_session").on(table.sessionId),
  ],
);

// User addresses for saved locations
export const userAddresses = pgTable(
  "user_addresses",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: varchar("type").notNull(), // 'home' | 'work' | 'other'
    label: varchar("label").notNull(),
    address: text("address").notNull(),
    city: varchar("city").notNull(),
    state: varchar("state"),
    postalCode: varchar("postal_code"),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("IDX_user_addresses_user").on(table.userId, table.createdAt.desc()),
    index("IDX_user_addresses_type").on(table.userId, table.type),
    index("IDX_user_addresses_default").on(table.userId, table.isDefault),
  ],
);

// Password reset tokens for secure password reset functionality
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text("token_hash").notNull(), // Store hashed token for security
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"), // Nullable - set when token is used
    requestIp: varchar("request_ip"), // Track IP for security auditing
    userAgent: varchar("user_agent"), // Track user agent for security auditing
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("IDX_password_reset_tokens_user").on(table.userId, table.createdAt.desc()),
    index("IDX_password_reset_tokens_token").on(table.tokenHash),
    index("IDX_password_reset_tokens_expires").on(table.expiresAt),
    index("IDX_password_reset_tokens_used").on(table.usedAt),
  ],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  dealClaims: many(dealClaims),
  reviews: many(reviews),
  dealViews: many(dealViews),
  restaurantFavorites: many(restaurantFavorites),
  restaurantRecommendations: many(restaurantRecommendations),
  addresses: many(userAddresses),
  passwordResetTokens: many(passwordResetTokens),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  deals: many(deals),
  reviews: many(reviews),
  verificationRequests: many(verificationRequests),
  foodTruckSessions: many(foodTruckSessions),
  foodTruckLocations: many(foodTruckLocations),
  favorites: many(restaurantFavorites),
  recommendations: many(restaurantRecommendations),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [deals.restaurantId],
    references: [restaurants.id],
  }),
  claims: many(dealClaims),
  views: many(dealViews),
}));

export const dealClaimsRelations = relations(dealClaims, ({ one }) => ({
  deal: one(deals, {
    fields: [dealClaims.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealClaims.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reviews.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [verificationRequests.restaurantId],
    references: [restaurants.id],
  }),
  reviewer: one(users, {
    fields: [verificationRequests.reviewerId],
    references: [users.id],
  }),
}));

export const dealViewsRelations = relations(dealViews, ({ one }) => ({
  deal: one(deals, {
    fields: [dealViews.dealId],
    references: [deals.id],
  }),
  user: one(users, {
    fields: [dealViews.userId],
    references: [users.id],
  }),
}));

export const foodTruckSessionsRelations = relations(foodTruckSessions, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [foodTruckSessions.restaurantId],
    references: [restaurants.id],
  }),
  startedByUser: one(users, {
    fields: [foodTruckSessions.startedByUserId],
    references: [users.id],
  }),
  locations: many(foodTruckLocations),
}));

export const foodTruckLocationsRelations = relations(foodTruckLocations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [foodTruckLocations.restaurantId],
    references: [restaurants.id],
  }),
  session: one(foodTruckSessions, {
    fields: [foodTruckLocations.sessionId],
    references: [foodTruckSessions.id],
  }),
}));

export const restaurantFavoritesRelations = relations(restaurantFavorites, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantFavorites.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantFavorites.userId],
    references: [users.id],
  }),
}));

export const restaurantRecommendationsRelations = relations(restaurantRecommendations, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [restaurantRecommendations.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [restaurantRecommendations.userId],
    references: [users.id],
  }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealClaimSchema = createInsertSchema(dealClaims).omit({
  id: true,
  claimedAt: true,
  usedAt: true,
  isUsed: true,
  orderAmount: true,
});

export const insertDealViewSchema = createInsertSchema(dealViews).omit({
  id: true,
  viewedAt: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewerId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  documents: z.array(z.string().url())
    .min(1, "At least one document is required")
    .max(5, "Maximum 5 documents allowed")
    .refine(
      (docs) => docs.every(doc => doc.startsWith("data:")), 
      "Documents must be valid base64 data URLs"
    )
});

export const insertFoodTruckSessionSchema = createInsertSchema(foodTruckSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
  isActive: true,
  createdAt: true,
});

export const insertFoodTruckLocationSchema = createInsertSchema(foodTruckLocations).omit({
  id: true,
  recordedAt: true,
  createdAt: true,
}).extend({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).max(200).optional(), // Max 200 km/h
  accuracy: z.number().min(0).max(10000).optional(), // Max 10km accuracy
});

export const updateRestaurantMobileSettingsSchema = z.object({
  isFoodTruck: z.boolean().optional(),
  mobileOnline: z.boolean().optional(),
});

export const insertRestaurantFavoriteSchema = createInsertSchema(restaurantFavorites).omit({
  id: true,
  favoritedAt: true,
  createdAt: true,
});

export const insertRestaurantRecommendationSchema = createInsertSchema(restaurantRecommendations).omit({
  id: true,
  showedAt: true,
  createdAt: true,
}).extend({
  recommendationType: z.enum(['homepage', 'search', 'nearby', 'personalized']),
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  type: z.enum(['home', 'work', 'other']),
  label: z.string().min(1, "Label is required").max(50, "Label must be less than 50 characters"),
  address: z.string().min(1, "Address is required").max(500, "Address must be less than 500 characters"),
  city: z.string().min(1, "City is required").max(100, "City must be less than 100 characters"),
  state: z.string().max(50, "State must be less than 50 characters").optional(),
  postalCode: z.string().max(20, "Postal code must be less than 20 characters").optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  usedAt: true,
  createdAt: true,
}).extend({
  tokenHash: z.string().min(1, "Token hash is required"),
  expiresAt: z.date().refine((date) => date > new Date(), "Expiry date must be in the future"),
  requestIp: z.string().ip().optional(),
  userAgent: z.string().max(500, "User agent must be less than 500 characters").optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User-specific data types
export type FacebookUserData = {
  facebookId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  facebookAccessToken?: string | null;
};

export type GoogleUserData = {
  googleId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  googleAccessToken?: string | null;
};

export type EmailUserData = {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
};
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDealClaim = z.infer<typeof insertDealClaimSchema>;
export type DealClaim = typeof dealClaims.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;

export type InsertDealView = z.infer<typeof insertDealViewSchema>;
export type DealView = typeof dealViews.$inferSelect;

export type InsertFoodTruckSession = z.infer<typeof insertFoodTruckSessionSchema>;
export type FoodTruckSession = typeof foodTruckSessions.$inferSelect;

export type InsertFoodTruckLocation = z.infer<typeof insertFoodTruckLocationSchema>;
export type FoodTruckLocation = typeof foodTruckLocations.$inferSelect;

export type UpdateRestaurantMobileSettings = z.infer<typeof updateRestaurantMobileSettingsSchema>;

export type InsertRestaurantFavorite = z.infer<typeof insertRestaurantFavoriteSchema>;
export type RestaurantFavorite = typeof restaurantFavorites.$inferSelect;

export type InsertRestaurantRecommendation = z.infer<typeof insertRestaurantRecommendationSchema>;
export type RestaurantRecommendation = typeof restaurantRecommendations.$inferSelect;

export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
