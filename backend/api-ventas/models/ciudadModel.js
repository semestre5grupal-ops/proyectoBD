const supabase = require('../config/db');

const CiudadModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('ciudad').select('*').order('id_ciudad');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('ciudad').select('*').eq('id_ciudad', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ ciu_nombre, ciu_abreviado, ciu_estado }) => {
        const { data, error } = await supabase
            .from('ciudad')
            .insert([{ ciu_nombre, ciu_abreviado, ciu_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { ciu_nombre, ciu_abreviado, ciu_estado }) => {
        const { data, error } = await supabase
            .from('ciudad')
            .update({ ciu_nombre, ciu_abreviado, ciu_estado })
            .eq('id_ciudad', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('ciudad')
            .delete()
            .eq('id_ciudad', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = CiudadModel;
