const express = require('express');
const router = express.Router();
const vacacionController = require('../controllers/vacacionController');

router.get('/', vacacionController.getAllVacaciones);
router.get('/:id', vacacionController.getVacacion);
router.post('/', vacacionController.createVacacion);
router.put('/:id', vacacionController.updateVacacion);
router.delete('/:id', vacacionController.deleteVacacion);

module.exports = router;
