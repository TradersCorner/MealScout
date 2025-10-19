# Overview

MealScout is a hyper-local meal deals discovery platform that connects restaurants with nearby customers. The application enables restaurant owners to create and manage promotional deals while allowing customers to discover, claim, and share food deals in their vicinity. Built as a full-stack TypeScript application with React frontend and Express backend, MealScout features location-based services, payment integration via Stripe, social sharing capabilities, and real-time updates through WebSocket connections for food trucks.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (October 2025)

## Pricing Model Update
- **Simplified Single-Tier Pricing**: Removed multi-tier pricing (single-deal vs multiple-deals)
- **New Pricing Structure**:
  - $50/month - Standard monthly subscription
  - $100 for 3 months - First-time user special offer (quarterly billing)
  - $450/year - Annual subscription (save 25%)
- **Unlimited Deals**: All paid subscriptions now include unlimited deal creation

## Subscription Format Standardization
- **New Format**: All subscriptions use `standard-{interval}` format (e.g., `standard-month`, `standard-quarter`, `standard-year`)
- **Legacy Compatibility**: System maintains backward compatibility with old formats (`multiple-deals-month`, `single-deal-month`, etc.)
- **Promo Codes**: BETA and TEST1 promo codes updated to use new format
- **Analytics**: Tier parsing logic handles both new and legacy subscription formats

## Critical Authentication Fixes
- **Google OAuth Session Fix**: Implemented manual `session.save()` with callback before redirect to prevent race conditions
- **Session Race Condition**: Fixed 400 password validation errors during OAuth flows by ensuring session persistence before redirect
- **OAuth Redirect Middleware Fix**: Disabled middleware that was redirecting OAuth requests before Passport could initiate the flow, which was breaking Google and Facebook login

## Subscription Activation Fix (October 19, 2025)
- **Issue**: Users were unable to create deals after subscribing and completing payment
- **Root Cause**: Stripe webhook handlers were only logging events but not updating user subscription status in the database
- **Solution**: 
  - Added `getUserByStripeCustomerId()` and `getUserByStripeSubscriptionId()` storage methods for webhook user lookup
  - Updated webhook handlers (`invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`) to persist subscription status changes to database
  - Ensured idempotent webhook processing with proper error handling
- **Promo Code Compatibility**: BETA and TEST1 promo codes continue to work correctly
  - BETA users: Have billing interval but no Stripe subscription ID (free beta access)
  - TEST1 users: Have both fields and are validated through Stripe ($1 test subscription)
  - Paid users: Subscription status now properly synced from Stripe webhooks

## OAuth Configuration Documentation (October 19, 2025)
- **OAuth Setup Guide**: Added comprehensive configuration guide at `/admin/oauth-setup`
- **Configuration Status API**: Added `/api/admin/oauth/status` endpoint for debugging OAuth issues
- **Privacy Policy Compliance**: Crawler-friendly privacy policy and data deletion pages with static HTML
  - Implemented server-side routes in `server/index.ts` that serve static HTML content
  - Static HTML files also available in `server/public/privacy-policy/` and `server/public/data-deletion/`
  - Routes bypass SPA routing and serve content directly to crawlers (Facebook, Google)
- **Required URLs for OAuth Providers**:
  - Privacy Policy: https://mealscout.replit.app/privacy-policy
  - Data Deletion: https://mealscout.replit.app/data-deletion
  - Terms of Service: https://mealscout.replit.app/terms-of-service
  - Google OAuth Callbacks: `/api/auth/google/customer/callback` and `/api/auth/google/restaurant/callback`
  - Facebook OAuth Callback: `/api/auth/facebook/callback`
- **Important**: Privacy policy and data deletion routes work correctly in production/deployed mode. In development mode, Vite's SPA routing may interfere, but deployed apps serve the static HTML correctly.

# System Architecture

## Frontend Architecture

The client application uses modern React 18 with TypeScript and follows a component-based architecture:

- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible UI components
- **Styling**: Tailwind CSS with CSS variables for theming, responsive design, and DoorDash-inspired color palette
- **Routing**: Wouter for lightweight client-side routing without the overhead of React Router
- **State Management**: TanStack Query (React Query) for server state management with built-in caching, background updates, and optimistic updates
- **Forms**: React Hook Form with Zod validation for type-safe form handling and client-side validation
- **Location Services**: Browser Geolocation API with reverse geocoding using BigDataCloud and OpenStreetMap APIs
- **Real-time Features**: WebSocket integration for live food truck location tracking and status updates

## Backend Architecture

The server follows a Node.js/Express REST API pattern with comprehensive middleware:

- **Framework**: Express.js with compression, helmet security headers, and CORS handling
- **Authentication**: Multi-provider authentication supporting Google OAuth, Facebook OAuth, and email/password with bcrypt hashing
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple with configurable TTL
- **Database Access**: Drizzle ORM with type-safe schema definitions and prepared statements
- **Build System**: Vite for development with hot module replacement, ESBuild for optimized production bundling
- **WebSocket Server**: Socket.IO for real-time food truck location broadcasting and status updates
- **Email Service**: Brevo (formerly SendinBlue) integration for transactional emails including welcome emails, password resets, and verification requests
- **File Handling**: Base64 document upload system for restaurant verification with validation and rate limiting

## Data Storage

PostgreSQL database with carefully designed schema optimized for location-based queries:

- **Users Table**: Supports multiple authentication methods (Google, Facebook, email/password) with subscription management fields for Stripe integration
- **Restaurants Table**: Geolocation data (latitude/longitude) with verification status, food truck capabilities, and mobile settings
- **Deals Table**: Time-based validity, usage limits, feature flags, and comprehensive deal metadata
- **Deal Claims/Views**: Anti-abuse tracking with rate limiting and usage analytics
- **Reviews System**: User feedback and ratings with moderation capabilities
- **Sessions Table**: Required for PostgreSQL session storage with automatic cleanup
- **Food Truck Features**: Real-time location tracking with session management and WebSocket broadcasting
- **Location Services**: User address management and restaurant favorites with distance calculations

## Authentication and Authorization

Multi-layered authentication system supporting different user types:

- **Google OAuth**: Primary authentication method for restaurant owners with profile data extraction
- **Facebook OAuth**: Social authentication for customers with profile integration
- **Email/Password**: Traditional authentication with bcrypt hashing and email verification
- **Role-Based Access**: Customer, restaurant owner, and admin roles with appropriate route protection
- **Session Security**: HttpOnly cookies, CSRF protection, and secure session storage in PostgreSQL

## External Dependencies

- **PostgreSQL**: Primary database with Neon serverless for scalability and connection pooling
- **Stripe**: Payment processing for subscription management with customer portal integration
- **Brevo Email API**: Transactional email service for user communications and notifications
- **Google OAuth**: Authentication and profile services for restaurant owners
- **Facebook OAuth**: Social authentication and sharing capabilities for customers
- **Location Services**: BigDataCloud and OpenStreetMap for reverse geocoding and address lookup
- **WebSocket Infrastructure**: Socket.IO for real-time food truck location broadcasting and customer notifications
## OAuth Setup Instructions

### Google OAuth Configuration
1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Create OAuth 2.0 Client ID** (Web application type)
3. **Required Settings**:
   - Authorized JavaScript origins: `https://mealscout.replit.app`
   - Authorized redirect URIs:
     - `https://mealscout.replit.app/api/auth/google/customer/callback`
     - `https://mealscout.replit.app/api/auth/google/restaurant/callback`
4. **OAuth Consent Screen**:
   - Privacy Policy URL: `https://mealscout.replit.app/privacy-policy`
   - Terms of Service URL: `https://mealscout.replit.app/terms-of-service`
   - Authorized domains: `replit.app`
5. **Environment Variables** (Add to Replit Secrets):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Facebook OAuth Configuration
1. **Facebook Developers**: https://developers.facebook.com/apps
2. **App Basic Settings**:
   - App Domain: `mealscout.replit.app`
   - Privacy Policy URL: `https://mealscout.replit.app/privacy-policy` (REQUIRED)
   - User Data Deletion: `https://mealscout.replit.app/data-deletion` (REQUIRED)
   - Terms of Service URL: `https://mealscout.replit.app/terms-of-service`
3. **Facebook Login Settings** (Products → Facebook Login):
   - Valid OAuth Redirect URIs: `https://mealscout.replit.app/api/auth/facebook/callback`
4. **Permissions**: email, public_profile (standard access)
5. **App Mode**: Switch from Development to Live after configuration
6. **Environment Variables** (Add to Replit Secrets):
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`

### Troubleshooting OAuth Issues
- **View Setup Guide**: Navigate to `/admin/oauth-setup` for detailed configuration instructions
- **Check Status**: Use `/api/admin/oauth/status` endpoint to verify environment variables and callback URLs
- **Common Errors**:
  - "Privacy Policy URL is required" → Add privacy policy URL in provider's developer console
  - "OAuth Redirect URI Mismatch" → Ensure exact URL match including protocol (https) and paths
  - "Can't Load URL" → Verify all URLs are publicly accessible via HTTPS
