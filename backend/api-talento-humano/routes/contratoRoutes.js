const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const contratoController = require('../controllers/contratoController');

router.get('/', authMiddleware, contratoController.getAllContratos);
router.get('/:id', authMiddleware, contratoController.getContrato);
router.post('/', authMiddleware, contratoController.createContrato);
router.put('/:id', authMiddleware, contratoController.updateContrato);
router.delete('/:id', authMiddleware, contratoController.deleteContrato);

module.exports = router;
