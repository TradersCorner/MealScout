import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";
import { storage } from "./storage";
import { emailService } from "./emailService";
import type { GoogleUserData, EmailUserData, FacebookUserData } from "@shared/schema";

export async function setupUnifiedAuth(app: Express) {
  // Set up passport serialization for email/password auth
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google Strategy and routes for all users (only enabled if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Setting up Google OAuth strategies...");
    
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
        // Send welcome email asynchronously (don't block auth flow)
        emailService.sendWelcomeEmail(user).catch(err => 
          console.error('Failed to send customer welcome email:', err)
        );
        // Send admin signup notification with context asynchronously
        emailService.sendAdminSignupNotification(user, { 
          signupMethod: 'google' 
        }).catch(err => 
          console.error('Failed to send admin signup notification:', err)
        );
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
        // Send welcome email asynchronously (don't block auth flow)
        emailService.sendWelcomeEmail(user).catch(err => 
          console.error('Failed to send restaurant owner welcome email:', err)
        );
        // Send admin signup notification with context asynchronously
        emailService.sendAdminSignupNotification(user, { 
          signupMethod: 'google' 
        }).catch(err => 
          console.error('Failed to send admin signup notification:', err)
        );
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));

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
  } else {
    console.log("Google OAuth not configured: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are missing");
    
    // Add error handling routes for when Google OAuth is not configured
    app.get("/api/auth/google/customer", (req, res) => {
      res.status(503).json({ 
        error: "Google OAuth not configured", 
        message: "Google authentication is not available at this time" 
      });
    });

    app.get("/api/auth/google/restaurant", (req, res) => {
      res.status(503).json({ 
        error: "Google OAuth not configured", 
        message: "Google authentication is not available at this time" 
      });
    });

    app.get("/api/auth/google/customer/callback", (req, res) => {
      res.redirect("/?error=google_not_configured");
    });

    app.get("/api/auth/google/restaurant/callback", (req, res) => {
      res.redirect("/restaurant-signup?error=google_not_configured");
    });
  }

  // Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    console.log("Setting up Facebook OAuth strategy...");
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails', 'photos', 'first_name', 'last_name']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const userData: FacebookUserData = {
          facebookId: profile.id,
          email: profile.emails?.[0]?.value || null,
          firstName: profile.name?.givenName || profile._json?.first_name || null,
          lastName: profile.name?.familyName || profile._json?.last_name || null,
          profileImageUrl: profile.photos?.[0]?.value || null,
          facebookAccessToken: accessToken,
        };

        const user = await storage.upsertUserByAuth('facebook', userData, 'customer');
        // Send welcome email asynchronously (don't block auth flow)
        emailService.sendWelcomeEmail(user).catch(err => 
          console.error('Failed to send customer welcome email:', err)
        );
        // Send admin signup notification with context asynchronously
        emailService.sendAdminSignupNotification(user, { 
          signupMethod: 'facebook' 
        }).catch(err => 
          console.error('Failed to send admin signup notification:', err)
        );
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));

    // Facebook auth routes
    app.get(
      '/api/auth/facebook',
      passport.authenticate('facebook', { 
        scope: ['email', 'public_profile'] 
      })
    );

    app.get(
      '/api/auth/facebook/callback',
      passport.authenticate('facebook', { 
        failureRedirect: '/?error=auth_failed' 
      }),
      (req, res) => {
        res.redirect('/');
      }
    );
    console.log("✅ Facebook OAuth strategy configured successfully");
  } else {
    console.log("Facebook OAuth not configured: FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables are missing");
  }

  // Email/password registration for customers
  app.post("/api/auth/customer/register", async (req, res) => {
    try {
      const { email, firstName, lastName, phone, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Validate phone if provided
      if (phone && phone.length < 10) {
        return res.status(400).json({ error: "Valid phone number is required" });
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
        phone: phone || '',
        passwordHash,
      };

      const user = await storage.upsertUserByAuth('email', userData, 'customer');

      // Send welcome email asynchronously (don't block registration flow)
      emailService.sendWelcomeEmail(user).catch(err => 
        console.error('Failed to send customer welcome email:', err)
      );
      // Send admin signup notification with context asynchronously
      emailService.sendAdminSignupNotification(user, { 
        signupMethod: 'email' 
      }).catch(err => 
        console.error('Failed to send admin signup notification:', err)
      );

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
      const { email, firstName, lastName, phone, password } = req.body;

      if (!email || !firstName || !lastName || !phone || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      if (phone.length < 10) {
        return res.status(400).json({ error: "Valid phone number is required" });
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
        phone,
        passwordHash,
      };

      const user = await storage.upsertUserByAuth('email', userData, 'restaurant_owner');

      // Send welcome email asynchronously (don't block registration flow)
      emailService.sendWelcomeEmail(user).catch(err => 
        console.error('Failed to send restaurant owner welcome email:', err)
      );
      // Send admin signup notification with context asynchronously
      emailService.sendAdminSignupNotification(user, { 
        signupMethod: 'email' 
      }).catch(err => 
        console.error('Failed to send admin signup notification:', err)
      );

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

  // Email/password login for restaurant owners
  app.post("/api/auth/restaurant/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.userType !== 'restaurant_owner') {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.passwordHash || !await bcrypt.compare(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to log in" });
        }
        res.json({ user, message: "Login successful" });
      });
    } catch (error) {
      console.error("Restaurant login error:", error);
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

      // Manually set the session instead of using req.login
      (req.session as any).passport = { user: user.id };
      res.json({ user, message: "Login successful" });
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