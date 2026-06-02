const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de proveedores con JWT
router.use(verifyToken);

router.get('/', proveedorController.getAllProveedores);
router.get('/:id', proveedorController.getProveedor);
router.post('/', proveedorController.createProveedor);
router.put('/:id', proveedorController.updateProveedor);

module.exports = router;
