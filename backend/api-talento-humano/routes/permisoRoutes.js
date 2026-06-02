const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisoController');

router.get('/', permisoController.getAllPermisos);
router.get('/:id', permisoController.getPermiso);
router.post('/', permisoController.createPermiso);
router.put('/:id', permisoController.updatePermiso);
router.delete('/:id', permisoController.deletePermiso);

module.exports = router;
