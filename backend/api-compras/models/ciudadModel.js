const { pool } = require('../config/db');

const getCiudades = async () => {
  const result = await pool.query('SELECT * FROM ciudades WHERE ciu_estado = true ORDER BY id_ciudad ASC');
  return result.rows;
};

const getCiudadById = async (id) => {
  const result = await pool.query('SELECT * FROM ciudades WHERE id_ciudad = $1', [id]);
  return result.rows[0];
};

const createCiudad = async (ciudad) => {
  const { ciu_nombre, ciu_abreviado } = ciudad;
  const result = await pool.query(
    `INSERT INTO ciudades (ciu_nombre, ciu_abreviado) 
     VALUES ($1, $2) RETURNING *`,
    [ciu_nombre, ciu_abreviado]
  );
  return result.rows[0];
};

module.exports = {
  getCiudades,
  getCiudadById,
  createCiudad
};
