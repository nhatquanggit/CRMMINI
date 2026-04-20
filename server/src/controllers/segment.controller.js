import asyncHandler from '../utils/asyncHandler.js';
import {
  createSegmentRecord,
  deleteSegmentRecord,
  getMembersBySegment,
  getSegmentDetail,
  getSegments,
  updateSegmentRecord
} from '../services/segment.service.js';

export const listSegmentsHandler = asyncHandler(async (_req, res) => {
  const segments = await getSegments();
  res.status(200).json({ success: true, data: segments });
});

export const getSegmentHandler = asyncHandler(async (req, res) => {
  const segment = await getSegmentDetail(req.validated.params.id);
  res.status(200).json({ success: true, data: segment });
});

export const createSegmentHandler = asyncHandler(async (req, res) => {
  const segment = await createSegmentRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Segment created', data: segment });
});

export const updateSegmentHandler = asyncHandler(async (req, res) => {
  const segment = await updateSegmentRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Segment updated', data: segment });
});

export const deleteSegmentHandler = asyncHandler(async (req, res) => {
  await deleteSegmentRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Segment deleted' });
});

export const getSegmentMembersHandler = asyncHandler(async (req, res) => {
  const data = await getMembersBySegment(req.validated.params.id);
  res.status(200).json({ success: true, data });
});
