import { Router } from 'express';
import { createRequire } from 'module';
import { protect } from '../middlewares/auth.middleware.js';
import { getAvatar, uploadAvatar } from '../controllers/avatar.controller.js';

const require = createRequire(import.meta.url);
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Only jpg, png, webp are allowed'));
      return;
    }
    cb(null, true);
  }
});

const router = Router();

router.get('/me', protect, getAvatar);
router.post('/upload', protect, upload.single('avatar'), uploadAvatar);

export default router;
