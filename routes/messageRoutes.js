const express = require('express');
const messageController = require('../controllers/messageController');
const { authenticationMiddleware } = require('../middlewares/authenticationMiddleware');
const { requestValidationMiddleware } = require('../middlewares/requestValidationMiddleware');

const router = express.Router();


router.post('/send',      messageController.sendMessage);

module.exports = router;