# MealScout Security - Quick Reference

## 🔐 What's Been Secured

### Core Features Implemented ✅
- ✅ CORS whitelist validation (no more wildcard)
- ✅ Strict CSP headers (production hardened)
- ✅ Environment variable validation (blocks on missing config)
- ✅ Rate limiting (6 tiers, endpoint-specific)
- ✅ Password reset protection (database-backed)
- ✅ RBAC middleware (centralized auth)
- ✅ API key system (bcrypt hashed)
- ✅ Resource ownership (prevents privilege escalation)
- ✅ XSS prevention (dangerouslySetInnerHTML removed)
- ✅ Debug logging cleanup (no sensitive data)

---

## 🚀 Deployment Checklist

### Critical Setup
```bash
# Required - will block if missing in production
export DATABASE_URL="postgresql://user:pass@host/db"
export SESSION_SECRET="minimum-32-characters-long-random-string"
export ALLOWED_ORIGINS="https://yourdomain.com"

# Important
export NODE_ENV="production"
export PUBLIC_BASE_URL="https://yourdomain.com"
export BETA_MODE="false"
```

### Quick Start Verification
```bash
# 1. Check environment
echo $DATABASE_URL
echo $SESSION_SECRET
echo $ALLOWED_ORIGINS

# 2. Verify rate limiting works (should fail after 3 attempts)
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}'
  sleep 1
done

# 3. Check admin protection
curl -H "Authorization: Bearer invalid" \
  http://localhost:5000/api/admin/users
# Should return 403
```

---

## 📊 Rate Limiting Tiers

| Endpoint | Limit | Window |
|---|---|---|
| Password Reset | 3 | 10 min |
| Login/Signup | 5 | 15 min |
| Search | 50 | 1 min |
| Views | 120 | 1 min |
| Updates | 10 | 1 hour |
| General API | 30 | 1 min |

---

## 👥 User Roles & Access

### Role Hierarchy
```
super_admin
  ├─ All admin operations
  ├─ Invite other admins
  └─ Override any decision

admin
  ├─ View all users
  ├─ Manage restaurants
  ├─ Manage deals
  └─ Review verifications

restaurant_owner
  ├─ Manage own restaurant
  ├─ Create deals
  ├─ View analytics
  └─ Receive orders

customer
  ├─ Browse deals
  ├─ Claim discounts
  └─ Leave feedback
```

### Endpoint Protection
```
/api/admin/*              → isAdmin middleware
/api/restaurants/:id/*    → isRestaurantOwnerOrAdmin (if owner)
/api/deals/:dealId/*      → verifyResourceOwnership('deal')
/api/auth/*               → Public (with rate limiting)
```

---

## 🔑 API Key Usage

### For Service Integration
```bash
# Include in request header
curl -H "X-API-Key: sk_live_abc123def456..." \
  https://api.mealscout.us/api/deals

# Response if rate limited
HTTP/1.1 429 Too Many Requests
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-06T15:30:00Z
```

### Key Management Endpoints (To Be Implemented)
```bash
# Create new key
POST /api/api-keys
{"name": "POS Integration", "scope": "write"}
# Returns plaintext key (save now, can't retrieve later)

# List keys
GET /api/api-keys

# Revoke key
DELETE /api/api-keys/:keyId

# Rotate key (create new, revoke old)
POST /api/api-keys/:keyId/rotate
```

---

## 🛡️ Security Headers

### What's Now Checked
```
CORS:
  ✅ Origin validated against ALLOWED_ORIGINS
  ✅ No wildcard (*) origin
  ✅ WebSocket CORS matches HTTP CORS

CSP:
  ✅ Production: strict (no unsafe-eval, no unsafe-inline)
  ✅ Development: flexible (for debugging only)
  ✅ Scripts from 'self' only
  ✅ Styles from 'self' only

Cookies:
  ✅ httpOnly (can't access from JS)
  ✅ Secure (HTTPS only in production)
  ✅ SameSite=Lax (CSRF protection)
```

---

## 🚨 Common Issues & Solutions

### "Admin access required"
```
Problem: Non-admin trying to access admin endpoint
Solution: Verify user role in database
         UPDATE users SET userType='admin' WHERE id='...';
```

### "Rate limit exceeded"
```
Problem: Too many requests too fast
Solution: Wait for X-RateLimit-Reset header
         Check which endpoint triggered limit
         Adjust limit if legitimate use case
```

### "You do not own this resource"
```
Problem: Trying to modify someone else's data
Solution: Verify you own the restaurant/deal
         Use proper restaurantId/dealId in URL
         Ask admin if cross-ownership needed
```

### "CORS error" / "Not allowed by CORS"
```
Problem: Frontend domain not in ALLOWED_ORIGINS
Solution: Add to ALLOWED_ORIGINS environment variable
         Restart server with new config
         Clear browser cache
```

---

## 📋 Daily Security Checks

### Morning Standup
- [ ] Check error logs for security exceptions (403, 429)
- [ ] Verify no suspicious admin access patterns
- [ ] Confirm database backups completed
- [ ] Review any rate limit violations

### Weekly Review
- [ ] Audit all admin actions
- [ ] Check API key usage patterns
- [ ] Review failed authentication attempts
- [ ] Update security incident log

### Monthly Audit
- [ ] Full security log review
- [ ] Verify all rate limiters functioning
- [ ] Check for any new vulnerabilities
- [ ] Review RBAC role assignments

---

## 🔄 Common Operations

### Promote User to Admin
```javascript
// In backend/database
await db.update(users)
  .set({ userType: 'admin' })
  .where(eq(users.id, userId));
```

### Create Restaurant Owner Account
```javascript
// On signup with special flag
const user = await createUser({
  email, password, userType: 'restaurant_owner'
});
```

### Generate API Key for Service
```javascript
// Generate random key
const key = crypto.randomBytes(32).toString('hex');
const hash = await bcrypt.hash(key, 10);

// Store in database
await db.insert(apiKeys).values({
  userId, name, keyHash: hash, scope: 'write'
});

// Return plaintext (only once!)
return { key, name, scope };
```

### Revoke API Key
```javascript
// Deactivate instead of deleting
await db.update(apiKeys)
  .set({ isActive: false })
  .where(eq(apiKeys.id, keyId));
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SECURITY.md` | Architecture overview & policies |
| `SECURITY_IMPLEMENTATION.md` | Detailed implementation guide |
| `SECURITY_CHECKLIST.md` | Pre-deployment verification |
| `IMPLEMENTATION_SUMMARY.md` | Complete change summary |

---

## 🆘 Emergency Contacts

### Security Issues
- Email: (To configure)
- Response time: 24 hours (To establish)
- Escalation: (To document)

### Common Contacts
- Database: DBA team
- Infrastructure: DevOps team
- Monitoring: Infrastructure team

---

## ✅ Pre-Production Checklist

```
Environment Setup:
  [ ] DATABASE_URL configured for production
  [ ] SESSION_SECRET is 32+ random characters
  [ ] ALLOWED_ORIGINS set to production domain(s)
  [ ] NODE_ENV=production
  [ ] BETA_MODE not enabled

Security Features:
  [ ] Rate limiting active (test password reset)
  [ ] Admin endpoints protected (test 403 response)
  [ ] CORS whitelist working (test invalid origin)
  [ ] CSP headers correct (check browser console)
  [ ] API keys generating and validating

Infrastructure:
  [ ] HTTPS enabled on all endpoints
  [ ] SSL certificate valid
  [ ] Database backups scheduled
  [ ] Error logging configured
  [ ] Monitoring/alerts set up

Testing:
  [ ] All auth flows working
  [ ] Rate limiting blocking correctly
  [ ] Admin can access admin panel
  [ ] Users can't access each other's data
  [ ] API keys authenticate correctly
```

---

## 🎯 Quick Troubleshooting

### Server won't start
```
Check: Are DATABASE_URL and SESSION_SECRET set?
Fix: export DATABASE_URL="..."
     export SESSION_SECRET="..."
     npm start
```

### 403 on admin endpoint
```
Check: Is user role 'admin' or 'super_admin'?
Fix: Verify user.userType in database
     Add isAdmin middleware to route
```

### Rate limit too strict
```
Check: Are requests within allowed limits?
Adjust: Modify limits in server/index.ts
        Restart server
        Test again
```

### CORS blocking requests
```
Check: Is frontend domain in ALLOWED_ORIGINS?
Fix: export ALLOWED_ORIGINS="https://yourdomain.com"
     Restart server
     Clear browser cache
```

---

## 📞 Support Resources

- **Security Docs**: See SECURITY.md
- **Implementation Guide**: See SECURITY_IMPLEMENTATION.md
- **Code Comments**: Look for 🔒 SECURITY markers
- **Team Channel**: #security-mealscout

---

**Last Updated**: December 6, 2025  
**Version**: 1.0.0  
**Keep This Handy!** 📌
