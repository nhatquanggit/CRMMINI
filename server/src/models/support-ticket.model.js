import { createRequest, sql } from '../config/sqlserver.js';

const ticketBaseQuery = `
  SELECT
    t.id,
    t.ticket_no AS ticketNo,
    t.subject,
    t.description,
    t.status,
    t.priority,
    t.category,
    t.customer_id AS customerId,
    t.assigned_to AS assignedTo,
    t.created_by AS createdBy,
    t.due_date AS dueDate,
    t.resolved_at AS resolvedAt,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    c.name AS customerName,
    assignee.name AS assigneeName,
    creator.name AS creatorName
  FROM SupportTickets t
  LEFT JOIN Customers c ON c.id = t.customer_id
  LEFT JOIN Users assignee ON assignee.id = t.assigned_to
  INNER JOIN Users creator ON creator.id = t.created_by
`;

const mapTicket = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    ticketNo: row.ticketNo,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    customerId: row.customerId,
    assignedTo: row.assignedTo,
    createdBy: row.createdBy,
    dueDate: row.dueDate,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    customer: row.customerId ? { id: row.customerId, name: row.customerName } : null,
    assignee: row.assignedTo ? { id: row.assignedTo, name: row.assigneeName } : null,
    creator: { id: row.createdBy, name: row.creatorName }
  };
};

export const listSupportTickets = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.search) {
    request.input('search', sql.NVarChar(255), `%${where.search}%`);
    clauses.push('(t.ticket_no LIKE @search OR t.subject LIKE @search OR t.description LIKE @search)');
  }
  if (where.status) {
    request.input('status', sql.NVarChar(20), where.status);
    clauses.push('t.status = @status');
  }
  if (where.priority) {
    request.input('priority', sql.NVarChar(20), where.priority);
    clauses.push('t.priority = @priority');
  }
  if (where.assignedTo) {
    request.input('assignedTo', sql.Int, where.assignedTo);
    clauses.push('t.assigned_to = @assignedTo');
  }
  if (where.createdBy) {
    request.input('createdBy', sql.Int, where.createdBy);
    clauses.push('t.created_by = @createdBy');
  }
  if (where.customerId) {
    request.input('customerId', sql.Int, where.customerId);
    clauses.push('t.customer_id = @customerId');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${ticketBaseQuery} ${whereSql} ORDER BY t.created_at DESC`);
  return result.recordset.map(mapTicket);
};

export const findSupportTicketById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${ticketBaseQuery} WHERE t.id = @id`);
  return mapTicket(result.recordset[0]);
};

export const createSupportTicket = async (data) => {
  const request = await createRequest();
  request.input('ticketNo', sql.NVarChar(30), data.ticketNo);
  request.input('subject', sql.NVarChar(180), data.subject);
  request.input('description', sql.NVarChar(sql.MAX), data.description);
  request.input('status', sql.NVarChar(20), data.status || 'OPEN');
  request.input('priority', sql.NVarChar(20), data.priority || 'MEDIUM');
  request.input('category', sql.NVarChar(60), data.category || null);
  request.input('customerId', sql.Int, data.customerId ?? null);
  request.input('assignedTo', sql.Int, data.assignedTo ?? null);
  request.input('createdBy', sql.Int, data.createdBy);
  request.input('dueDate', sql.DateTime2, data.dueDate ? new Date(data.dueDate) : null);
  request.input('resolvedAt', sql.DateTime2, data.resolvedAt ? new Date(data.resolvedAt) : null);

  const result = await request.query(`
    INSERT INTO SupportTickets (ticket_no, subject, description, status, priority, category, customer_id, assigned_to, created_by, due_date, resolved_at)
    OUTPUT INSERTED.id AS id
    VALUES (@ticketNo, @subject, @description, @status, @priority, @category, @customerId, @assignedTo, @createdBy, @dueDate, @resolvedAt)
  `);

  return findSupportTicketById(result.recordset[0].id);
};

export const updateSupportTicket = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.subject !== undefined) {
    request.input('subject', sql.NVarChar(180), data.subject);
    fields.push('subject = @subject');
  }
  if (data.description !== undefined) {
    request.input('description', sql.NVarChar(sql.MAX), data.description);
    fields.push('description = @description');
  }
  if (data.status !== undefined) {
    request.input('status', sql.NVarChar(20), data.status);
    fields.push('status = @status');
  }
  if (data.priority !== undefined) {
    request.input('priority', sql.NVarChar(20), data.priority);
    fields.push('priority = @priority');
  }
  if (data.category !== undefined) {
    request.input('category', sql.NVarChar(60), data.category || null);
    fields.push('category = @category');
  }
  if (data.customerId !== undefined) {
    request.input('customerId', sql.Int, data.customerId ?? null);
    fields.push('customer_id = @customerId');
  }
  if (data.assignedTo !== undefined) {
    request.input('assignedTo', sql.Int, data.assignedTo ?? null);
    fields.push('assigned_to = @assignedTo');
  }
  if (data.dueDate !== undefined) {
    request.input('dueDate', sql.DateTime2, data.dueDate ? new Date(data.dueDate) : null);
    fields.push('due_date = @dueDate');
  }
  if (data.resolvedAt !== undefined) {
    request.input('resolvedAt', sql.DateTime2, data.resolvedAt ? new Date(data.resolvedAt) : null);
    fields.push('resolved_at = @resolvedAt');
  }

  await request.query(`UPDATE SupportTickets SET ${fields.join(', ')} WHERE id = @id`);
  return findSupportTicketById(id);
};

export const deleteSupportTicket = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM SupportTickets WHERE id = @id');
};
