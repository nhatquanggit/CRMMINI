import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import {
  listUsersHandler,
  getUserHandler,
  updateRoleHandler,
  toggleActiveHandler,
  deleteUserHandler
} from '../controllers/admin.user.controller.js';

const router = Router();

// All routes require: authenticated + ADMIN role
router.use(protect, authorize('ADMIN'));

router.get('/', listUsersHandler);
router.get('/:id', getUserHandler);
router.patch('/:id/role', updateRoleHandler);
router.patch('/:id/active', toggleActiveHandler);
router.delete('/:id', deleteUserHandler);

export default router;
