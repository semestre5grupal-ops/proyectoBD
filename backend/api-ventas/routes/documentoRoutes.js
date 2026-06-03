const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/documentoController');

router.get('/', authMiddleware, ctrl.getAll);
router.get('/cliente/:idCliente', authMiddleware, ctrl.getByCliente);
router.get('/:id', authMiddleware, ctrl.getById);
router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
