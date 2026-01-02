# MealScout Deployment Guide

**Architecture:** Dual-track deployment
- **Frontend:** Vercel → `mealscout.us`
- **Backend:** Render (existing TradeScout instance) → `api.mealscout.thetradescout.com`

---

## 1. Backend Setup (Render)

### A. Configure Subdomain on Render

1. Go to your existing Render instance dashboard
2. Navigate to **Settings** → **Custom Domains**
3. Add subdomain: `api.mealscout.thetradescout.com`
4. Update DNS at your domain registrar:
   - Type: `CNAME`
   - Name: `api.mealscout`
   - Value: `<your-render-url>.onrender.com`
   - TTL: `3600`

### B. Set Environment Variables on Render

Copy these from `.env.production.example` into Render dashboard → **Environment**:

```bash
NODE_ENV=production
PORT=5001
BETA_MODE=true

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_PVKq0bmnTi3k@ep-dry-sound-adjyrgiu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Security Secrets (GENERATE NEW VALUES)
SESSION_SECRET=<GENERATE_64_CHAR_RANDOM_STRING>
INCIDENT_SIGNATURE_SECRET=<GENERATE_64_CHAR_RANDOM_STRING>

# TradeScout Integration
TRADESCOUT_API_TOKEN=mealscout_dev_f8a7c2d9e1b4f6a3c8e5d7b2a9f1c4e6d8b3a5f7c9e2d4b6a8f1c3e5d7b9a2f4c6e8

# CORS Origins
CLIENT_ORIGIN=https://mealscout.us
ALLOWED_ORIGINS=https://mealscout.us,https://www.mealscout.us,https://thetradescout.com,https://www.thetradescout.com

# Public URL
PUBLIC_BASE_URL=https://api.mealscout.thetradescout.com
```

**Generate secure secrets:**
```powershell
# Run in PowerShell to generate random strings
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### C. Deploy Backend

If MealScout is in the same repo as TradeScout:
- Render will auto-deploy from GitHub on push to `main`
- Ensure build command: `npm run build`
- Ensure start command: `npm start`

If separate repo:
- Push MealScout code to GitHub
- Connect repo to Render
- Configure build/start commands as above

---

## 2. Frontend Setup (Vercel)

### A. Install Vercel CLI (optional, but recommended)

```powershell
npm install -g vercel
```

### B. Deploy to Vercel

```powershell
# From MealScout/MealScout directory
cd c:\Users\FlavorGood\Documents\AAATraderCorner\TradeScout\MealScout\MealScout

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

**Vercel prompts:**
- Set up and deploy? `Y`
- Scope: `<your-vercel-account>`
- Link to existing project? `N`
- Project name: `mealscout`
- Directory: `./` (current directory)
- Override settings? `N`

### C. Configure Custom Domain on Vercel

1. Go to Vercel dashboard → **Settings** → **Domains**
2. Add domain: `mealscout.us`
3. Add domain: `www.mealscout.us` (redirects to main)
4. Update DNS at domain registrar (Vercel will show exact records):
   - Type: `A` 
   - Name: `@`
   - Value: `76.76.21.21` (Vercel IP)
   
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`

### D. Verify Environment Variables on Vercel

Vercel should auto-detect from `vercel.json`, but confirm in dashboard → **Settings** → **Environment Variables**:

```
VITE_API_BASE_URL=https://api.mealscout.thetradescout.com
```

---

## 3. Post-Deployment Verification

### A. Backend Health Checks

```powershell
# Test liveness
Invoke-RestMethod -Uri "https://api.mealscout.thetradescout.com/health"
# Expected: { status: "ok", ts: <timestamp> }

# Test realtime readiness
Invoke-RestMethod -Uri "https://api.mealscout.thetradescout.com/health/realtime"
# Expected: { status: "ok", realtime: "ready", ts: <timestamp> }
```

### B. Frontend Tests

1. Visit `https://mealscout.us` → Should load homepage
2. Check browser console → No CORS errors
3. Test Socket.IO connection:
   - Go to food truck map
   - Open DevTools → Network → WS tab
   - Should see `socket.io` connection established

### C. End-to-End Flow

1. Browse deals on `mealscout.us`
2. View live food trucks (Socket.IO)
3. Check TradeScout Action API:
   ```powershell
   # From TradeScout LLM or curl
   curl -X POST https://api.mealscout.thetradescout.com/api/actions `
     -H "Authorization: Bearer mealscout_dev_f8a7c2d9e1b4f6a3c8e5d7b2a9f1c4e6d8b3a5f7c9e2d4b6a8f1c3e5d7b9a2f4c6e8" `
     -H "Content-Type: application/json" `
     -d '{"action":"GET_FOOD_TRUCKS","latitude":40.7128,"longitude":-74.0060,"radiusKm":10}'
   ```

---

## 4. Monitoring

### A. Render Logs

- Go to Render dashboard → **Logs**
- Watch for:
  - ✅ Database connection established
  - ✅ Socket.IO server setup complete
  - ✅ serving on port 5001
  - ⚠️ Any CORS warnings
  - ⚠️ Realtime churn warnings

### B. Vercel Logs

- Go to Vercel dashboard → **Deployments** → Select latest → **Logs**
- Watch for build errors or runtime issues

### C. Socket.IO Metrics

Check realtime metrics (you added this in prod hardening):
- Backend should log connect/disconnect counts
- Watch for churn warnings (disconnects > 1.5x connects)

---

## 5. Rollback Plan

### If Backend Issues

1. Check Render logs for errors
2. Verify environment variables set correctly
3. Rollback to previous Render deployment:
   - Dashboard → **Deployments** → Select previous → **Redeploy**

### If Frontend Issues

```powershell
# Redeploy previous version
vercel --prod rollback
```

Or via Vercel dashboard:
- **Deployments** → Select previous → **Promote to Production**

---

## 6. Future Upgrade Path (When Revenue Allows)

**Option A: Separate Render Instance**
- Deploy MealScout backend to dedicated Render instance
- Point `api.mealscout.us` to new instance
- Migrate TRADESCOUT_API_TOKEN auth to new env

**Option B: Railway**
- Export code as standalone package
- Deploy to Railway (unlimited domains)
- Update DNS to Railway URL

**Option C: Oracle Always-Free**
- 2 VMs with 24GB RAM total (generous for free)
- Full control, custom setup
- Requires more DevOps knowledge

---

## 7. TradeScout Law Compliance Check

✅ **Authority > Visibility:** Placement is proximity/time-based, not paid  
✅ **Intent-Gated:** Actions require explicit user intent (discover_now, save, etc.)  
✅ **No Pay-to-Play:** Zero paid promotion surfaces  
✅ **Read-Only Global, Action Local:** County data read-only; writes via TradeScout  
✅ **AI Guardrails:** Action API validates coordinates, caps radius, no data fabrication  

---

## 8. Sale Positioning Documentation

If selling MealScout later, provide buyer with:

1. **EMBED_CONTRACT.md** → TradeScout integration boundaries
2. **This DEPLOY.md** → Shows separation capability (can move to any host)
3. **API_ACTIONS.md** → TradeScout Action API contracts
4. **.env.production.example** → All config externalized
5. **Architecture diagram:**
   ```
   TradeScout (Parent Authority)
        ↓
   Action API Bridge (/api/actions + TRADESCOUT_API_TOKEN)
        ↓
   MealScout Backend (Render subdomain, portable)
        ↓
   MealScout Frontend (Vercel, standalone domain)
   ```

**Key message to buyer:** 
> MealScout is architecturally decoupled. Currently hosted via TradeScout subdomain for cost efficiency, but all code is standalone and can deploy to any Node.js host (Railway, Fly.io, AWS, etc.) with zero refactoring. TradeScout integration is via documented Action API only.

---

## Done ✅

MealScout is now live at `mealscout.us` with:
- Production-grade backend (health checks, realtime metrics, env validation)
- Fast frontend (Vercel CDN)
- Realtime Socket.IO for food trucks
- TradeScout Action API bridge operational
- TradeScout Law compliant
- Sellable as standalone asset
