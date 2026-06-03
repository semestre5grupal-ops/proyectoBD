const supabase = require('../config/db');

const VendedorModel = {
    getAll: async () => {
        const { data, error } = await supabase.from('vendedores').select('*').order('id_vendedor');
        if (error) throw new Error(error.message);
        return data;
    },

    getById: async (id) => {
        const { data, error } = await supabase.from('vendedores').select('*').eq('id_vendedor', id).single();
        if (error) throw new Error(error.message);
        return data;
    },

    create: async ({ id_empleado, ven_comision, ven_meta, ven_estado }) => {
        const { data, error } = await supabase
            .from('vendedores')
            .insert([{ id_empleado, ven_comision, ven_meta, ven_estado }])
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    update: async (id, { id_empleado, ven_comision, ven_meta, ven_estado }) => {
        const { data, error } = await supabase
            .from('vendedores')
            .update({ id_empleado, ven_comision, ven_meta, ven_estado })
            .eq('id_vendedor', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    },

    delete: async (id) => {
        const { data, error } = await supabase
            .from('vendedores')
            .delete()
            .eq('id_vendedor', id)
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
};

module.exports = VendedorModel;
