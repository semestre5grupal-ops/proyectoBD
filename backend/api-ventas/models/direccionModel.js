const supabase = require('../config/db');

const DireccionModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('direcciones').select('*').order('id_direccion');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('direcciones').select('*').eq('id_direccion', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    getByCliente: async (idCliente) => {
        const { data, error } = await supabase
            .from('direcciones')
            .select('*')
            .eq('id_cliente', idCliente)
            .order('id_direccion');
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_cliente, id_ciudad, dir_sector, dir_principal, dir_secundaria, dir_referencia, dir_estado }) => {
        const { data, error } = await supabase
            .from('direcciones')
            .insert([{ id_cliente, id_ciudad, dir_sector, dir_principal, dir_secundaria, dir_referencia, dir_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_cliente, id_ciudad, dir_sector, dir_principal, dir_secundaria, dir_referencia, dir_estado }) => {
        const { data, error } = await supabase
            .from('direcciones')
            .update({ id_cliente, id_ciudad, dir_sector, dir_principal, dir_secundaria, dir_referencia, dir_estado })
            .eq('id_direccion', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('direcciones')
            .delete()
            .eq('id_direccion', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = DireccionModel;
