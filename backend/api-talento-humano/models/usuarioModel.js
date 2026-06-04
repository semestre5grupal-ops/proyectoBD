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
  const result = await pool.query(`
    SELECT u.*, r.rol_nombre 
    FROM usuario u 
    LEFT JOIN rol r ON u.id_rol = r.id_rol 
    WHERE u.usu_nombre = $1
  `, [usu_nombre]);
  return result.rows[0]; 
};

const createUsuario = async (usuario) => {
  const { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol } = usuario;
  const result = await pool.query(
    'INSERT INTO usuario (usu_nombre, usu_contra, usu_estado, id_empleado, id_rol) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, usu_nombre, usu_estado, id_empleado, id_rol',
    [usu_nombre, usu_contra, usu_estado, id_empleado, id_rol]
  );
  return result.rows[0];
};

const updateUsuario = async (id, usuario) => {
  const { usu_nombre, usu_contra, usu_estado, id_empleado, id_rol } = usuario;
  
  if (usu_contra) {
    const result = await pool.query(
      'UPDATE usuario SET usu_nombre = $1, usu_contra = $2, usu_estado = $3, id_empleado = $4, id_rol = $5 WHERE id_usuario = $6 RETURNING id_usuario, usu_nombre, usu_estado, id_empleado, id_rol',
      [usu_nombre, usu_contra, usu_estado, id_empleado, id_rol, id]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      'UPDATE usuario SET usu_nombre = $1, usu_estado = $2, id_empleado = $3, id_rol = $4 WHERE id_usuario = $5 RETURNING id_usuario, usu_nombre, usu_estado, id_empleado, id_rol',
      [usu_nombre, usu_estado, id_empleado, id_rol, id]
    );
    return result.rows[0];
  }
};

const deleteUsuario = async (id) => {
  const result = await pool.query('DELETE FROM usuario WHERE id_usuario = $1 RETURNING id_usuario, usu_nombre', [id]);
  return result.rows[0];
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  getUsuarioByNombre,
  createUsuario,
  updateUsuario,
  deleteUsuario
};
