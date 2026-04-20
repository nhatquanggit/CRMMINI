import asyncHandler from '../utils/asyncHandler.js';
import {
  createQuoteRecord,
  deleteQuoteRecord,
  getQuoteDetail,
  getQuotes,
  updateQuoteRecord,
  updateQuoteStatus
} from '../services/quote.service.js';

export const listQuotesHandler = asyncHandler(async (req, res) => {
  const quotes = await getQuotes(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, data: quotes });
});

export const getQuoteHandler = asyncHandler(async (req, res) => {
  const quote = await getQuoteDetail(req.validated.params.id, req.user);
  res.status(200).json({ success: true, data: quote });
});

export const createQuoteHandler = asyncHandler(async (req, res) => {
  const quote = await createQuoteRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Quote created', data: quote });
});

export const updateQuoteHandler = asyncHandler(async (req, res) => {
  const quote = await updateQuoteRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Quote updated', data: quote });
});

export const updateQuoteStatusHandler = asyncHandler(async (req, res) => {
  const quote = await updateQuoteStatus(req.validated.params.id, req.validated.body.status, req.user);
  res.status(200).json({ success: true, message: 'Quote status updated', data: quote });
});

export const deleteQuoteHandler = asyncHandler(async (req, res) => {
  await deleteQuoteRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Quote deleted' });
});
