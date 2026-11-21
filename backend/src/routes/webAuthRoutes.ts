import { Router } from 'express';
import { register, login, googleStart, googleCallback, me, googleStatus } from '../controllers/webAuthController';
import { authOptional } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authOptional, me);
router.get('/google-status', googleStatus);
router.get('/google', googleStart);
router.get('/google/callback', googleCallback);

export default router;
