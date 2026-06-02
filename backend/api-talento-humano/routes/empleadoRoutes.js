const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const empleadoController = require('../controllers/empleadoController');

// Definir las rutas CRUD y enlazarlas a los controladores
router.get('/', authMiddleware, empleadoController.getAllEmpleados);
router.get('/:id', authMiddleware, empleadoController.getEmpleado);
router.post('/', authMiddleware, empleadoController.createEmpleado);
router.put('/:id', authMiddleware, empleadoController.updateEmpleado);
router.delete('/:id', authMiddleware, empleadoController.deleteEmpleado);

module.exports = router;
