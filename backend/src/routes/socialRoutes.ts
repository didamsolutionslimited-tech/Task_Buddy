import { Router } from 'express';
import { sendMessage, getMessages, submitReview, getAdminStats, approveKYC } from '../controllers/socialController';

const router = Router();

// Chat
router.post('/chat/send', sendMessage);
router.get('/chat/:booking_id', getMessages);

// Reviews
router.post('/reviews/submit', submitReview);

// Admin
router.get('/admin/stats', getAdminStats);
router.post('/admin/verify-user', approveKYC);

export default router;
