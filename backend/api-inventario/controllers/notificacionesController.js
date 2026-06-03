const NotificacionesModel = require('../models/notificacionesModel');

/**
 * Mapa inverso id_rol → nombre de rol.
 * Sincronizado con authMiddleware.js y la tabla 'roles' de Supabase.
 */
const MAPA_ROLES = {
    8:  'JEFE_INVENTARIO',
    9:  'AUXILIAR_INVENTARIO',
    10: 'OPERATIVO_INVENTARIO',
};

/**
 * Resuelve el nombre de rol string desde el payload del JWT.
 * Primero intenta leer rol_nombre (ya resuelto por authMiddleware),
 * luego hace fallback al id_rol numérico.
 *
 * @param {object} usuarioAutenticado - req.usuarioAutenticado
 * @returns {string} nombre del rol o 'OPERATIVO_INVENTARIO' por defecto
 */
function resolverRolNombre(usuarioAutenticado) {
    if (usuarioAutenticado?.rol_nombre) return usuarioAutenticado.rol_nombre;
    return MAPA_ROLES[Number(usuarioAutenticado?.id_rol)] ?? 'OPERATIVO_INVENTARIO';
}

/**
 * GET /api/inventario/tareas/pendientes
 * Devuelve todas las notificaciones con estado = 'pendiente'
 * filtradas por el rol_destino del usuario autenticado.
 * Protegido con verificarToken (definido en la ruta).
 */
exports.obtenerTareasPendientes = async (req, res) => {
    try {
        const rolDestino = resolverRolNombre(req.usuarioAutenticado);
        const pendientes = await NotificacionesModel.obtenerPendientesPorRol(rolDestino);

        return res.status(200).json({
            success: true,
            rol_destino: rolDestino,
            total: pendientes.length,
            data: pendientes,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Helper interno — usado por inventarioController para persistir tareas
 * generadas por Ollama que requieran acción de otro rol.
 * No es una ruta HTTP directa.
 *
 * @param {object} params
 * @param {object} params.payload
 * @param {string} params.accion
 * @param {string} params.mensaje
 * @param {string} params.rolOrigen  - Quien generó la tarea
 * @param {string} [params.rolDestino] - Quien debe ejecutarla. Default: 'OPERATIVO_INVENTARIO'
 */
exports.guardarNotificacion = async ({ payload, accion, mensaje, rolOrigen, rolDestino = 'OPERATIVO_INVENTARIO' }) => {
    return NotificacionesModel.crearNotificacion({
        payload,
        accion,
        mensaje,
        rolOrigen,
        rolDestino,
    });
};

/**
 * POST /api/inventario/tareas
 * Persiste una notificación de tarea generada por Ollama en el FRONTEND.
 * El frontend la llama tan pronto como parsea el JSON de intención, ANTES de
 * que el usuario confirme. Solo se guarda si rol_destino !== rol_origen.
 *
 * Body esperado:
 *   { accion, mensaje_usuario, rol_origen, rol_destino, payload_json }
 *
 * Protegido con verificarToken (definido en la ruta).
 */
exports.crearTarea = async (req, res) => {
    try {
        const { accion, mensaje_usuario, rol_origen, rol_destino, payload_json } = req.body;

        if (!accion || !mensaje_usuario || !rol_destino) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: accion, mensaje_usuario, rol_destino.'
            });
        }

        const rolOrigen = rol_origen ?? resolverRolNombre(req.usuarioAutenticado);

        const notificacion = await NotificacionesModel.crearNotificacion({
            accion,
            mensaje: mensaje_usuario,
            rolOrigen,
            rolDestino: rol_destino,
            payload: payload_json ?? {},
        });

        return res.status(201).json({
            success: true,
            message: 'Notificación de tarea registrada correctamente.',
            data: notificacion,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

