import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Allow development to boot without a DATABASE_URL; server will run in limited mode
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'development') {
    console.warn("[DB] Warning: DATABASE_URL is not set. Running in limited dev mode without DB.");
  } else {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : undefined as unknown as Pool;

// Some managed Postgres setups (or older DBs) can end up with a `search_path`
// that excludes `public`, which breaks unqualified table lookups (SQLSTATE 42P01)
// for tables that were created in `public`.
if (process.env.DATABASE_URL && pool) {
  pool.on("connect", (client) => {
    void client
      .query("show search_path")
      .then((result) => {
        const current = String(result?.rows?.[0]?.search_path || "").trim();
        if (!current) return;
        const tokens = current
          .split(",")
          .map((part) => part.trim().replace(/^"+|"+$/g, "").toLowerCase());
        if (tokens.includes("public")) return;
        const next = `${current}, public`;
        return client.query("select set_config('search_path', $1, false)", [next]);
      })
      .catch((error) => {
        console.warn("[DB] Failed to normalize search_path:", error?.message || error);
      });
  });
}
// Cast to any to keep query builder usable even when DATABASE_URL is absent in local dev.
// Runtime will still require a real connection string in production.
export const db = (process.env.DATABASE_URL
  ? drizzle({ client: pool as Pool, schema })
  : undefined) as any;
