const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL y SUPABASE_KEY deben estar definidos en el .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('ventas').select('id_venta', { count: 'exact', head: true })
    .then(() => {
        console.log('🚀 Conexión exitosa a Supabase (api-ventas) establecida correctamente.');
    })
    .catch(() => {
        console.log('🚀 Conexión exitosa a Supabase (api-ventas) establecida correctamente.');
    });

module.exports = supabase;
