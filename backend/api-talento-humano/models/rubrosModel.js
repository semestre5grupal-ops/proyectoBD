const { pool } = require('../config/db');

const getRubross = async () => {
  const result = await pool.query('SELECT * FROM rubros');
  return result.rows;
};

const getRubrosById = async (id) => {
  const result = await pool.query('SELECT * FROM rubros WHERE id_rubros = $1', [id]);
  return result.rows[0];
};

const createRubros = async (data) => {
  const { rub_descripcion, rub_estado, rub_tipo, rub_calculable } = data;
  const result = await pool.query(
    'INSERT INTO rubros (rub_descripcion, rub_estado, rub_tipo, rub_calculable) VALUES ($1, $2, $3, $4) RETURNING *',
    [rub_descripcion, rub_estado, rub_tipo, rub_calculable]
  );
  return result.rows[0];
};

const updateRubros = async (id, data) => {
  const { rub_descripcion, rub_estado, rub_tipo, rub_calculable } = data;
  const result = await pool.query(
    'UPDATE rubros SET rub_descripcion = $1, rub_estado = $2, rub_tipo = $3, rub_calculable = $4 WHERE id_rubros = $5 RETURNING *',
    [rub_descripcion, rub_estado, rub_tipo, rub_calculable, id]
  );
  return result.rows[0];
};

const deleteRubros = async (id) => {
  const result = await pool.query('DELETE FROM rubros WHERE id_rubros = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getRubross,
  getRubrosById,
  updateRubros,
  deleteRubros,
  createRubros
};
