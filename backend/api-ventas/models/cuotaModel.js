const supabase = require('../config/db');

const CuotaModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('cuotas').select('*').order('id_cuota');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('cuotas').select('*').eq('id_cuota', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    getByDocumento: async (idDocumento) => {
        const { data, error } = await supabase
            .from('cuotas')
            .select('*')
            .eq('id_documento', idDocumento)
            .order('cuo_numero');
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_documento, cuo_numero, cuo_monto, cuo_pendiente, cuo_fecha_pagado, cuo_fecha_estimada, cuo_estado }) => {
        const { data, error } = await supabase
            .from('cuotas')
            .insert([{ id_documento, cuo_numero, cuo_monto, cuo_pendiente, cuo_fecha_pagado, cuo_fecha_estimada, cuo_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_documento, cuo_numero, cuo_monto, cuo_pendiente, cuo_fecha_pagado, cuo_fecha_estimada, cuo_estado }) => {
        const { data, error } = await supabase
            .from('cuotas')
            .update({ id_documento, cuo_numero, cuo_monto, cuo_pendiente, cuo_fecha_pagado, cuo_fecha_estimada, cuo_estado })
            .eq('id_cuota', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('cuotas')
            .delete()
            .eq('id_cuota', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = CuotaModel;
