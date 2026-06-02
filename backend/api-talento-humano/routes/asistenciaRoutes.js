const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const asistenciaController = require('../controllers/asistenciaController');

router.get('/', authMiddleware, asistenciaController.getAllAsistencias);
router.get('/:id', authMiddleware, asistenciaController.getAsistencia);
router.post('/', authMiddleware, asistenciaController.createAsistencia);
router.put('/:id', authMiddleware, asistenciaController.updateAsistencia);
router.delete('/:id', authMiddleware, asistenciaController.deleteAsistencia);

module.exports = router;
