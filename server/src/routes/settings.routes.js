import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import {
	changePasswordHandler,
	deleteOwnAccountHandler,
	logoutOtherSessionsHandler,
	updateProfileHandler
} from '../controllers/settings.controller.js';

const router = Router();

router.put('/profile', protect, updateProfileHandler);
router.post('/change-password', protect, changePasswordHandler);
router.post('/logout-other-sessions', protect, logoutOtherSessionsHandler);
router.delete('/account', protect, deleteOwnAccountHandler);

export default router;
