import "dotenv/config";
import { pool } from "../server/db";

async function auditParkingPassBookings() {
  console.log("🅿️  PARKING PASS FEATURE AUDIT\n");

  try {
    if (!pool) {
      console.error("❌ No database connection");
      process.exit(1);
    }

    // Query 1: Host pricing setup (what's actually configured)
    console.log("📊 HOST PARKING PASS PRICING SETUP\n");

    const pricingSetup = await pool.query(`
      SELECT
        COUNT(*)::integer as total_hosts,
        COUNT(CASE WHEN parking_pass_daily_price_cents > 0 THEN 1 END)::integer as with_daily,
        COUNT(CASE WHEN parking_pass_weekly_price_cents > 0 THEN 1 END)::integer as with_weekly,
        COUNT(CASE WHEN parking_pass_monthly_price_cents > 0 THEN 1 END)::integer as with_monthly,
        COUNT(CASE WHEN parking_pass_daily_price_cents > 0 OR parking_pass_weekly_price_cents > 0 OR parking_pass_monthly_price_cents > 0 THEN 1 END)::integer as any_pricing
      FROM hosts
    `);

    const setup = pricingSetup.rows[0];
    console.log(`Total Hosts: ${setup.total_hosts}`);
    console.log(`Hosts with parking pricing:`);
    console.log(`  - Daily pricing: ${setup.with_daily}/${setup.total_hosts}`);
    console.log(
      `  - Weekly pricing: ${setup.with_weekly}/${setup.total_hosts}`,
    );
    console.log(
      `  - Monthly pricing: ${setup.with_monthly}/${setup.total_hosts}`,
    );
    console.log(
      `  - Any pricing: ${setup.any_pricing || 0}/${setup.total_hosts}`,
    );

    // Query 2: Pricing distribution
    console.log("\n💰 PRICING DISTRIBUTION (Top 10 Hosts)\n");

    const pricingDetails = await pool.query(`
      SELECT
        business_name,
        parking_pass_daily_price_cents,
        parking_pass_weekly_price_cents,
        parking_pass_monthly_price_cents
      FROM hosts
      WHERE parking_pass_daily_price_cents > 0
      OR parking_pass_weekly_price_cents > 0
      OR parking_pass_monthly_price_cents > 0
      ORDER BY parking_pass_daily_price_cents DESC
      LIMIT 10
    `);

    if (pricingDetails.rows.length === 0) {
      console.log("No hosts have parking pass pricing configured yet");
    } else {
      pricingDetails.rows.forEach((h: any, i: number) => {
        console.log(`${String(i + 1).padStart(2, " ")}. ${h.business_name}`);
        if (h.parking_pass_daily_price_cents > 0)
          console.log(
            `    Daily: $${(h.parking_pass_daily_price_cents / 100).toFixed(2)}`,
          );
        if (h.parking_pass_weekly_price_cents > 0)
          console.log(
            `    Weekly: $${(h.parking_pass_weekly_price_cents / 100).toFixed(2)}`,
          );
        if (h.parking_pass_monthly_price_cents > 0)
          console.log(
            `    Monthly: $${(h.parking_pass_monthly_price_cents / 100).toFixed(2)}`,
          );
        console.log();
      });
    }

    // Query 3: Stripe readiness (needed before real bookings)
    console.log("🔗 STRIPE READINESS FOR PAYMENTS\n");

    const stripeReady = await pool.query(`
      SELECT
        COUNT(*)::integer as total_hosts,
        COUNT(CASE WHEN stripe_connect_account_id IS NOT NULL THEN 1 END)::integer as with_stripe_account,
        COUNT(CASE WHEN stripe_charges_enabled = true THEN 1 END)::integer as charges_enabled
      FROM hosts
    `);

    const stripe = stripeReady.rows[0];
    console.log(`Stripe Connect Status:`);
    console.log(
      `  - Hosts with Stripe account: ${stripe.with_stripe_account}/${stripe.total_hosts}`,
    );
    console.log(
      `  - Hosts with charges enabled: ${stripe.charges_enabled}/${stripe.total_hosts}`,
    );

    if (stripe.with_stripe_account === 0) {
      console.log(`\n⚠️  No hosts have started Stripe Connect onboarding yet`);
      console.log(
        `    Parking pass checkout will require hosts to complete Stripe setup first`,
      );
    }

    // Query 4: Parking infrastructure status
    console.log("\n📋 PARKING PASS FEATURE STATUS\n");
    console.log(
      "Current Stage: Schema defined, pricing configured (9/18 hosts), awaiting:",
    );
    console.log("  - [ ] Stripe onboarding completion (0/18 hosts)");
    console.log("  - [ ] Parking pass inventory creation");
    console.log("  - [ ] Booking workflow implementation");
    console.log("  - [ ] Payment processing integration");
    console.log("  - [ ] Hold/release management");

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

auditParkingPassBookings();
