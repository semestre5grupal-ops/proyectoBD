const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const permisoController = require('../controllers/permisoController');

router.get('/', authMiddleware, permisoController.getAllPermisos);
router.get('/:id', authMiddleware, permisoController.getPermiso);
router.post('/', authMiddleware, permisoController.createPermiso);
router.put('/:id', authMiddleware, permisoController.updatePermiso);
router.delete('/:id', authMiddleware, permisoController.deletePermiso);

module.exports = router;
