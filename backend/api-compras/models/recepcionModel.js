const { pool } = require('../config/db');

const getRecepciones = async () => {
  const result = await pool.query('SELECT * FROM recepciones ORDER BY id_recepcion DESC');
  return result.rows;
};

const getRecepcionById = async (id) => {
  const headerResult = await pool.query('SELECT * FROM recepciones WHERE id_recepcion = $1', [id]);
  if (headerResult.rows.length === 0) return null;

  const detailsResult = await pool.query('SELECT * FROM proxrec WHERE id_recepcion = $1', [id]);

  return {
    ...headerResult.rows[0],
    detalles: detailsResult.rows
  };
};

const createRecepcion = async (recepcionData) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id_compra, id_bodega, rec_descripcion, rec_num_productos, usu_responsable, detalles } = recepcionData;

    const headerResult = await client.query(
      `INSERT INTO recepciones (id_compra, id_bodega, rec_descripcion, rec_num_productos, usu_responsable, rec_estado)
       VALUES ($1, $2, $3, $4, $5, 'ABI') RETURNING *`,
      [id_compra, id_bodega, rec_descripcion, rec_num_productos, usu_responsable]
    );

    const recepcion = headerResult.rows[0];
    const id_recepcion = recepcion.id_recepcion;

    for (const detail of detalles) {
      const { id_variante, pxr_cantidad_solicitada, pxr_qty_recibida, pxr_diferencia, pxr_motivo_diferencia, pxr_estado } = detail;
      await client.query(
        `INSERT INTO proxrec (id_recepcion, id_variante, pxr_cantidad_solicitada, pxr_qty_recibida, pxr_diferencia, pxr_motivo_diferencia, pxr_estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id_recepcion, id_variante, pxr_cantidad_solicitada, pxr_qty_recibida, pxr_diferencia, pxr_motivo_diferencia, pxr_estado || 'PEN']
      );
    }

    await client.query('COMMIT');
    return { ...recepcion, detalles };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateRecepcionEstado = async (id, estado, fechaResolucion = null) => {
  const result = await pool.query(
    `UPDATE recepciones 
     SET rec_estado = $1, rec_fecharesolucion = $2 
     WHERE id_recepcion = $3 RETURNING *`,
    [estado, fechaResolucion, id]
  );
  return result.rows[0];
};

module.exports = {
  getRecepciones,
  getRecepcionById,
  createRecepcion,
  updateRecepcionEstado
};
