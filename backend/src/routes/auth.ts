import { Router } from 'express';
import { login, verifyToken } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/verify', authMiddleware, verifyToken);

export default router;

