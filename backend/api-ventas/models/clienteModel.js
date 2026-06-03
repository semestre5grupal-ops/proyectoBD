const supabase = require('../config/db');

const ClienteModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('clientes').select('*').order('id_cliente');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('clientes').select('*').eq('id_cliente', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_telefono, cli_correo, cli_categoria, cli_estado }) => {
        const { data, error } = await supabase
            .from('clientes')
            .insert([{ id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_telefono, cli_correo, cli_categoria, cli_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_telefono, cli_correo, cli_categoria, cli_estado }) => {
        const { data, error } = await supabase
            .from('clientes')
            .update({ id_ciudad, cli_nombre, cli_ciruc, cli_celular, cli_telefono, cli_correo, cli_categoria, cli_estado })
            .eq('id_cliente', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('clientes')
            .delete()
            .eq('id_cliente', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = ClienteModel;
