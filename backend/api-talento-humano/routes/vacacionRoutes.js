const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const vacacionController = require('../controllers/vacacionController');

router.get('/', authMiddleware, vacacionController.getAllVacaciones);
router.get('/:id', authMiddleware, vacacionController.getVacacion);
router.post('/', authMiddleware, vacacionController.createVacacion);
router.put('/:id', authMiddleware, vacacionController.updateVacacion);
router.delete('/:id', authMiddleware, vacacionController.deleteVacacion);

module.exports = router;
