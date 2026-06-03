const supabase = require('../config/db');

/**
 * SCHEMA REAL de la tabla 'notificaciones_tareas' en Supabase:
 *
 *  id                 uuid  PK
 *  rol_origen         text  NOT NULL   — Rol que generó la tarea
 *  usuario_origen     text  NOT NULL   — Nombre del usuario que generó la tarea
 *  accion             text  NOT NULL   — AccionInventario
 *  payload_json       jsonb            — Datos extra de la tarea
 *  instruccion_original text NOT NULL  — Texto original del usuario
 *  respuesta_ia       text  NOT NULL   — Mensaje generado por Ollama para el destinatario
 *  estado             text  NOT NULL   — 'pendiente' | 'confirmada' | 'rechazada'
 *  creado_en          timestamptz      — Timestamp de creación
 *  rol_destino        text  NOT NULL   — Rol que debe ejecutar la tarea
 */

const NotificacionesModel = {
    /**
     * Obtener notificaciones 'pendiente' filtradas por rol_destino.
     * El rolDestino viene del JWT del usuario que hace la petición.
     *
     * @param {string} rolDestino - Ej: 'OPERATIVO_INVENTARIO'
     */
    obtenerPendientesPorRol: async (rolDestino) => {
        console.log('[NotificacionesModel] obtenerPendientesPorRol → rolDestino:', rolDestino);

        try {
            const { data, error } = await supabase
                .from('notificaciones_tareas')
                .select('*')
                .eq('estado', 'pendiente')
                .eq('rol_destino', rolDestino)
                .order('creado_en', { ascending: true });

            console.log('[NotificacionesModel] Supabase data length:', data?.length ?? 0);

            if (error) {
                console.error('🔥 ERROR SUPABASE [obtenerPendientesPorRol]:', error);
                throw new Error(error.message);
            }

            return data ?? [];
        } catch (err) {
            console.error('🔥 ERROR EN MODELO [obtenerPendientesPorRol]:', err);
            throw err;
        }
    },

    /**
     * Guardar una nueva notificación con estado 'pendiente'.
     *
     * @param {object} params
     * @param {string} params.accion              — AccionInventario
     * @param {string} params.respuestaIa         — Mensaje de Ollama para el destinatario
     * @param {string} params.instruccionOriginal — Texto original del usuario
     * @param {string} params.usuarioOrigen       — Nombre del usuario que generó la tarea
     * @param {string} params.rolOrigen           — Rol que generó la tarea
     * @param {string} params.rolDestino          — Rol que debe ejecutarla
     * @param {object} [params.payload]           — Datos extra (idVariante, cantidad, etc.)
     */
    crearNotificacion: async ({
        accion,
        respuestaIa,
        instruccionOriginal,
        usuarioOrigen,
        rolOrigen,
        rolDestino,
        payload = {},
    }) => {
        console.log('[NotificacionesModel] crearNotificacion →', { accion, rolOrigen, rolDestino, usuarioOrigen });

        try {
            const { data, error } = await supabase
                .from('notificaciones_tareas')
                .insert([{
                    estado:               'pendiente',
                    accion,
                    rol_origen:           rolOrigen,
                    rol_destino:          rolDestino,
                    usuario_origen:       usuarioOrigen,
                    instruccion_original: instruccionOriginal,
                    respuesta_ia:         respuestaIa,
                    payload_json:         payload,
                    creado_en:            new Date().toISOString(),
                }])
                .select();

            console.log('[NotificacionesModel] insert data:', data);

            if (error) {
                console.error('🔥 ERROR SUPABASE [crearNotificacion]:', error);
                throw new Error(error.message);
            }

            return data[0];
        } catch (err) {
            console.error('🔥 ERROR EN MODELO [crearNotificacion]:', err);
            throw err;
        }
    },

    /**
     * Marcar una notificación como 'ejecutada' (o el estado que se le pase).
     *
     * @param {string} id - ID de la notificación a actualizar
     * @param {string} estado - Nuevo estado (default: 'ejecutada')
     */
    actualizarEstadoTarea: async (id, estado = 'ejecutada') => {
        console.log('[NotificacionesModel] actualizarEstadoTarea →', { id, estado });
        try {
            const { data, error } = await supabase
                .from('notificaciones_tareas')
                .update({ estado })
                .eq('id', id)
                .select();

            if (error) {
                console.error('🔥 ERROR SUPABASE [actualizarEstadoTarea]:', error);
                throw new Error(error.message);
            }

            return data[0];
        } catch (err) {
            console.error('🔥 ERROR EN MODELO [actualizarEstadoTarea]:', err);
            throw err;
        }
    },
};

module.exports = NotificacionesModel;
