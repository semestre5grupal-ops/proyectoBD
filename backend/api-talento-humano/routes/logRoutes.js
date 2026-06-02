const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const logController = require('../controllers/logController');

router.get('/', authMiddleware, logController.getAllLogs);
router.get('/:id', authMiddleware, logController.getLog);
router.post('/', authMiddleware, logController.createLog);
router.put('/:id', authMiddleware, logController.updateLog);
router.delete('/:id', authMiddleware, logController.deleteLog);

module.exports = router;
