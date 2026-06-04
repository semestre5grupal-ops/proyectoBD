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
        console.warn(`[WARNING] No se pudo validar la variante ${id_variante} en la API de Inventario (${URL_API_INVENTARIO}): ${err.message}. Continuando en modo fallback.`);
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

    // Integración Automática: Generar Recepción en Inventarios si la orden se aprueba
    if (estado === 'APR') {
      try {
        const compraCompleta = await Compra.getCompraById(req.params.id);
        if (compraCompleta && compraCompleta.detalles) {
          const payloadInventario = {
            id_compra: Number(compraCompleta.id_compra),
            id_bodega: 1,
            descripcion: "Recepción generada desde módulo Compras",
            usuario_responsable: "Liz_Cloud", // O usar req.user si está disponible
            productos: compraCompleta.detalles.map(d => ({
              id_variante: d.id_variante,
              pxo_cantidad: d.pxo_cantidad
            }))
          };

          const URL_INVENTARIO = process.env.URL_API_INVENTARIO || "http://localhost:4000";
          
          const inventarioRes = await fetch(`${URL_INVENTARIO}/api/inventario/recepciones`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": req.headers["authorization"] || ""
            },
            body: JSON.stringify(payloadInventario)
          });

          if (!inventarioRes.ok) {
            console.warn(`[WARNING] Falló la creación de recepción en Inventario (HTTP ${inventarioRes.status})`);
          } else {
            console.log(`[SUCCESS] 🚀 Recepción generada exitosamente en la API de Inventario para la OC #${compraCompleta.id_compra}`);
          }
        }
      } catch (err) {
        console.error(`[ERROR] Excepción al notificar a Inventario: ${err.message}`);
      }
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
        console.warn(`[WARNING] No se pudo validar la variante ${id_variante} en la API de Inventario (${URL_API_INVENTARIO}): ${err.message}. Continuando en modo fallback.`);
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
