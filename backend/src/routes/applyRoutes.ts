import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { becomeTasker, getServices } from '../controllers/applyController';

const router = Router();

// document uploads: max 5 files, 10MB each, common document types
const ALLOWED_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
    filename: (_req, file, cb) => {
      const ext = (path.extname(file.originalname) || '.bin').toLowerCase().slice(0, 12);
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
    else cb(null, false);
  },
});

router.get('/services', getServices);
router.post('/become-tasker', upload.array('documents', 5), becomeTasker);

export default router;
