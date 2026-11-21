import { Router } from 'express';
import { getMessages, decideOffer } from '../controllers/chatController';

const router = Router();

router.get('/', getMessages);
router.put('/:id/offer', decideOffer);

export default router;
