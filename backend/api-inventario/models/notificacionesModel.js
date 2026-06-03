const supabase = require('../config/db');

const NotificacionesModel = {
    /**
     * Obtener notificaciones 'pendientes' filtradas por rol_destino.
     * El rolDestino viene del JWT del usuario que hace la petición.
     *
     * @param {string} rolDestino - Ej: 'OPERATIVO_INVENTARIO'
     */
    obtenerPendientesPorRol: async (rolDestino) => {
        const { data, error } = await supabase
            .from('notificaciones_tareas')
            .select('*')
            .eq('estado', 'pendiente')
            .eq('rol_destino', rolDestino)
            .order('created_at', { ascending: true });

        if (error) throw new Error(error.message);
        return data ?? [];
    },

    /**
     * Guardar una nueva notificación con estado 'pendiente'.
     * Almacena tanto rol_origen (quien la creó) como rol_destino (quien debe ejecutarla).
     *
     * @param {object} params
     * @param {object} params.payload    - Datos de la tarea (idVariante, cantidad, etc.)
     * @param {string} params.accion     - AccionInventario (CONFIRMAR_RECEPCION, etc.)
     * @param {string} params.mensaje    - Texto legible para el operativo
     * @param {string} params.rolOrigen  - Rol que generó la tarea (JEFE_INVENTARIO)
     * @param {string} params.rolDestino - Rol que debe ejecutarla (OPERATIVO_INVENTARIO)
     */
    crearNotificacion: async ({ payload, accion, mensaje, rolOrigen, rolDestino }) => {
        const { data, error } = await supabase
            .from('notificaciones_tareas')
            .insert([
                {
                    estado: 'pendiente',
                    accion,
                    mensaje_usuario: mensaje,
                    rol_origen: rolOrigen,
                    rol_destino: rolDestino,
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
