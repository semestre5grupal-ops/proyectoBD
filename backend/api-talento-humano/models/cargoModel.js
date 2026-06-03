const { pool } = require('../config/db');

const getCargos = async (options = {}) => {
  const { page = 1, limit = 20, search = '', limitAll = false } = options;
  
  if (limitAll) {
    const result = await pool.query("SELECT id_cargo, car_nombre, car_sueldobase FROM cargo WHERE car_estado != 'INC' ORDER BY car_nombre ASC");
    return { data: result.rows, totalRecords: result.rows.length };
  }

  const offset = (page - 1) * limit;
  let query = "SELECT * FROM cargo WHERE car_estado != 'INC'";
  const values = [];

  if (search) {
    query += " AND car_nombre ILIKE $1";
    values.push(`%${search}%`);
  }

  const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
  const countResult = await pool.query(countQuery, values);
  const totalRecords = parseInt(countResult.rows[0].count, 10);

  query += " ORDER BY id_cargo DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2);
  values.push(limit, offset);

  const result = await pool.query(query, values);
  
  return {
    data: result.rows,
    totalRecords,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: parseInt(page, 10)
  };
};

const getCargoById = async (id) => {
  const result = await pool.query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
  return result.rows[0];
};

const createCargo = async (data) => {
  const { id_departamento, car_nombre, car_sueldobase, car_feccreacion, car_estado } = data;
  const result = await pool.query(
    'INSERT INTO cargo (id_departamento, car_nombre, car_sueldobase, car_feccreacion, car_estado) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id_departamento, car_nombre, car_sueldobase, car_feccreacion, car_estado || 'ACT']
  );
  return result.rows[0];
};

const updateCargo = async (id, data) => {
  const { id_departamento, car_nombre, car_sueldobase, car_feccreacion, car_estado } = data;
  const result = await pool.query(
    'UPDATE cargo SET id_departamento = $1, car_nombre = $2, car_sueldobase = $3, car_feccreacion = $4, car_estado = $5 WHERE id_cargo = $6 RETURNING *',
    [id_departamento, car_nombre, car_sueldobase, car_feccreacion, car_estado || 'ACT', id]
  );
  return result.rows[0];
};

const deleteCargo = async (id) => {
  const result = await pool.query("UPDATE cargo SET car_estado = 'INC' WHERE id_cargo = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getCargos,
  getCargoById,
  updateCargo,
  deleteCargo,
  createCargo
};
