# Overview

MealScout is a hyper-local meal deals discovery platform that connects restaurants with nearby customers. The application enables restaurant owners to create and manage promotional deals while allowing customers to discover, claim, and share food deals in their vicinity. Built as a full-stack TypeScript application with React frontend and Express backend, MealScout features location-based services, payment integration via Stripe, social sharing capabilities, and real-time updates through WebSocket connections for food trucks.

# User Preferences

Preferred communication style: Simple, everyday language.

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