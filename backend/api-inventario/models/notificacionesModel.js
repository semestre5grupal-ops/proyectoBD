const supabase = require('../config/db');

const NotificacionesModel = {
    /**
     * Obtener todas las notificaciones con estado 'pendiente'.
     * Ordena por fecha de creación ascendente (las más antiguas primero).
     */
    obtenerPendientes: async () => {
        const { data, error } = await supabase
            .from('notificaciones_tareas')
            .select('*')
            .eq('estado', 'pendiente')
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /**
     * Guardar una nueva notificación de tarea en estado 'pendiente'.
     * @param {object} payload - Datos de la tarea generada por Ollama.
     * @param {string} accion  - AccionInventario: INGRESAR_STOCK, CONFIRMAR_RECEPCION, etc.
     * @param {string} mensaje - Texto legible para el operativo.
     * @param {string} rolOrigen - Rol que generó la tarea.
     */
    crearNotificacion: async ({ payload, accion, mensaje, rolOrigen }) => {
        const { data, error } = await supabase
            .from('notificaciones_tareas')
            .insert([
                {
                    estado: 'pendiente',
                    accion,
                    mensaje_usuario: mensaje,
                    rol_origen: rolOrigen,
                    payload_json: payload,
                    created_at: new Date().toISOString(),
                }
            ])
            .select();

        if (error) throw new Error(error.message);
        return data[0];
    },
};

module.exports = NotificacionesModel;
