import asyncHandler from '../utils/asyncHandler.js';
import {
  createTaskRecord,
  getTasks,
  getTaskDetail,
  updateTaskRecord,
  updateTaskStatus,
  deleteTaskRecord,
  getUserTaskStats
} from '../services/task.service.js';

export const getTaskList = asyncHandler(async (req, res) => {
  const tasks = await getTasks(req.query, req.user);
  res.status(200).json({ success: true, data: tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await createTaskRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Task created', data: task });
});

export const getTask = asyncHandler(async (req, res) => {
  const taskId = req.validated.params.id;
  const task = await getTaskDetail(taskId, req.user);
  res.status(200).json({ success: true, data: task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const taskId = req.validated.params.id;
  const task = await updateTaskRecord(taskId, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Task updated', data: task });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const taskId = req.validated.params.id;
  const { status } = req.validated.body;
  const task = await updateTaskStatus(taskId, status, req.user);
  res.status(200).json({ success: true, message: 'Task status updated', data: task });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const taskId = req.validated.params.id;
  await deleteTaskRecord(taskId, req.user);
  res.status(200).json({ success: true, message: 'Task deleted' });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await getUserTaskStats(req.user);
  res.status(200).json({ success: true, data: stats });
});
