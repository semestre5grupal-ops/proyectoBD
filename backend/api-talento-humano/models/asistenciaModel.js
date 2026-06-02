const { pool } = require('../config/db');

const getAsistencias = async () => {
  const result = await pool.query('SELECT * FROM asistencia');
  return result.rows;
};

const getAsistenciaById = async (id) => {
  const result = await pool.query('SELECT * FROM asistencia WHERE id_asistencia = $1', [id]);
  return result.rows[0];
};

const createAsistencia = async (data) => {
  const { id_empleado, fecha_hora, tipo_movimiento } = data;
  const result = await pool.query(
    'INSERT INTO asistencia (id_empleado, fecha_hora, tipo_movimiento) VALUES ($1, $2, $3) RETURNING *',
    [id_empleado, fecha_hora, tipo_movimiento]
  );
  return result.rows[0];
};

const updateAsistencia = async (id, data) => {
  const { id_empleado, fecha_hora, tipo_movimiento } = data;
  const result = await pool.query(
    'UPDATE asistencia SET id_empleado = $1, fecha_hora = $2, tipo_movimiento = $3 WHERE id_asistencia = $4 RETURNING *',
    [id_empleado, fecha_hora, tipo_movimiento, id]
  );
  return result.rows[0];
};

const deleteAsistencia = async (id) => {
  const result = await pool.query('DELETE FROM asistencia WHERE id_asistencia = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getAsistencias,
  getAsistenciaById,
  updateAsistencia,
  deleteAsistencia,
  createAsistencia
};
