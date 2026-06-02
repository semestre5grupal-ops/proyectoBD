const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Importar tus nuevos escudos de seguridad
const { verificarToken, restringirA } = require('../middlewares/authMiddleware');

// RUTA PÚBLICA o CONSULTA: Cualquier usuario autenticado puede revisar existencias
router.get('/stock/:idVariante', verificarToken, inventarioController.consultarStock);

// RUTAS PROTEGIDAS CRÍTICAS: Solo usuarios con roles autorizados pueden alterar stock o la nube
router.post('/ingresar', verificarToken, restringirA('ADMIN', 'EMPLEADO_BODEGA'), inventarioController.ingresarStock);
router.post('/descontar', verificarToken, restringirA('ADMIN', 'EMPLEADO_BODEGA'), inventarioController.descontarStock);
router.get('/sincronizar-cloud', verificarToken, restringirA('ADMIN'), inventarioController.sincronizarCloud);

module.exports = router;