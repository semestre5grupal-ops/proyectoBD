const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const rolController = require('../controllers/rolController');

router.get('/', authMiddleware, rolController.getAllRoles);
router.get('/:id', authMiddleware, rolController.getRol);
router.post('/', authMiddleware, rolController.createRol);
router.put('/:id', authMiddleware, rolController.updateRol);
router.delete('/:id', authMiddleware, rolController.deleteRol);

module.exports = router;
