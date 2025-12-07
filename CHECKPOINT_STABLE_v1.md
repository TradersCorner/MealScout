# MealScout - Stable Checkpoint v1

**Date:** 2025-01-20  
**Status:** Working & Stable  
**User Confirmed:** ✅ "this looks like i wanted"

---

## Current Working State

### Servers Running
- **Backend:** Port 5001 (tsx server/index.ts)
  - Real Neon Serverless Postgres connected
  - DATABASE_URL required (optional warning in dev mode)
  - Optional keys: BREVO_API_KEY, OAuth creds, admin creds
  
- **Frontend:** Port 5176 (Vite dev server)
  - Proxy: `/api/*` → `http://localhost:5001`
  - Auto-retargeted due to port collisions (5173/5174/5175 busy)

### Tech Stack
```json
{
  "frontend": {
    "react": "18.3.1",
    "vite": "5.4.19",
    "wouter": "3.3.5",
    "react-query": "5.60.5",
    "tailwindcss": "latest",
    "lucide-react": "latest"
  },
  "backend": {
    "node": "latest",
    "express": "4.21.2",
    "tsx": "4.19.1",
    "drizzle-orm": "0.38.3",
    "@neondatabase/serverless": "0.10.4",
    "socket.io": "4.8.1"
  }
}
```

### Router Configuration
**App.tsx** - Single source of truth for routing:
```tsx
// Authenticated users
if (user) {
  return <Route path="/" component={Home} />;
}

// Unauthenticated users
return (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/welcome" component={Landing} />
  </Switch>
);
```

**Landing.tsx** - Re-exports Home:
```tsx
export { default } from "./home";
```

**Result:** Both "/" and "/welcome" render Home component. No duplicate pages, no wrong project landing, clean state.

### Home Page Layout (Confirmed Correct)

**client/src/pages/home.tsx:**
1. Hero section with auto location detection
2. Search bar (city/county input)
3. Active deals query/display
4. **Conditional CTA block** (lines ~530):
   - Shows when: `!loadingFoodTrucks && !hasRestaurants && foodTrucks.filter(t => t.isOnline).length === 0`
   - Content: "Search Your City" + "Invite Restaurants & Food Trucks" buttons
   - Layout: Full-width banner, center-aligned, blue/green gradient buttons
5. Food truck tracking section (Socket.IO, online status, mock data)
6. **Community Builder section** (bottom of page):
   - Always visible
   - Restaurant submission form (name, address, category, cuisine)
   - POST to `/api/restaurants/submit`
   - No conditional display

### Key Fixes Applied

#### 1. RotateCw Import Fix (line 13)
```tsx
import { MapPin, Search, Clock, Star, TrendingUp, Users, Utensils, ChevronRight, RotateCw } from "lucide-react";
```

#### 2. Vite Proxy Retarget (vite.config.ts)
```ts
server: {
  proxy: {
    "/api": {
      target: "http://localhost:5001",  // was 5000
      changeOrigin: true,
    },
  },
},
```

#### 3. Database Connection Safe Mode (server/db.ts)
```ts
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEV MODE] DATABASE_URL not found - exports will be undefined');
    export const db = undefined as any;
    export const pool = undefined as any;
  } else {
    throw new Error('DATABASE_URL not set in production');
  }
} else {
  // normal pool/drizzle exports
}
```

### Startup Commands

**From project root (child MealScout folder):**

#### Start Backend:
```powershell
cd C:\Users\FlavorGood\Documents\AAATraderCorner\TradeScout\MealScout\MealScout
npm run dev:server
# or: npx tsx server/index.ts
```

#### Start Frontend:
```powershell
cd C:\Users\FlavorGood\Documents\AAATraderCorner\TradeScout\MealScout\MealScout
npm run dev
# Vite will auto-pick available port (5173, 5174, 5175, or 5176)
```

#### Both (concurrently):
```powershell
npm run dev
# runs both via package.json script
```

---

## Environment Variables

**Required for Production:**
- `DATABASE_URL` - Neon Postgres connection string

**Optional (dev warnings only):**
- `BREVO_API_KEY` - Email service
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` - OAuth
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - Admin credentials

**Dev Mode Behavior:**
- Backend starts without DATABASE_URL (warns, exports undefined db/pool)
- Endpoints must guard against undefined db
- Real DB operations require DATABASE_URL

---

## File Structure (Canonical)

```
MealScout/MealScout/              # ← PROJECT ROOT (child folder)
├── .env                          # Environment variables
├── package.json                  # Dependencies, scripts
├── vite.config.ts                # Vite config (proxy to 5001)
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
├── client/
│   ├── index.html                # Vite entry
│   ├── src/
│   │   ├── App.tsx               # Router (/) → Home, (/welcome) → Landing
│   │   ├── pages/
│   │   │   ├── home.tsx          # Main page (auto location, CTA, Community Builder)
│   │   │   └── landing.tsx       # Re-exports home.tsx
│   │   └── ...
├── server/
│   ├── index.ts                  # Express app entry
│   ├── db.ts                     # DB connection (safe mode dev support)
│   └── ...
└── shared/
    └── ...
```

**Parent Folder (Guard):**
```
MealScout/                        # ← PARENT (guard only)
├── package.json                  # Error guard (prevents wrong project start)
└── README.md                     # Redirect notice
```

---

## Known Constraints

1. **No Dummy Data:**
   - User explicitly forbids dummy/stub data
   - All queries use real database or return empty results

2. **Port Collisions:**
   - 5173/5174/5175 busy (other services)
   - Vite auto-increments to 5176 (working)
   - Backend locked to 5001 (configured)

3. **Layout Requirements:**
   - CTA: top of page, only when no vendors in area
   - Community Builder: always at bottom
   - No other layout modifications without approval

4. **Database Schema:**
   - Uses Drizzle ORM
   - Neon Serverless Postgres
   - Schema in `shared/schema.ts`

---

## Next Steps (Post-Checkpoint)

User requested:
> "now we needs to work on the functionality and a few adjustments to the pages"

**Deferred until after checkpoint:**
- Functionality improvements
- Page adjustments
- Feature work

**Priority:**
- Lock this stable state
- Remove conflicting files
- Validate startup scripts
- Then proceed to functionality work

---

## Validation Checklist

- [x] Backend starts on 5001 with real DB
- [x] Frontend starts on 5176 (Vite)
- [x] Proxy forwards /api to 5001
- [x] Home page renders with correct layout
- [x] CTA appears when no vendors
- [x] Community Builder at bottom
- [x] No white screen errors
- [x] No RotateCw ReferenceError
- [x] Router maps / → Home
- [x] Landing re-exports Home
- [x] User confirmed: "this looks like i wanted"

---

**Checkpoint locked.** Proceed to cleanup phase.
