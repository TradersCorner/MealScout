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
import crypto from "crypto";

// Session configuration (moved from facebookAuth.ts)
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionTtl,
    },
  });
}

export async function setupUnifiedAuth(app: Express) {
  // Get canonical base URL for OAuth callbacks - must be set for multi-user access
  const getBaseUrl = () => {
    if (process.env.PUBLIC_BASE_URL) {
      return process.env.PUBLIC_BASE_URL;
    }
    // Fallback for local development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:5000';
    }
    throw new Error('PUBLIC_BASE_URL must be set for OAuth to work with multiple users');
  };
  const baseUrl = getBaseUrl();
  
  // Set up passport serialization for email/password auth
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Handle cases where id might not be a string (old session format)
      if (!id || typeof id !== 'string') {
        return done(null, false);
      }
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      // For user not found or other errors, return false to clear the session
      done(null, false);
    }
  });

  // Google Strategy and routes for all users (only enabled if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Setting up Google OAuth strategies...");
    console.log('🔵 Google OAuth customer callback URL:', `${baseUrl}/api/auth/google/customer/callback`);
    console.log('🔵 Google OAuth restaurant callback URL:', `${baseUrl}/api/auth/google/restaurant/callback`);
    
    passport.use('google-customer', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/api/auth/google/customer/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('🔍 Google customer profile data received:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          name: profile.name,
          photos: profile.photos,
          _json: profile._json ? {
            given_name: profile._json.given_name,
            family_name: profile._json.family_name,
            email: profile._json.email,
            picture: profile._json.picture
          } : null
        });

        const userData: GoogleUserData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value || profile._json?.email || null,
          firstName: profile.name?.givenName || profile._json?.given_name || profile.displayName?.split(' ')[0] || 'Google',
          lastName: profile.name?.familyName || profile._json?.family_name || profile.displayName?.split(' ').slice(1).join(' ') || 'User',
          profileImageUrl: profile.photos?.[0]?.value || profile._json?.picture || null,
          googleAccessToken: accessToken,
        };

        console.log('🔍 Processed Google customer user data:', {
          googleId: userData.googleId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasProfileImage: !!userData.profileImageUrl
        });

        const user = await storage.upsertUserByAuth('google', userData, 'customer');
        console.log('✅ Google customer user created/updated successfully:', { userId: user.id, email: user.email });
        
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
        console.error('❌ Google customer authentication error:', error);
        console.error('❌ Profile data that caused error:', profile);
        return done(error, null);
      }
    }));

    passport.use('google-restaurant', new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/api/auth/google/restaurant/callback`,
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('🔍 Google restaurant profile data received:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          name: profile.name,
          photos: profile.photos,
          _json: profile._json ? {
            given_name: profile._json.given_name,
            family_name: profile._json.family_name,
            email: profile._json.email,
            picture: profile._json.picture
          } : null
        });

        const userData: GoogleUserData = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value || profile._json?.email || null,
          firstName: profile.name?.givenName || profile._json?.given_name || profile.displayName?.split(' ')[0] || 'Google',
          lastName: profile.name?.familyName || profile._json?.family_name || profile.displayName?.split(' ').slice(1).join(' ') || 'User',
          profileImageUrl: profile.photos?.[0]?.value || profile._json?.picture || null,
          googleAccessToken: accessToken,
        };

        console.log('🔍 Processed Google restaurant user data:', {
          googleId: userData.googleId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasProfileImage: !!userData.profileImageUrl
        });

        const user = await storage.upsertUserByAuth('google', userData, 'restaurant_owner');
        console.log('✅ Google restaurant user created/updated successfully:', { userId: user.id, email: user.email });
        
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
        console.error('❌ Google restaurant authentication error:', error);
        console.error('❌ Profile data that caused error:', profile);
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
      callbackURL: (() => {
        const callbackUrl = `${baseUrl}/api/auth/facebook/callback`;
        console.log('🔵 Facebook OAuth callback URL:', callbackUrl);
        return callbackUrl;
      })(),
      profileFields: ['id', 'displayName', 'emails', 'photos', 'first_name', 'last_name']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('🔍 Facebook profile data received:', {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          name: profile.name,
          photos: profile.photos,
          _json: profile._json ? {
            first_name: profile._json.first_name,
            last_name: profile._json.last_name,
            email: profile._json.email
          } : null
        });

        const userData: FacebookUserData = {
          facebookId: profile.id,
          email: profile.emails?.[0]?.value || profile._json?.email || null,
          firstName: profile.name?.givenName || profile._json?.first_name || profile.displayName?.split(' ')[0] || 'Facebook',
          lastName: profile.name?.familyName || profile._json?.last_name || profile.displayName?.split(' ').slice(1).join(' ') || 'User',
          profileImageUrl: profile.photos?.[0]?.value || null,
          facebookAccessToken: accessToken,
        };

        console.log('🔍 Processed Facebook user data:', {
          facebookId: userData.facebookId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          hasProfileImage: !!userData.profileImageUrl
        });

        const user = await storage.upsertUserByAuth('facebook', userData, 'customer');
        console.log('✅ Facebook user created/updated successfully:', { userId: user.id, email: user.email });
        
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
        console.error('❌ Facebook authentication error:', error);
        console.error('❌ Profile data that caused error:', profile);
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
      (req, res, next) => {
        console.log('🔍 Facebook OAuth callback reached:', {
          query: req.query,
          hasError: !!req.query.error,
          errorDescription: req.query.error_description
        });
        next();
      },
      passport.authenticate('facebook', { 
        failureRedirect: '/?error=auth_failed&source=facebook' 
      }),
      (req, res) => {
        console.log('✅ Facebook OAuth callback success:', { userId: (req.user as any)?.id });
        // Add cache-busting parameter to ensure fresh page load
        res.redirect('/?auth=success&t=' + Date.now());
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

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether email exists - always return success
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Clean up existing tokens for this user
      await storage.deleteUserResetTokens(user.id);

      // Create new reset token
      await storage.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
        requestIp: req.ip || req.connection.remoteAddress || undefined,
        userAgent: req.get('User-Agent') || undefined,
      });

      // Generate reset URL
      const baseUrl = process.env.PUBLIC_BASE_URL || 
                     (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send reset email
      await emailService.sendPasswordResetEmail(user, resetUrl);

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Unable to process password reset request" });
    }
  });

  // Validate reset token
  app.get("/api/auth/reset-password/validate", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.json({ valid: false, error: "Invalid token" });
      }

      // Hash the token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find token in database
      const resetToken = await storage.getPasswordResetTokenByTokenHash(tokenHash);
      
      if (!resetToken) {
        return res.json({ valid: false, error: "Token not found or already used" });
      }

      // Check if token has expired
      if (new Date() > resetToken.expiresAt) {
        return res.json({ valid: false, error: "Token has expired" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Token validation error:", error);
      res.json({ valid: false, error: "Unable to validate token" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Hash the token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find and validate token
      const resetToken = await storage.getPasswordResetTokenByTokenHash(tokenHash);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Check if token has expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ error: "Reset token has expired" });
      }

      // Get user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user password
      await storage.updateUser(user.id, { passwordHash });

      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Unable to reset password" });
    }
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