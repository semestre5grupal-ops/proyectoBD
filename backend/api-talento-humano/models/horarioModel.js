const { pool } = require('../config/db');

const getHorarios = async () => {
  const result = await pool.query('SELECT * FROM horario');
  return result.rows;
};

const getHorarioById = async (id) => {
  const result = await pool.query('SELECT * FROM horario WHERE id_horario = $1', [id]);
  return result.rows[0];
};

const createHorario = async (data) => {
  const { hor_nombre_horario, hor_horastotal } = data;
  const result = await pool.query(
    'INSERT INTO horario (hor_nombre_horario, hor_horastotal) VALUES ($1, $2) RETURNING *',
    [hor_nombre_horario, hor_horastotal]
  );
  return result.rows[0];
};

const updateHorario = async (id, data) => {
  const { hor_nombre_horario, hor_horastotal } = data;
  const result = await pool.query(
    'UPDATE horario SET hor_nombre_horario = $1, hor_horastotal = $2 WHERE id_horario = $3 RETURNING *',
    [hor_nombre_horario, hor_horastotal, id]
  );
  return result.rows[0];
};

const deleteHorario = async (id) => {
  const result = await pool.query('DELETE FROM horario WHERE id_horario = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getHorarios,
  getHorarioById,
  updateHorario,
  deleteHorario,
  createHorario
};
