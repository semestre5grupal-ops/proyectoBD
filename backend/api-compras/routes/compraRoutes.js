const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de compras con JWT
router.use(verifyToken);

router.get('/', compraController.getAllCompras);
router.get('/:id', compraController.getCompra);
router.post('/', compraController.createCompra);
router.put('/:id/estado', compraController.updateCompraEstado);

module.exports = router;
