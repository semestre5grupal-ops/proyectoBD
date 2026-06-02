const { pool } = require('../config/db');

const getMetas = async () => {
  const result = await pool.query('SELECT * FROM meta');
  return result.rows;
};

const getMetaById = async (id) => {
  const result = await pool.query('SELECT * FROM meta WHERE id_meta = $1', [id]);
  return result.rows[0];
};

const createMeta = async (data) => {
  const { id_contrato, met_objetivo, met_alcanzo, met_porcentaje, met_estado, met_observacion } = data;
  const result = await pool.query(
    'INSERT INTO meta (id_contrato, met_objetivo, met_alcanzo, met_porcentaje, met_estado, met_observacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [id_contrato, met_objetivo, met_alcanzo, met_porcentaje, met_estado, met_observacion]
  );
  return result.rows[0];
};

const updateMeta = async (id, data) => {
  const { id_contrato, met_objetivo, met_alcanzo, met_porcentaje, met_estado, met_observacion } = data;
  const result = await pool.query(
    'UPDATE meta SET id_contrato = $1, met_objetivo = $2, met_alcanzo = $3, met_porcentaje = $4, met_estado = $5, met_observacion = $6 WHERE id_meta = $7 RETURNING *',
    [id_contrato, met_objetivo, met_alcanzo, met_porcentaje, met_estado, met_observacion, id]
  );
  return result.rows[0];
};

const deleteMeta = async (id) => {
  const result = await pool.query('DELETE FROM meta WHERE id_meta = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getMetas,
  getMetaById,
  updateMeta,
  deleteMeta,
  createMeta
};
