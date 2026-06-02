const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const metaController = require('../controllers/metaController');

router.get('/', authMiddleware, metaController.getAllMetas);
router.get('/:id', authMiddleware, metaController.getMeta);
router.post('/', authMiddleware, metaController.createMeta);
router.put('/:id', authMiddleware, metaController.updateMeta);
router.delete('/:id', authMiddleware, metaController.deleteMeta);

module.exports = router;
