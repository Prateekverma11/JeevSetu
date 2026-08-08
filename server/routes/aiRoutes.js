const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/aiController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/chat', authenticateUser, chatWithAI);

module.exports = router;
