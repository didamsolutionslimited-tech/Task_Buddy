import { Router } from 'express';
import { submitKYC, getKYCStatus } from '../controllers/kycController';

const router = Router();

router.post('/verify', submitKYC);
router.get('/status', getKYCStatus);

export default router;
