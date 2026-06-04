const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/documentoController');
const negocio = require('../controllers/documentoNegocioController');

// CRUD existente
router.get('/', authMiddleware, ctrl.getAll);
router.get('/cliente/:idCliente', authMiddleware, ctrl.getByCliente);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

// Transiciones de negocio
router.post('/:id/emitir',       authMiddleware, negocio.emitir);
router.post('/:id/aprobar',      authMiddleware, negocio.aprobar);
router.post('/:id/anular',       authMiddleware, negocio.anular);
router.post('/:id/factura',      authMiddleware, negocio.generarFactura);
router.post('/:id/nota-credito', authMiddleware, negocio.generarNotaCredito);
router.post('/:id/pagos',        authMiddleware, negocio.registrarPagos);

module.exports = router;
