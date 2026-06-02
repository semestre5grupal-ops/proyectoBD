const Devolucion = require('../models/devolucionModel');

const URL_API_INVENTARIO = process.env.URL_API_INVENTARIO || 'http://localhost:3004';

const getAllDevoluciones = async (req, res) => {
  try {
    const devoluciones = await Devolucion.getDevoluciones();
    res.status(200).json({ success: true, data: devoluciones });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDevolucion = async (req, res) => {
  try {
    const devolucion = await Devolucion.getDevolucionById(req.params.id);
    if (!devolucion) {
      return res.status(404).json({ success: false, message: 'Devolución de compra no encontrada' });
    }
    res.status(200).json({ success: true, data: devolucion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDevolucion = async (req, res) => {
  try {
    const { id_compra, id_bodega, devc_motivo, devc_num_produc, detalles } = req.body;
    const usu_responsable = req.usuario ? req.usuario.usu_nombre : 'SISTEMA';

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ success: false, error: 'La devolución debe contener detalles de productos.' });
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

    const nuevaDevolucion = await Devolucion.createDevolucion({
      id_compra,
      id_bodega,
      devc_motivo,
      devc_num_produc,
      usu_responsable,
      detalles
    });

    res.status(201).json({ success: true, data: nuevaDevolucion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const aprobarDevolucion = async (req, res) => {
  try {
    const { id } = req.params;
    const devolucion = await Devolucion.getDevolucionById(id);

    if (!devolucion) {
      return res.status(404).json({ success: false, message: 'Devolución de compra no encontrada' });
    }

    if (devolucion.devc_estado !== 'ABI') {
      return res.status(400).json({ success: false, error: 'Sólo se pueden aprobar devoluciones en estado ABI (Abierta).' });
    }

    // Preparar detalles para el inventario (egreso)
    const detallesMovimiento = devolucion.detalles.map(d => ({
      id_variante: d.id_variante,
      cantidad: d.pxdc_cantidad_devuelta
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
          id_bodega: devolucion.id_bodega,
          tipo_movimiento: 'EGR', // Egreso (Exit)
          referencia: `DEVCOMP-${id}`,
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

    // Si la actualización de stock fue exitosa, aprobamos la devolución localmente
    const devolucionAprobada = await Devolucion.updateDevolucionEstado(id, 'APR', new Date());

    res.status(200).json({
      success: true,
      message: 'Devolución de compra aprobada y stock de inventario deducido exitosamente.',
      data: devolucionAprobada
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllDevoluciones,
  getDevolucion,
  createDevolucion,
  aprobarDevolucion
};
