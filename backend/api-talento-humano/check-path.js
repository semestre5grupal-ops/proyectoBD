const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres.wuqzqyivzeogodzpbefq:Mbz1ul5po%402026@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkPath() {
  try {
    const res = await pool.query('SHOW search_path');
    console.log("search_path:", res.rows[0].search_path);
    const count = await pool.query('SELECT COUNT(*) FROM public.usuario');
    console.log("Count in public.usuario:", count.rows[0].count);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

checkPath();
