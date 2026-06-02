const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const horarioController = require('../controllers/horarioController');

router.get('/', authMiddleware, horarioController.getAllHorarios);
router.get('/:id', authMiddleware, horarioController.getHorario);
router.post('/', authMiddleware, horarioController.createHorario);
router.put('/:id', authMiddleware, horarioController.updateHorario);
router.delete('/:id', authMiddleware, horarioController.deleteHorario);

module.exports = router;
