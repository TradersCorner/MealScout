# Overview

DealScout is a hyper-local meal deals discovery platform built as a full-stack React application. The application connects restaurants with nearby customers by enabling restaurant owners to create and manage special meal deals for breakfast, lunch, and dinner, while allowing users to discover and claim deals within walking distance of their location. The platform focuses on time-based dining offers with location-based services to create a targeted dining experience.

# User Preferences

Preferred communication style: Simple, everyday language.

# Phase 4 Complete: Production Ready! 🚀

**DealScout** is now production-ready with all phases completed:
- ✅ Phase 1: Core functionality and user authentication
- ✅ Phase 2: Enhanced features with location services and ratings
- ✅ Phase 3: Payment integration, social features, and smart search
- ✅ Phase 4: Production deployment with performance and security optimizations

# System Architecture

## Frontend Architecture

The client application is built with React 18 using TypeScript and follows a modern component-based architecture:

- **UI Framework**: Uses Radix UI components with shadcn/ui for a comprehensive design system
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management with built-in caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Location Services**: Browser Geolocation API with reverse geocoding for location-based features

## Backend Architecture

The server follows a Node.js/Express REST API pattern with TypeScript:

- **Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **Authentication**: Replit Auth integration with OpenID Connect and Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **Database Access**: Drizzle ORM with type-safe schema definitions
- **Build System**: Vite for development with ESBuild for production bundling

## Data Storage

The application uses PostgreSQL as the primary database with the following schema design:

- **Users Table**: Stores user profiles with Stripe integration fields for subscription management
- **Restaurants Table**: Contains restaurant information with geolocation data (latitude/longitude)
- **Deals Table**: Manages deal information with time-based validity, usage limits, and feature flags
- **Deal Claims Table**: Tracks user interactions with deals to prevent abuse
- **Reviews Table**: Handles user feedback and ratings for restaurants
- **Sessions Table**: Manages user authentication sessions (required for Replit Auth)

The database uses UUID primary keys and includes proper foreign key relationships with cascading deletes where appropriate.

## Authentication and Authorization

The system implements Replit's authentication service:

- **Provider**: Replit OpenID Connect with automatic user provisioning
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Route Protection**: Middleware-based authentication checks for protected endpoints
- **User Management**: Automatic user creation and profile synchronization

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for subscription management with both client-side (Stripe.js, React Stripe.js) and server-side implementations
- **Subscription Model**: Handles premium features for restaurant owners

### Location Services
- **Browser Geolocation**: Primary location detection method
- **BigDataCloud API**: Reverse geocoding service for converting coordinates to readable addresses
- **Spatial Queries**: Database-level geographic calculations for nearby restaurant/deal discovery

### Development Tools
- **Replit Integration**: Custom Vite plugins for Replit-specific development features including error overlays and cartographer integration
- **Development Banner**: Automatic Replit development environment detection

### UI and Styling
- **Radix UI**: Comprehensive accessible component library
- **shadcn/ui**: Pre-built component system with consistent styling
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe variant handling for component styling

### Database and ORM
- **Neon Database**: Serverless PostgreSQL with WebSocket support
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **Connection Pooling**: PostgreSQL connection pooling for improved performance