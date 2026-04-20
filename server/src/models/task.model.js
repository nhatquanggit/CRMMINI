import { query } from '../config/db.js';

const BASE = `
  SELECT t.*,
    c.id AS "cId", c.name AS "cName",
    d.id AS "dId", d.title AS "dTitle",
    u1.id AS "a1Id", u1.name AS "a1Name", u1.email AS "a1Email",
    u2.id AS "a2Id", u2.name AS "a2Name", u2.email AS "a2Email"
  FROM "Tasks" t
  LEFT JOIN "Customers" c ON c.id = t.customer_id
  LEFT JOIN "Deals" d ON d.id = t.deal_id
  LEFT JOIN "Users" u1 ON u1.id = t.assigned_to
  LEFT JOIN "Users" u2 ON u2.id = t.created_by
`;

const map = (row) => ({
  id: row.id, title: row.title, description: row.description,
  status: row.status, priority: row.priority,
  customerId: row.customer_id, dealId: row.deal_id,
  dueDate: row.due_date, remindAt: row.remind_at, completedAt: row.completed_at,
  createdAt: row.created_at, updatedAt: row.updated_at,
  customer: row.cId ? { id: row.cId, name: row.cName } : null,
  deal: row.dId ? { id: row.dId, title: row.dTitle } : null,
  assignee: { id: row.a1Id, name: row.a1Name, email: row.a1Email },
  creator: { id: row.a2Id, name: row.a2Name, email: row.a2Email }
});

export const listTasks = async (where = {}) => {
  const clauses = ['t.id IS NOT NULL']; const values = [];
  if (where.customerId) { clauses.push(`t.customer_id = $${values.length + 1}`); values.push(where.customerId); }
  if (where.dealId) { clauses.push(`t.deal_id = $${values.length + 1}`); values.push(where.dealId); }
  if (where.assignedTo) { clauses.push(`t.assigned_to = $${values.length + 1}`); values.push(where.assignedTo); }
  if (where.status) { clauses.push(`t.status = $${values.length + 1}`); values.push(where.status); }
  if (where.priority) { clauses.push(`t.priority = $${values.length + 1}`); values.push(where.priority); }
  if (where.fromDate) { clauses.push(`t.due_date >= $${values.length + 1}`); values.push(new Date(where.fromDate)); }
  if (where.toDate) { clauses.push(`t.due_date <= $${values.length + 1}`); values.push(new Date(where.toDate)); }
  if (where.isOverdue) { clauses.push(`t.due_date < NOW() AND t.status NOT IN ('DONE','CANCELLED')`); }
  const r = await query(`${BASE} WHERE ${clauses.join(' AND ')} ORDER BY t.due_date ASC`, values);
  return r.rows.map(map);
};

export const findTaskById = async (id) => {
  const r = await query(`${BASE} WHERE t.id = $1`, [id]);
  return r.rows[0] ? map(r.rows[0]) : null;
};

export const createTask = async (data) => {
  const r = await query(
    `INSERT INTO "Tasks" (title, description, priority, customer_id, deal_id, assigned_to, created_by, due_date, remind_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING id`,
    [data.title, data.description, data.priority || 'MEDIUM', data.customerId || null, data.dealId || null,
     data.assignedTo, data.createdBy, new Date(data.dueDate), data.remindAt ? new Date(data.remindAt) : null]
  );
  return findTaskById(r.rows[0].id);
};

export const updateTask = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  if (data.title) { fields.push(`title=$${idx++}`); values.push(data.title); }
  if (data.description) { fields.push(`description=$${idx++}`); values.push(data.description); }
  if (data.status) {
    fields.push(`status=$${idx++}`); values.push(data.status);
    if (data.status === 'DONE') fields.push('completed_at=NOW()');
  }
  if (data.priority) { fields.push(`priority=$${idx++}`); values.push(data.priority); }
  if (data.dueDate) { fields.push(`due_date=$${idx++}`); values.push(new Date(data.dueDate)); }
  if (data.assignedTo) { fields.push(`assigned_to=$${idx++}`); values.push(data.assignedTo); }
  values.push(id);
  await query(`UPDATE "Tasks" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findTaskById(id);
};

export const deleteTask = async (id) => {
  await query('DELETE FROM "Tasks" WHERE id = $1', [id]);
};
