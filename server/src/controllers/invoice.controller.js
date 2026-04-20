import asyncHandler from '../utils/asyncHandler.js';
import {
  createInvoiceRecord,
  deleteInvoiceRecord,
  getInvoiceDetail,
  getInvoices,
  updateInvoiceRecord,
  updateInvoiceStatus
} from '../services/invoice.service.js';

export const listInvoicesHandler = asyncHandler(async (req, res) => {
  const invoices = await getInvoices(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, data: invoices });
});

export const getInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceDetail(req.validated.params.id, req.user);
  res.status(200).json({ success: true, data: invoice });
});

export const createInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await createInvoiceRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Invoice created', data: invoice });
});

export const updateInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await updateInvoiceRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Invoice updated', data: invoice });
});

export const updateInvoiceStatusHandler = asyncHandler(async (req, res) => {
  const invoice = await updateInvoiceStatus(req.validated.params.id, req.validated.body.status, req.user);
  res.status(200).json({ success: true, message: 'Invoice status updated', data: invoice });
});

export const deleteInvoiceHandler = asyncHandler(async (req, res) => {
  await deleteInvoiceRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Invoice deleted' });
});
