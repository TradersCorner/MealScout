// Legacy module retained for reference only.
// Active Facebook OAuth is configured in `server/unifiedAuth.ts` via `setupUnifiedAuth`.
// Do not wire this module into runtime routes unless intentionally migrating auth architecture.

import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import type { Express } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Check for required Facebook environment variables
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    // Facebook auth is optional - app functions without it
    return;
  }

  // Facebook Strategy
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: `/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails', 'photos', 'first_name', 'last_name']
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Extract user data from Facebook profile
      const userData = {
        facebookId: profile.id,
        email: profile.emails?.[0]?.value || null,
        firstName: profile.name?.givenName || profile._json?.first_name || null,
        lastName: profile.name?.familyName || profile._json?.last_name || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
        facebookAccessToken: accessToken,
      };

      // Create or update user in database
      const user = await storage.upsertUserByAuth('facebook', userData, 'customer');
      return done(null, { ...user, accessToken });
    } catch (error) {
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });

  // Facebook auth routes
  app.get('/api/auth/facebook',
    passport.authenticate('facebook', { 
      scope: ['email', 'public_profile', 'user_posts'] 
    })
  );

  app.get('/api/auth/facebook/callback',
    passport.authenticate('facebook', { 
      failureRedirect: '/?error=auth_failed' 
    }),
    (req, res) => {
      // Successful authentication, redirect to app
      res.redirect('/');
    }
  );

  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect('/');
    });
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
