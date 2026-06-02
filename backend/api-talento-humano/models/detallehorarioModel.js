const { pool } = require('../config/db');

const getDetallehorarios = async () => {
  const result = await pool.query('SELECT * FROM detallehorario');
  return result.rows;
};

const getDetallehorarioById = async (id) => {
  const result = await pool.query('SELECT * FROM detallehorario WHERE id_detalle = $1', [id]);
  return result.rows[0];
};

const createDetallehorario = async (data) => {
  const { id_horario, det_dia_semana, det_hora_entrada, det_hora_salida } = data;
  const result = await pool.query(
    'INSERT INTO detallehorario (id_horario, det_dia_semana, det_hora_entrada, det_hora_salida) VALUES ($1, $2, $3, $4) RETURNING *',
    [id_horario, det_dia_semana, det_hora_entrada, det_hora_salida]
  );
  return result.rows[0];
};

const updateDetallehorario = async (id, data) => {
  const { id_horario, det_dia_semana, det_hora_entrada, det_hora_salida } = data;
  const result = await pool.query(
    'UPDATE detallehorario SET id_horario = $1, det_dia_semana = $2, det_hora_entrada = $3, det_hora_salida = $4 WHERE id_detalle = $5 RETURNING *',
    [id_horario, det_dia_semana, det_hora_entrada, det_hora_salida, id]
  );
  return result.rows[0];
};

const deleteDetallehorario = async (id) => {
  const result = await pool.query('DELETE FROM detallehorario WHERE id_detalle = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getDetallehorarios,
  getDetallehorarioById,
  updateDetallehorario,
  deleteDetallehorario,
  createDetallehorario
};
