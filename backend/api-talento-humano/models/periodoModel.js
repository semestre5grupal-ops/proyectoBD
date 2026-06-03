const { pool } = require('../config/db');

const getPeriodos = async (options = {}) => {
  const { page = 1, limit = 20, search = '', limitAll = false } = options;
  
  if (limitAll) {
    const result = await pool.query("SELECT id_rolpago2, per_descripcion FROM periodo ORDER BY id_rolpago2 DESC");
    return { data: result.rows, totalRecords: result.rows.length };
  }

  const offset = (page - 1) * limit;
  let query = "SELECT * FROM periodo WHERE 1=1";
  const values = [];

  if (search) {
    query += " AND per_descripcion ILIKE $1";
    values.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
  const countResult = await pool.query(countQuery, values);
  const totalRecords = parseInt(countResult.rows[0].count, 10);

  query += " ORDER BY id_rolpago2 DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);
  values.push(limit, offset);

  const result = await pool.query(query, values);
  
  return {
    data: result.rows,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: parseInt(page, 10)
  };
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
