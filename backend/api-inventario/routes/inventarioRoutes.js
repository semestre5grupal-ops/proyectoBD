const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Mapeo explícito de los endpoints del microservicio
router.post('/descontar', inventarioController.descontarStock);
router.post('/ingresar', inventarioController.ingresarStock); // <- Aquí se registra el endpoint que te dio el error 404
router.get('/stock/:idVariante', inventarioController.consultarStock);
// Ruta para disparar la sincronización a Firebase
router.get('/sincronizar-cloud', inventarioController.sincronizarCloud);

module.exports = router;