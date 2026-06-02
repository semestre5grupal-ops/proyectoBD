const { pool } = require('../config/db');

const getVacaciones = async () => {
  const result = await pool.query('SELECT * FROM vacaciones ORDER BY id_vacacion ASC');
  return result.rows;
};

const getVacacionById = async (id) => {
  const result = await pool.query('SELECT * FROM vacaciones WHERE id_vacacion = $1', [id]);
  return result.rows[0];
};

const createVacacion = async (vacacion) => {
  const { id_contrato, vac_periodo, vac_diasg, vac_diasp, vac_saldo } = vacacion;
  const result = await pool.query(
    'INSERT INTO vacaciones (id_contrato, vac_periodo, vac_diasg, vac_diasp, vac_saldo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id_contrato, vac_periodo, vac_diasg, vac_diasp, vac_saldo]
  );
  return result.rows[0];
};

const updateVacacion = async (id, vacacion) => {
  const { id_contrato, vac_periodo, vac_diasg, vac_diasp, vac_saldo } = vacacion;
  const result = await pool.query(
    'UPDATE vacaciones SET id_contrato = $1, vac_periodo = $2, vac_diasg = $3, vac_diasp = $4, vac_saldo = $5 WHERE id_vacacion = $6 RETURNING *',
    [id_contrato, vac_periodo, vac_diasg, vac_diasp, vac_saldo, id]
  );
  return result.rows[0];
};

const deleteVacacion = async (id) => {
  const result = await pool.query('DELETE FROM vacaciones WHERE id_vacacion = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = { getVacaciones, getVacacionById, createVacacion, updateVacacion, deleteVacacion };
