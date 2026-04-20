import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getLeadSourceStatsHandler } from '../controllers/lead-source.controller.js';

const router = Router();

router.use(protect);
router.get('/stats', getLeadSourceStatsHandler);

export default router;
