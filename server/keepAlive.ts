/**
 * Keep-Alive Service
 * Prevents Render.com free tier from spinning down by self-pinging
 * Also keeps Neon database warm by hitting DB-aware health endpoint
 */

const PING_INTERVAL = 4 * 60 * 1000; // 4 minutes (before Neon's 5-min timeout)
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
  console.log(`📍 Target: ${SERVICE_URL}/api/health (includes DB warmup)`);

  // Initial ping after 2 minutes to warm up DB early
  setTimeout(() => {
    pingServer();
    // Then start regular interval
    pingTimer = setInterval(pingServer, PING_INTERVAL);
  }, 2 * 60 * 1000);
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
    const response = await fetch(`${SERVICE_URL}/api/health`, {
      method: "GET",
      headers: {
        "User-Agent": "MealScout-KeepAlive/1.0",
      },
    });

    const duration = Date.now() - start;

    if (response.ok) {
      const data = await response.json();
      console.log(
        `✅ Keep-alive ping successful (${duration}ms) - DB: ${data.status}`
      );
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
