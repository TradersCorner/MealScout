/**
 * Keep-Alive Service
 * Prevents Render.com free tier from spinning down by self-pinging
 * This keeps the server warm and responsive
 */

const PING_INTERVAL = 13 * 60 * 1000; // 13 minutes (before Render's 15-min timeout)
const SERVICE_URL = process.env.SERVICE_URL || "https://mealscout.onrender.com";

let pingTimer: NodeJS.Timeout | null = null;

/**
 * Start the keep-alive service
 * Only runs in production to avoid unnecessary pings in development
 */
export function startKeepAlive() {
  // Only run in production and if on Render.com
  if (process.env.NODE_ENV !== "production" || !process.env.RENDER) {
    console.log(
      "⏭️  Keep-alive service disabled (not in production on Render)"
    );
    return;
  }

  console.log(
    `🔄 Starting keep-alive service (pinging every ${
      PING_INTERVAL / 60000
    } minutes)`
  );
  console.log(`📍 Target: ${SERVICE_URL}/health`);

  // Initial ping after 5 minutes
  setTimeout(() => {
    pingServer();
    // Then start regular interval
    pingTimer = setInterval(pingServer, PING_INTERVAL);
  }, 5 * 60 * 1000);
}

/**
 * Stop the keep-alive service
 */
export function stopKeepAlive() {
  if (pingTimer) {
    clearInterval(pingTimer);
    pingTimer = null;
    console.log("🛑 Keep-alive service stopped");
  }
}

/**
 * Ping the server health endpoint
 */
async function pingServer() {
  try {
    const start = Date.now();
    const response = await fetch(`${SERVICE_URL}/health`, {
      method: "GET",
      headers: {
        "User-Agent": "MealScout-KeepAlive/1.0",
      },
    });

    const duration = Date.now() - start;

    if (response.ok) {
      console.log(`✅ Keep-alive ping successful (${duration}ms)`);
    } else {
      console.warn(`⚠️  Keep-alive ping returned ${response.status}`);
    }
  } catch (error) {
    console.error(
      "❌ Keep-alive ping failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
