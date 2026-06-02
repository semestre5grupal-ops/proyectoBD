const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const rubrosxrolController = require('../controllers/rubrosxrolController');

router.get('/', authMiddleware, rubrosxrolController.getAllRubrosxrols);
router.post('/', authMiddleware, rubrosxrolController.createRubrosxrol);

module.exports = router;
