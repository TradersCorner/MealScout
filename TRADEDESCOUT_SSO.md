# TradeScout SSO for MealScout

MealScout can accept authenticated TradeScout users without requiring a separate MealScout login.

## Server-side setup

- Set `TRADESCOUT_JWT_SECRET` in the MealScout server environment. This must match the HMAC secret used by TradeScout when issuing SSO JWTs.
- Ensure the server is running with the unified auth stack (default `npm run dev:server` / `npm run start`).

## SSO endpoint

The MealScout server exposes a dedicated SSO endpoint:

- `POST /api/auth/tradescout/sso`
  - Authorization: `Bearer <TradeScout JWT>` **or** JSON body `{ "token": "<TradeScout JWT>" }`
  - On success:
    - Creates or links a MealScout user to the TradeScout account.
    - Establishes a regular session cookie so existing `/api/auth/user` and `useAuth()` continue to work.

### Expected JWT claims

Recommended (but flexible) claims in the TradeScout-issued JWT:

- `sub`: stable TradeScout user id (required)
- `email`: user email (optional but recommended for linking)
- `name` or `given_name` / `family_name`: for display (optional)
- `roles`: `string[]` of TradeScout roles (optional)

Role mapping rules (in MealScout):

- `mealscout_super_admin` → treated as MealScout `super_admin` (stored as `admin` for SSO upsert)
- `mealscout_admin` or `admin` → MealScout `admin`
- `restaurant_owner`, `merchant`, or `vendor` → MealScout `restaurant_owner`
- anything else / none → MealScout `customer`

## Typical TradeScout integration flow

1. User authenticates with TradeScout as usual.
2. TradeScout issues a signed JWT for that user.
3. TradeScout calls `POST /api/auth/tradescout/sso` on the MealScout server (server-to-server or via a backend proxy), **or** uses the SDK helper:
  - `import { performMealScoutSSO } from "@tradescout/mealscout-app";`
  - `await performMealScoutSSO(tradeScoutJwt, { baseUrl: "https://mealscout.yourdomain.com" });`
4. Once SSO succeeds, TradeScout can render the embedded MealScout app (for example using the SDK-style `MealScoutApp` component), and MealScout will treat the user as logged in via its normal `useAuth()` and `/api/auth/user` mechanisms.
