const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const departamentoController = require('../controllers/departamentoController');

router.get('/', authMiddleware, departamentoController.getAllDepartamentos);
router.get('/:id', authMiddleware, departamentoController.getDepartamento);
router.post('/', authMiddleware, departamentoController.createDepartamento);
router.put('/:id', authMiddleware, departamentoController.updateDepartamento);
router.delete('/:id', authMiddleware, departamentoController.deleteDepartamento);

module.exports = router;
