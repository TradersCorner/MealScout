require("dotenv").config();
const { Pool } = require("@neondatabase/serverless");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function pickUniqueTag() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const tag = `user${suffix}`;
    const existing = await pool.query(
      "select id from users where affiliate_tag = $1 limit 1",
      [tag],
    );
    if (existing.rowCount === 0) {
      return tag;
    }
  }
  throw new Error("Unable to generate unique affiliate tag");
}

async function run() {
  const { rows } = await pool.query(
    "select id from users where affiliate_tag is null and (user_type is null or user_type not in ('admin','super_admin'))",
  );

  let updated = 0;
  for (const row of rows) {
    const tag = await pickUniqueTag();
    const result = await pool.query(
      "update users set affiliate_tag = $1, updated_at = now() where id = $2 and affiliate_tag is null",
      [tag, row.id],
    );
    if (result.rowCount > 0) {
      updated += 1;
    }
  }

  console.log(`Affiliate tags assigned: ${updated}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => pool.end());
