const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSupabase() {
  console.log('⏳ Probando conexión a Supabase...');
  try {
    const res = await pool.query('SELECT NOW() as tiempo_supabase, current_database() as nombre_db');
    console.log('✅ ¡Conexión Exitosa a Supabase!');
    console.log(`⏰ Tiempo del servidor en la nube: ${res.rows[0].tiempo_supabase}`);
    console.log(`🗄️ Nombre de la base de datos: ${res.rows[0].nombre_db}`);
    
    // Probar si hay datos en alguna tabla (ej. usuarios)
    const users = await pool.query('SELECT COUNT(*) as total FROM usuario');
    console.log(`👥 Tienes ${users.rows[0].total} usuarios en la tabla 'usuario' de Supabase.`);
  } catch (err) {
    console.error('❌ Falló la conexión:', err.message);
  } finally {
    pool.end();
  }
}

testSupabase();
