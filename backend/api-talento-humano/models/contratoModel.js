const { pool } = require('../config/db');

const getContratos = async () => {
  const result = await pool.query('SELECT * FROM contrato');
  return result.rows;
};

const getContratoById = async (id) => {
  const result = await pool.query('SELECT * FROM contrato WHERE id_contrato = $1', [id]);
  return result.rows[0];
};

const createContrato = async (data) => {
  const { id_empleado, id_cargo, con_tipo, con_sueldobase, con_fechainicio, con_fecha_fin, con_mensualiza_d3, con_mensualiza_d4, con_mensualiza_fr, con_estado, con_empfechaingreso } = data;
  const result = await pool.query(
    'INSERT INTO contrato (id_empleado, id_cargo, con_tipo, con_sueldobase, con_fechainicio, con_fecha_fin, con_mensualiza_d3, con_mensualiza_d4, con_mensualiza_fr, con_estado, con_empfechaingreso) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
    [id_empleado, id_cargo, con_tipo, con_sueldobase, con_fechainicio, con_fecha_fin, con_mensualiza_d3, con_mensualiza_d4, con_mensualiza_fr, con_estado, con_empfechaingreso]
  );
  return result.rows[0];
};

const updateContrato = async (id, data) => {
  const { id_empleado, id_cargo, con_tipo, con_sueldobase, con_fechainicio, con_fecha_fin, con_mensualiza_d3, con_mensualiza_d4, con_mensualiza_fr, con_estado, con_empfechaingreso } = data;
  const result = await pool.query(
    'UPDATE contrato SET id_empleado = $1, id_cargo = $2, con_tipo = $3, con_sueldobase = $4, con_fechainicio = $5, con_fecha_fin = $6, con_mensualiza_d3 = $7, con_mensualiza_d4 = $8, con_mensualiza_fr = $9, con_estado = $10, con_empfechaingreso = $11 WHERE id_contrato = $12 RETURNING *',
    [id_empleado, id_cargo, con_tipo, con_sueldobase, con_fechainicio, con_fecha_fin, con_mensualiza_d3, con_mensualiza_d4, con_mensualiza_fr, con_estado, con_empfechaingreso, id]
  );
  return result.rows[0];
};

const deleteContrato = async (id) => {
  const result = await pool.query("UPDATE contrato SET con_estado = 'INC' WHERE id_contrato = $1 RETURNING *", [id]);
  return result.rows[0];
};

module.exports = {
  getContratos,
  getContratoById,
  updateContrato,
  deleteContrato,
  createContrato
};
