import asyncHandler from '../utils/asyncHandler.js';
import {
  createSupportTicketRecord,
  deleteSupportTicketRecord,
  getSupportTicketDetail,
  getSupportTickets,
  updateSupportTicketRecord
} from '../services/support-ticket.service.js';

export const listSupportTicketsHandler = asyncHandler(async (req, res) => {
  const tickets = await getSupportTickets(req.validated?.query || req.query, req.user);
  res.status(200).json({ success: true, data: tickets });
});

export const getSupportTicketHandler = asyncHandler(async (req, res) => {
  const ticket = await getSupportTicketDetail(req.validated.params.id, req.user);
  res.status(200).json({ success: true, data: ticket });
});

export const createSupportTicketHandler = asyncHandler(async (req, res) => {
  const ticket = await createSupportTicketRecord(req.validated.body, req.user);
  res.status(201).json({ success: true, message: 'Support ticket created', data: ticket });
});

export const updateSupportTicketHandler = asyncHandler(async (req, res) => {
  const ticket = await updateSupportTicketRecord(req.validated.params.id, req.validated.body, req.user);
  res.status(200).json({ success: true, message: 'Support ticket updated', data: ticket });
});

export const deleteSupportTicketHandler = asyncHandler(async (req, res) => {
  await deleteSupportTicketRecord(req.validated.params.id, req.user);
  res.status(200).json({ success: true, message: 'Support ticket deleted' });
});
