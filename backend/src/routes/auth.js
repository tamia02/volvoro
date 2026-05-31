const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', verifyToken, authController.getMe);
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
