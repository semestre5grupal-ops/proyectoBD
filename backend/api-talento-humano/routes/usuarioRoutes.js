const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta principal para Login (Autenticación)
router.post('/login', usuarioController.login);

// Otras rutas CRUD para administración
router.get('/', usuarioController.getAllUsuarios);
router.post('/', usuarioController.createUsuario);

module.exports = router;
