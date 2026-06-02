const { pool } = require('../config/db');

const getRubrosxrols = async () => {
  const result = await pool.query('SELECT * FROM rubrosxrol');
  return result.rows;
};

const createRubrosxrol = async (data) => {
  const { id_rol, id_rubros, dxe_cantidad, dxe_estado } = data;
  const result = await pool.query(
    'INSERT INTO rubrosxrol (id_rol, id_rubros, dxe_cantidad, dxe_estado) VALUES ($1, $2, $3, $4) RETURNING *',
    [id_rol, id_rubros, dxe_cantidad, dxe_estado]
  );
  return result.rows[0];
};

module.exports = {
  getRubrosxrols,
  createRubrosxrol
};
