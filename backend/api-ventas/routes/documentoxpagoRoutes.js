const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/documentoxpagoController');

// PK compuesta: (id_documento, id_metodopago)
router.get('/', authMiddleware, ctrl.getAll);
router.get('/documento/:idDocumento', authMiddleware, ctrl.getByDocumento);
router.get('/:idDocumento/:idMetodopago', authMiddleware, ctrl.getOne);
router.post('/', authMiddleware, ctrl.create);
router.put('/:idDocumento/:idMetodopago', authMiddleware, ctrl.update);
router.delete('/:idDocumento/:idMetodopago', authMiddleware, ctrl.remove);

module.exports = router;
