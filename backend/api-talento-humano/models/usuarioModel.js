const { pool } = require('../config/db');

const getUsuarios = async () => {
  const result = await pool.query('SELECT id_usuario, usu_nombre, usu_estado, id_empleado, id_rol FROM usuario ORDER BY id_usuario ASC');
  return result.rows; // Excluimos usu_contra por seguridad en el listado
};

const getUsuarioById = async (id) => {
  const result = await pool.query('SELECT id_usuario, usu_nombre, usu_estado, id_empleado, id_rol FROM usuario WHERE id_usuario = $1', [id]);
  return result.rows[0];
};

const getUsuarioByNombre = async (usu_nombre) => {
  const result = await pool.query('SELECT * FROM usuario WHERE usu_nombre = $1', [usu_nombre]);
  return result.rows[0]; // Retorna todo incluyendo contra para validación de login
};

const createUsuario = async (usuario) => {
  const { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol } = usuario;
  const result = await pool.query(
    'INSERT INTO usuario (usu_nombre, usu_contra, usu_estado, id_empleado, id_rol) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, usu_nombre, usu_estado, id_empleado, id_rol',
    [usu_nombre, usu_contra, usu_estado, id_empleado, id_rol]
  );
  return result.rows[0];
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  getUsuarioByNombre,
  createUsuario
};
