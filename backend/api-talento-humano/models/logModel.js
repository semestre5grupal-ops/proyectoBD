const { pool } = require('../config/db');

const getLogs = async () => {
  const result = await pool.query('SELECT * FROM log');
  return result.rows;
};

const getLogById = async (id) => {
  const result = await pool.query('SELECT * FROM log WHERE id_log = $1', [id]);
  return result.rows[0];
};

const createLog = async (data) => {
  const { log_operacion, log_usuario, log_fecha, log_idregistro, log_tabla } = data;
  const result = await pool.query(
    'INSERT INTO log (log_operacion, log_usuario, log_fecha, log_idregistro, log_tabla) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [log_operacion, log_usuario, log_fecha, log_idregistro, log_tabla]
  );
  return result.rows[0];
};

const updateLog = async (id, data) => {
  const { log_operacion, log_usuario, log_fecha, log_idregistro, log_tabla } = data;
  const result = await pool.query(
    'UPDATE log SET log_operacion = $1, log_usuario = $2, log_fecha = $3, log_idregistro = $4, log_tabla = $5 WHERE id_log = $6 RETURNING *',
    [log_operacion, log_usuario, log_fecha, log_idregistro, log_tabla, id]
  );
  return result.rows[0];
};

const deleteLog = async (id) => {
  const result = await pool.query('DELETE FROM log WHERE id_log = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getLogs,
  getLogById,
  updateLog,
  deleteLog,
  createLog
};
