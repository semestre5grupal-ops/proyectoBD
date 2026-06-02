const { pool } = require('../config/db');

const getEmpleados = async () => {
  const result = await pool.query('SELECT * FROM empleados ORDER BY id_empleado ASC');
  return result.rows;
};

const getEmpleadoById = async (id) => {
  const result = await pool.query('SELECT * FROM empleados WHERE id_empleado = $1', [id]);
  return result.rows[0];
};

const createEmpleado = async (empleado) => {
  const { emp_cedula, emp_nom1, emp_nom2, emp_ap1, emp_ap2, emp_fechanacimiento, emp_sexo, emp_direccion, emp_telefono, emp_email } = empleado;
  const result = await pool.query(
    `INSERT INTO empleados (emp_cedula, emp_nom1, emp_nom2, emp_ap1, emp_ap2, emp_fechanacimiento, emp_sexo, emp_direccion, emp_telefono, emp_email) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [emp_cedula, emp_nom1, emp_nom2, emp_ap1, emp_ap2, emp_fechanacimiento, emp_sexo, emp_direccion, emp_telefono, emp_email]
  );
  return result.rows[0];
};

const updateEmpleado = async (id, empleado) => {
  const { emp_cedula, emp_nom1, emp_nom2, emp_ap1, emp_ap2, emp_fechanacimiento, emp_sexo, emp_direccion, emp_telefono, emp_email } = empleado;
  const result = await pool.query(
    `UPDATE empleados SET 
      emp_cedula = $1, emp_nom1 = $2, emp_nom2 = $3, emp_ap1 = $4, emp_ap2 = $5, 
      emp_fechanacimiento = $6, emp_sexo = $7, emp_direccion = $8, emp_telefono = $9, emp_email = $10 
     WHERE id_empleado = $11 RETURNING *`,
    [emp_cedula, emp_nom1, emp_nom2, emp_ap1, emp_ap2, emp_fechanacimiento, emp_sexo, emp_direccion, emp_telefono, emp_email, id]
  );
  return result.rows[0];
};

const deleteEmpleado = async (id) => {
  const result = await pool.query('DELETE FROM empleados WHERE id_empleado = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
};
