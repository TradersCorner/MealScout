# Keep Server Warm - Prevent Render.com Spin-Down

## Problem

Render.com's free tier spins down your server after 15 minutes of inactivity, causing slow cold starts (10-30 seconds) when users visit your site.

## Solutions Implemented

### 1. Self-Ping Keep-Alive ✅ (Implemented)

The server now pings itself every 13 minutes to stay warm.

**Status**: Active in production
**Location**: `server/keepAlive.ts`
**Environment Variable Required**: None (auto-detects Render)

### 2. External Monitoring Services (Recommended Additional Layer)

Use one of these FREE external services to ping your server:

#### Option A: UptimeRobot (Recommended)

1. Sign up at https://uptimerobot.com (free account)
2. Create a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://mealscout.onrender.com/health`
   - **Monitoring Interval**: 5 minutes (free tier)
   - **Alert Contacts**: Your email
3. Save

**Benefits**:

- Also alerts you if server is actually down
- Web dashboard to view uptime history
- 5-minute interval keeps server very responsive

#### Option B: Cron-Job.org

1. Sign up at https://cron-job.org (free account)
2. Create a new cron job:
   - **Title**: MealScout Keep-Alive
   - **URL**: `https://mealscout.onrender.com/health`
   - **Schedule**: Every 10 minutes
3. Save

#### Option C: Koyeb (Serverless Cron)

1. Sign up at https://www.koyeb.com
2. Create a serverless cron job that calls your health endpoint

### 3. Upgrade to Render Paid Tier (Best Long-Term Solution)

**Cost**: $7/month
**Benefits**:

- Server always running (no cold starts)
- Better performance
- No need for keep-alive hacks
- 512MB RAM (vs 512MB on free)
- Professional reliability

To upgrade:

1. Go to your Render dashboard
2. Select your service
3. Click "Upgrade" and choose "Starter" plan

## Current Status

✅ Self-ping keep-alive active (13-minute intervals)
⚠️ External monitoring recommended for redundancy
💡 Consider paid tier for production apps

## Monitoring

Check server logs to verify keep-alive is working:

```bash
# Look for log entries like:
✅ Keep-alive ping successful (123ms)
```

## Environment Variables

Optional configuration in your Render dashboard:

- `SERVICE_URL`: Your server URL (defaults to `https://mealscout.onrender.com`)
- `RENDER`: Auto-set by Render.com (used to detect environment)

## Troubleshooting

**Keep-alive not working?**

1. Check Render logs for "Keep-alive service" messages
2. Verify `NODE_ENV=production` is set
3. Ensure server has been deployed with latest code

**Still seeing slow loads?**

1. Add external monitoring (UptimeRobot)
2. Consider upgrading to paid tier
3. Check database connection (may also be on free tier)

## Performance Impact

- **CPU**: Negligible (~0.1% every 13 minutes)
- **Bandwidth**: <1KB per ping = ~3.3KB/hour
- **Cost**: $0 (well within free tier limits)
