import "dotenv/config";
import { pool } from "../server/db";

async function verify() {
  const result = await pool.query(`
    SELECT u.id, u.user_type, COUNT(r.id)::integer as restaurant_count
    FROM users u
    LEFT JOIN restaurants r ON r.owner_id = u.id
    WHERE u.id IN (
      'b83fb41e-40ae-4353-90d2-76a6ce9e6799',
      'd6910fa9-2a02-4ba5-b604-69b9191864bf',
      'dc647ba7-7023-4b97-bb25-3605cd75b7a8',
      'ea243a1b-b331-4d34-bff4-c7a96bb1eadd'
    )
    GROUP BY u.id, u.user_type
    ORDER BY u.id
  `);

  console.log("✅ Updated users status:");
  result.rows.forEach((r: any) => {
    console.log(
      `  ${r.id.substring(0, 8)}... user_type="${r.user_type}" restaurants=${r.restaurant_count}`
    );
  });

  console.log("\n📊 ROLE SUMMARY:");
  const roles = await pool.query(`
    SELECT user_type, COUNT(*)::integer as count
    FROM users
    WHERE user_type IS NOT NULL
    GROUP BY user_type
    ORDER BY count DESC
  `);

  roles.rows.forEach((r: any) => {
    console.log(`  ${r.user_type}: ${r.count}`);
  });
}

verify()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  });
