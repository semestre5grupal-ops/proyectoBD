const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

// Definir las rutas CRUD y enlazarlas a los controladores
router.get('/', empleadoController.getAllEmpleados);
router.get('/:id', empleadoController.getEmpleado);
router.post('/', empleadoController.createEmpleado);
router.put('/:id', empleadoController.updateEmpleado);
router.delete('/:id', empleadoController.deleteEmpleado);

module.exports = router;
