const { pool } = require('../config/db');

const getProveedores = async () => {
  const result = await pool.query(
    `SELECT p.*, c.ciu_nombre 
     FROM proveedores p 
     JOIN ciudades c ON p.id_ciudad = c.id_ciudad 
     ORDER BY p.id_proveedor ASC`
  );
  return result.rows;
};

const getProveedorById = async (id) => {
  const result = await pool.query(
    `SELECT p.*, c.ciu_nombre 
     FROM proveedores p 
     JOIN ciudades c ON p.id_ciudad = c.id_ciudad 
     WHERE p.id_proveedor = $1`, 
    [id]
  );
  return result.rows[0];
};

const createProveedor = async (proveedor) => {
  const { id_ciudad, prv_nombre, prv_ciruc, prv_telefono, prv_mail, prv_celular, prv_direccion } = proveedor;
  const result = await pool.query(
    `INSERT INTO proveedores (id_ciudad, prv_nombre, prv_ciruc, prv_telefono, prv_mail, prv_celular, prv_direccion, prv_estado) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACT') RETURNING *`,
    [id_ciudad, prv_nombre, prv_ciruc, prv_telefono, prv_mail, prv_celular, prv_direccion]
  );
  return result.rows[0];
};

const updateProveedor = async (id, proveedor) => {
  const { id_ciudad, prv_nombre, prv_ciruc, prv_telefono, prv_mail, prv_celular, prv_direccion, prv_estado } = proveedor;
  const result = await pool.query(
    `UPDATE proveedores SET 
      id_ciudad = $1, prv_nombre = $2, prv_ciruc = $3, prv_telefono = $4, 
      prv_mail = $5, prv_celular = $6, prv_direccion = $7, prv_estado = $8 
     WHERE id_proveedor = $9 RETURNING *`,
    [id_ciudad, prv_nombre, prv_ciruc, prv_telefono, prv_mail, prv_celular, prv_direccion, prv_estado, id]
  );
  return result.rows[0];
};

module.exports = {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor
};
