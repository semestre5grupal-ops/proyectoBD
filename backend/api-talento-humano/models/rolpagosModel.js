const { pool } = require('../config/db');

const getRolpagoss = async () => {
  const result = await pool.query('SELECT * FROM rolpagos');
  return result.rows;
};

const getRolpagosById = async (id) => {
  const result = await pool.query('SELECT * FROM rolpagos WHERE id_rol = $1', [id]);
  return result.rows[0];
};

const createRolpagos = async (data) => {
  const { id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal } = data;
  const result = await pool.query(
    'INSERT INTO rolpagos (id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    [id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal]
  );
  return result.rows[0];
};

const updateRolpagos = async (id, data) => {
  const { id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal } = data;
  const result = await pool.query(
    'UPDATE rolpagos SET id_empleado = $1, id_rolpago2 = $2, rol_destotal = $3, rol_bontotal = $4, rol_neto = $5, rol_estado = $6, rol_dias_trabajados = $7, rol_comtotal = $8 WHERE id_rol = $9 RETURNING *',
    [id_empleado, id_rolpago2, rol_destotal, rol_bontotal, rol_neto, rol_estado, rol_dias_trabajados, rol_comtotal, id]
  );
  return result.rows[0];
};

const deleteRolpagos = async (id) => {
  const result = await pool.query("UPDATE rolpagos SET rol_estado = 'ANU' WHERE id_rol = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getRolpagoss,
  getRolpagosById,
  updateRolpagos,
  deleteRolpagos,
  createRolpagos
};
