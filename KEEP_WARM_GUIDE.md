# Keep Server Warm - Prevent Cold Starts

## The Real Problem

Your site has **TWO** services that can go cold:

1. **Render.com backend** - Free tier spins down after 15 minutes (~500ms wake-up)
2. **Neon database** - Free tier suspends after ~5 minutes (**1-3 second wake-up**) ⚠️

**The database suspension is the main cause of slow loads!**

## Solutions Implemented

### 1. Database + Server Keep-Alive ✅ (Updated)

The server now pings itself every **4 minutes** using `/api/health`, which:

- ✅ Keeps Render.com server awake
- ✅ **Keeps Neon database active** (this is the key!)
- ✅ Tests actual database connectivity

**Interval**: 4 minutes (before Neon's 5-min timeout)  
**Endpoint**: `/api/health` (includes DB query)

### 2. Update Your UptimeRobot ⚠️ **ACTION REQUIRED**

**You need to change the URL in UptimeRobot!**

❌ **WRONG** (doesn't keep DB warm):

```
https://mealscout.onrender.com/health
```

✅ **CORRECT** (keeps both server AND database warm):

```
https://mealscout.onrender.com/api/health
```

**How to Update**:

1. Log into https://uptimerobot.com
2. Find your MealScout monitor
3. Click "Edit"
4. Change URL to: `https://mealscout.onrender.com/api/health`
5. Confirm interval is **5 minutes**
6. Save

This ensures UptimeRobot also helps keep the database warm!

### 3. Upgrade Options (Long-Term Solution)

#### Option A: Neon Database (~$19/month) ⭐ **HIGHEST IMPACT**

This fixes the main bottleneck!

- ✅ No database suspension (always active)
- ✅ Eliminates 1-3 second DB wake-up delay
- ✅ Better connection pooling

Upgrade at: https://console.neon.tech

#### Option B: Render.com ($7/month)

- Server always running
- Better performance

Upgrade in Render dashboard

**💡 Recommendation**: Upgrade Neon first for biggest improvement

## Current Status

✅ Self-ping keep-alive active (4-minute intervals, DB-aware)  
⚠️ **ACTION REQUIRED**: Update UptimeRobot to `/api/health`  
💡 Consider upgrading Neon database for best results

## Why Database Is The Problem

| Issue   | Neon DB (Free)               | Render Server (Free) |
| ------- | ---------------------------- | -------------------- |
| Timeout | 5 minutes                    | 15 minutes           |
| Wake-up | 1-3 seconds ⚠️               | ~500ms               |
| Impact  | **HIGH**                     | Low                  |
| Fix     | Use `/api/health` OR upgrade | Keep-alive works     |

## Monitoring

Check Render logs for:

```
✅ Keep-alive ping successful (234ms) - DB: healthy
```

If you see response times >2000ms, the database woke up from sleep.

## Troubleshooting

**Keep-alive not working?**

1. Check Render logs for "Keep-alive service" messages
2. Verify `NODE_ENV=production` is set
3. Ensure latest code is deployed

**Still seeing slow loads after updating UptimeRobot?**

1. Verify UptimeRobot is using `/api/health` (not `/health`)
2. Check that interval is 5 minutes or less
3. Wait 10-15 minutes for DB to stay warm
4. If still slow, upgrade Neon database ($19/month - most effective solution)

## Performance Impact

- **CPU**: Negligible (~0.2% every 4 minutes)
- **Bandwidth**: <2KB per ping = ~8KB/hour
- **Database queries**: Simple health check (negligible load)
- **Cost**: $0 (well within free tier limits)

## Environment Variables

Optional configuration in your Render dashboard:

- `SERVICE_URL`: Your server URL (defaults to `https://mealscout.onrender.com`)
- `RENDER`: Auto-set by Render.com (used to detect environment)
