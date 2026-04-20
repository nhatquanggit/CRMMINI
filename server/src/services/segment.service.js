import ApiError from '../utils/apiError.js';
import {
  createSegment,
  deleteSegment,
  findSegmentById,
  getSegmentMembers,
  listSegments,
  updateSegment
} from '../models/segment.model.js';

const canManage = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

export const getSegments = async () => {
  return listSegments();
};

export const getSegmentDetail = async (id) => {
  const segment = await findSegmentById(id);
  if (!segment) throw new ApiError(404, 'Segment not found');
  return segment;
};

export const createSegmentRecord = async (payload, currentUser) => {
  if (!canManage(currentUser)) throw new ApiError(403, 'Only ADMIN/MANAGER can create segment');
  return createSegment({ ...payload, createdBy: currentUser.id });
};

export const updateSegmentRecord = async (id, payload, currentUser) => {
  if (!canManage(currentUser)) throw new ApiError(403, 'Only ADMIN/MANAGER can update segment');
  const current = await findSegmentById(id);
  if (!current) throw new ApiError(404, 'Segment not found');
  return updateSegment(id, payload);
};

export const deleteSegmentRecord = async (id, currentUser) => {
  if (!canManage(currentUser)) throw new ApiError(403, 'Only ADMIN/MANAGER can delete segment');
  const current = await findSegmentById(id);
  if (!current) throw new ApiError(404, 'Segment not found');
  await deleteSegment(id);
};

export const getMembersBySegment = async (id) => {
  const segment = await findSegmentById(id);
  if (!segment) throw new ApiError(404, 'Segment not found');
  const members = await getSegmentMembers(segment);
  return { segment, members, totalMembers: members.length };
};
