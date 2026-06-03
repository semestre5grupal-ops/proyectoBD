const Compra = require('../models/compraModel');

const URL_API_INVENTARIO = process.env.URL_API_INVENTARIO || 'http://localhost:3004';

const getAllCompras = async (req, res) => {
  try {
    const compras = await Compra.getCompras();
    res.status(200).json({ success: true, data: compras });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCompra = async (req, res) => {
  try {
    const compra = await Compra.getCompraById(req.params.id);
    if (!compra) {
      return res.status(404).json({ success: false, message: 'Orden de compra no encontrada' });
    }
    res.status(200).json({ success: true, data: compra });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createCompra = async (req, res) => {
  try {
    const { id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, detalles } = req.body;

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ success: false, error: 'La orden de compra debe contener al menos un producto.' });
    }

    // Validar variantes en api-inventario vía HTTP
    for (const detail of detalles) {
      const { id_variante } = detail;
      try {
        const checkRes = await fetch(`${URL_API_INVENTARIO}/api/variantes/${id_variante}`, {
          headers: {
            'Authorization': req.headers['authorization'] // Reenviar token de SSO JWT
          }
        });
        if (!checkRes.ok) {
          return res.status(400).json({ 
            success: false, 
            error: `La variante de producto con ID ${id_variante} no es válida o no existe en Inventario.` 
          });
        }
      } catch (err) {
        return res.status(502).json({ 
          success: false, 
          error: `Error al validar variante ${id_variante} con el API de Inventario: ${err.message}` 
        });
      }
    }

    const nuevaCompra = await Compra.createCompra({
      id_proveedor,
      oc_fechaentrega,
      oc_subtotal,
      oc_iva,
      oc_total,
      detalles
    });

    res.status(201).json({ success: true, data: nuevaCompra });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCompraEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['ABI', 'APR', 'ANU'].includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado inválido. Debe ser ABI, APR, o ANU.' });
    }

    const compraActualizada = await Compra.updateCompraEstado(req.params.id, estado);
    if (!compraActualizada) {
      return res.status(404).json({ success: false, message: 'Orden de compra no encontrada' });
    }

    res.status(200).json({ success: true, data: compraActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCompra = async (req, res) => {
  try {
    const { id_proveedor, oc_fechaentrega, oc_subtotal, oc_iva, oc_total, detalles } = req.body;

    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ success: false, error: 'La orden de compra debe contener al menos un producto.' });
    }

    // Validar variantes en api-inventario vía HTTP
    for (const detail of detalles) {
      const { id_variante } = detail;
      try {
        const checkRes = await fetch(`${URL_API_INVENTARIO}/api/variantes/${id_variante}`, {
          headers: {
            'Authorization': req.headers['authorization']
          }
        });
        if (!checkRes.ok) {
          return res.status(400).json({ 
            success: false, 
            error: `La variante de producto con ID ${id_variante} no es válida o no existe en Inventario.` 
          });
        }
      } catch (err) {
        return res.status(502).json({ 
          success: false, 
          error: `Error al validar variante ${id_variante} con el API de Inventario: ${err.message}` 
        });
      }
    }

    const compraActualizada = await Compra.updateCompra(req.params.id, {
      id_proveedor,
      oc_fechaentrega,
      oc_subtotal,
      oc_iva,
      oc_total,
      detalles
    });

    if (!compraActualizada) {
      return res.status(404).json({ success: false, message: 'Orden de compra no encontrada' });
    }

    res.status(200).json({ success: true, data: compraActualizada });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllCompras,
  getCompra,
  createCompra,
  updateCompraEstado,
  updateCompra
};
