const { pool } = require('./config/db');

async function test() {
  try {
    await pool.query("ALTER TABLE cargo ADD COLUMN car_estado character(3) DEFAULT 'ACT'");
    console.log("Column added successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error adding column:", err.message);
    process.exit(1);
  }
}

test();
