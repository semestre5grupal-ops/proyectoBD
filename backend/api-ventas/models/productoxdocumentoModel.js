const supabase = require('../config/db');

// Clave primaria compuesta: (id_documento, id_variante)
const ProductoxdocumentoModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('productosxdocumento').select('*').order('id_documento');
        if (error) throw new Error(error.message);
        return data;
    },

    getByDocumento: async (idDocumento) => {
        const { data, error } = await supabase
            .from('productosxdocumento')
            .select('*')
            .eq('id_documento', idDocumento);
        if (error) throw new Error(error.message);
        return data;
    },

    getOne: async (idDocumento, idVariante) => {
        const { data, error } = await supabase
            .from('productosxdocumento')
            .select('*')
            .eq('id_documento', idDocumento)
            .eq('id_variante', idVariante)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_documento, id_variante, pxd_cantidad, pxd_valor_unitario, pxd_valor_subtotal, pxd_estado }) => {
        const { data, error } = await supabase
            .from('productosxdocumento')
            .insert([{ id_documento, id_variante, pxd_cantidad, pxd_valor_unitario, pxd_valor_subtotal, pxd_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (idDocumento, idVariante, { pxd_cantidad, pxd_valor_unitario, pxd_valor_subtotal, pxd_estado }) => {
        const { data, error } = await supabase
            .from('productosxdocumento')
            .update({ pxd_cantidad, pxd_valor_unitario, pxd_valor_subtotal, pxd_estado })
            .eq('id_documento', idDocumento)
            .eq('id_variante', idVariante)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (idDocumento, idVariante) => {
        const { data, error } = await supabase
            .from('productosxdocumento')
            .delete()
            .eq('id_documento', idDocumento)
            .eq('id_variante', idVariante)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = ProductoxdocumentoModel;
