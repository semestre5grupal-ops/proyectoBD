const InventarioModel = require('../models/inventarioModel');
const axios = require('axios');

// ENDPOINT: Descontar Stock (Gabriel - Ventas)
exports.descontarStock = async (req, res) => {
    try {
        const { idVariante, cantidad } = req.body;

        if (!idVariante || !cantidad || cantidad <= 0) {
            return res.status(400).json({ success: false, error: "Parámetros inválidos." });
        }

        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "No existe el registro de inventario." });
        }

        if (inventario.inv_saldo_final < cantidad) {
            return res.status(400).json({ success: false, error: "Stock insuficiente en bodega." });
        }

        const nuevoSaldoFinal = inventario.inv_saldo_final - cantidad;
        const nuevaQtyEgresos = (inventario.inv_qty_egresos || 0) + cantidad;

        await InventarioModel.actualizarStock(
            inventario.id_bodega,
            idVariante,
            inventario.inv_periodo,
            nuevoSaldoFinal,
            nuevaQtyEgresos
        );

        return res.status(200).json({
            success: true,
            message: "Stock de inventario descontado con éxito del flujo de bodegas.",
            stock_restante: nuevoSaldoFinal
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Ingresar Stock por Compra (Liz - Compras)
exports.ingresarStock = async (req, res) => {
    try {
        const { idVariante, cantidad, idBodega, descripcion, usuario } = req.body;

        if (!idVariante || !cantidad || cantidad <= 0 || !idBodega || !usuario) {
            return res.status(400).json({
                success: false,
                error: "Parámetros inválidos. Campos requeridos completos."
            });
        }

        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "No existe parametrización de inventario." });
        }

        const nuevoSaldoFinal = inventario.inv_saldo_final + cantidad;
        const nuevaQtyIngresos = (inventario.inv_qty_ingresos || 0) + cantidad;

        await InventarioModel.actualizarStockIngreso(
            idBodega,
            idVariante,
            inventario.inv_periodo,
            nuevoSaldoFinal,
            nuevaQtyIngresos
        );

        await InventarioModel.registrarRecepcion(idBodega, descripcion || "Ingreso por compras", cantidad, usuario);

        return res.status(200).json({
            success: true,
            message: "Mercadería ingresada al inventario y recepción registrada con éxito.",
            stock_actual: nuevoSaldoFinal
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Consultar disponibilidad (Gabriel - Ventas)
exports.consultarStock = async (req, res) => {
    try {
        const { idVariante } = req.params;
        const inventario = await InventarioModel.obtenerStockVariante(idVariante);
        if (!inventario) {
            return res.status(404).json({ success: false, error: "Variante sin inventario asignado." });
        }
        return res.status(200).json({
            success: true,
            id_bodega: inventario.id_bodega,
            stock_disponible: inventario.inv_saldo_final
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ─── Endpoints saga de stock para api-ventas ─────────────────────────────────

// GET /variantes/:id → {id_variante, nombre, valor_unitario, iva_incluido}
exports.getVariante = async (req, res) => {
    try {
        const data = await InventarioModel.obtenerVariante(req.params.id);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        const status = error.message.includes('not found') || error.message.includes('no rows') ? 404 : 500;
        return res.status(status).json({ success: false, error: error.message });
    }
};

// POST /stock/verificar — lote sin modificar stock
// Body: { items: [{id_variante, cantidad}] }
exports.verificarStock = async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'items requerido y no vacío.' });
        }
        const resultado = await InventarioModel.verificarStockLote(items);
        return res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// POST /stock/reservar — descuenta stock (implementación mínima).
// TODO[OI-08]: saga completa requiere tabla de reservas.
// Body: { documento_id, items: [{id_variante, cantidad}] }
exports.reservarStock = async (req, res) => {
    try {
        const { documento_id, items } = req.body;
        if (!documento_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'documento_id e items son requeridos.' });
        }
        const resultado = await InventarioModel.reservarStockLote(documento_id, items);
        return res.status(200).json({ success: true, ...resultado });
    } catch (error) {
        const status = error.message.includes('insuficiente') ? 409 : 500;
        return res.status(status).json({ success: false, error: error.message });
    }
};

// POST /stock/confirmar — no-op en implementación mínima (stock ya descontado en reservar).
// TODO[OI-08]: en saga completa, aquí se haría el commit final.
// Body: { reserva_id, documento_id }
exports.confirmarReserva = async (req, res) => {
    try {
        const { reserva_id, documento_id } = req.body;
        if (!reserva_id || !documento_id) {
            return res.status(400).json({ success: false, error: 'reserva_id y documento_id son requeridos.' });
        }
        // TODO[OI-08]: no-op. En saga completa: mover stock de "reservado" a "comprometido".
        return res.status(200).json({ success: true, message: 'Reserva confirmada.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// POST /stock/liberar — revierte el descuento de reservarStock (compensación).
// Body: { reserva_id, documento_id }
exports.liberarReserva = async (req, res) => {
    try {
        const { reserva_id, documento_id } = req.body;
        if (!reserva_id || !documento_id) {
            return res.status(400).json({ success: false, error: 'reserva_id y documento_id son requeridos.' });
        }
        // Para liberar necesitamos los items originales; el cliente debe enviarlos.
        // TODO[OI-08]: en saga completa, recuperar items desde tabla de reservas.
        const { items } = req.body;
        if (Array.isArray(items) && items.length > 0) {
            await InventarioModel.liberarStockLote(items);
        }
        return res.status(200).json({ success: true, message: 'Reserva liberada.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// POST /stock/reponer — devuelve stock (para anulaciones FAC APR y NCR). TODO[OI-07]
// Body: { documento_id, items: [{id_variante, cantidad}] }
exports.reponerStock = async (req, res) => {
    try {
        const { documento_id, items } = req.body;
        if (!documento_id || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'documento_id e items son requeridos.' });
        }
        await InventarioModel.reponerStockLote(items);
        return res.status(200).json({ success: true, message: 'Stock repuesto correctamente.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ENDPOINT: Sincronizar Catálogo hacia la Nube (Firebase NoSQL)
exports.sincronizarCloud = async (req, res) => {
    try {
        console.log("🔄 Iniciando sincronización masiva con Firebase...");

        // 1. Obtener la data estructurada desde Supabase
        const catalogo = await InventarioModel.obtenerCatalogoParaEcommerce();

        // 2. Enviar la data usando la API REST de Firebase (.json es obligatorio en Firebase)
        const firebaseUri = `${process.env.FIREBASE_DB_URL}/catalogo_ecommerce.json`;

        await axios.put(firebaseUri, catalogo);

        return res.status(200).json({
            success: true,
            message: "Ecosistema híbrido sincronizado. Catálogo en la nube Firebase actualizado con éxito.",
            items_sincronizados: catalogo.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Error en la sincronización híbrida: " + error.message
        });
    }
};

/**
 * PUT /api/inventario/ajustes/:id/aprobar
 * Llama al Stored Procedure para aprobar el ajuste y mover inventario físicamente.
 */
exports.aprobarAjuste = async (req, res) => {
    try {
        const idCabecera = req.params.id;
        const { idBodega, idVariante, cantidad } = req.body;
        
        if (!idCabecera || !idVariante || cantidad == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idCabecera, idVariante, cantidad).'
            });
        }

        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Sistema';

        await InventarioModel.aprobarAjusteFisico(
            idCabecera,
            idBodega || 1,
            idVariante,
            cantidad,
            usuario
        );

        return res.status(200).json({
            success: true,
            message: `Ajuste (Cabecera: ${idCabecera}) procesado en base de datos transaccional con éxito.`
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [aprobarAjuste]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al aprobar ajuste de stock.'
        });
    }
};

/**
 * POST /api/inventario/ajustes/pendiente
 * Crea la cabecera del ajuste con estado PEN y devuelve su ID (UUID).
 */
exports.crearCabeceraPendiente = async (req, res) => {
    try {
        const { idBodega, idVariante, cantidad, descripcion } = req.body;
        
        if (!idVariante || cantidad == null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan datos obligatorios (idVariante, cantidad).'
            });
        }

        const usuario = req.usuarioAutenticado?.usu_nombre ?? req.usuarioAutenticado?.nombre ?? 'Sistema';

        const idCabecera = await InventarioModel.crearCabeceraAjustePendiente(
            idBodega || 1,
            idVariante,
            cantidad,
            usuario,
            descripcion || "Ajuste/Recepción vía Agente de Voz"
        );

        return res.status(201).json({
            success: true,
            message: "Cabecera pendiente creada con éxito.",
            id: idCabecera
        });
    } catch (error) {
        console.error('🔥 ERROR EN CONTROLADOR [crearCabeceraPendiente]:', error);
        return res.status(500).json({
            success: false,
            error: error.message ?? 'Error interno al crear cabecera pendiente.'
        });
    }
};