const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/cuotaController');
const negocio = require('../controllers/documentoNegocioController');

router.get('/', authMiddleware, ctrl.getAll);
router.get('/documento/:idDocumento', authMiddleware, ctrl.getByDocumento);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

// Abono de cuota: Body { monto, documento_id }
router.post('/:id/abonar', authMiddleware, negocio.abonarCuota);

module.exports = router;
