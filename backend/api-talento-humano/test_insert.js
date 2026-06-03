const { pool } = require('./config/db');

async function test() {
  try {
    const empRes = await pool.query('SELECT id_empleado FROM empleados LIMIT 1');
    const perRes = await pool.query("SELECT id_rolpago2 FROM periodo WHERE per_estado IN ('ABI', 'ACT') LIMIT 1");
    
    if (empRes.rows.length === 0 || perRes.rows.length === 0) {
      console.log('No data');
      process.exit(0);
    }
    
    const empId = empRes.rows[0].id_empleado;
    const perId = perRes.rows[0].id_rolpago2;
    
    console.log(`Inserting with emp: ${empId}, per: ${perId}`);
    
    const res = await pool.query(
      'INSERT INTO rolpagos (id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [empId, perId, 0, 0, 100, 'GEN', 30, 0]
    );
    console.log(res.rows[0]);
    
    // delete it to clean up
    await pool.query('DELETE FROM rolpagos WHERE id_rol = $1', [res.rows[0].id_rol]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
