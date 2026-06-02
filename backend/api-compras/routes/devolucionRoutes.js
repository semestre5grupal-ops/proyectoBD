const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de devoluciones con JWT
router.use(verifyToken);

router.get('/', devolucionController.getAllDevoluciones);
router.get('/:id', devolucionController.getDevolucion);
router.post('/', devolucionController.createDevolucion);
router.put('/:id/aprobar', devolucionController.aprobarDevolucion);

module.exports = router;
