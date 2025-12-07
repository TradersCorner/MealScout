# MealScout Production Deployment Guide

## 🚀 Quick Deploy (Recommended: Render.com)

**Get your site live in 10 minutes - FREE tier available**

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Deploy MealScout"
git remote add origin https://github.com/TradersCorner/MealScout.git
git push -u origin main
```

### Step 2: Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### Step 3: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: `mealscout-db`
3. Select **Free** tier
4. Click "Create Database"
5. **Copy the "Internal Database URL"** (you'll need this next)

### Step 4: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repo: `TradersCorner/MealScout`
3. Configure:
   - **Name:** `mealscout`
   - **Root Directory:** `MealScout/MealScout` *(adjust if needed)*
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Step 5: Add Environment Variables
In the "Environment" section, add:
```
DATABASE_URL=<paste your Render PostgreSQL URL from Step 3>
SESSION_SECRET=<generate random 32-character string>
NODE_ENV=production
PORT=10000
```

Optional (add later when ready):
```
BREVO_API_KEY=your_email_api_key
GOOGLE_CLIENT_ID=your_oauth_id
GOOGLE_CLIENT_SECRET=your_oauth_secret
FACEBOOK_APP_ID=your_fb_app_id
FACEBOOK_APP_SECRET=your_fb_secret
ADMIN_USERNAME=your_admin_user
ADMIN_PASSWORD=your_admin_pass
```

### Step 6: Deploy!
- Click "Create Web Service"
- Render builds and deploys automatically
- **Your site is live at:** `https://mealscout.onrender.com`

### Step 7: Connect Your Domain (Optional)
1. In Render dashboard → Settings → Custom Domain
2. Add your domain: `mealscout.com`
3. Update DNS at your domain registrar:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: mealscout.onrender.com
   ```
4. Wait 5-10 minutes for DNS propagation
5. ✅ Your site is live at `https://mealscout.com`

---

## Alternative: Railway.app (Also Free & Fast)

1. Push code to GitHub (same as above)
2. Sign up at [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Select `TradersCorner/MealScout`
5. Add PostgreSQL: New → Database → PostgreSQL
6. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
7. Add `SESSION_SECRET` environment variable
8. Deploy → Generate Domain

---

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] Build script works: `npm run build`
- [x] Start script works: `npm start`
- [x] Environment variables configured
- [x] Database connection tested

### ✅ Security (Already Configured)
- [x] HTTPS enabled (automatic on Render/Railway)
- [x] Helmet security headers active
- [x] Session secret required
- [x] Database parameterized queries

## Required Environment Variables

### Essential
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure session secret (32+ characters)
- Configure your deployment domain in your hosting platform settings

### Optional but Recommended
- `STRIPE_SECRET_KEY` - For payment processing
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key
- `ADMIN_EMAIL` - Admin account email
- `ADMIN_PASSWORD` - Admin account password

### Social Authentication (Optional)
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

## Deployment Steps

1. **Set Environment Variables**
   ```bash
   # Set all required environment variables in your deployment platform
   ```

2. **Database Setup**
   ```bash
   npm run db:push
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Production Server**
   ```bash
   npm start
   ```

## Health Check

The application includes a health check endpoint at `/api/health` that verifies:
- Database connectivity
- Session store availability  
- Basic application functionality

## Performance Optimizations Applied

- **Server-side compression** for reduced bandwidth
- **Response caching** with appropriate headers
- **Database query optimization** with result limits
- **Client-side caching** with React Query
- **Security headers** with Helmet
- **Request/response logging** for monitoring

## Security Measures

- **Content Security Policy** preventing XSS attacks
- **Helmet middleware** for various security headers
- **Session security** with secure cookies
- **Input validation** with Zod schemas
- **SQL injection prevention** with parameterized queries
- **Authentication middleware** protecting sensitive routes

## Troubleshooting

### Common Issues
1. **Database connection failed** - Check DATABASE_URL and network access
2. **Session errors** - Verify SESSION_SECRET is set and secure
3. **Build failures** - Ensure all dependencies are installed
4. **Performance issues** - Check database indexes and query performance

### Debug Mode
Enable debug logging by setting `DEBUG=*` in development.

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review security settings

---

**MealScout v1.0** - Production Ready ✅