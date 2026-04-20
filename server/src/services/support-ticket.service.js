import ApiError from '../utils/apiError.js';
import { findCustomerById } from '../models/customer.model.js';
import { findUserById } from '../models/user.model.js';
import {
  createSupportTicket,
  deleteSupportTicket,
  findSupportTicketById,
  listSupportTickets,
  updateSupportTicket
} from '../models/support-ticket.model.js';

const canManageAll = (user) => user.role === 'ADMIN' || user.role === 'MANAGER';

const makeTicketNo = () => {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `TKT-${y}-${rand}`;
};

const ensureRelations = async ({ customerId, assignedTo }) => {
  if (customerId !== undefined && customerId !== null) {
    const customer = await findCustomerById(customerId);
    if (!customer) throw new ApiError(404, 'Customer not found');
  }

  if (assignedTo !== undefined && assignedTo !== null) {
    const user = await findUserById(assignedTo);
    if (!user) throw new ApiError(404, 'Assignee not found');
  }
};

const canAccessTicket = (ticket, user) => {
  if (canManageAll(user)) return true;
  return ticket.createdBy === user.id || ticket.assignedTo === user.id;
};

export const getSupportTickets = async (query, currentUser) => {
  const where = {
    search: query.search,
    status: query.status,
    priority: query.priority,
    customerId: query.customerId
  };

  if (canManageAll(currentUser)) {
    if (query.assignedTo) where.assignedTo = query.assignedTo;
    if (query.createdBy) where.createdBy = query.createdBy;
  } else {
    where.assignedTo = currentUser.id;
  }

  return listSupportTickets(where);
};

export const getSupportTicketDetail = async (id, currentUser) => {
  const ticket = await findSupportTicketById(id);
  if (!ticket) throw new ApiError(404, 'Support ticket not found');
  if (!canAccessTicket(ticket, currentUser)) throw new ApiError(403, 'Forbidden');
  return ticket;
};

export const createSupportTicketRecord = async (payload, currentUser) => {
  await ensureRelations({ customerId: payload.customerId, assignedTo: payload.assignedTo });

  if (!canManageAll(currentUser)) {
    if (payload.assignedTo && payload.assignedTo !== currentUser.id) {
      throw new ApiError(403, 'You can only assign ticket to yourself');
    }
  }

  return createSupportTicket({
    ticketNo: makeTicketNo(),
    subject: payload.subject,
    description: payload.description,
    status: payload.status || 'OPEN',
    priority: payload.priority || 'MEDIUM',
    category: payload.category,
    customerId: payload.customerId,
    assignedTo: payload.assignedTo || currentUser.id,
    createdBy: currentUser.id,
    dueDate: payload.dueDate
  });
};

export const updateSupportTicketRecord = async (id, payload, currentUser) => {
  const current = await findSupportTicketById(id);
  if (!current) throw new ApiError(404, 'Support ticket not found');
  if (!canAccessTicket(current, currentUser)) throw new ApiError(403, 'Forbidden');

  if (!canManageAll(currentUser) && payload.assignedTo !== undefined && payload.assignedTo !== currentUser.id) {
    throw new ApiError(403, 'You cannot assign this ticket to others');
  }

  await ensureRelations({ customerId: payload.customerId, assignedTo: payload.assignedTo });

  const patch = { ...payload };
  if (payload.status === 'RESOLVED' && payload.resolvedAt === undefined) {
    patch.resolvedAt = new Date();
  }
  if (payload.status && payload.status !== 'RESOLVED' && payload.resolvedAt === undefined) {
    patch.resolvedAt = null;
  }

  return updateSupportTicket(id, patch);
};

export const deleteSupportTicketRecord = async (id, currentUser) => {
  const current = await findSupportTicketById(id);
  if (!current) throw new ApiError(404, 'Support ticket not found');
  if (!canManageAll(currentUser) && current.createdBy !== currentUser.id) {
    throw new ApiError(403, 'Only creator can delete this ticket');
  }
  await deleteSupportTicket(id);
};
