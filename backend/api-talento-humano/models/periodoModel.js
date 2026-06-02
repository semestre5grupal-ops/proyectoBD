const { pool } = require('../config/db');

const getPeriodos = async () => {
  const result = await pool.query('SELECT * FROM periodo');
  return result.rows;
};

const getPeriodoById = async (id) => {
  const result = await pool.query('SELECT * FROM periodo WHERE id_rolpago2 = $1', [id]);
  return result.rows[0];
};

const createPeriodo = async (data) => {
  const { per_descripcion, per_fechainicio, per_fechafin, per_estado } = data;
  const result = await pool.query(
    'INSERT INTO periodo (per_descripcion, per_fechainicio, per_fechafin, per_estado) VALUES ($1, $2, $3, $4) RETURNING *',
    [per_descripcion, per_fechainicio, per_fechafin, per_estado]
  );
  return result.rows[0];
};

const updatePeriodo = async (id, data) => {
  const { per_descripcion, per_fechainicio, per_fechafin, per_estado } = data;
  const result = await pool.query(
    'UPDATE periodo SET per_descripcion = $1, per_fechainicio = $2, per_fechafin = $3, per_estado = $4 WHERE id_rolpago2 = $5 RETURNING *',
    [per_descripcion, per_fechainicio, per_fechafin, per_estado, id]
  );
  return result.rows[0];
};

const deletePeriodo = async (id) => {
  const result = await pool.query('DELETE FROM periodo WHERE id_rolpago2 = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getPeriodos,
  getPeriodoById,
  updatePeriodo,
  deletePeriodo,
  createPeriodo
};
