const supabase = require('../config/db');

const DocumentoModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('documentos').select('*').order('id_documento');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('documentos').select('*').eq('id_documento', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    getByCliente: async (idCliente) => {
        const { data, error } = await supabase
            .from('documentos')
            .select('*')
            .eq('id_cliente', idCliente)
            .order('doc_emision', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_cliente, doc_id_documento, id_vendedor, doc_tipo, doc_emision, doc_pago, doc_descripcion, doc_subtotal, doc_iva, doc_descuento, doc_total, doc_estado }) => {
        const { data, error } = await supabase
            .from('documentos')
            .insert([{ id_cliente, doc_id_documento, id_vendedor, doc_tipo, doc_emision, doc_pago, doc_descripcion, doc_subtotal, doc_iva, doc_descuento, doc_total, doc_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_cliente, doc_id_documento, id_vendedor, doc_tipo, doc_emision, doc_pago, doc_descripcion, doc_subtotal, doc_iva, doc_descuento, doc_total, doc_estado }) => {
        const { data, error } = await supabase
            .from('documentos')
            .update({ id_cliente, doc_id_documento, id_vendedor, doc_tipo, doc_emision, doc_pago, doc_descripcion, doc_subtotal, doc_iva, doc_descuento, doc_total, doc_estado })
            .eq('id_documento', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('documentos')
            .delete()
            .eq('id_documento', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = DocumentoModel;
