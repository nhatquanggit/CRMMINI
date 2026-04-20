import ApiError from '../utils/apiError.js';
import { findCustomerById } from '../models/customer.model.js';
import {
  createTask,
  listTasks,
  findTaskById,
  updateTask,
  deleteTask
} from '../models/task.model.js';

const isAdmin = (user) => user.role === 'ADMIN';
const isManager = (user) => user.role === 'MANAGER';

/**
 * Get tasks with permission checks
 * - Admin: sees all tasks
 * - Manager: sees tasks in their team
 * - Sales: sees tasks assigned to them
 */
export const getTasks = async (filters = {}, currentUser) => {
  const where = {};

  // Copy valid filter fields
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.dealId) where.dealId = filters.dealId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.fromDate) where.fromDate = filters.fromDate;
  if (filters.toDate) where.toDate = filters.toDate;
  if (filters.isOverdue) where.isOverdue = filters.isOverdue === 'true';
  if (filters.orderBy) where.orderBy = filters.orderBy;

  // Permission checks
  if (!isAdmin(currentUser)) {
    // Sales/Manager only see tasks assigned to them
    where.assignedTo = currentUser.id;
  }

  if (filters.assignedTo && !isAdmin(currentUser)) {
    // Non-admin cannot filter to see other's tasks
    throw new ApiError(403, 'Forbidden');
  }

  return listTasks(where);
};

/**
 * Create task
 */
export const createTaskRecord = async (payload, currentUser) => {
  // Validator has passed, so we just need to attach creator
  const taskData = {
    ...payload,
    createdBy: currentUser.id,
    assignedTo: payload.assignedTo || currentUser.id
  };

  const task = await createTask(taskData);
  return task;
};

/**
 * Get single task
 */
export const getTaskDetail = async (taskId, currentUser) => {
  const task = await findTaskById(taskId);
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Permission check: only assignee, admin, or creator can view
  if (!isAdmin(currentUser) && task.assignee.id !== currentUser.id && task.creator.id !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  return task;
};

/**
 * Update task
 */
export const updateTaskRecord = async (taskId, payload, currentUser) => {
  const task = await findTaskById(taskId);
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Permission check: only assignee, admin, or creator can update
  if (!isAdmin(currentUser) && task.assignee.id !== currentUser.id && task.creator.id !== currentUser.id) {
    throw new ApiError(403, 'Forbidden');
  }

  return updateTask(taskId, payload);
};

/**
 * Update task status (quick action)
 */
export const updateTaskStatus = async (taskId, status, currentUser) => {
  const task = await findTaskById(taskId);
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Permission check: only assignee or admin can change status
  if (!isAdmin(currentUser) && task.assignee.id !== currentUser.id) {
    throw new ApiError(403, 'Only assignee or admin can update status');
  }

  return updateTask(taskId, { status });
};

/**
 * Delete task
 */
export const deleteTaskRecord = async (taskId, currentUser) => {
  const task = await findTaskById(taskId);
  
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Permission check: only creator or admin
  if (!isAdmin(currentUser) && task.creator.id !== currentUser.id) {
    throw new ApiError(403, 'Only creator or admin can delete task');
  }

  await deleteTask(taskId);
};

/**
 * Get task statistics for user
 */
export const getUserTaskStats = async (currentUser) => {
  const tasksQuery = {
    assignedTo: currentUser.id
  };

  const allTasks = await listTasks(tasksQuery);

  const stats = {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === 'TODO').length,
    inProgress: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: allTasks.filter(t => t.status === 'DONE').length,
    cancelled: allTasks.filter(t => t.status === 'CANCELLED').length,
    overdue: allTasks.filter(t => 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'DONE' && 
      t.status !== 'CANCELLED'
    ).length
  };

  return stats;
};
