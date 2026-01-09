import 'dotenv/config';
import { pool } from '../server/db';

async function main() {
  if (!pool) {
    console.error('❌ Database pool not initialized');
    process.exit(1);
  }

  console.log('🔍 Checking for admin accounts...\n');
  
  const result = await pool.query(`
    SELECT id, email, user_type, first_name, last_name, created_at
    FROM users
    WHERE user_type = 'admin'
    ORDER BY created_at DESC
  `);

  if (result.rowCount === 0) {
    console.log('❌ No admin accounts found in database');
    console.log('\n💡 To create an admin account, set these in your .env file:');
    console.log('   ADMIN_EMAIL=your-email@example.com');
    console.log('   ADMIN_PASSWORD=your-secure-password');
    console.log('\nThen restart the server with: npm run dev:server');
  } else {
    console.log(`✅ Found ${result.rowCount} admin account(s):\n`);
    result.rows.forEach((admin: any) => {
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`  ID: ${admin.id}`);
      console.log(`  Created: ${admin.created_at}`);
      console.log('');
    });
  }

  await pool.end();
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
