const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Middleware de autenticación y autorización (RBAC)
const { verificarToken, restringirA } = require('../middlewares/authMiddleware');

// ─── CONSULTA DE STOCK ────────────────────────────────────────────────────────
// Cualquier usuario autenticado puede revisar existencias (sin restricción de rol).
router.get('/stock/:idVariante', verificarToken, inventarioController.consultarStock);

// ─── OPERACIONES DE STOCK ─────────────────────────────────────────────────────
// Ingresar stock: solo JEFE o OPERATIVO (quien recibe físicamente la mercadería).
router.post('/ingresar',  verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.ingresarStock);

// Descontar stock: solo JEFE o OPERATIVO (quien procesa la salida de mercadería).
router.post('/descontar', verificarToken, restringirA('JEFE_INVENTARIO', 'OPERATIVO_INVENTARIO'), inventarioController.descontarStock);

// ─── SINCRONIZACIÓN CLOUD ─────────────────────────────────────────────────────
// Operación masiva hacia Firebase: exclusivo para el Jefe de Inventario.
router.get('/sincronizar-cloud', verificarToken, restringirA('JEFE_INVENTARIO'), inventarioController.sincronizarCloud);

module.exports = router;