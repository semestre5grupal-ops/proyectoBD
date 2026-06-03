const InventarioModel = require('../models/inventarioModel');
const axios = require('axios'); // Asegurar la importación al inicio del archivo si no está
const { guardarNotificacion } = require('./notificacionesController');

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

        // ── Persistir notificación en notificaciones_tareas (estado 'pendiente') ──────
        // Se dispara cuando Ollama genera un JSON válido de INGRESAR_STOCK / CONFIRMAR_RECEPCION.
        // El OPERATIVO_INVENTARIO la leerá al entrar al módulo de chat.
        try {
            await guardarNotificacion({
                accion: 'CONFIRMAR_RECEPCION',
                mensaje: `Recibirás un lote de ${cantidad} unidades (variante ${idVariante}) desde el módulo de compras. Confirma la recepción física.`,
                rolOrigen: req.usuarioAutenticado?.rol_nombre ?? 'SISTEMA',
                payload: { idVariante, cantidad, idBodega, descripcion, usuario },
            });
        } catch (notifErr) {
            // No interrumpir la respuesta principal si la notificación falla
            console.warn('[inventarioController] No se pudo guardar la notificación:', notifErr.message);
        }

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