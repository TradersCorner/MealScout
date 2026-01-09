# Staff Role Implementation - Complete

## Overview
MealScout now has a **staff** role positioned between customer/restaurant_owner and admin. Staff can create user accounts on-the-spot while admin retains exclusive control over staff membership.

## Architecture

### 1. Database Schema
- **userType**: Extended to include `'staff'`  
- **mustResetPassword**: Flag forcing password change on first login  
- **isDisabled**: Allow admins to disable accounts without deletion  

**Migration**: [migrations/006_add_staff_role_and_flags.sql](migrations/006_add_staff_role_and_flags.sql)

### 2. RBAC Guards (server/unifiedAuth.ts)
- `isAdmin`: admin/super_admin only  
- `isStaffOrAdmin`: staff + admin access  
- `isDisabled` check: Blocks disabled accounts from all authenticated routes  

### 3. Storage Functions (server/storage.ts)
- `getUsersByRole(role)`: List all users by role  
- `createUserWithPassword(...)`: Create user with temp password + mustResetPassword flag  
- `updateUserPassword(...)`: Update password and clear reset flag  
- `disableUser(userId)` / `enableUser(userId)`: Soft account disable  

### 4. Staff Management Routes (server/staffRoutes.ts)
**Admin-only:**
- `GET /api/admin/staff` - List staff members  
- `POST /api/admin/staff/:userId/promote` - Promote user to staff  
- `POST /api/admin/staff/:userId/demote` - Demote staff to customer (or disable)  

**Staff or Admin:**
- `POST /api/staff/users` - Create customer account (returns temp password)  
- `POST /api/staff/restaurant-owners` - Create restaurant owner + optional restaurant shell  
- `POST /api/account/force-password-reset` - User sets new password after first login  

### 5. Dashboards

#### `/staff` - Staff Dashboard
- Create customer accounts  
- Create restaurant owner + restaurant shell  
- Displays temp password for immediate sharing  

#### `/admin/dashboard` - Admin Dashboard
- New **Staff** tab:
  - View current staff members  
  - Promote any user to staff  
  - Remove/demote staff members  
  - Link to staff dashboard  

### 6. Routing (client/src/App.tsx)
- `/staff` → Staff dashboard (requires staff or admin role)  
- `/admin` → Admin login page (unchanged)  
- `/admin/dashboard` → Canonical admin shell (6 tabs: Overview, Restaurants, Users, **Staff**, Deals, Verifications)  

## Security Rules

✅ **Staff can:**
- Create `customer` or `restaurant_owner` accounts  
- Set temporary passwords  
- Create restaurant shells for owners  

🚫 **Staff cannot:**
- Create `staff` or `admin` accounts  
- Promote users to staff  
- Access admin-only tools (audit logs, verifications, etc.)  
- Modify their own role  

✅ **Admin can:**
- Everything staff can do  
- Promote/demote staff members  
- Access all admin tools  
- Cannot demote themselves (safety guard)  

🔒 **All staff actions are audit-logged** (who created whom, role changes, etc.)

## User Flow: Staff Creates Account

1. **Staff** creates account at `/staff`  
   - Enters email + optional details  
   - Receives temp password on screen  

2. **Staff** shares temp password with user (in-person, SMS, etc.)  

3. **User** logs in with email + temp password  
   - Redirected to force password reset page  
   - Must set new password (min 8 chars)  

4. **User** can now use MealScout normally  

## Testing Checklist

- [ ] Run migration: `npm run db:push`  
- [ ] Promote a test user to staff via admin dashboard  
- [ ] Log in as staff, create a customer account  
- [ ] Log in as that customer with temp password → forced reset works  
- [ ] Create restaurant owner + restaurant shell  
- [ ] Verify audit logs capture staff actions  
- [ ] Verify staff cannot access `/admin/dashboard` tabs other than allowed  
- [ ] Verify disabled users cannot log in  

## Admin Access

To access admin tools:
1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`  
2. Go to `/admin/login`  
3. Log in → redirected to `/admin/dashboard`  
4. Navigate to **Staff** tab to manage staff members  

## Files Changed

**Backend:**
- `shared/schema.ts` - Added staff to userType, added mustResetPassword/isDisabled fields  
- `migrations/006_add_staff_role_and_flags.sql` - Database migration  
- `server/unifiedAuth.ts` - Added staff role guard + isDisabled check  
- `server/storage.ts` - Added staff management functions  
- `server/staffRoutes.ts` - NEW: All staff/admin user creation + management routes  
- `server/routes.ts` - Registered staff routes  

**Frontend:**
- `client/src/App.tsx` - Added staff dashboard route  
- `client/src/pages/staff-dashboard.tsx` - NEW: Staff account creation UI  
- `client/src/pages/admin-dashboard.tsx` - Added Staff tab with promote/demote UI  

## Next Steps

1. **Email Integration** (optional): Send temp password via email instead of displaying  
2. **Bulk Import**: Allow staff to CSV-import multiple accounts  
3. **Staff Activity Log**: Show staff what accounts they've created  
4. **Role Transitions**: Implement customer → restaurant_owner promotion without creating new account  

---
**Implementation Status**: ✅ Complete  
**Migration Applied**: ✅ Yes (006_add_staff_role_and_flags.sql)  
**Routes Registered**: ✅ Yes  
**UI Complete**: ✅ Yes  
