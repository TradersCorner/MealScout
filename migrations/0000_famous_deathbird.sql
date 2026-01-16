CREATE TABLE "affiliate_clicks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_link_id" varchar NOT NULL,
	"visitor_ip" varchar,
	"visitor_user_agent" text,
	"referrer_source" varchar,
	"clicked_at" timestamp DEFAULT now(),
	"converted_at" timestamp,
	"restaurant_signup_id" varchar,
	"session_id" varchar
);
--> statement-breakpoint
CREATE TABLE "affiliate_commission_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" varchar NOT NULL,
	"referral_id" varchar,
	"restaurant_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"commission_source" varchar NOT NULL,
	"stripe_invoice_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate_commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" varchar NOT NULL,
	"restaurant_user_id" varchar NOT NULL,
	"affiliate_link_id" varchar,
	"commission_amount" numeric(10, 2) NOT NULL,
	"commission_percent" integer NOT NULL,
	"based_on" varchar NOT NULL,
	"subscription_value" numeric(10, 2),
	"billing_cycle" varchar NOT NULL,
	"for_month" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" varchar NOT NULL,
	"code" varchar NOT NULL,
	"resource_type" varchar NOT NULL,
	"resource_id" varchar,
	"source_url" text NOT NULL,
	"full_url" text NOT NULL,
	"click_count" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_links_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "affiliate_wallet" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_earned" numeric(12, 2) DEFAULT '0',
	"available_balance" numeric(12, 2) DEFAULT '0',
	"pending_commissions" numeric(12, 2) DEFAULT '0',
	"total_withdrawn" numeric(12, 2) DEFAULT '0',
	"total_spent" numeric(12, 2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "affiliate_wallet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_withdrawals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"method_details" jsonb,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(8),
	"scope" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "award_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"award_type" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"recipient_type" varchar NOT NULL,
	"award_period_start" timestamp NOT NULL,
	"award_period_end" timestamp NOT NULL,
	"ranking_score" integer NOT NULL,
	"rank_position" integer,
	"geographic_area" varchar,
	"metadata" jsonb,
	"awarded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" varchar NOT NULL,
	"claim_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"restaurant_id" varchar,
	"host_id" varchar,
	"event_id" varchar,
	"claim_data" jsonb DEFAULT '{}' NOT NULL,
	"verification_refs" text[],
	"verified_by" varchar,
	"verified_at" timestamp,
	"notes" text,
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source_type" varchar NOT NULL,
	"source_id" varchar,
	"redeemed_at" timestamp,
	"redeemed_for" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_claims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"claimed_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	"is_used" boolean DEFAULT false,
	"order_amount" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "deal_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"user_id" varchar,
	"rating" integer NOT NULL,
	"feedback_type" varchar NOT NULL,
	"comment" text,
	"is_helpful" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"viewed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"deal_type" varchar NOT NULL,
	"discount_value" numeric(5, 2) NOT NULL,
	"min_order_amount" numeric(8, 2),
	"image_url" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"start_time" varchar,
	"end_time" varchar,
	"available_during_business_hours" boolean DEFAULT false,
	"is_ongoing" boolean DEFAULT false,
	"total_uses_limit" integer,
	"per_customer_limit" integer DEFAULT 1,
	"current_uses" integer DEFAULT 0,
	"facebook_page_url" varchar,
	"is_active" boolean DEFAULT true,
	"is_ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_interests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar NOT NULL,
	"truck_id" varchar NOT NULL,
	"message" varchar(200),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_event_interests_event_truck" UNIQUE("event_id","truck_id")
);
--> statement-breakpoint
CREATE TABLE "event_series" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"timezone" varchar DEFAULT 'America/New_York' NOT NULL,
	"recurrence_rule" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"default_start_time" varchar NOT NULL,
	"default_end_time" varchar NOT NULL,
	"default_max_trucks" integer DEFAULT 1 NOT NULL,
	"default_hard_cap_enabled" boolean DEFAULT false,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"series_id" varchar,
	"name" varchar,
	"description" text,
	"date" timestamp NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"max_trucks" integer DEFAULT 1 NOT NULL,
	"status" varchar DEFAULT 'open' NOT NULL,
	"booked_restaurant_id" varchar,
	"hard_cap_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "featured_video_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"slot_number" integer NOT NULL,
	"current_video_id" varchar,
	"cycle_start_date" timestamp DEFAULT now(),
	"cycle_end_date" timestamp DEFAULT NOW() + INTERVAL '1 day',
	"previous_video_ids" text[] DEFAULT '{}',
	"engagement_score" numeric(5, 2) DEFAULT '0.00',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feed_ads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"media_url" text,
	"target_url" text NOT NULL,
	"cta_text" varchar DEFAULT 'Learn more',
	"is_house_ad" boolean DEFAULT false,
	"is_affiliate" boolean DEFAULT false,
	"affiliate_name" varchar,
	"priority" integer DEFAULT 0,
	"insertion_frequency" integer DEFAULT 5,
	"start_at" timestamp,
	"end_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_truck_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"session_id" varchar,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"heading" numeric(5, 2),
	"speed" numeric(5, 2),
	"accuracy" numeric(8, 2),
	"source" varchar DEFAULT 'gps',
	"recorded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "food_truck_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"device_id" varchar NOT NULL,
	"started_by_user_id" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "host_reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_id" varchar NOT NULL,
	"truck_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"traffic_rating" integer,
	"amenities_rating" integer,
	"host_communication_rating" integer,
	"would_return_again" boolean DEFAULT true,
	"is_approved" boolean DEFAULT true,
	"flagged_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_host_reviews_host_truck" UNIQUE("host_id","truck_id")
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"business_name" varchar NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"location_type" varchar NOT NULL,
	"expected_foot_traffic" integer,
	"amenities" jsonb,
	"contact_phone" varchar,
	"notes" text,
	"is_verified" boolean DEFAULT false,
	"admin_created" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image_uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by_user_id" varchar NOT NULL,
	"image_type" varchar NOT NULL,
	"entity_id" varchar,
	"entity_type" varchar,
	"cloudinary_public_id" varchar,
	"cloudinary_url" varchar NOT NULL,
	"thumbnail_url" varchar,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"mime_type" varchar,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"status" varchar DEFAULT 'new' NOT NULL,
	"user_id" varchar,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"acknowledged_at" timestamp,
	"acknowledged_by" varchar,
	"resolved_at" timestamp,
	"resolved_by" varchar,
	"closed_at" timestamp,
	"closed_by" varchar,
	"signature_hash" varchar
);
--> statement-breakpoint
CREATE TABLE "lisa_claim" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" varchar NOT NULL,
	"actor_type" text,
	"actor_id" varchar,
	"app" text NOT NULL,
	"claim_type" text NOT NULL,
	"claim_value" jsonb NOT NULL,
	"source" text NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "location_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posted_by_user_id" varchar NOT NULL,
	"business_name" varchar NOT NULL,
	"address" text NOT NULL,
	"location_type" varchar NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"preferred_dates" jsonb NOT NULL,
	"expected_foot_traffic" integer NOT NULL,
	"notes" text,
	"status" varchar DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "moderation_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar NOT NULL,
	"severity" varchar DEFAULT 'medium' NOT NULL,
	"reported_user_id" varchar,
	"reported_resource_type" varchar,
	"reported_resource_id" varchar,
	"reporter_user_id" varchar,
	"reason" varchar NOT NULL,
	"description" text,
	"metadata" jsonb,
	"status" varchar DEFAULT 'open',
	"action_taken" varchar,
	"reviewed_by_admin_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "oncall_rotation" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"request_ip" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" varchar NOT NULL,
	"url" text NOT NULL,
	"user_agent" text,
	"ip" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_user_id" varchar NOT NULL,
	"referred_restaurant_id" varchar,
	"clicked_at" timestamp NOT NULL,
	"signed_up_at" timestamp,
	"activated_at" timestamp,
	"commission_eligible_at" timestamp,
	"status" varchar DEFAULT 'clicked' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_credit_redemptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"credit_amount" numeric(10, 2) NOT NULL,
	"order_reference" varchar,
	"notes" text,
	"redeemed_at" timestamp DEFAULT now(),
	"settlement_status" varchar DEFAULT 'pending' NOT NULL,
	"settlement_batch_id" varchar,
	"dispute_until" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"favorited_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_recommendations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"recommendation_type" varchar NOT NULL,
	"recommendation_context" text,
	"is_clicked" boolean DEFAULT false,
	"clicked_at" timestamp,
	"showed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_settlement_batch" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"payout_date" timestamp,
	"status" varchar DEFAULT 'queued' NOT NULL,
	"stripe_payout_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurant_settlement_batch_batch_id_unique" UNIQUE("batch_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submitted_by_user_id" varchar,
	"restaurant_name" varchar NOT NULL,
	"address" text,
	"website" varchar,
	"phone_number" varchar,
	"category" varchar,
	"county" varchar,
	"state" varchar,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"description" text,
	"photo_url" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"converted_to_restaurant_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"tier" varchar DEFAULT 'free' NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"price_cents" integer DEFAULT 0,
	"billing_interval" varchar DEFAULT 'monthly',
	"next_billing_at" timestamp,
	"quarterly_trial_used" boolean DEFAULT false,
	"quarterly_trial_activated_at" timestamp,
	"is_lifetime_free" boolean DEFAULT false,
	"lifetime_granted_by" varchar,
	"lifetime_granted_at" timestamp,
	"lifetime_reason" text,
	"can_post_videos" boolean DEFAULT false,
	"can_post_deals" boolean DEFAULT false,
	"can_use_featured_slots" boolean DEFAULT false,
	"max_featured_slots" integer DEFAULT 0,
	"has_analytics" boolean DEFAULT false,
	"has_deal_scheduling" boolean DEFAULT false,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"address" text NOT NULL,
	"phone" varchar,
	"business_type" varchar DEFAULT 'restaurant' NOT NULL,
	"cuisine_type" varchar,
	"promo_code" varchar,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_food_truck" boolean DEFAULT false,
	"mobile_online" boolean DEFAULT false,
	"current_latitude" numeric(10, 8),
	"current_longitude" numeric(11, 8),
	"last_broadcast_at" timestamp,
	"operating_hours" jsonb,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"logo_url" varchar,
	"cover_image_url" varchar,
	"description" text,
	"website_url" varchar,
	"instagram_url" varchar,
	"facebook_page_url" varchar,
	"amenities" jsonb,
	"has_golden_plate" boolean DEFAULT false,
	"golden_plate_earned_at" timestamp,
	"golden_plate_count" integer DEFAULT 0,
	"ranking_score" integer DEFAULT 0,
	"locked_price_cents" integer,
	"price_lock_date" timestamp,
	"price_lock_reason" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"resource_type" varchar,
	"resource_id" varchar,
	"ip" varchar,
	"user_agent" varchar,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_awards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"award_type" varchar NOT NULL,
	"awarded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"parent_comment_id" varchar,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_approved" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "story_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "story_views" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"user_id" varchar,
	"viewed_at" timestamp DEFAULT now(),
	"watch_duration" integer
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar NOT NULL,
	"priority" varchar DEFAULT 'normal',
	"status" varchar DEFAULT 'open',
	"admin_notes" text,
	"assigned_to_admin_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by_admin_id" varchar
);
--> statement-breakpoint
CREATE TABLE "telemetry_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" varchar NOT NULL,
	"user_id" varchar,
	"properties" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "truck_interests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_request_id" varchar NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"label" varchar NOT NULL,
	"address" text NOT NULL,
	"city" varchar NOT NULL,
	"state" varchar,
	"postal_code" varchar,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_payout_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"method" varchar DEFAULT 'credit' NOT NULL,
	"stripe_connected_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_payout_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_reviewer_levels" (
	"user_id" varchar PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1,
	"total_favorites" integer DEFAULT 0,
	"total_stories" integer DEFAULT 0,
	"top_story_favorites" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_type" varchar DEFAULT 'customer' NOT NULL,
	"tradescout_id" varchar,
	"facebook_id" varchar,
	"facebook_access_token" text,
	"google_id" varchar,
	"google_access_token" text,
	"password_hash" text,
	"email_verified" boolean DEFAULT false,
	"must_reset_password" boolean DEFAULT false,
	"is_disabled" boolean DEFAULT false,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"phone" varchar,
	"profile_image_url" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_billing_interval" varchar,
	"subscription_signup_date" timestamp,
	"birth_year" integer,
	"gender" varchar,
	"postal_code" varchar,
	"has_golden_fork" boolean DEFAULT false,
	"golden_fork_earned_at" timestamp,
	"review_count" integer DEFAULT 0,
	"recommendation_count" integer DEFAULT 0,
	"influence_score" integer DEFAULT 0,
	"app_context" varchar DEFAULT 'mealscout',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_tradescout_id_unique" UNIQUE("tradescout_id"),
	CONSTRAINT "users_facebook_id_unique" UNIQUE("facebook_id"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"documents" text[],
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewer_id" varchar,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"restaurant_id" varchar,
	"title" varchar NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"status" varchar DEFAULT 'processing' NOT NULL,
	"view_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"comment_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"impression_count" integer DEFAULT 0,
	"engagement_score" numeric(5, 2) DEFAULT '0.00',
	"hashtags" text[] DEFAULT '{}',
	"cuisine" varchar,
	"transcript" text,
	"transcript_language" varchar DEFAULT 'en',
	"transcript_source" varchar,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '7 days',
	"deleted_at" timestamp,
	"is_featured" boolean DEFAULT false,
	"featured_slot_number" integer,
	"featured_started_at" timestamp,
	"featured_ended_at" timestamp,
	"is_approved" boolean DEFAULT true,
	"flag_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "video_story_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"reported_by_user_id" varchar NOT NULL,
	"reason" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"reviewed_by_admin_id" varchar,
	"reviewed_at" timestamp,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_restaurant_signup_id_users_id_fk" FOREIGN KEY ("restaurant_signup_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission_ledger" ADD CONSTRAINT "affiliate_commission_ledger_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission_ledger" ADD CONSTRAINT "affiliate_commission_ledger_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission_ledger" ADD CONSTRAINT "affiliate_commission_ledger_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_restaurant_user_id_users_id_fk" FOREIGN KEY ("restaurant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_link_id_affiliate_links_id_fk" FOREIGN KEY ("affiliate_link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_wallet" ADD CONSTRAINT "affiliate_wallet_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_withdrawals" ADD CONSTRAINT "affiliate_withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_claims" ADD CONSTRAINT "deal_claims_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_claims" ADD CONSTRAINT "deal_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_feedback" ADD CONSTRAINT "deal_feedback_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_feedback" ADD CONSTRAINT "deal_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_views" ADD CONSTRAINT "deal_views_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_views" ADD CONSTRAINT "deal_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_interests" ADD CONSTRAINT "event_interests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_interests" ADD CONSTRAINT "event_interests_truck_id_restaurants_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_series" ADD CONSTRAINT "event_series_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_series_id_event_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."event_series"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_booked_restaurant_id_restaurants_id_fk" FOREIGN KEY ("booked_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_video_slots" ADD CONSTRAINT "featured_video_slots_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_video_slots" ADD CONSTRAINT "featured_video_slots_current_video_id_video_stories_id_fk" FOREIGN KEY ("current_video_id") REFERENCES "public"."video_stories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_truck_locations" ADD CONSTRAINT "food_truck_locations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_truck_locations" ADD CONSTRAINT "food_truck_locations_session_id_food_truck_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."food_truck_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_truck_sessions" ADD CONSTRAINT "food_truck_sessions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_truck_sessions" ADD CONSTRAINT "food_truck_sessions_started_by_user_id_users_id_fk" FOREIGN KEY ("started_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_reviews" ADD CONSTRAINT "host_reviews_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_reviews" ADD CONSTRAINT "host_reviews_truck_id_restaurants_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_reviews" ADD CONSTRAINT "host_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_uploads" ADD CONSTRAINT "image_uploads_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_requests" ADD CONSTRAINT "location_requests_posted_by_user_id_users_id_fk" FOREIGN KEY ("posted_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oncall_rotation" ADD CONSTRAINT "oncall_rotation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_affiliate_user_id_users_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_restaurant_id_restaurants_id_fk" FOREIGN KEY ("referred_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_credit_redemptions" ADD CONSTRAINT "restaurant_credit_redemptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_credit_redemptions" ADD CONSTRAINT "restaurant_credit_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_favorites" ADD CONSTRAINT "restaurant_favorites_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_favorites" ADD CONSTRAINT "restaurant_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_recommendations" ADD CONSTRAINT "restaurant_recommendations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_recommendations" ADD CONSTRAINT "restaurant_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_submissions" ADD CONSTRAINT "restaurant_submissions_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_submissions" ADD CONSTRAINT "restaurant_submissions_converted_to_restaurant_id_restaurants_id_fk" FOREIGN KEY ("converted_to_restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_subscriptions" ADD CONSTRAINT "restaurant_subscriptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_awards" ADD CONSTRAINT "story_awards_story_id_video_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."video_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_story_id_video_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."video_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_comments" ADD CONSTRAINT "story_comments_parent_comment_id_story_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."story_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_story_id_video_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."video_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_video_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."video_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_admin_id_users_id_fk" FOREIGN KEY ("assigned_to_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_admin_id_users_id_fk" FOREIGN KEY ("resolved_by_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truck_interests" ADD CONSTRAINT "truck_interests_location_request_id_location_requests_id_fk" FOREIGN KEY ("location_request_id") REFERENCES "public"."location_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "truck_interests" ADD CONSTRAINT "truck_interests_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_payout_preferences" ADD CONSTRAINT "user_payout_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviewer_levels" ADD CONSTRAINT "user_reviewer_levels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stories" ADD CONSTRAINT "video_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stories" ADD CONSTRAINT "video_stories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_story_reports" ADD CONSTRAINT "video_story_reports_story_id_video_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."video_stories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_story_reports" ADD CONSTRAINT "video_story_reports_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_story_reports" ADD CONSTRAINT "video_story_reports_reviewed_by_admin_id_users_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_link" ON "affiliate_clicks" USING btree ("affiliate_link_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_session" ON "affiliate_clicks" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_created" ON "affiliate_clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "idx_commission_ledger_affiliate" ON "affiliate_commission_ledger" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_commission_ledger_referral" ON "affiliate_commission_ledger" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "idx_commission_ledger_created" ON "affiliate_commission_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_commissions_affiliate" ON "affiliate_commissions" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_restaurant" ON "affiliate_commissions" USING btree ("restaurant_user_id");--> statement-breakpoint
CREATE INDEX "idx_commissions_status" ON "affiliate_commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commissions_month" ON "affiliate_commissions" USING btree ("for_month");--> statement-breakpoint
CREATE INDEX "idx_affiliate_links_user" ON "affiliate_links" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_links_code" ON "affiliate_links" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_affiliate_links_created" ON "affiliate_links" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_wallet_user" ON "affiliate_wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_user" ON "affiliate_withdrawals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_status" ON "affiliate_withdrawals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_withdrawals_created" ON "affiliate_withdrawals" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "IDX_api_keys_user" ON "api_keys" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "IDX_api_keys_prefix" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "IDX_api_keys_active" ON "api_keys" USING btree ("is_active","expires_at");--> statement-breakpoint
CREATE INDEX "idx_award_recipient" ON "award_history" USING btree ("recipient_id","recipient_type");--> statement-breakpoint
CREATE INDEX "idx_award_type" ON "award_history" USING btree ("award_type");--> statement-breakpoint
CREATE INDEX "idx_award_period" ON "award_history" USING btree ("award_period_start","award_period_end");--> statement-breakpoint
CREATE INDEX "idx_award_area" ON "award_history" USING btree ("geographic_area");--> statement-breakpoint
CREATE INDEX "idx_claims_person" ON "claims" USING btree ("person_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_claims_type" ON "claims" USING btree ("claim_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_claims_status" ON "claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_claims_restaurant" ON "claims" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_claims_host" ON "claims" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_claims_event" ON "claims" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_claims_person_type_status" ON "claims" USING btree ("person_id","claim_type","status");--> statement-breakpoint
CREATE INDEX "idx_credit_ledger_user" ON "credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_credit_ledger_source" ON "credit_ledger" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_credit_ledger_redeemed" ON "credit_ledger" USING btree ("redeemed_at");--> statement-breakpoint
CREATE INDEX "IDX_deal_claims_deal_used" ON "deal_claims" USING btree ("deal_id","used_at");--> statement-breakpoint
CREATE INDEX "IDX_deal_claims_deal_status" ON "deal_claims" USING btree ("deal_id","is_used");--> statement-breakpoint
CREATE INDEX "IDX_deal_claims_user_claimed" ON "deal_claims" USING btree ("user_id","claimed_at");--> statement-breakpoint
CREATE INDEX "IDX_deal_feedback_deal" ON "deal_feedback" USING btree ("deal_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_deal_feedback_user" ON "deal_feedback" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_deal_feedback_rating" ON "deal_feedback" USING btree ("deal_id","rating");--> statement-breakpoint
CREATE INDEX "IDX_deal_feedback_type" ON "deal_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "IDX_deal_views_deal_viewed" ON "deal_views" USING btree ("deal_id","viewed_at");--> statement-breakpoint
CREATE INDEX "IDX_deal_views_user_deal" ON "deal_views" USING btree ("user_id","deal_id");--> statement-breakpoint
CREATE INDEX "IDX_deal_views_session" ON "deal_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_event_interests_event" ON "event_interests" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_event_interests_truck" ON "event_interests" USING btree ("truck_id");--> statement-breakpoint
CREATE INDEX "idx_event_series_host" ON "event_series" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_event_series_status" ON "event_series" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_event_series_dates" ON "event_series" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "idx_events_host" ON "events" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_events_series" ON "events" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "idx_events_date" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_events_status" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_events_booked_restaurant" ON "events" USING btree ("booked_restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_featured_restaurant" ON "featured_video_slots" USING btree ("restaurant_id","slot_number");--> statement-breakpoint
CREATE INDEX "idx_featured_cycle" ON "featured_video_slots" USING btree ("cycle_end_date");--> statement-breakpoint
CREATE INDEX "idx_feed_ads_active" ON "feed_ads" USING btree ("is_active","start_at","end_at");--> statement-breakpoint
CREATE INDEX "idx_feed_ads_priority" ON "feed_ads" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "IDX_food_truck_locations_restaurant_time" ON "food_truck_locations" USING btree ("restaurant_id","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_food_truck_locations_time" ON "food_truck_locations" USING btree ("recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_food_truck_locations_geo" ON "food_truck_locations" USING btree ("restaurant_id","latitude","longitude");--> statement-breakpoint
CREATE INDEX "IDX_food_truck_locations_session" ON "food_truck_locations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_food_truck_sessions_restaurant" ON "food_truck_sessions" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "IDX_food_truck_sessions_active" ON "food_truck_sessions" USING btree ("is_active","started_at");--> statement-breakpoint
CREATE INDEX "idx_host_reviews_host" ON "host_reviews" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "idx_host_reviews_truck" ON "host_reviews" USING btree ("truck_id");--> statement-breakpoint
CREATE INDEX "idx_host_reviews_user" ON "host_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_host_reviews_rating" ON "host_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_host_reviews_approved" ON "host_reviews" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "idx_hosts_user" ON "hosts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_hosts_verified" ON "hosts" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_hosts_location" ON "hosts" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "idx_image_entity" ON "image_uploads" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "idx_image_uploader" ON "image_uploads" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_image_type" ON "image_uploads" USING btree ("image_type");--> statement-breakpoint
CREATE INDEX "idx_incidents_status" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_incidents_severity" ON "incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_incidents_rule" ON "incidents" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_incidents_created" ON "incidents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_subject" ON "lisa_claim" USING btree ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_actor" ON "lisa_claim" USING btree ("actor_type","actor_id");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_app" ON "lisa_claim" USING btree ("app");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_type" ON "lisa_claim" USING btree ("claim_type");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_created_at" ON "lisa_claim" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_lisa_claim_app_subject" ON "lisa_claim" USING btree ("app","subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "idx_location_requests_user" ON "location_requests" USING btree ("posted_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_location_requests_status" ON "location_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_location_requests_created" ON "location_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_events_status" ON "moderation_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_moderation_events_severity" ON "moderation_events" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_moderation_events_created_at" ON "moderation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_events_reported_user" ON "moderation_events" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "idx_oncall_dates" ON "oncall_rotation" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "IDX_password_reset_tokens_user" ON "password_reset_tokens" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "IDX_password_reset_tokens_expires" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "IDX_password_reset_tokens_used" ON "password_reset_tokens" USING btree ("used_at");--> statement-breakpoint
CREATE INDEX "idx_referral_clicks_affiliate" ON "referral_clicks" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_referral_clicks_created" ON "referral_clicks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_referrals_affiliate" ON "referrals" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_restaurant" ON "referrals" USING btree ("referred_restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_status" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_referrals_clicked" ON "referrals" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "idx_redemptions_restaurant" ON "restaurant_credit_redemptions" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_redemptions_user" ON "restaurant_credit_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_redemptions_status" ON "restaurant_credit_redemptions" USING btree ("settlement_status");--> statement-breakpoint
CREATE INDEX "idx_redemptions_batch" ON "restaurant_credit_redemptions" USING btree ("settlement_batch_id");--> statement-breakpoint
CREATE INDEX "idx_redemptions_created" ON "restaurant_credit_redemptions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_restaurant_favorites_restaurant" ON "restaurant_favorites" USING btree ("restaurant_id","favorited_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_restaurant_favorites_user" ON "restaurant_favorites" USING btree ("user_id","favorited_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_restaurant_favorites_unique" ON "restaurant_favorites" USING btree ("restaurant_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_restaurant_recommendations_restaurant" ON "restaurant_recommendations" USING btree ("restaurant_id","showed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_restaurant_recommendations_user" ON "restaurant_recommendations" USING btree ("user_id","showed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_restaurant_recommendations_session" ON "restaurant_recommendations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_restaurant_recommendations_type" ON "restaurant_recommendations" USING btree ("recommendation_type","showed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_restaurant_recommendations_clicked" ON "restaurant_recommendations" USING btree ("is_clicked","clicked_at");--> statement-breakpoint
CREATE INDEX "idx_batch_id" ON "restaurant_settlement_batch" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_batch_status" ON "restaurant_settlement_batch" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_batch_period" ON "restaurant_settlement_batch" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "idx_submissions_status" ON "restaurant_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_submissions_county" ON "restaurant_submissions" USING btree ("county");--> statement-breakpoint
CREATE INDEX "idx_submissions_created" ON "restaurant_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_subscription_restaurant" ON "restaurant_subscriptions" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_tier" ON "restaurant_subscriptions" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_subscription_status" ON "restaurant_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_security_audit_user" ON "security_audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_security_audit_action" ON "security_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_security_audit_resource" ON "security_audit_log" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_security_audit_time" ON "security_audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_story_awards_story" ON "story_awards" USING btree ("story_id");--> statement-breakpoint
CREATE INDEX "IDX_story_awards_type" ON "story_awards" USING btree ("award_type");--> statement-breakpoint
CREATE INDEX "IDX_story_awards_date" ON "story_awards" USING btree ("awarded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_comments_story" ON "story_comments" USING btree ("story_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_comments_user" ON "story_comments" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_comments_parent" ON "story_comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX "IDX_story_likes_story" ON "story_likes" USING btree ("story_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_likes_user" ON "story_likes" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_likes_unique" ON "story_likes" USING btree ("story_id","user_id");--> statement-breakpoint
CREATE INDEX "IDX_story_views_story" ON "story_views" USING btree ("story_id","viewed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_story_views_user" ON "story_views" USING btree ("user_id","viewed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_support_tickets_user_id" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_status" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_created_at" ON "support_tickets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_telemetry_name" ON "telemetry_events" USING btree ("event_name");--> statement-breakpoint
CREATE INDEX "idx_telemetry_created" ON "telemetry_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_truck_interests_request" ON "truck_interests" USING btree ("location_request_id");--> statement-breakpoint
CREATE INDEX "idx_truck_interests_restaurant" ON "truck_interests" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "idx_truck_interests_created" ON "truck_interests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_user_addresses_user" ON "user_addresses" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_user_addresses_type" ON "user_addresses" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "IDX_user_addresses_default" ON "user_addresses" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_payout_prefs_user" ON "user_payout_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_video_stories_user" ON "video_stories" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_video_stories_restaurant" ON "video_stories" USING btree ("restaurant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_video_stories_expires" ON "video_stories" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "IDX_video_stories_status" ON "video_stories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_video_stories_deleted" ON "video_stories" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "IDX_video_stories_featured" ON "video_stories" USING btree ("is_featured","featured_slot_number");--> statement-breakpoint
CREATE INDEX "IDX_video_reports_story" ON "video_story_reports" USING btree ("story_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_video_reports_user" ON "video_story_reports" USING btree ("reported_by_user_id");--> statement-breakpoint
CREATE INDEX "IDX_video_reports_status" ON "video_story_reports" USING btree ("status");