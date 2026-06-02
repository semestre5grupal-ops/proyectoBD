const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const cargoController = require('../controllers/cargoController');

router.get('/', authMiddleware, cargoController.getAllCargos);
router.get('/:id', authMiddleware, cargoController.getCargo);
router.post('/', authMiddleware, cargoController.createCargo);
router.put('/:id', authMiddleware, cargoController.updateCargo);
router.delete('/:id', authMiddleware, cargoController.deleteCargo);

module.exports = router;
