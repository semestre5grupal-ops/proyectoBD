const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const detallehorarioController = require('../controllers/detallehorarioController');

router.get('/', authMiddleware, detallehorarioController.getAllDetallehorarios);
router.get('/:id', authMiddleware, detallehorarioController.getDetallehorario);
router.post('/', authMiddleware, detallehorarioController.createDetallehorario);
router.put('/:id', authMiddleware, detallehorarioController.updateDetallehorario);
router.delete('/:id', authMiddleware, detallehorarioController.deleteDetallehorario);

module.exports = router;
