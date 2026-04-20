import asyncHandler from '../utils/asyncHandler.js';
import {
  createSalesTargetRecord,
  deleteSalesTargetRecord,
  getSalesForecastDashboard,
  getSalesTargets,
  updateSalesTargetRecord
} from '../services/forecast.service.js';

export const getForecastOverviewHandler = asyncHandler(async (req, res) => {
  const data = await getSalesForecastDashboard(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, data });
});

export const listSalesTargetsHandler = asyncHandler(async (req, res) => {
  const data = await getSalesTargets(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, data });
});

export const createSalesTargetHandler = asyncHandler(async (req, res) => {
  const data = await createSalesTargetRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Sales target created', data });
});

export const updateSalesTargetHandler = asyncHandler(async (req, res) => {
  const data = await updateSalesTargetRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Sales target updated', data });
});

export const deleteSalesTargetHandler = asyncHandler(async (req, res) => {
  await deleteSalesTargetRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Sales target deleted' });
});
