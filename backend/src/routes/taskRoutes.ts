import { Router } from 'express';
import { getCategories, getOpenTasks, createTask, myPostedTasks, helpingTasks } from '../controllers/taskController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/categories', getCategories);
router.get('/open', getOpenTasks);
router.post('/create', requireAuth, createTask);
router.get('/mine', requireAuth, myPostedTasks);
router.get('/helping', requireAuth, helpingTasks);

export default router;
