# Quick Start: Fix Admin Login & Test Authentication

## Step 1: Create .env file

Create a `.env` file in the root directory with your database connection:

```bash
DATABASE_URL=postgresql://mealscout_owner:YOUR_PASSWORD@ep-withered-sea-a4gvhpej.us-east-1.aws.neon.tech/mealscout?sslmode=require
SESSION_SECRET=your-random-secret-here
NODE_ENV=development
```

## Step 2: Reset Admin Password

Run the admin password reset script:

```bash
npx tsx scripts/fixAdminLogin.ts
```

This will set the password for `info.mealscout@gmail.com` to `Roundtable4!`

## Step 3: Test Login

### Start Development Server:

```bash
npm run dev
```

### Test Admin Login:

1. Navigate to: http://localhost:5000/admin-login
2. Email: `info.mealscout@gmail.com`
3. Password: `Roundtable4!`
4. Should redirect to `/admin/dashboard`

### Test Customer Login:

1. Navigate to: http://localhost:5000/login
2. Use any registered user credentials
3. Should stay logged in and maintain session

## What Was Fixed

### Issue 1: Manual Session Setting

**Before:**

```typescript
(req.session as any).passport = { user: user.id };
```

**After:**

```typescript
req.login(user, (err) => {
  if (err) {
    return res.status(500).json({ error: "Failed to establish session" });
  }
  res.json({ user, message: "Login successful" });
});
```

### Issue 2: Session Not Persisting

- Changed both `/api/auth/login` and `/api/auth/tradescout/sso` endpoints
- Now properly uses Passport's `req.login()` method
- Sessions are correctly serialized and saved
- User data persists across page reloads

## Verification Checklist

After starting the server:

- [ ] Admin can log in at `/admin-login`
- [ ] Admin stays logged in after page refresh
- [ ] Customer can log in at `/login`
- [ ] Customer stays logged in after page refresh
- [ ] Logout works (`/api/auth/logout`)
- [ ] User data is maintained in session
- [ ] No "Invalid email or password" errors for correct credentials

## Troubleshooting

### "DATABASE_URL must be set"

- Create `.env` file with DATABASE_URL

### "Invalid email or password"

- Run `npx tsx scripts/fixAdminLogin.ts` to reset password
- Verify email is exact: `info.mealscout@gmail.com`
- Verify password is exact: `Roundtable4!`

### "Session not persisting"

- Ensure SESSION_SECRET is set in `.env`
- Check browser allows cookies
- Check no CORS issues in browser console

### "User data lost on refresh"

- Fixed by using `req.login()` instead of manual session
- Ensure Passport deserializeUser is working (logs user lookup)

## Files Modified

1. `server/unifiedAuth.ts` - Fixed login endpoints to use `req.login()`
2. `scripts/fixAdminLogin.ts` - Created admin password reset script

## Next Steps

Once authentication is working:

1. Run database migration: `npm run db:push` (requires `.env` with DATABASE_URL)
2. Test all user flows
3. Deploy to production
