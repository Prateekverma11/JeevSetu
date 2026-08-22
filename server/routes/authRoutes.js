const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, googleAuth } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');
const {
    validateRegister,
    validateLogin
} = require('../middleware/validateMiddleware');

// CONCEPT: Request Body Validation — validate all auth inputs before processing
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/google', googleAuth);
router.get('/me', authenticateUser, getMe);

module.exports = router;
