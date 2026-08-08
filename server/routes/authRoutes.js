const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, googleAuth } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.post('/google', googleAuth);
router.get('/me', authenticateUser, getMe);

module.exports = router;
