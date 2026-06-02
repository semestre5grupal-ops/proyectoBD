const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const horarioxempleadoController = require('../controllers/horarioxempleadoController');

router.get('/', authMiddleware, horarioxempleadoController.getAllHorarioxempleados);
router.post('/', authMiddleware, horarioxempleadoController.createHorarioxempleado);

module.exports = router;
