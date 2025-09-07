import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import type { Express } from "express";
import { storage } from "./storage";
import type { GoogleUserData, EmailUserData, FacebookUserData } from "@shared/schema";

export async function setupUnifiedAuth(app: Express) {
  // Google Strategy for all users
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use('google-customer', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/api/auth/google/customer/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const userData: GoogleUserData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName || null,
          lastName: profile.name?.familyName || null,
          profileImageUrl: profile.photos?.[0]?.value || null,
          googleAccessToken: accessToken,
        };

        const user = await storage.upsertUserByAuth('google', userData, 'customer');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));

    passport.use('google-restaurant', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/api/auth/google/restaurant/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const userData: GoogleUserData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName || null,
          lastName: profile.name?.familyName || null,
          profileImageUrl: profile.photos?.[0]?.value || null,
          googleAccessToken: accessToken,
        };

        const user = await storage.upsertUserByAuth('google', userData, 'restaurant_owner');
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Google OAuth routes for customers
  app.get("/api/auth/google/customer", (req, res, next) => {
    passport.authenticate('google-customer', {
      scope: ['profile', 'email']
    })(req, res, next);
  });

  app.get("/api/auth/google/customer/callback", (req, res, next) => {
    passport.authenticate('google-customer', {
      successRedirect: "/",
      failureRedirect: "/?error=auth_failed",
    })(req, res, next);
  });

  // Google OAuth routes for restaurant owners
  app.get("/api/auth/google/restaurant", (req, res, next) => {
    passport.authenticate('google-restaurant', {
      scope: ['profile', 'email']
    })(req, res, next);
  });

  app.get("/api/auth/google/restaurant/callback", (req, res, next) => {
    passport.authenticate('google-restaurant', {
      successRedirect: "/restaurant-signup",
      failureRedirect: "/restaurant-signup?error=auth_failed",
    })(req, res, next);
  });

  // Email/password registration for customers
  app.post("/api/auth/customer/register", async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userData: EmailUserData = {
        email,
        firstName,
        lastName,
        passwordHash,
      };

      const user = await storage.upsertUserByAuth('email', userData, 'customer');

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        res.json({ user, message: "Registration successful" });
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email/password registration for restaurant owners
  app.post("/api/auth/restaurant/register", async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userData: EmailUserData = {
        email,
        firstName,
        lastName,
        passwordHash,
      };

      const user = await storage.upsertUserByAuth('email', userData, 'restaurant_owner');

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in after registration" });
        }
        res.json({ user, message: "Registration successful" });
      });
    } catch (error) {
      console.error("Restaurant registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Email/password login for all users
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        res.json({ user, message: "Login successful" });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Unified logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logout successful" });
    });
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware to check if user is authenticated restaurant owner
export const isRestaurantOwner = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.userType !== 'restaurant_owner') {
    return res.status(403).json({ error: "Restaurant owner access required" });
  }

  next();
};