const supabase = require('../config/db');

// Clave primaria compuesta: (id_documento, id_metodopago)
const DocumentoxpagoModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('documentoxpago').select('*').order('id_documento');
        if (error) throw new Error(error.message);
        return data;
    },

    getByDocumento: async (idDocumento) => {
        const { data, error } = await supabase
            .from('documentoxpago')
            .select('*')
            .eq('id_documento', idDocumento);
        if (error) throw new Error(error.message);
        return data;
    },

    getOne: async (idDocumento, idMetodopago) => {
        const { data, error } = await supabase
            .from('documentoxpago')
            .select('*')
            .eq('id_documento', idDocumento)
            .eq('id_metodopago', idMetodopago)
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_documento, id_metodopago, dxp_monto_aboonado, dxp_referencia, dxp_mesesplazo }) => {
        const { data, error } = await supabase
            .from('documentoxpago')
            .insert([{ id_documento, id_metodopago, dxp_monto_aboonado, dxp_referencia, dxp_mesesplazo }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (idDocumento, idMetodopago, { dxp_monto_aboonado, dxp_referencia, dxp_mesesplazo }) => {
        const { data, error } = await supabase
            .from('documentoxpago')
            .update({ dxp_monto_aboonado, dxp_referencia, dxp_mesesplazo })
            .eq('id_documento', idDocumento)
            .eq('id_metodopago', idMetodopago)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (idDocumento, idMetodopago) => {
        const { data, error } = await supabase
            .from('documentoxpago')
            .delete()
            .eq('id_documento', idDocumento)
            .eq('id_metodopago', idMetodopago)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = DocumentoxpagoModel;
