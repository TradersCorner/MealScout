# Production Deployment Checklist

## Critical Environment Variables

Ensure these are set on your production platform (Render/Vercel):

### Required
```bash
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require
ADMIN_EMAIL=info.mealscout@gmail.com
ADMIN_PASSWORD=your-secure-password-here
SESSION_SECRET=your-random-secret-here
NODE_ENV=production
```

### Optional but Recommended
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
BREVO_API_KEY=...
```

## Super Admin Protection

The following protections are **permanently** in place for `info.mealscout@gmail.com`:

✅ **Cannot be deleted** - Storage layer blocks deletion  
✅ **Cannot be demoted** - API routes reject role changes  
✅ **Cannot be disabled** - Storage layer prevents disabling  
✅ **Auto-created on startup** - If account doesn't exist, it's created as `super_admin`  
✅ **Password sync** - Password is automatically synced with `ADMIN_PASSWORD` env var  

## Deployment Steps

### 1. Set Environment Variables
- Go to your hosting platform dashboard
- Set all required environment variables listed above
- **IMPORTANT**: Set `ADMIN_PASSWORD` to a strong, secure password

### 2. Deploy
```bash
git push origin main
```

### 3. Verify Super Admin
After deployment, log in at:
- URL: `https://yourdomain.com/login`
- Email: `info.mealscout@gmail.com`
- Password: (whatever you set in `ADMIN_PASSWORD`)

### 4. Access Admin Controls
After logging in, you'll see:
- **Admin** button in navigation → Full admin dashboard
- **Staff** button in navigation → Staff account creation tools

### 5. Grant Staff Permissions
1. Go to Admin Dashboard
2. Click "Staff" tab
3. Select any user and click "Promote to Staff"
4. Staff members can then create customer/restaurant accounts

## User Experience Flow

### Regular Users (Customers/Restaurant Owners)
1. Sign up at `/customer-signup` or `/restaurant-signup`
2. Login at `/login`
3. See customer navigation (Home, Search, Map, Video, Favorites, Profile)

### Staff Users
1. Promoted by super admin in Admin Dashboard → Staff tab
2. Login at `/login` (same as everyone else)
3. See staff navigation with "Dashboard" button
4. Can create customer and restaurant owner accounts

### Super Admin (info.mealscout@gmail.com)
1. Login at `/login` (same as everyone else)
2. See admin navigation with "Admin" and "Staff" buttons
3. Full access to all features
4. **Cannot** be removed or demoted (protected at code level)

## Testing Production

1. **Test super admin login**:
   - Go to `/login`
   - Use `info.mealscout@gmail.com` and your `ADMIN_PASSWORD`
   - Verify "Admin" and "Staff" buttons appear in navigation

2. **Test admin dashboard**:
   - Click "Admin" button
   - Verify all tabs load (Overview, Restaurants, Users, Staff, Deals, Verifications)

3. **Test staff promotion**:
   - Go to Staff tab
   - Promote a test user to staff
   - Log in as that user
   - Verify they see "Dashboard" button in navigation

4. **Test protection**:
   - Try to demote `info.mealscout@gmail.com` from Staff tab
   - Should see error: "Cannot modify super admin account"

## Rollback Plan

If something goes wrong:
1. Check production logs for errors
2. Verify environment variables are set correctly
3. Ensure `DATABASE_URL` is accessible
4. Check that `ADMIN_EMAIL` and `ADMIN_PASSWORD` match

## Support

If the super admin account isn't working:
1. Restart the production server to trigger `ensureAdminExists()`
2. Check logs for database connection errors
3. Verify `ADMIN_EMAIL=info.mealscout@gmail.com` is set
4. Verify `ADMIN_PASSWORD` is set to a valid value
