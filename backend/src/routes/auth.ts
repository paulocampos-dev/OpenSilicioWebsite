import { Router } from 'express';
import { login, verifyToken, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { validate, loginSchema, changePasswordSchema } from '../middleware/validation';

const router = Router();

// Apply rate limiting and validation to login endpoint to prevent brute force attacks
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/verify', authMiddleware, verifyToken);
router.put('/change-password', authMiddleware, authLimiter, validate(changePasswordSchema), changePassword);

export default router;

