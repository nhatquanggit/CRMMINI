import asyncHandler from '../utils/asyncHandler.js';
import {
  getDashboardOverview,
  getDashboardSummary,
  getDealStatusBreakdown,
  getRecentActivities,
  getRevenueByMonth
} from '../services/dashboard.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardOverview(req.user);
  res.status(200).json({ success: true, data: dashboard });
});

export const getDashboardSummaryHandler = asyncHandler(async (req, res) => {
  const summary = await getDashboardSummary(req.user);
  res.status(200).json({ success: true, data: summary });
});

export const getRevenueByMonthHandler = asyncHandler(async (req, res) => {
  const revenueByMonth = await getRevenueByMonth(req.user);
  res.status(200).json({ success: true, data: revenueByMonth });
});

export const getDealStatusHandler = asyncHandler(async (req, res) => {
  const dealStatus = await getDealStatusBreakdown(req.user);
  res.status(200).json({ success: true, data: dealStatus });
});

export const getActivitiesHandler = asyncHandler(async (req, res) => {
  const activities = await getRecentActivities(req.user, 10);
  res.status(200).json({ success: true, data: activities });
});
