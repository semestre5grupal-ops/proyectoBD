const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const empleadoRoutes = require('./routes/empleadoRoutes');
const rolRoutes = require('./routes/rolRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const vacacionRoutes = require('./routes/vacacionRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const departamentoRoutes = require('./routes/departamentoRoutes');
const dependientesRoutes = require('./routes/dependientesRoutes');
const detallehorarioRoutes = require('./routes/detallehorarioRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const horarioxempleadoRoutes = require('./routes/horarioxempleadoRoutes');
const logRoutes = require('./routes/logRoutes');
const metaRoutes = require('./routes/metaRoutes');
const periodoRoutes = require('./routes/periodoRoutes');
const rolpagosRoutes = require('./routes/rolpagosRoutes');
const rubrosRoutes = require('./routes/rubrosRoutes');
const rubrosxrolRoutes = require('./routes/rubrosxrolRoutes');

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
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/contrato', contratoRoutes);
app.use('/api/departamento', departamentoRoutes);
app.use('/api/dependientes', dependientesRoutes);
app.use('/api/detallehorario', detallehorarioRoutes);
app.use('/api/horario', horarioRoutes);
app.use('/api/horarioxempleado', horarioxempleadoRoutes);
app.use('/api/log', logRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/periodo', periodoRoutes);
app.use('/api/rolpagos', rolpagosRoutes);
app.use('/api/rubros', rubrosRoutes);
app.use('/api/rubrosxrol', rubrosxrolRoutes);

// Iniciar Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de Talento Humano corriendo en http://localhost:${PORT}`);
});
