const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcionController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de recepciones con JWT
router.use(verifyToken);

router.get('/', recepcionController.getAllRecepciones);
router.get('/:id', recepcionController.getRecepcion);
router.post('/', recepcionController.createRecepcion);
router.put('/:id/aprobar', recepcionController.aprobarRecepcion);

module.exports = router;
