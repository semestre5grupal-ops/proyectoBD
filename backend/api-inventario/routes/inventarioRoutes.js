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

// ─── Saga de stock para api-ventas ───────────────────────────────────────────
// Cualquier servicio autenticado puede consultar variantes y gestionar reservas.
router.get('/variantes/:id',    verificarToken, inventarioController.getVariante);
router.post('/stock/verificar', verificarToken, inventarioController.verificarStock);
router.post('/stock/reservar',  verificarToken, inventarioController.reservarStock);
router.post('/stock/confirmar', verificarToken, inventarioController.confirmarReserva);
router.post('/stock/liberar',   verificarToken, inventarioController.liberarReserva);
router.post('/stock/reponer',   verificarToken, inventarioController.reponerStock);

module.exports = router;