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

const app = express();

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
  // Validate database schema at startup
  try {
    const schemaCheck = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phone'
    `);
    
    if (schemaCheck.rows.length === 0) {
      console.error('❌ CRITICAL: phone column missing from users table!');
      console.error('Database URL:', process.env.DATABASE_URL?.split('@')[0] + '@...');
      process.exit(1);
    } else {
      console.log('✅ Schema validation: phone column exists');
    }
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
  }

  // Initialize admin account and seed data
  await storage.ensureAdminExists();
  await storage.seedDevelopmentData();
  
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

  // Host normalization middleware - redirect all users to canonical domain
  app.use((req, res, next) => {
    // Skip for API routes and localhost development
    if (req.path.startsWith('/api') || req.hostname === 'localhost' || req.hostname === '127.0.0.1') {
      return next();
    }
    
    const publicBaseUrl = process.env.PUBLIC_BASE_URL;
    if (publicBaseUrl && !req.url.includes('?')) { // Only redirect if no query params to avoid losing OAuth state
      const canonicalHost = new URL(publicBaseUrl).hostname;
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
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
  });
})();
