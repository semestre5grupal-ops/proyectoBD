const Recepcion = require('../models/recepcionModel');

const URL_API_INVENTARIO = process.env.URL_API_INVENTARIO || 'http://localhost:3004';

const getAllRecepciones = async (req, res) => {
  try {
    const recepciones = await Recepcion.getRecepciones();
    res.status(200).json({ success: true, data: recepciones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRecepcion = async (req, res) => {
  try {
    const recepcion = await Recepcion.getRecepcionById(req.params.id);
    if (!recepcion) {
      return res.status(404).json({ success: false, message: 'Recepción no encontrada' });
    }
    res.status(200).json({ success: true, data: recepcion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createRecepcion = async (req, res) => {
  try {
    const { id_compra, id_bodega, rec_descripcion, rec_num_productos, detalles } = req.body;
    const usu_responsable = req.usuario ? req.usuario.usu_nombre : 'SISTEMA';

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ success: false, error: 'La recepción debe contener detalles de productos.' });
    }

    // 1. Validar bodega en api-inventario
    try {
      const bodegaRes = await fetch(`${URL_API_INVENTARIO}/api/bodegas/${id_bodega}`, {
        headers: { 'Authorization': req.headers['authorization'] }
      });
      if (!bodegaRes.ok) {
        return res.status(400).json({ success: false, error: `La bodega con ID ${id_bodega} no es válida o no existe.` });
      }
    } catch (err) {
      return res.status(502).json({ success: false, error: `Error al validar bodega con Inventario: ${err.message}` });
    }

    // 2. Validar variantes
    for (const detail of detalles) {
      const { id_variante } = detail;
      try {
        const checkRes = await fetch(`${URL_API_INVENTARIO}/api/variantes/${id_variante}`, {
          headers: { 'Authorization': req.headers['authorization'] }
        });
        if (!checkRes.ok) {
          return res.status(400).json({ success: false, error: `La variante de producto con ID ${id_variante} no existe.` });
        }
      } catch (err) {
        return res.status(502).json({ success: false, error: `Error al validar variante ${id_variante} con Inventario: ${err.message}` });
      }
    }

    const nuevaRecepcion = await Recepcion.createRecepcion({
      id_compra,
      id_bodega,
      rec_descripcion,
      rec_num_productos,
      usu_responsable,
      detalles
    });

    res.status(201).json({ success: true, data: nuevaRecepcion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const aprobarRecepcion = async (req, res) => {
  try {
    const { id } = req.params;
    const recepcion = await Recepcion.getRecepcionById(id);

    if (!recepcion) {
      return res.status(404).json({ success: false, message: 'Recepción no encontrada' });
    }

    if (recepcion.rec_estado !== 'ABI') {
      return res.status(400).json({ success: false, error: 'Sólo se pueden aprobar recepciones en estado ABI (Abierta).' });
    }

    // Preparar detalles para el inventario
    const detallesMovimiento = recepcion.detalles.map(d => ({
      id_variante: d.id_variante,
      cantidad: d.pxr_qty_recibida
    }));

    // Realizar HTTP request a api-inventario para actualizar stock
    try {
      const inventarioRes = await fetch(`${URL_API_INVENTARIO}/api/inventario/movimientos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization']
        },
        body: JSON.stringify({
          id_bodega: recepcion.id_bodega,
          tipo_movimiento: 'ING', // Ingreso (Entry)
          referencia: `RECPCION-${id}`,
          detalles: detallesMovimiento
        })
      });

      if (!inventarioRes.ok) {
        const errorData = await inventarioRes.json().catch(() => ({}));
        return res.status(400).json({
          success: false,
          error: `El servicio de Inventario rechazó la actualización de stock: ${errorData.error || 'Error desconocido'}`
        });
      }
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: `Fallo de red al comunicar con el servicio de Inventario: ${err.message}`
      });
    }

    // Si la actualización de stock en Inventario fue exitosa, aprobamos la recepción localmente
    const recepcionAprobada = await Recepcion.updateRecepcionEstado(id, 'APR', new Date());

    res.status(200).json({
      success: true,
      message: 'Recepción aprobada y stock de inventario actualizado exitosamente.',
      data: recepcionAprobada
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllRecepciones,
  getRecepcion,
  createRecepcion,
  aprobarRecepcion
};
