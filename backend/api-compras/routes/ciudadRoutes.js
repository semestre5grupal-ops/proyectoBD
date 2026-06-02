const express = require('express');
const router = express.Router();
const ciudadController = require('../controllers/ciudadController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Proteger todas las rutas del catálogo de ciudades con JWT
router.use(verifyToken);

router.get('/', ciudadController.getAllCiudades);
router.get('/:id', ciudadController.getCiudad);
router.post('/', ciudadController.createCiudad);

module.exports = router;
