import { query } from '../config/db.js';

const BASE = `
  SELECT t.*,
    c.name AS "cName", a.name AS "aName", cr.name AS "crName"
  FROM "SupportTickets" t
  LEFT JOIN "Customers" c ON c.id = t.customer_id
  LEFT JOIN "Users" a ON a.id = t.assigned_to
  INNER JOIN "Users" cr ON cr.id = t.created_by
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, ticketNo: row.ticket_no, subject: row.subject, description: row.description,
    status: row.status, priority: row.priority, category: row.category,
    customerId: row.customer_id, assignedTo: row.assigned_to, createdBy: row.created_by,
    dueDate: row.due_date, resolvedAt: row.resolved_at, createdAt: row.created_at, updatedAt: row.updated_at,
    customer: row.customer_id ? { id: row.customer_id, name: row.cName } : null,
    assignee: row.assigned_to ? { id: row.assigned_to, name: row.aName } : null,
    creator: { id: row.created_by, name: row.crName }
  };
};

export const listSupportTickets = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.search) { clauses.push(`(t.ticket_no ILIKE $${values.length + 1} OR t.subject ILIKE $${values.length + 1})`); values.push(`%${where.search}%`); }
  if (where.status) { clauses.push(`t.status = $${values.length + 1}`); values.push(where.status); }
  if (where.priority) { clauses.push(`t.priority = $${values.length + 1}`); values.push(where.priority); }
  if (where.assignedTo) { clauses.push(`t.assigned_to = $${values.length + 1}`); values.push(where.assignedTo); }
  if (where.createdBy) { clauses.push(`t.created_by = $${values.length + 1}`); values.push(where.createdBy); }
  if (where.customerId) { clauses.push(`t.customer_id = $${values.length + 1}`); values.push(where.customerId); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY t.created_at DESC`, values);
  return r.rows.map(map);
};

export const findSupportTicketById = async (id) => {
  const r = await query(`${BASE} WHERE t.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createSupportTicket = async (data) => {
  const r = await query(
    `INSERT INTO "SupportTickets" (ticket_no,subject,description,status,priority,category,customer_id,assigned_to,created_by,due_date,resolved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [data.ticketNo, data.subject, data.description, data.status || 'OPEN', data.priority || 'MEDIUM',
     data.category || null, data.customerId ?? null, data.assignedTo ?? null, data.createdBy,
     data.dueDate ? new Date(data.dueDate) : null, data.resolvedAt ? new Date(data.resolvedAt) : null]
  );
  return findSupportTicketById(r.rows[0].id);
};

export const updateSupportTicket = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const cols = { subject: 'subject', description: 'description', status: 'status',
    priority: 'priority', category: 'category', customerId: 'customer_id', assignedTo: 'assigned_to' };
  for (const [k, col] of Object.entries(cols)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  if (data.dueDate !== undefined) { fields.push(`due_date=$${idx++}`); values.push(data.dueDate ? new Date(data.dueDate) : null); }
  if (data.resolvedAt !== undefined) { fields.push(`resolved_at=$${idx++}`); values.push(data.resolvedAt ? new Date(data.resolvedAt) : null); }
  values.push(id);
  await query(`UPDATE "SupportTickets" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findSupportTicketById(id);
};

export const deleteSupportTicket = async (id) => {
  await query('DELETE FROM "SupportTickets" WHERE id = $1', [id]);
};
