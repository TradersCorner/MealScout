# Admin Stats Integrity Audit & Fixes

## Objective
Resolve count mismatches and ensure accurate admin dashboard metrics.

## Audit Results (Feb 24, 2026)

### User Coverage
- **Total Users**: 45
- **Active Users**: 29 (disabled: 16)
- **Role Total**: 29 (consistent with active users) ✅

### Role Breakdown
- Customer: 3
- Food Truck: 3
- Restaurant Owner: **0** ❌ (should be 12)
- Host: 10
- Event Coordinator: 1
- Staff: 6
- Admin: 3
- Super Admin: 1
- Other: 2

### Restaurant Analysis
- **Total Restaurants**: 1,025
- **Unique Owners**: 12
- **Verified**: 6
- **Unverified**: 1,019

### Host Analysis
- **Total Hosts**: 20
- **Unique Host Users**: 13
- **Verified**: 16
- **Unverified**: 4

## Issues Identified

### 🔴 CRITICAL: Restaurant Role Assignment Missing
- **Problem**: 12 owners have restaurants but NO users have `restaurant_owner` role
- **Impact**: Admin stats show 0 restaurant owners, but system has 1,025 restaurants
- **Root Cause**: Likely restaurants created via import or API without role assignment

### 🟠 HIGH: Anomalous Data - Single Owner with 1,002 Restaurants
- **Owner ID**: d6910fa9-2a02-4ba5-b604-69b9191864bf
- **Restaurant Count**: 1,002 (vs normal 1-4)
- **Status**: Likely data quality issue from import
- **Action**: Review and consolidate

### 🟡 MEDIUM: Multiple Hosts Per User
- **User fd64d4d8-98b1-4bed-a4b3-502cd9320f84**: 2 hosts
- **User 28db2cd0-ba65-403d-96c3-27fa00b9379c**: 3 hosts  
- **User ce8b599b-583c-4577-806e-485373546e8e**: 5 hosts
- **Impact**: May cause double-counting in capacity calculations

### 🟡 MEDIUM: Multiple Restaurants Per Owner
- **8 owners with 2-4 restaurants each** (expected, legitimate)
- **1 owner with 1,002 restaurants** (anomalous, needs investigation)

## Fixes Required

### Fix 1: Assign restaurant_owner role to restaurant owners
- Identify all distinct owners in restaurants table
- Ensure they have restaurant_owner role in users table
- Status: NOT STARTED

### Fix 2: Consolidate anomalous restaurant data
- Investigate owner d6910fa9-2a02-4ba5-b604-69b9191864bf
- Determine if 1,002 restaurants should be:
  - Consolidated into fewer profiles
  - Deleted as duplicates
  - Split among other owners
- Status: PENDING INVESTIGATION

### Fix 3: Review multiple-host scenarios
- Check users with 3+ hosts for legitimate use cases
- Ensure capacity calculations don't double-count
- Status: NOT STARTED

## Next Steps
1. Run role assignment fix
2. Investigate and clean restaurant consolidation
3. Verify final admin stats consistency
