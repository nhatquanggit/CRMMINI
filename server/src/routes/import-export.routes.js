import { Router } from 'express';
import { createRequire } from 'module';
import { protect } from '../middlewares/auth.middleware.js';
import {
  exportCustomersHandler,
  exportDealsHandler,
  importCustomersHandler
} from '../controllers/import-export.controller.js';

const require = createRequire(import.meta.url);
const multer  = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'text/csv',
      'application/csv',
      'text/plain' // some browsers send .csv as text/plain
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx?|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .xlsx, .xls, .csv'));
    }
  }
});

const router = Router();

router.get('/export/customers', protect, exportCustomersHandler);
router.get('/export/deals',     protect, exportDealsHandler);
router.post('/import/customers', protect, upload.single('file'), importCustomersHandler);

export default router;
