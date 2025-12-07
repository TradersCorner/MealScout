# MealScout Security Implementation

## Overview
This document outlines the security architecture and controls implemented in MealScout backend.

---

## 1. Authentication & Authorization

### Session-Based Authentication
- **Method**: Express sessions with PostgreSQL store
- **Duration**: 7 days (604,800,000 ms)
- **Cookies**: httpOnly, Secure (production), SameSite=Lax
- **Session Storage**: PostgreSQL table for persistence across restarts

### OAuth Support
- **Google OAuth 2.0**: For both customers and restaurant owners
- **Facebook OAuth**: For customers
- **Email/Password**: With bcrypt password hashing (10 rounds)

### Role-Based Access Control (RBAC)
```
user_type values:
- 'customer'          → Normal user, browse deals
- 'restaurant_owner'  → Manage own restaurant(s)
- 'admin'             → Global administrative access
- 'super_admin'       → Invite admins, highest privilege
```

### Authorization Middleware
```typescript
// Endpoint protection examples:
POST /api/deals            → isAuthenticated + isRestaurantOwnerOrAdmin
PATCH /api/deals/:dealId   → isAuthenticated + verifyResourceOwnership('deal')
DELETE /api/deals/:dealId  → isAuthenticated + verifyResourceOwnership('deal')
PATCH /api/restaurants/:id → isAuthenticated + verifyResourceOwnership('restaurant')
```

---

## 2. API Authentication

### API Keys
- **Storage**: Hashed in database using bcryptjs
- **Format**: 32-64 bytes, random generation
- **Headers**: `X-API-Key: sk_...` (Bearer not used)
- **Scope**: 'read' | 'write' | 'admin'
- **Expiration**: Optional, checked at validation time
- **Rotation**: Full regeneration required

### API Key Lifecycle
1. Generate random key (32+ bytes)
2. Hash with bcrypt (rounds: 10)
3. Store hash + prefix in database
4. Return plaintext once (never again)
5. Display prefix for identification

---

## 3. Rate Limiting

### Granular Rate Limiting Policy
| Endpoint Type | Window | Limit | Purpose |
|---|---|---|---|
| Password Reset | 10 min | 3 | Prevent brute force |
| Login/Signup | 15 min | 5 | Prevent account takeover |
| Search | 1 min | 50 | Allow normal discovery |
| Deal Views | 1 min | 120 | Engagement tracking |
| Content Updates | 1 hr | 10 | Prevent spam editing |
| General API | 1 min | 30 | Baseline protection |

### Rate Limit Response
```json
HTTP/1.1 429 Too Many Requests

{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again after 45 seconds.",
  "retryAfter": 45
}

Headers:
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-12-06T15:30:45.000Z
```

---

## 4. CORS & WebSocket Security

### Allowed Origins (Environment Variable)
```bash
# Single domain
ALLOWED_ORIGINS=https://mealscout.us

# Multiple domains
ALLOWED_ORIGINS=https://mealscout.us,https://app.mealscout.us,http://localhost:5000

# Default (development)
ALLOWED_ORIGINS=http://localhost:5000
```

### WebSocket Connection
- **Authentication**: Via Express session (same as HTTP)
- **CORS**: Restricted to ALLOWED_ORIGINS
- **Handshake**: Required before any event transmission

---

## 5. Content Security Policy (CSP)

### Production CSP
```
default-src 'self'
styleSrc 'self'
scriptSrc 'self'
imgSrc 'self' data: https:
connectSrc 'self' https: ws: wss:
fontSrc 'self' https: data:
```

### Development CSP
```
default-src 'self' data: https:
styleSrc 'self' 'unsafe-inline' https:
scriptSrc 'self' https:
connectSrc 'self' https: wss: ws:
  https://geocoding.census.gov
  https://nominatim.openstreetmap.org
  ... (external APIs)
```

---

## 6. Data Protection

### Password Reset Tokens
- **Storage**: Database-backed (not in-memory)
- **Format**: Random 32-byte token, hashed with SHA-256
- **TTL**: 1 hour expiration
- **Rate Limit**: 3 attempts per 15 minutes
- **Invalidation**: Automatic on use or expiry

### Database
- **Connection**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM (prevents SQL injection)
- **Queries**: Parameterized (no string interpolation)

### Hashing
- **Passwords**: bcryptjs (10 rounds)
- **API Keys**: bcryptjs (10 rounds)
- **Tokens**: SHA-256

---

## 7. Resource Ownership

### Verification Middleware
```typescript
verifyResourceOwnership('restaurant') 
  → Check user.id === restaurant.ownerId
  
verifyResourceOwnership('deal')
  → Check user owns deal's restaurant
  
Bypass: admin or super_admin roles
```

### Protected Operations
```
PATCH /api/deals/:dealId                        ✓ Ownership check
DELETE /api/deals/:dealId                       ✓ Ownership check
PATCH /api/restaurants/:id/location             ✓ Ownership check
PATCH /api/restaurants/:id/operating-hours      ✓ Ownership check
DELETE /api/restaurants/:id                     ✓ Ownership check
```

---

## 8. Input Validation

### Zod Schema Validation
- All POST/PUT/PATCH requests validated against Zod schemas
- Type coercion and sanitization
- Email, phone, URL format validation
- Numeric range validation

### File Upload Validation
- **Accepted Types**: JPEG, PNG, PDF
- **Max Size**: 10 MB
- **Max Files**: 5 per submission
- **Validation**: MIME type + size check

---

## 9. Environment Variables (Required)

### Critical (Must Have)
```bash
DATABASE_URL              # PostgreSQL connection string
SESSION_SECRET            # Min 32 characters
ALLOWED_ORIGINS          # Comma-separated domain list
```

### Important (Recommended)
```bash
NODE_ENV=production
PUBLIC_BASE_URL=https://yourdomain.com
STRIPE_SECRET_KEY=...    # For payment features
```

### Validation
- **Startup Check**: Blocks production if critical vars missing
- **Development**: Warns but allows startup

---

## 10. Security Checklist

### Authentication ✅
- [x] Session-based auth with PostgreSQL store
- [x] OAuth 2.0 (Google, Facebook)
- [x] Password hashing with bcrypt
- [x] Email verification capability
- [x] API key authentication

### Authorization ✅
- [x] Role-based access control (RBAC)
- [x] Resource ownership verification
- [x] Admin/Super-admin distinctions

### Data Protection ✅
- [x] Database-backed rate limiting
- [x] Token expiration (password reset)
- [x] ORM prevents SQL injection
- [x] Input validation via Zod

### API Security ✅
- [x] CORS whitelist enforcement
- [x] CSP headers (production & dev)
- [x] Granular rate limiting
- [x] httpOnly secure cookies
- [x] HTTPS-only in production

### Infrastructure ✅
- [x] Environment variable validation
- [x] Graceful error handling
- [x] Error logging without leaking secrets
- [x] WebSocket authentication

---

## 11. Common Attack Mitigations

| Attack Type | Mitigation |
|---|---|
| Brute Force | Rate limiting on login (3-5 per 15 min) |
| SQL Injection | Drizzle ORM + parameterized queries |
| XSS | CSP headers, no dangerouslySetInnerHTML |
| CSRF | SameSite cookies + session validation |
| CORS | ALLOWED_ORIGINS whitelist |
| Account Takeover | Session timeout + secure cookies |
| Privilege Escalation | RBAC middleware on all operations |
| Data Leakage | Resource ownership checks |
| DoS | Rate limiting + connection timeouts |

---

## 12. Deployment Security

### Pre-Deployment Checklist
```bash
# 1. Verify environment variables
DATABASE_URL="..."
SESSION_SECRET="[32+ chars]"
ALLOWED_ORIGINS="https://yourdomain.com"
NODE_ENV="production"
PUBLIC_BASE_URL="https://yourdomain.com"

# 2. Run TypeScript check
npm run check

# 3. Review recent changes
git log --oneline -10

# 4. Test authentication flows
# - Login with email/password
# - OAuth signup
# - API key authentication
# - Admin operations

# 5. Enable HTTPS only
# - Certificate: Let's Encrypt
# - Redirect HTTP → HTTPS
# - HSTS headers enabled
```

---

## 13. API Key Management

### Generating an API Key
```bash
# Backend endpoint (to be implemented):
POST /api/api-keys

Request:
{
  "name": "POS Integration",
  "scope": "write",
  "expiresAt": "2026-12-06T00:00:00Z"
}

Response:
{
  "id": "key_abc123...",
  "name": "POS Integration",
  "keyPrefix": "sk_live_abc123",
  "key": "sk_live_abc123def456ghi789jkl012mno345pqr",
  "scope": "write",
  "expiresAt": "2026-12-06T00:00:00Z",
  "createdAt": "2025-12-06T12:00:00Z"
}

⚠️  IMPORTANT: Key only displayed once - save securely!
```

### Using an API Key
```bash
curl -H "X-API-Key: sk_live_abc123def456..." https://api.mealscout.us/api/deals
```

---

## 14. Incident Response

### If Credentials Compromised
1. Rotate SESSION_SECRET immediately
2. Invalidate all active sessions
3. Force re-authentication
4. Review audit logs

### If API Key Compromised
1. Deactivate the key
2. Generate new key
3. Update all clients using old key
4. Monitor usage patterns

### If Database Breached
1. Rotate DATABASE_URL
2. Check for unauthorized changes
3. Review access logs
4. Notify users if personal data exposed

---

## 15. Future Enhancements

- [ ] Implement 2FA/MFA support
- [ ] Add audit logging for all admin actions
- [ ] Implement API key scoping per resource
- [ ] Add request signing for sensitive operations
- [ ] Implement IP whitelisting for admin endpoints
- [ ] Add CAPTCHA to public endpoints
- [ ] Implement secret scanning in CI/CD
- [ ] Regular penetration testing

---

**Last Updated**: December 6, 2025
**Status**: Production Ready
**Review Cycle**: Quarterly
