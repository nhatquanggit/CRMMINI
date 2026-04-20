import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createActivity,
  getActivityList,
  getActivity,
  updateActivity,
  deleteActivity
} from '../controllers/activity.controller.js';
import {
  createActivitySchema,
  updateActivitySchema,
  getActivitySchema,
  deleteActivitySchema,
  listActivitiesSchema
} from '../validators/activity.validator.js';

const router = Router();

router.use(protect);

// List activities with filters
router.get('/', validate(listActivitiesSchema), getActivityList);

// Create activity
router.post('/', validate(createActivitySchema), createActivity);

// Get activity detail
router.get('/:id', validate(getActivitySchema), getActivity);

// Update activity
router.put('/:id', validate(updateActivitySchema), updateActivity);

// Delete activity
router.delete('/:id', validate(deleteActivitySchema), deleteActivity);

export default router;
