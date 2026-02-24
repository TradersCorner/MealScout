import "dotenv/config";
import { pool } from "../server/db";

async function auditStripeOnboarding() {
  console.log("💳 STRIPE HOST ONBOARDING AUDIT\n");

  try {
    if (!pool) {
      console.error("❌ No database connection");
      process.exit(1);
    }

    // Query 1: Host Stripe status overview
    console.log("📊 HOST STRIPE ONBOARDING STATUS\n");

    const stripeStatus = await pool.query(`
      SELECT
        COUNT(*)::integer as total_hosts,
        SUM(CASE WHEN stripe_connect_account_id IS NOT NULL THEN 1 ELSE 0 END)::integer as with_stripe_id,
        SUM(CASE WHEN stripe_onboarding_completed = true THEN 1 ELSE 0 END)::integer as onboarding_complete,
        SUM(CASE WHEN stripe_charges_enabled = true THEN 1 ELSE 0 END)::integer as charges_enabled,
        SUM(CASE WHEN stripe_payouts_enabled = true THEN 1 ELSE 0 END)::integer as payouts_enabled
      FROM hosts
    `);

    const stats = stripeStatus.rows[0];
    console.log(`Total Hosts: ${stats.total_hosts}`);
    console.log(`  With Stripe ID: ${stats.with_stripe_id}/${stats.total_hosts}`);
    console.log(`  Onboarding Completed: ${stats.onboarding_complete}/${stats.total_hosts}`);
    console.log(`  Charges Enabled: ${stats.charges_enabled}/${stats.total_hosts}`);
    console.log(`  Payouts Enabled: ${stats.payouts_enabled}/${stats.total_hosts}`);

    // Query 2: Detailed per-host status
    console.log("\n📋 HOST STATUS BREAKDOWN\n");

    const hostDetails = await pool.query(`
      SELECT
        h.id,
        h.business_name,
        COALESCE(u.first_name || ' ' || u.last_name, u.email) as owner,
        h.stripe_connect_account_id,
        h.stripe_connect_status,
        h.stripe_onboarding_completed,
        h.stripe_charges_enabled,
        h.stripe_payouts_enabled,
        h.created_at
      FROM hosts h
      LEFT JOIN users u ON h.user_id = u.id
      ORDER BY h.created_at DESC
      LIMIT 15
    `);

    hostDetails.rows.forEach((h: any, i: number) => {
      console.log(`${String(i + 1).padStart(2, " ")}. ${h.business_name}`);
      console.log(`    Owner: ${h.owner}`);

      if (!h.stripe_connect_account_id) {
        console.log(`    Status: ❌ NO STRIPE ACCOUNT`);
      } else {
        const status =
          h.stripe_connect_status === "charges_enabled" ? "✅" : "🟡";
        console.log(
          `    Status: ${status} ${h.stripe_connect_status || "pending"}`
        );
        console.log(`    Account ID: ${h.stripe_connect_account_id.substring(0, 15)}...`);

        const readiness = [];
        if (h.stripe_onboarding_completed)
          readiness.push("onboarding-complete");
        if (h.stripe_charges_enabled)
          readiness.push("charges-enabled");
        if (h.stripe_payouts_enabled)
          readiness.push("payouts-enabled");

        if (readiness.length === 0) {
          console.log(`    Readiness: 🟡 Pending setup`);
        } else {
          console.log(`    Readiness: ✅ ${readiness.join(" | ")}`);
        }
      }

      console.log(`    Created: ${new Date(h.created_at).toLocaleDateString()}`);
      console.log();
    });

    // Query 3: Hosts needing onboarding
    console.log("⚠️  ACTION REQUIRED\n");

    const needsOnboarding = await pool.query(`
      SELECT COUNT(*)::integer as count
      FROM hosts
      WHERE stripe_connect_account_id IS NULL
    `);

    const needsCompletion = await pool.query(`
      SELECT COUNT(*)::integer as count
      FROM hosts
      WHERE stripe_connect_account_id IS NOT NULL
      AND stripe_onboarding_completed = false
    `);

    const notChargesReady = await pool.query(`
      SELECT COUNT(*)::integer as count
      FROM hosts
      WHERE stripe_charges_enabled = false
      AND stripe_connect_account_id IS NOT NULL
    `);

    if (needsOnboarding.rows[0].count > 0) {
      console.log(
        `⚠️  ${needsOnboarding.rows[0].count} hosts need to start Stripe onboarding`
      );
    }

    if (needsCompletion.rows[0].count > 0) {
      console.log(
        `🟡 ${needsCompletion.rows[0].count} hosts need to complete onboarding`
      );
    }

    if (notChargesReady.rows[0].count > 0) {
      console.log(
        `⚠️  ${notChargesReady.rows[0].count} hosts not yet enabled for charges`
      );
    }

    if (
      needsOnboarding.rows[0].count === 0 &&
      needsCompletion.rows[0].count === 0 &&
      notChargesReady.rows[0].count === 0
    ) {
      console.log("✅ All hosts have complete Stripe onboarding!");
    }

    // Query 4: Pricing setup check
    console.log("\n💰 PRICING SETUP\n");

    const pricingStatus = await pool.query(`
      SELECT
        COUNT(*)::integer as total_with_pricing,
        SUM(CASE WHEN parking_pass_daily_price_cents > 0 THEN 1 ELSE 0 END)::integer as with_daily,
        SUM(CASE WHEN parking_pass_weekly_price_cents > 0 THEN 1 ELSE 0 END)::integer as with_weekly,
        SUM(CASE WHEN parking_pass_monthly_price_cents > 0 THEN 1 ELSE 0 END)::integer as with_monthly
      FROM hosts
      WHERE parking_pass_daily_price_cents > 0
      OR parking_pass_weekly_price_cents > 0
      OR parking_pass_monthly_price_cents > 0
    `);

    const pricing = pricingStatus.rows[0];
    console.log(`Hosts with pricing configured: ${pricing.total_with_pricing || 0}/${stats.total_hosts}`);
    if (pricing.total_with_pricing > 0) {
      console.log(`  - Daily pricing: ${pricing.with_daily || 0}`);
      console.log(`  - Weekly pricing: ${pricing.with_weekly || 0}`);
      console.log(`  - Monthly pricing: ${pricing.with_monthly || 0}`);
    }

    console.log("\n✅ AUDIT COMPLETE\n");
  } catch (error) {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  }
}

auditStripeOnboarding();
