CREATE TABLE IF NOT EXISTS "restaurant_follows" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "followed_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_restaurant_follows_restaurant" ON "restaurant_follows" ("restaurant_id", "followed_at" DESC);
CREATE INDEX IF NOT EXISTS "IDX_restaurant_follows_user" ON "restaurant_follows" ("user_id", "followed_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_restaurant_follows_unique" ON "restaurant_follows" ("restaurant_id", "user_id");

CREATE TABLE IF NOT EXISTS "restaurant_user_recommendations" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurant_id" varchar NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "recommended_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "IDX_restaurant_user_recommendations_restaurant" ON "restaurant_user_recommendations" ("restaurant_id", "recommended_at" DESC);
CREATE INDEX IF NOT EXISTS "IDX_restaurant_user_recommendations_user" ON "restaurant_user_recommendations" ("user_id", "recommended_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_restaurant_user_recommendations_unique" ON "restaurant_user_recommendations" ("restaurant_id", "user_id");
