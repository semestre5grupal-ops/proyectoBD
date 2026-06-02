const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const rubrosController = require('../controllers/rubrosController');

router.get('/', authMiddleware, rubrosController.getAllRubross);
router.get('/:id', authMiddleware, rubrosController.getRubros);
router.post('/', authMiddleware, rubrosController.createRubros);
router.put('/:id', authMiddleware, rubrosController.updateRubros);
router.delete('/:id', authMiddleware, rubrosController.deleteRubros);

module.exports = router;
