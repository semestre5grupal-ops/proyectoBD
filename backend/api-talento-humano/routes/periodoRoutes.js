const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const periodoController = require('../controllers/periodoController');

router.get('/', authMiddleware, periodoController.getAllPeriodos);
router.get('/:id', authMiddleware, periodoController.getPeriodo);
router.post('/', authMiddleware, periodoController.createPeriodo);
router.put('/:id', authMiddleware, periodoController.updatePeriodo);
router.delete('/:id', authMiddleware, periodoController.deletePeriodo);

module.exports = router;
