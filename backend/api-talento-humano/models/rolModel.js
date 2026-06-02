const { pool } = require('../config/db');

const getRoles = async () => {
  const result = await pool.query('SELECT * FROM rol ORDER BY id_rol ASC');
  return result.rows;
};

const getRolById = async (id) => {
  const result = await pool.query('SELECT * FROM rol WHERE id_rol = $1', [id]);
  return result.rows[0];
};

const createRol = async (rol) => {
  const { nombre_rol } = rol;
  const result = await pool.query(
    'INSERT INTO rol (nombre_rol) VALUES ($1) RETURNING *',
    [nombre_rol]
  );
  return result.rows[0];
};

const updateRol = async (id, rol) => {
  const { nombre_rol } = rol;
  const result = await pool.query(
    'UPDATE rol SET nombre_rol = $1 WHERE id_rol = $2 RETURNING *',
    [nombre_rol, id]
  );
  return result.rows[0];
};

const deleteRol = async (id) => {
  const result = await pool.query('DELETE FROM rol WHERE id_rol = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = { getRoles, getRolById, createRol, updateRol, deleteRol };
