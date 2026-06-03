const { pool } = require('../config/db');

const getCompras = async () => {
  const result = await pool.query(
    `SELECT c.*, p.prv_nombre 
     FROM compras c 
     JOIN proveedores p ON c.id_proveedor = p.id_proveedor 
     ORDER BY c.id_compra DESC`
  );
  return result.rows;
};

const getCompraById = async (id) => {
  // Get header
  const headerResult = await pool.query(
    `SELECT c.*, p.prv_nombre 
     FROM compras c 
     JOIN proveedores p ON c.id_proveedor = p.id_proveedor 
     WHERE c.id_compra = $1`,
    [id]
  );
  if (headerResult.rows.length === 0) return null;
  
  // Get details
  const detailsResult = await pool.query(
    `SELECT * FROM proxoc WHERE id_compra = $1`,
    [id]
  );

  return {
    ...headerResult.rows[0],
    detalles: detailsResult.rows
  };
};

const createCompra = async (compraData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, detalles } = compraData;
    
    // Insert header
    const headerResult = await client.query(
      `INSERT INTO compras (id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, oc_estado)
       VALUES ($1, $2, $3, $4, $5, 'ABI') RETURNING *`,
      [id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total]
    );
    const compra = headerResult.rows[0];
    const id_compra = compra.id_compra;
    
    // Insert details
    for (const detail of detalles) {
      const { id_variante, pxo_cantidad, pxo_valor, pxo_subtotal } = detail;
      await client.query(
        `INSERT INTO proxoc (id_compra, id_variante, pxo_cantidad, pxo_valor, pxo_subtotal, pxo_estado)
         VALUES ($1, $2, $3, $4, $5, 'ACT')`,
        [id_compra, id_variante, pxo_cantidad, pxo_valor, pxo_subtotal]
      );
    }
    
    await client.query('COMMIT');
    return { ...compra, detalles };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateCompraEstado = async (id, estado) => {
  const result = await pool.query(
    `UPDATE compras SET oc_estado = $1 WHERE id_compra = $2 RETURNING *`,
    [estado, id]
  );
  return result.rows[0];
};

const updateCompra = async (id, compraData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, detalles } = compraData;
    
    // Update header
    await client.query(
      `UPDATE compras 
       SET id_proveedor = $1, oc_fechaentrega = $2, oc_subtotal = $3, oc_iva = $4, oc_total = $5
       WHERE id_compra = $6`,
      [id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, id]
    );
    
    // Delete existing details
    await client.query(
      `DELETE FROM proxoc WHERE id_compra = $1`,
      [id]
    );
    
    // Re-insert details
    for (const detail of detalles) {
      const { id_variante, pxo_cantidad, pxo_valor, pxo_subtotal } = detail;
      await client.query(
        `INSERT INTO proxoc (id_compra, id_variante, pxo_cantidad, pxo_valor, pxo_subtotal, pxo_estado)
         VALUES ($1, $2, $3, $4, $5, 'ACT')`,
        [id, id_variante, pxo_cantidad, pxo_valor, pxo_subtotal]
      );
    }
    
    await client.query('COMMIT');
    return { id_compra: Number(id), id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, detalles };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getCompras,
  getCompraById,
  createCompra,
  updateCompraEstado,
  updateCompra
};
