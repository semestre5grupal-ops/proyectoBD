const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL 
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`📦 Conectado exitosamente a la base de datos PostgreSQL: ${process.env.DB_NAME}`);
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
