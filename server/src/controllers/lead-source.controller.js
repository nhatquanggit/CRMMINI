import asyncHandler from '../utils/asyncHandler.js';
import { getLeadSourceDashboard } from '../services/lead-source.service.js';

export const getLeadSourceStatsHandler = asyncHandler(async (req, res) => {
  const data = await getLeadSourceDashboard(req.user);
  res.status(200).json({ success: true, data });
});
