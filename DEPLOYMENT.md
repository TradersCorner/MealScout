# MealScout Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Environment Configuration
- [ ] All required environment variables are set
- [ ] Database connection is secure and configured
- [ ] Session secret is strong and unique
- [ ] Admin credentials are secure

### ✅ Security
- [ ] HTTPS is enabled
- [ ] Content Security Policy is configured
- [ ] Helmet security headers are active
- [ ] Database queries use parameterized statements
- [ ] Input validation is in place
- [ ] Rate limiting is configured (if needed)

### ✅ Performance
- [ ] Server compression is enabled
- [ ] Response caching headers are set
- [ ] Database queries are optimized
- [ ] Client-side caching is configured
- [ ] Image assets are optimized

### ✅ Database
- [ ] Database schema is up to date
- [ ] Proper indexes are created
- [ ] Connection pooling is configured
- [ ] Backup strategy is in place

### ✅ Monitoring
- [ ] Error logging is configured
- [ ] Performance metrics are tracked
- [ ] Health check endpoint is available
- [ ] Database monitoring is set up

## Required Environment Variables

### Essential
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure session secret (32+ characters)
- `REPLIT_DOMAINS` - Your deployment domain

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