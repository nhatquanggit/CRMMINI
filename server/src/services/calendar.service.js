import { listCalendarEvents } from '../models/calendar.model.js';

const isAdmin = (user) => user.role === 'ADMIN';

/**
 * Get calendar events for a date range.
 * Admin sees all, others see only their own.
 */
export const getCalendarEvents = async (filters, currentUser) => {
  if (!filters.startDate || !filters.endDate) {
    // Default to current month
    const now = new Date();
    filters.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    filters.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  }

  const where = {
    startDate: filters.startDate,
    endDate: filters.endDate
  };

  // Non-admin can only see their own events
  if (!isAdmin(currentUser)) {
    where.userId = currentUser.id;
  }

  const events = await listCalendarEvents(where);
  return events;
};
