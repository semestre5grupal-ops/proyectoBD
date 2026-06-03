const NotificacionesModel = require('../models/notificacionesModel');

/**
 * Mapeo canónico id_rol (JWT de Alejandro) → string semántico almacenado en Supabase.
 * Los registros de 'notificaciones_tareas' se guardaron con el string semántico,
 * por lo tanto la búsqueda debe usar el mismo string.
 *
 * Sincronizado con authMiddleware.js:
 *   id_rol 8  → JEFE_INVENTARIO
 *   id_rol 9  → AUXILIAR_INVENTARIO
 *   id_rol 10 → OPERATIVO_INVENTARIO
 */
const MAPA_ID_ROL = {
    8:  'JEFE_INVENTARIO',
    9:  'AUXILIAR_INVENTARIO',
    10: 'OPERATIVO_INVENTARIO',
};

/**
 * Resuelve el nombre de rol semántico a partir del payload del JWT.
 *
 * Prioridad:
 *   1. id_rol numérico  → mapeo canónico (fuente de verdad del JWT de Alejandro)
 *   2. rol_nombre string → ya resuelto por authMiddleware (fallback)
 *   3. Default          → 'OPERATIVO_INVENTARIO' (rol más restrictivo)
 *
 * @param {object} usuarioAutenticado - req.usuarioAutenticado
 * @returns {string} nombre semántico del rol
 */
function resolverRolNombre(usuarioAutenticado) {
    // 1. Mapeo explícito por id_rol numérico (mayor prioridad)
    const idRol = Number(usuarioAutenticado?.id_rol);
    if (MAPA_ID_ROL[idRol]) return MAPA_ID_ROL[idRol];

    // 2. Fallback: string ya resuelto por authMiddleware
    if (usuarioAutenticado?.rol_nombre) return usuarioAutenticado.rol_nombre;
    if (usuarioAutenticado?.rol)        return usuarioAutenticado.rol;

    // 3. Default seguro
    console.warn('[notificacionesController] id_rol no reconocido:', usuarioAutenticado?.id_rol, '— usando OPERATIVO_INVENTARIO');
    return 'OPERATIVO_INVENTARIO';
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

