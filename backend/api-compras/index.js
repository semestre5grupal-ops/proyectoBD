const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const ciudadRoutes = require('./routes/ciudadRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const compraRoutes = require('./routes/compraRoutes');
const recepcionRoutes = require('./routes/recepcionRoutes');
const devolucionRoutes = require('./routes/devolucionRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite entender JSON en los cuerpos de las peticiones

// Conectar a la Base de Datos
connectDB();

// Registro de Rutas
app.use('/api/ciudades', ciudadRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/recepciones', recepcionRoutes);
app.use('/api/devoluciones-compra', devolucionRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

// Iniciar Servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Compras corriendo en http://localhost:${PORT}`);
});
