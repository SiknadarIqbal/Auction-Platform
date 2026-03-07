import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendVerificationEmail
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
