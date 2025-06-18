const express = require('express');
const router = express.Router();
const { getGeminiResponse, postGeminiResponse } = require('../controllers/geminiController');



router.get('/', getGeminiResponse);
router.post('/', postGeminiResponse);

const { getPhoneNumber } = require('../controllers/geminiController');

router.get('/phone', getPhoneNumber);
router.post('/phone', getPhoneNumber);

module.exports = router;