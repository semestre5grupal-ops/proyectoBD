const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const rolpagosController = require('../controllers/rolpagosController');

router.get('/', authMiddleware, rolpagosController.getAllRolpagoss);
router.get('/:id', authMiddleware, rolpagosController.getRolpagos);
router.post('/', authMiddleware, rolpagosController.createRolpagos);
router.put('/:id', authMiddleware, rolpagosController.updateRolpagos);
router.delete('/:id', authMiddleware, rolpagosController.deleteRolpagos);

module.exports = router;
