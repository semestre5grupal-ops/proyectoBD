const { pool } = require('../config/db');

const getDepartamentos = async () => {
  const result = await pool.query('SELECT * FROM departamento');
  return result.rows;
};

const getDepartamentoById = async (id) => {
  const result = await pool.query('SELECT * FROM departamento WHERE id_departamento = $1', [id]);
  return result.rows[0];
};

const createDepartamento = async (data) => {
  const { dep_nombre, dep_estado, dep_feccreacion } = data;
  const result = await pool.query(
    'INSERT INTO departamento (dep_nombre, dep_estado, dep_feccreacion) VALUES ($1, $2, $3) RETURNING *',
    [dep_nombre, dep_estado, dep_feccreacion]
  );
  return result.rows[0];
};

const updateDepartamento = async (id, data) => {
  const { dep_nombre, dep_estado, dep_feccreacion } = data;
  const result = await pool.query(
    'UPDATE departamento SET dep_nombre = $1, dep_estado = $2, dep_feccreacion = $3 WHERE id_departamento = $4 RETURNING *',
    [dep_nombre, dep_estado, dep_feccreacion, id]
  );
  return result.rows[0];
};

const deleteDepartamento = async (id) => {
  const result = await pool.query("UPDATE departamento SET dep_estado = 'INC' WHERE id_departamento = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getDepartamentos,
  getDepartamentoById,
  updateDepartamento,
  deleteDepartamento,
  createDepartamento
};
