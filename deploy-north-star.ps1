# MealScout North Star - Production Deployment Script (PowerShell)

Write-Host "🚀 MealScout North Star Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Run Database Migration
Write-Host "📊 Step 1: Running database migration..." -ForegroundColor Yellow
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL not set" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DATABASE_URL='your_postgres_connection_string'"
    Write-Host "   Then run: psql `$env:DATABASE_URL -f migrations/010_unified_claims_and_pricing_lock.sql"
    Write-Host ""
} else {
    Write-Host "✓ DATABASE_URL found" -ForegroundColor Green
    psql $env:DATABASE_URL -f migrations/010_unified_claims_and_pricing_lock.sql
    Write-Host "✓ Migration complete" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Verify Schema
Write-Host "📋 Step 2: Verifying schema..." -ForegroundColor Yellow
if ($env:DATABASE_URL) {
    psql $env:DATABASE_URL -c "SELECT COUNT(*) as pricing_locks FROM restaurants WHERE locked_price_cents = 2500;"
    psql $env:DATABASE_URL -c "SELECT COUNT(*) as total_claims FROM claims;"
    Write-Host ""
}

# Step 3: Build Application
Write-Host "🔨 Step 3: Building application..." -ForegroundColor Yellow
npm install
npm run build
Write-Host "✓ Build complete" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "🌐 Step 4: Deploy to production" -ForegroundColor Yellow
Write-Host "   North Star homepage: ACTIVE (home-north-star.tsx)"
Write-Host "   Event signup: /event-signup"
Write-Host "   Pricing lock: `$25/month before March 1, 2026"
Write-Host ""
Write-Host "Ready to deploy with:"
Write-Host "  - Vercel: vercel --prod"
Write-Host "  - Railway: railway up"
Write-Host "  - Render: git push"
Write-Host ""

# Success
Write-Host "✅ MealScout North Star is ready to ship" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Start onboarding" -ForegroundColor Cyan
Write-Host "  - Restaurants: `$25/mo forever (before March 1)"
Write-Host "  - Food Trucks: Free listing, booking fees only"
Write-Host "  - Hosts: Free forever"
Write-Host "  - Events: Free forever"
