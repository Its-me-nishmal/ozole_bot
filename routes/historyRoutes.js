const express = require('express');
const historyController = require('../controllers/historyController');
const { authenticationMiddleware } = require('../middlewares/authenticationMiddleware');

const router = express.Router();

router.get('/fetch', authenticationMiddleware, historyController.fetchHistory);
router.post('/clear', authenticationMiddleware, historyController.clearHistory);

module.exports = router;