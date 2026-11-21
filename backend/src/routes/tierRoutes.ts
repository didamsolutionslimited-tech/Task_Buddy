import { Router } from 'express';
import { getTier } from '../controllers/tierController';

const router = Router();

router.get('/:userId', getTier);

export default router;
