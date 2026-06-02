const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const dependientesController = require('../controllers/dependientesController');

router.get('/', authMiddleware, dependientesController.getAllDependientess);
router.get('/:id', authMiddleware, dependientesController.getDependientes);
router.post('/', authMiddleware, dependientesController.createDependientes);
router.put('/:id', authMiddleware, dependientesController.updateDependientes);
router.delete('/:id', authMiddleware, dependientesController.deleteDependientes);

module.exports = router;
