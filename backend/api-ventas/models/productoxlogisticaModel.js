const supabase = require('../config/db');

// Clave primaria compuesta: (id_logistica, id_variante)
const ProductoxlogisticaModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('productosxlogistica').select('*').order('id_logistica');
        if (error) throw new Error(error.message);
        return data;
    },

    getByLogistica: async (idLogistica) => {
        const { data, error } = await supabase
            .from('productosxlogistica')
            .select('*')
            .eq('id_logistica', idLogistica);
        if (error) throw new Error(error.message);
        return data;
    },

    getOne: async (idLogistica, idVariante) => {
        const { data, error } = await supabase
            .from('productosxlogistica')
            .select('*')
            .eq('id_logistica', idLogistica)
            .eq('id_variante', idVariante)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_logistica, id_variante, pxl_cantidad, pxl_estado }) => {
        const { data, error } = await supabase
            .from('productosxlogistica')
            .insert([{ id_logistica, id_variante, pxl_cantidad, pxl_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (idLogistica, idVariante, { pxl_cantidad, pxl_estado }) => {
        const { data, error } = await supabase
            .from('productosxlogistica')
            .update({ pxl_cantidad, pxl_estado })
            .eq('id_logistica', idLogistica)
            .eq('id_variante', idVariante)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (idLogistica, idVariante) => {
        const { data, error } = await supabase
            .from('productosxlogistica')
            .delete()
            .eq('id_logistica', idLogistica)
            .eq('id_variante', idVariante)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = ProductoxlogisticaModel;
