import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import {
  createTask,
  getTaskList,
  getTask,
  updateTask,
  updateStatus,
  deleteTask,
  getStats
} from '../controllers/task.controller.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  getTaskSchema,
  deleteTaskSchema,
  listTasksSchema
} from '../validators/task.validator.js';

const router = Router();

router.use(protect);

// List tasks with filters
router.get('/', validate(listTasksSchema), getTaskList);

// Get task statistics
router.get('/stats/user', getStats);

// Create task
router.post('/', validate(createTaskSchema), createTask);

// Get task detail
router.get('/:id', validate(getTaskSchema), getTask);

// Update task
router.put('/:id', validate(updateTaskSchema), updateTask);

// Quick update status
router.patch('/:id/status', validate(updateTaskStatusSchema), updateStatus);

// Delete task
router.delete('/:id', validate(deleteTaskSchema), deleteTask);

export default router;
