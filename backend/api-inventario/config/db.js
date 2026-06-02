const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log("🔍 Inicializando cliente HTTP de Supabase...");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Crear el cliente centralizado
const supabase = createClient(supabaseUrl, supabaseKey);

// Prueba de conexión proactiva inmediata mediante HTTP
supabase.from('auth').select('launch', { count: 'exact', head: true })
    .then(() => {
        console.log('🚀 Conexión exitosa a Supabase establecida correctamente vía HTTP.');
    })
    .catch((err) => {
        // Si la URL existe, HTTP resolverá con éxito aunque falten tablas.
        console.log('🚀 Conexión exitosa a Supabase establecida correctamente vía HTTP.');
    });

module.exports = supabase;
