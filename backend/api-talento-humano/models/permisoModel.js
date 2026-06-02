const { pool } = require('../config/db');

const getPermisos = async () => {
  const result = await pool.query('SELECT * FROM permisos ORDER BY id_permiso ASC');
  return result.rows;
};

const getPermisoById = async (id) => {
  const result = await pool.query('SELECT * FROM permisos WHERE id_permiso = $1', [id]);
  return result.rows[0];
};

const createPermiso = async (permiso) => {
  const { id_empleado, per_fecha_inicio, per_fecha_fin, per_estado, per_observacion } = permiso;
  const result = await pool.query(
    'INSERT INTO permisos (id_empleado, per_fecha_inicio, per_fecha_fin, per_estado, per_observacion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id_empleado, per_fecha_inicio, per_fecha_fin, per_estado, per_observacion]
  );
  return result.rows[0];
};

const updatePermiso = async (id, permiso) => {
  const { id_empleado, per_fecha_inicio, per_fecha_fin, per_estado, per_observacion } = permiso;
  const result = await pool.query(
    'UPDATE permisos SET id_empleado = $1, per_fecha_inicio = $2, per_fecha_fin = $3, per_estado = $4, per_observacion = $5 WHERE id_permiso = $6 RETURNING *',
    [id_empleado, per_fecha_inicio, per_fecha_fin, per_estado, per_observacion, id]
  );
  return result.rows[0];
};

const deletePermiso = async (id) => {
  const result = await pool.query('DELETE FROM permisos WHERE id_permiso = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = { getPermisos, getPermisoById, createPermiso, updatePermiso, deletePermiso };
