const express = require('express');
const cors = require('cors');
require('dotenv').config();

const inventarioRoutes = require('./routes/inventarioRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales obligatorios
app.use(cors()); // Permite peticiones cruzadas multi-nodo
app.use(express.json()); // Permite mapear cuerpos JSON entrantes

// Enrutamiento de la API de Inventario
app.use('/api/inventario', inventarioRoutes);

// Ruta de diagnóstico base
app.get('/', (req, res) => {
    res.json({ modulo: "API Microservicio Inventario", estado: "Operativo en la Nube" });
});

// Inicialización del Servidor
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`📡 Servidor de Inventario corriendo en el puerto ${PORT}`);
    console.log(`===================================================`);
});