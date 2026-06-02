const { pool } = require('../config/db');

const getDevoluciones = async () => {
  const result = await pool.query('SELECT * FROM devoluciones_compra ORDER BY id_devcompra_pk DESC');
  return result.rows;
};

const getDevolucionById = async (id) => {
  const headerResult = await pool.query('SELECT * FROM devoluciones_compra WHERE id_devcompra_pk = $1', [id]);
  if (headerResult.rows.length === 0) return null;

  const detailsResult = await pool.query('SELECT * FROM proxdevc WHERE id_devcompra_pk = $1', [id]);

  return {
    ...headerResult.rows[0],
    detalles: detailsResult.rows
  };
};

const createDevolucion = async (devolucionData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id_compra, id_bodega, devc_motivo, devc_num_produc, usu_responsable, detalles } = devolucionData;

    const headerResult = await client.query(
      `INSERT INTO devoluciones_compra (id_compra, id_bodega, devc_motivo, devc_num_produc, usu_responsable, devc_estado)
       VALUES ($1, $2, $3, $4, $5, 'ABI') RETURNING *`,
      [id_compra, id_bodega, devc_motivo, devc_num_produc, usu_responsable]
    );

    const devolucion = headerResult.rows[0];
    const id_devcompra_pk = devolucion.id_devcompra_pk;

    for (const detail of detalles) {
      const { id_variante, pxdc_cantidad_recibida, pxdc_cantidad_devuelta, pxdc_diferencia, pxdc_motivo, pxdc_estado } = detail;
      await client.query(
        `INSERT INTO proxdevc (id_devcompra_pk, id_variante, pxdc_cantidad_recibida, pxdc_cantidad_devuelta, pxdc_diferencia, pxdc_motivo, pxdc_estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id_devcompra_pk, id_variante, pxdc_cantidad_recibida, pxdc_cantidad_devuelta, pxdc_diferencia, pxdc_motivo, pxdc_estado || 'PEN']
      );
    }

    await client.query('COMMIT');
    return { ...devolucion, detalles };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateDevolucionEstado = async (id, estado, fechaResolucion = null) => {
  const result = await pool.query(
    `UPDATE devoluciones_compra 
     SET devc_estado = $1, devc_fecharesolucion = $2 
     WHERE id_devcompra_pk = $3 RETURNING *`,
    [estado, fechaResolucion, id]
  );
  return result.rows[0];
};

module.exports = {
  getDevoluciones,
  getDevolucionById,
  createDevolucion,
  updateDevolucionEstado
};
