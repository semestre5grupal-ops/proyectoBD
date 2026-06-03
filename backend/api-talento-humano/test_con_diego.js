const { pool } = require('./config/db');

async function test() {
  try {
    const res = await pool.query(`
      SELECT * FROM contrato WHERE id_empleado = (
        SELECT id_empleado FROM empleados WHERE emp_cedula = '2054705344'
      ) AND con_estado = 'ACT';
    `);
    console.log("Contratos activos para Diego Cano:", res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
