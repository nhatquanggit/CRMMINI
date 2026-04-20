import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import { getEvents } from '../controllers/calendar.controller.js';

const router = Router();

router.use(protect);

// GET /api/calendar?startDate=2026-03-01T00:00:00Z&endDate=2026-03-31T23:59:59Z
router.get('/', getEvents);

export default router;
