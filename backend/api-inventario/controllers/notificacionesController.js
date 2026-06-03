const NotificacionesModel = require('../models/notificacionesModel');

/**
 * GET /api/inventario/tareas/pendientes
 * Devuelve todas las notificaciones con estado = 'pendiente'.
 * Protegido con verificarToken (definido en la ruta).
 */
exports.obtenerTareasPendientes = async (req, res) => {
    try {
        const pendientes = await NotificacionesModel.obtenerPendientes();
        return res.status(200).json({
            success: true,
            total: pendientes.length,
            data: pendientes,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * POST (interno) — usado por el controlador de IA para persistir tareas
 * generadas por Ollama que requieran acción del OPERATIVO_INVENTARIO.
 * No es una ruta HTTP directa; se exporta para reutilizarla desde inventarioController.
 */
exports.guardarNotificacion = async ({ payload, accion, mensaje, rolOrigen }) => {
    return NotificacionesModel.crearNotificacion({ payload, accion, mensaje, rolOrigen });
};
