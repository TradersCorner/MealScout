#!/bin/bash
# MealScout North Star - Production Deployment Script

set -e

echo "🚀 MealScout North Star Deployment"
echo "=================================="
echo ""

# Step 1: Run Database Migration
echo "📊 Step 1: Running database migration..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
    echo "   Set it with: export DATABASE_URL='your_postgres_connection_string'"
    echo "   Then run: psql \$DATABASE_URL -f migrations/010_unified_claims_and_pricing_lock.sql"
    echo ""
else
    echo "✓ DATABASE_URL found"
    psql $DATABASE_URL -f migrations/010_unified_claims_and_pricing_lock.sql
    echo "✓ Migration complete"
    echo ""
fi

# Step 2: Verify Schema
echo "📋 Step 2: Verifying schema..."
if [ ! -z "$DATABASE_URL" ]; then
    psql $DATABASE_URL -c "SELECT COUNT(*) as pricing_locks FROM restaurants WHERE locked_price_cents = 2500;" || echo "⚠️  Run migration first"
    psql $DATABASE_URL -c "SELECT COUNT(*) as total_claims FROM claims;" || echo "⚠️  Run migration first"
    echo ""
fi

# Step 3: Build Application
echo "🔨 Step 3: Building application..."
npm install
npm run build
echo "✓ Build complete"
echo ""

# Step 4: Deploy
echo "🌐 Step 4: Deploy to production"
echo "   North Star homepage: ACTIVE (home-north-star.tsx)"
echo "   Event signup: /event-signup"
echo "   Pricing lock: $25/month before March 1, 2026"
echo ""
echo "Ready to deploy with:"
echo "  - Vercel: vercel --prod"
echo "  - Railway: railway up"
echo "  - Render: git push"
echo ""

# Success
echo "✅ MealScout North Star is ready to ship"
echo ""
echo "Next: Start onboarding"
echo "  - Restaurants: $25/mo forever (before March 1)"
echo "  - Food Trucks: Free listing, booking fees only"
echo "  - Hosts: Free forever"
echo "  - Events: Free forever"
