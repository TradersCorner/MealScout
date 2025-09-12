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
  cuisineType: varchar("cuisine_type"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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
  isFeatured: boolean("is_featured").default(false),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  dealClaims: many(dealClaims),
  reviews: many(reviews),
  dealViews: many(dealViews),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  deals: many(deals),
  reviews: many(reviews),
  verificationRequests: many(verificationRequests),
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
