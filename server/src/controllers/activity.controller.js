import asyncHandler from '../utils/asyncHandler.js';
import {
  createActivityRecord,
  getActivities,
  getActivityDetail,
  updateActivityRecord,
  deleteActivityRecord
} from '../services/activity.service.js';

export const getActivityList = asyncHandler(async (req, res) => {
  const activities = await getActivities(req.query, req.user);
  res.status(200).json({ success: true, data: activities });
});

export const createActivity = asyncHandler(async (req, res) => {
  const activity = await createActivityRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Activity created', data: activity });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activityId = req.validated.params.id;
  const activity = await getActivityDetail(activityId, req.user);
  res.status(200).json({ success: true, data: activity });
});

export const updateActivity = asyncHandler(async (req, res) => {
  const activityId = req.validated.params.id;
  const activity = await updateActivityRecord(activityId, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Activity updated', data: activity });
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const activityId = req.validated.params.id;
  await deleteActivityRecord(activityId, req.user);
  res.status(200).json({ success: true, message: 'Activity deleted' });
});
