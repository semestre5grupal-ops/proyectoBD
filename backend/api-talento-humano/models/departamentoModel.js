const { pool } = require('../config/db');

const getDepartamentos = async (options = {}) => {
  const { page = 1, limit = 20, search = '', limitAll = false } = options;
  
  if (limitAll) {
    const result = await pool.query("SELECT id_departamento, dep_nombre FROM departamento WHERE dep_estado != 'INC' ORDER BY dep_nombre ASC");
    return { data: result.rows, totalRecords: result.rows.length };
  }

  const offset = (page - 1) * limit;
  let query = "SELECT * FROM departamento WHERE dep_estado != 'INC'";
  const values = [];

  if (search) {
    query += " AND dep_nombre ILIKE $1";
    values.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
  const countResult = await pool.query(countQuery, values);
  const totalRecords = parseInt(countResult.rows[0].count, 10);

  query += " ORDER BY id_departamento DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);
  values.push(limit, offset);

  const result = await pool.query(query, values);
  
  return {
    data: result.rows,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: parseInt(page, 10)
  };
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
