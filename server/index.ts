import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import helmet from "helmet";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { setupWebSocketServer } from "./websocket";
import { getSession } from "./unifiedAuth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

const app = express();

// Enhanced global error handlers to prevent server crashes during deployment
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Production mode: Server continuing despite uncaught exception to maintain service availability');
    console.log('🔍 Error details logged for debugging. Service remains operational.');
  } else {
    console.error('💥 Development mode: Exiting process due to uncaught exception');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise);
  console.error('Rejection reason:', reason);
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Production mode: Server continuing despite unhandled rejection');
    console.log('🔍 Rejection details logged for debugging. Service remains operational.');
  } else {
    console.warn('⚠️  Development mode: Unhandled rejection detected - consider adding proper error handling');
  }
});

// Enhanced graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`🔄 ${signal} received again. Forcing immediate shutdown...`);
    process.exit(1);
  }
  
  isShuttingDown = true;
  console.log(`🔄 ${signal} received. Initiating graceful shutdown...`);
  
  // Give the server a few seconds to finish processing current requests
  setTimeout(() => {
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Add warning handler for potential memory leaks
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('⚠️  Memory leak warning:', warning.message);
    console.warn('🔍 Consider investigating event listener usage');
  }
});

// Production security and performance middleware
if (process.env.NODE_ENV === "production") {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'" // Required for Vite in production
        ],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "ws:", "wss:"],
        fontSrc: ["'self'", "https:", "data:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for some features
  }));
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));
}

// Minimal CSP for development - allow external geocoding APIs
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.setHeader(
    'Content-Security-Policy', 
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; " +
    "connect-src 'self' https: wss: ws: " +
    "https://geocoding.census.gov " +
    "https://api.zippopotam.us " +
    "https://api.bigdatacloud.net " +
    "https://nominatim.openstreetmap.org " +
    "https://ipapi.co;"
  );
  next();
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Basic database connection test - non-blocking to prevent health check failures
  try {
    await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.warn('⚠️  Warning: Could not connect to database during startup:', error instanceof Error ? error.message : String(error));
    console.log('🚀 Server will continue starting, database initialization will be performed after startup');
    
    // Log connection details for debugging (without exposing credentials)
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@');
      console.log('📋 Database URL format:', dbUrl);
    } else {
      console.warn('⚠️  DATABASE_URL environment variable not set');
    }
  }
  
  // Setup session configuration before routes
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
  
  // OAuth normalization middleware - redirect Google OAuth to canonical domain to prevent session mismatch
  app.use((req, res, next) => {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    if (publicBaseUrl && req.path.startsWith('/api/auth/google')) {
      const canonicalHost = new URL(publicBaseUrl).hostname;
      if (req.hostname !== canonicalHost) {
        const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        const redirectUrl = `${publicBaseUrl}${req.path}${queryString}`;
        log(`Redirecting Google OAuth ${req.hostname} to canonical domain: ${redirectUrl}`);
        return res.redirect(307, redirectUrl);
      }
    }
    next();
  });

  // Host normalization middleware - redirect to canonical domain
  app.use((req, res, next) => {
    // Skip for API routes and localhost development
    if (req.path.startsWith('/api') || req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
      return next();
    }
    
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    if (publicBaseUrl && !req.url.includes('?')) { // Only redirect if no query params to avoid losing OAuth state
      const canonicalHost = new URL(publicBaseUrl).hostname;
      
      // Debug logging to see what's happening
      log(`🔍 Hostname check: req.hostname='${req.hostname}', canonicalHost='${canonicalHost}', match=${req.hostname === canonicalHost}`);
      
      if (req.hostname !== canonicalHost) {
        const redirectUrl = `${publicBaseUrl}${req.path}`;
        log(`Redirecting ${req.hostname} to canonical domain: ${redirectUrl}`);
        return res.redirect(302, redirectUrl);
      }
    }
    next();
  });
  
  const server = await registerRoutes(app);

  // Setup WebSocket server for food truck GPS tracking
  setupWebSocketServer(server);
  log("WebSocket server initialized for food truck tracking");

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log error for debugging
    console.error('❌ Express error middleware:', err);
    
    // Send response if not already sent
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // Don't throw after responding to avoid triggering uncaughtException
    // In production, log and continue; in development, we can be more strict
    if (process.env.NODE_ENV !== 'production') {
      console.error('💥 Development error - check logs above');
    }
  });

  // Root endpoint health guard - handles health checks while preserving SPA functionality  
  app.use('/', (req, res, next) => {
    // Only handle root path, let other paths go through
    if (req.path !== '/') {
      return next();
    }

    // Handle HEAD requests (common for health checks) - always return 200
    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    // Handle GET requests based on Accept header
    if (req.method === 'GET') {
      const acceptHeader = req.get('Accept') || '';
      
      // If not requesting HTML, return JSON status (for API health checks)
      if (!acceptHeader.includes('text/html')) {
        return res.status(200).json({ 
          status: 'ok', 
          service: 'Food Truck Finder API',
          timestamp: new Date().toISOString()
        });
      }

      // For HTML requests in development, always let Vite handle it
      if (app.get("env") === "development") {
        return next();
      }

      // For HTML requests in production, check if built frontend exists
      // Use the same path logic as serveStatic function in vite.ts
      const indexPath = path.resolve(process.cwd(), 'server', 'public', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        // SPA build exists, let serveStatic handle it
        return next();
      } else {
        // No build available, return minimal HTML fallback with 200 status
        res.status(200).set({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }).send(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Food Truck Finder</title>
            </head>
            <body>
              <h1>Food Truck Finder</h1>
              <p>Service is running successfully.</p>
              <p>Status: OK</p>
              <p><a href="/health">Health Check</a></p>
            </body>
          </html>
        `);
        return;
      }
    }

    // For other methods, continue to next middleware
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize database data after server startup - truly non-blocking
    setImmediate(async () => {
      try {
        await storage.ensureAdminExists();
        await storage.seedDevelopmentData();
        console.log('✅ Database initialization completed successfully');
      } catch (error) {
        console.warn('⚠️  Warning: Could not initialize storage after startup:', error instanceof Error ? error.message : String(error));
        console.warn('⚠️  Some features may not work properly until database is initialized');
      }
    });
    
    // Perform database validation after server startup - non-blocking
    setTimeout(async () => {
      try {
        const schemaCheck = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'phone'
        `);
        
        if (schemaCheck.rows.length === 0) {
          console.error('❌ CRITICAL: phone column missing from users table!');
          console.error('Database URL:', process.env.DATABASE_URL?.split('@')[0] + '@...');
          // Don't exit process in production - log error and continue
          if (process.env.NODE_ENV === 'production') {
            console.warn('⚠️  Server will continue running despite database schema issues');
          }
        } else {
          console.log('✅ Schema validation: phone column exists');
        }
      } catch (error) {
        console.error('❌ Schema validation failed:', error instanceof Error ? error.message : String(error));
        console.warn('⚠️  Server will continue running despite database validation failure');
      }
    }, 1000); // Delay 1 second to allow server to fully start
  });
})();
