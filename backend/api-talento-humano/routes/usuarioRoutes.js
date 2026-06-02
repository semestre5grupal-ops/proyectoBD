const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const usuarioController = require('../controllers/usuarioController');

// Ruta principal para Login (Autenticación)
router.post('/login', usuarioController.login);

// Otras rutas CRUD para administración
router.get('/', authMiddleware, usuarioController.getAllUsuarios);
router.get('/:id', authMiddleware, usuarioController.getUsuario);
router.post('/', authMiddleware, usuarioController.createUsuario);
router.put('/:id', authMiddleware, usuarioController.updateUsuario);
router.delete('/:id', authMiddleware, usuarioController.deleteUsuario);

module.exports = router;
