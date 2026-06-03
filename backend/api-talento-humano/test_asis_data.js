const { pool } = require('./config/db');

async function test() {
  try {
    const res = await pool.query('SELECT tipo_movimiento FROM asistencia LIMIT 5');
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
