import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
	getActivitiesHandler,
	getDashboard,
	getDashboardSummaryHandler,
	getDealStatusHandler,
	getRevenueByMonthHandler
} from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', protect, getDashboard);
router.get('/summary', protect, getDashboardSummaryHandler);
router.get('/revenue-by-month', protect, getRevenueByMonthHandler);
router.get('/deal-status', protect, getDealStatusHandler);
router.get('/activities', protect, getActivitiesHandler);

export default router;
