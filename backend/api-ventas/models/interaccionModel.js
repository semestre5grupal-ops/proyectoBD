const supabase = require('../config/db');

const InteraccionModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('interacciones').select('*').order('id_interaccion');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('interacciones').select('*').eq('id_interaccion', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    getByCliente: async (idCliente) => {
        const { data, error } = await supabase
            .from('interacciones')
            .select('*')
            .eq('id_cliente', idCliente)
            .order('int_apertura', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_cliente, id_documento, int_tipo, int_canal, int_inconveniente, int_apertura, int_cierre, int_estado }) => {
        const { data, error } = await supabase
            .from('interacciones')
            .insert([{ id_cliente, id_documento, int_tipo, int_canal, int_inconveniente, int_apertura, int_cierre, int_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_cliente, id_documento, int_tipo, int_canal, int_inconveniente, int_apertura, int_cierre, int_estado }) => {
        const { data, error } = await supabase
            .from('interacciones')
            .update({ id_cliente, id_documento, int_tipo, int_canal, int_inconveniente, int_apertura, int_cierre, int_estado })
            .eq('id_interaccion', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('interacciones')
            .delete()
            .eq('id_interaccion', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = InteraccionModel;
