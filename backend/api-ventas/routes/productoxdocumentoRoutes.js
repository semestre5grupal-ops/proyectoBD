const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/productoxdocumentoController');

// PK compuesta: (id_documento, id_variante)
router.get('/', authMiddleware, ctrl.getAll);
router.get('/documento/:idDocumento', authMiddleware, ctrl.getByDocumento);
router.get('/:idDocumento/:idVariante', authMiddleware, ctrl.getOne);
router.post('/', authMiddleware, ctrl.create);
router.put('/:idDocumento/:idVariante', authMiddleware, ctrl.update);
router.delete('/:idDocumento/:idVariante', authMiddleware, ctrl.remove);

module.exports = router;
