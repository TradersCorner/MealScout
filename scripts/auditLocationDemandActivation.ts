import "dotenv/config";
import { runLocationDemandActivationCron, getLocationDemandFunnelKpis } from "../server/services/locationDemandActivation";
import { pool } from "../server/db";

async function run() {
  const mode = String(process.env.DEMAND_ACTIVATION_MODE || "kpi").trim().toLowerCase();

  const kpis = await getLocationDemandFunnelKpis();
  console.log("[location-demand-kpi]", kpis.summary);

  if (mode === "run") {
    const stats = await runLocationDemandActivationCron();
    console.log("[location-demand-activation]", stats);
  }

  const strict = String(process.env.AUDIT_STRICT || "").trim().toLowerCase() === "true";
  const stuck24h = Number((kpis.summary as any)?.threshold_met_stuck_24h || 0);
  if (strict && stuck24h > 0) {
    throw new Error(`[location-demand-kpi] FAIL threshold_met_stuck_24h=${stuck24h}`);
  }
}

run()
  .catch((error: any) => {
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
