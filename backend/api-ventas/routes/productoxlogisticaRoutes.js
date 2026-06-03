const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/productoxlogisticaController');

// PK compuesta: (id_logistica, id_variante)
router.get('/', authMiddleware, ctrl.getAll);
router.get('/logistica/:idLogistica', authMiddleware, ctrl.getByLogistica);
router.get('/:idLogistica/:idVariante', authMiddleware, ctrl.getOne);
router.post('/', authMiddleware, ctrl.create);
router.put('/:idLogistica/:idVariante', authMiddleware, ctrl.update);
router.delete('/:idLogistica/:idVariante', authMiddleware, ctrl.remove);

module.exports = router;
