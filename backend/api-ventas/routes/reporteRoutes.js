const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/reporteController');

router.get('/kpis',      authMiddleware, ctrl.kpis);
router.get('/ventas',    authMiddleware, ctrl.ventas);
router.get('/comercial', authMiddleware, ctrl.comercial);
router.get('/clientes',  authMiddleware, ctrl.clientes);
router.get('/productos', authMiddleware, ctrl.productos);

module.exports = router;
