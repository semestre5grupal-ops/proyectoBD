const { pool } = require('../config/db');

const getHorarioxempleados = async () => {
  const result = await pool.query('SELECT * FROM horarioxempleado');
  return result.rows;
};

const createHorarioxempleado = async (data) => {
  const { id_horario, id_empleado, fecha_inicio_asignacion, fecha_fin_asignacion } = data;
  const result = await pool.query(
    'INSERT INTO horarioxempleado (id_horario, id_empleado, fecha_inicio_asignacion, fecha_fin_asignacion) VALUES ($1, $2, $3, $4) RETURNING *',
    [id_horario, id_empleado, fecha_inicio_asignacion, fecha_fin_asignacion]
  );
  return result.rows[0];
};

module.exports = {
  getHorarioxempleados,
  createHorarioxempleado
};
