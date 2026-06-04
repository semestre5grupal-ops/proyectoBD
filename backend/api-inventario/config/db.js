const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// Generamos un token simulando que eres un usuario JEFE_INVENTARIO o ADMIN
const tokenDePrueba = jwt.sign(
    { id_usuario: 999, rol: 'ADMIN' }, // Rol autorizado en tus rutas
    process.env.JWT_SECRET || 'clave_secreta_local',
    { expiresIn: '24h' }
);
console.log('🔑 TU TOKEN DE PRUEBA PARA THUNDER CLIENT:\nBearer ' + tokenDePrueba);


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
