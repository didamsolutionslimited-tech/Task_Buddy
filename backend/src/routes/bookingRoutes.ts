import { Router } from 'express';
import { acceptTask, confirmCompletion } from '../controllers/bookingController';
import { initializePayment, verifyPayment } from '../controllers/paymentController';
import { authOptional } from '../middleware/auth';

const router = Router();

// Booking routes (tasker identity resolved from JWT)
router.post('/accept', authOptional, acceptTask);
router.post('/complete', authOptional, confirmCompletion);

// Payment routes
router.post('/pay/init', initializePayment);
router.post('/pay/verify', verifyPayment);

export default router;
