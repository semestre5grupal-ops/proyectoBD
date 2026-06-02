const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const empleadoRoutes = require('./routes/empleadoRoutes');
const rolRoutes = require('./routes/rolRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const vacacionRoutes = require('./routes/vacacionRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite a express entender JSON en los cuerpos de las peticiones (req.body)

// Conectar a la Base de Datos
connectDB();

// Registro de Rutas
app.use('/api/empleados', empleadoRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/vacaciones', vacacionRoutes);

// Iniciar Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Talento Humano corriendo en http://localhost:${PORT}`);
});
