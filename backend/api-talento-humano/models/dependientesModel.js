const { pool } = require('../config/db');

const getDependientess = async () => {
  const result = await pool.query('SELECT * FROM dependientes');
  return result.rows;
};

const getDependientesById = async (id) => {
  const result = await pool.query('SELECT * FROM dependientes WHERE id_dependiente = $1', [id]);
  return result.rows[0];
};

const createDependientes = async (data) => {
  const { id_empleado, dep_ceddoc, dep_nom1, dep_nom2, dep_ap1, dep_ap2, dep_fechanacimiento, dep_sexo, dep_parentesco, dep_estado } = data;
  const result = await pool.query(
    'INSERT INTO dependientes (id_empleado, dep_ceddoc, dep_nom1, dep_nom2, dep_ap1, dep_ap2, dep_fechanacimiento, dep_sexo, dep_parentesco, dep_estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
    [id_empleado, dep_ceddoc, dep_nom1, dep_nom2, dep_ap1, dep_ap2, dep_fechanacimiento, dep_sexo, dep_parentesco, dep_estado]
  );
  return result.rows[0];
};

const updateDependientes = async (id, data) => {
  const { id_empleado, dep_ceddoc, dep_nom1, dep_nom2, dep_ap1, dep_ap2, dep_fechanacimiento, dep_sexo, dep_parentesco, dep_estado } = data;
  const result = await pool.query(
    'UPDATE dependientes SET id_empleado = $1, dep_ceddoc = $2, dep_nom1 = $3, dep_nom2 = $4, dep_ap1 = $5, dep_ap2 = $6, dep_fechanacimiento = $7, dep_sexo = $8, dep_parentesco = $9, dep_estado = $10 WHERE id_dependiente = $11 RETURNING *',
    [id_empleado, dep_ceddoc, dep_nom1, dep_nom2, dep_ap1, dep_ap2, dep_fechanacimiento, dep_sexo, dep_parentesco, dep_estado, id]
  );
  return result.rows[0];
};

const deleteDependientes = async (id) => {
  const result = await pool.query('DELETE FROM dependientes WHERE id_dependiente = $1 RETURNING *', [id]);
  return result.rows[0];
};

module.exports = {
  getDependientess,
  getDependientesById,
  updateDependientes,
  deleteDependientes,
  createDependientes
};
