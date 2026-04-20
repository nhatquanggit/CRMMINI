import asyncHandler from '../utils/asyncHandler.js';
import { getCalendarEvents } from '../services/calendar.service.js';

export const getEvents = asyncHandler(async (req, res) => {
  const events = await getCalendarEvents(req.query, req.user);
  res.status(200).json({ success: true, data: events });
});
