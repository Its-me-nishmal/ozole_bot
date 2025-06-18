const express = require('express');
const userController = require('../controllers/userController');
const { authenticationMiddleware } = require('../middlewares/authenticationMiddleware');

const router = express.Router();

router.post('/sync', authenticationMiddleware, userController.syncUsers);

module.exports = router;