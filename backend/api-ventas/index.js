const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar el cliente Supabase (dispara la prueba de conexion al arrancar)
require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/ciudad',               require('./routes/ciudadRoutes'));
app.use('/api/clientes',             require('./routes/clienteRoutes'));
app.use('/api/direcciones',          require('./routes/direccionRoutes'));
app.use('/api/vendedores',           require('./routes/vendedorRoutes'));
app.use('/api/metodospago',          require('./routes/metodoPagoRoutes'));
app.use('/api/documentos',           require('./routes/documentoRoutes'));
app.use('/api/documentoxpago',       require('./routes/documentoxpagoRoutes'));
app.use('/api/productosxdocumento',  require('./routes/productoxdocumentoRoutes'));
app.use('/api/cuotas',               require('./routes/cuotaRoutes'));
app.use('/api/interacciones',        require('./routes/interaccionRoutes'));
app.use('/api/logistica',            require('./routes/logisticaRoutes'));
app.use('/api/productosxlogistica',  require('./routes/productoxlogisticaRoutes'));
app.use('/api/reportes',             require('./routes/reporteRoutes'));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Ventas corriendo en http://localhost:${PORT}`);
});