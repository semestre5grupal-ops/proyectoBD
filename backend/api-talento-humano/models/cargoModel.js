const { pool } = require('../config/db');

const getCargos = async () => {
  const result = await pool.query('SELECT * FROM cargo');
  return result.rows;
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
  const result = await pool.query('DELETE FROM cargo WHERE id_cargo = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getCargos,
  getCargoById,
  updateCargo,
  deleteCargo,
  createCargo
};
