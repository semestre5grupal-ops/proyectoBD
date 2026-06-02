const supabase = require('../config/db');

const MetodoPagoModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('metodospago').select('*').order('id_metodopago');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('metodospago').select('*').eq('id_metodopago', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ mpg_nombre, mpg_diferido, mpg_plazos, mpg_estado, mpg_numero_referencia }) => {
        const { data, error } = await supabase
            .from('metodospago')
            .insert([{ mpg_nombre, mpg_diferido, mpg_plazos, mpg_estado, mpg_numero_referencia }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { mpg_nombre, mpg_diferido, mpg_plazos, mpg_estado, mpg_numero_referencia }) => {
        const { data, error } = await supabase
            .from('metodospago')
            .update({ mpg_nombre, mpg_diferido, mpg_plazos, mpg_estado, mpg_numero_referencia })
            .eq('id_metodopago', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('metodospago')
            .delete()
            .eq('id_metodopago', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = MetodoPagoModel;
