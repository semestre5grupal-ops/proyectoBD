const { pool } = require('./config/db');

async function test() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name IN ('cargo', 'departamento', 'periodo');
    `);
    console.table(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
