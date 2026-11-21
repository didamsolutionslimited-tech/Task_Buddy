import { Router } from 'express';
import { createReview, listReviews } from '../controllers/reviewController';

const router = Router();

router.post('/', createReview);
router.get('/:userId', listReviews);

export default router;
