import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const now = new Date();
const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);

const { rows } = await pool.query(
  `SELECT e.id, e.name, e.status, e.date, e.start_time, e.end_time,
          e.unbooked_notification_sent_at,
          h.id as host_id, h.business_name, h.address
     FROM events e
     JOIN hosts h ON e.host_id = h.id
    WHERE e.status = 'open'
      AND e.date >= $1
      AND e.date <= $2
 ORDER BY e.date ASC`,
  [now, end]
);

console.log(JSON.stringify({ count: rows.length, rows }, null, 2));
await pool.end();
