import asyncHandler from '../utils/asyncHandler.js';
import { createDealRecord, getDeals, updateDealRecord } from '../services/deal.service.js';

export const getDealList = asyncHandler(async (req, res) => {
  const deals = await getDeals(req.user);
  res.status(200).json({ success: true, data: deals });
});

export const createDeal = asyncHandler(async (req, res) => {
  const deal = await createDealRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Deal created', data: deal });
});

export const updateDeal = asyncHandler(async (req, res) => {
  const id = req.validated.params.id;
  const deal = await updateDealRecord(id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Deal updated', data: deal });
});
