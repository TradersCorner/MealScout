# Deal Creation End-to-End Verification Checklist
**Date**: January 7, 2026
**URL**: http://localhost:5174/deal-creation
**Backend Terminal**: 3d22d0e2 (port 5200)

---

## ✅ DATABASE VERIFICATION COMPLETE

### Schema Changes Verified:
- ✅ `image_url` is **NOT NULL** (required)
- ✅ `available_during_business_hours` added (boolean, default: false)
- ✅ `is_ongoing` added (boolean, default: false)
- ✅ `end_date` is **NULLABLE**
- ✅ `start_time` is **NULLABLE**
- ✅ `end_time` is **NULLABLE**
- ✅ No existing rows with NULL image_url (0 found)
- ✅ All 10 seed deals have images

---

## 🧪 UI VALIDATION TESTS (12 Minutes)

### Setup:
1. Open http://localhost:5174/deal-creation in Chrome
2. Open DevTools (F12) → Network tab
3. Filter for "deals" to see POST requests
4. Keep backend terminal visible for logs

---

### TEST A: Image Required ❌→✅

**Steps:**
1. Fill out the form:
   - Title: "Test Deal No Image"
   - Description: "Testing required image validation"
   - Deal Type: Percentage, 10%
   - Min Order: $15
   - Start Date: Today
   - End Date: +7 days
   - Start Time: 11:00
   - End Time: 15:00
2. **DO NOT upload an image**
3. Click "Publish Deal"

**Expected Results:**
- ❌ Form does NOT submit
- ❌ No network request appears in DevTools
- ✅ Upload area shows **red border**
- ✅ Upload area shows **asterisk (*)**
- ✅ Form validation message appears: "Deal image is required"

**Actual Result:** __________________________

**Pass/Fail:** [ ] PASS  [ ] FAIL

---

### TEST B: Business Hours Checkbox ⏰→✅

**Steps:**
1. Upload an image first (any JPG/PNG)
2. Fill basic fields (title, description, discount)
3. **Check** "Available anytime during business hours"
4. Observe Start Time and End Time fields
5. Click "Publish Deal"
6. In DevTools Network → Click the POST request → "Payload" tab

**Expected Results:**
- ✅ Start Time field becomes **disabled** (grayed out)
- ✅ End Time field becomes **disabled** (grayed out)
- ✅ Fields show asterisk (*) disappears from time labels
- ✅ Request payload contains:
  ```json
  {
    "availableDuringBusinessHours": true,
    "startTime": null,
    "endTime": null
  }
  ```
- ✅ Backend logs show: `startTime: null, endTime: null`

**Actual Payload:** 
```json


```

**Pass/Fail:** [ ] PASS  [ ] FAIL

---

### TEST C: Ongoing Deal Checkbox 📅→✅

**Steps:**
1. Upload an image
2. Fill basic fields
3. **Check** "Ongoing deal (no expiration date)"
4. Observe End Date field
5. Click "Publish Deal"
6. In DevTools Network → Click the POST request → "Payload" tab

**Expected Results:**
- ✅ End Date field becomes **disabled** (grayed out)
- ✅ Asterisk (*) disappears from End Date label
- ✅ Request payload contains:
  ```json
  {
    "isOngoing": true,
    "endDate": null
  }
  ```
- ✅ Backend logs show: `isOngoing: true, endDate: null`

**Actual Payload:**
```json


```

**Pass/Fail:** [ ] PASS  [ ] FAIL

---

### TEST D: Combined (Business Hours + Ongoing) 🔄

**Steps:**
1. Upload an image
2. Fill basic fields
3. **Check BOTH**:
   - "Available anytime during business hours"
   - "Ongoing deal (no expiration date)"
4. Click "Publish Deal"

**Expected Results:**
- ✅ End Date, Start Time, End Time all **disabled**
- ✅ Request payload contains:
  ```json
  {
    "availableDuringBusinessHours": true,
    "isOngoing": true,
    "startTime": null,
    "endTime": null,
    "endDate": null
  }
  ```

**Actual Payload:**
```json


```

**Pass/Fail:** [ ] PASS  [ ] FAIL

---

## 🔍 BACKEND LOG VERIFICATION

### What to Look For in Terminal 3d22d0e2:

When you submit a deal, you should see:

```
🟢 POST /api/deals - incoming request {
  userId: '<uuid>',
  ip: '127.0.0.1',
  ua: 'Mozilla/5.0...'
}

🧭 Normalized deal payload {
  restaurantId: '<uuid>',
  title: '...',
  dealType: 'percentage',
  discountValue: '25',  // ← STRING (decimal type)
  imageUrl: 'data:image/...',  // ← PRESENT
  availableDuringBusinessHours: true/false,
  isOngoing: true/false,
  startTime: null or '11:00',
  endTime: null or '15:00',
  endDate: null or Date object
}

✅ Deal created { id: '<uuid>', restaurantId: '<uuid>', title: '...' }
```

**Critical Checks:**
- [ ] `imageUrl` is **never empty string** (should be data URI or rejected)
- [ ] When `availableDuringBusinessHours: true` → `startTime: null, endTime: null`
- [ ] When `isOngoing: true` → `endDate: null`
- [ ] `discountValue` is **string** (e.g., "25", not 25)
- [ ] `minOrderAmount` is **string** or **null** (not empty string "")

---

## 🚨 FAIL-SAFES TO WATCH FOR

### 1. Empty String vs Null
❌ **Bad**: `"minOrderAmount": ""`  
✅ **Good**: `"minOrderAmount": null`

### 2. Checkbox Bypass
If user unchecks "Business Hours" but times remain null:
- Backend should **reject** (400 error)
- Check Zod validation is working

### 3. Image Upload Failure
If image > 5MB or wrong type:
- Toast error should appear
- Form should NOT submit

---

## 📊 FINAL DATABASE VALIDATION

After creating 2-3 test deals, run:

```sql
select 
  id, 
  title, 
  image_url is not null as has_image,
  available_during_business_hours,
  start_time,
  end_time,
  is_ongoing,
  end_date,
  created_at
from deals
where created_at > now() - interval '10 minutes'
order by created_at desc;
```

**Expected:**
- [ ] All `has_image = true`
- [ ] Business hours deals: `start_time IS NULL AND end_time IS NULL`
- [ ] Ongoing deals: `end_date IS NULL`
- [ ] Regular deals: All fields populated

---

## ✅ VERIFICATION CHECKLIST

- [ ] Test A: Image required validation works
- [ ] Test B: Business hours checkbox disables times and sends nulls
- [ ] Test C: Ongoing checkbox disables end date and sends null
- [ ] Test D: Combined checkboxes work together
- [ ] Backend logs show correct normalization
- [ ] Database contains valid data (no empty strings)
- [ ] No Zod validation errors in backend
- [ ] Deals appear in database with correct null values

---

## 🎯 SUCCESS CRITERIA

**All tests PASS if:**
1. Cannot submit without image (UI blocks)
2. Checkboxes correctly disable fields
3. Payload contains `null` (not empty strings or false values)
4. Backend logs show expected normalization
5. Database rows match checkbox states
6. No 400 errors from Zod validation

**If ANY test FAILS:**
- Copy exact error from DevTools Console/Network
- Copy backend logs showing the failure
- Note which field(s) caused the issue
- Check if it's UI, API, or DB layer problem
