const supabase = require('../config/db');

const LogisticaModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('logistica').select('*').order('id_logistica');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('logistica').select('*').eq('id_logistica', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    getByDocumento: async (idDocumento) => {
        const { data, error } = await supabase
            .from('logistica')
            .select('*')
            .eq('id_documento', idDocumento);
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_documento, id_direccion, log_despacho, log_estimada, log_real, log_estado }) => {
        const { data, error } = await supabase
            .from('logistica')
            .insert([{ id_documento, id_direccion, log_despacho, log_estimada, log_real, log_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_documento, id_direccion, log_despacho, log_estimada, log_real, log_estado }) => {
        const { data, error } = await supabase
            .from('logistica')
            .update({ id_documento, id_direccion, log_despacho, log_estimada, log_real, log_estado })
            .eq('id_logistica', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('logistica')
            .delete()
            .eq('id_logistica', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = LogisticaModel;
