import { query } from '../config/db.js';

const BASE = `
  SELECT c.*, u.id AS "assigneeId", u.name AS "assigneeName", u.email AS "assigneeEmail", u.role AS "assigneeRole"
  FROM "Customers" c
  INNER JOIN "Users" u ON u.id = c.assigned_to
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, name: row.name, email: row.email, phone: row.phone,
    company: row.company, status: row.status, leadSource: row.lead_source,
    assignedTo: row.assigned_to, createdAt: row.created_at,
    assignee: { id: row.assigneeId, name: row.assigneeName, email: row.assigneeEmail, role: row.assigneeRole }
  };
};

export const listCustomers = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.assignedTo) { clauses.push(`c.assigned_to = $${values.length + 1}`); values.push(where.assignedTo); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY c.created_at DESC`, values);
  return r.rows.map(map);
};

export const findCustomerById = async (id) => {
  const r = await query(`${BASE} WHERE c.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createCustomer = async (data) => {
  const r = await query(
    `INSERT INTO "Customers" (name, email, phone, company, status, lead_source, assigned_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [data.name, data.email, data.phone, data.company, data.status || 'NEW', data.leadSource || 'OTHER', data.assignedTo]
  );
  return findCustomerById(r.rows[0].id);
};

export const updateCustomer = async (id, data) => {
  const fields = []; const values = []; let idx = 1;
  if (data.name !== undefined) { fields.push(`name=$${idx++}`); values.push(data.name); }
  if (data.email !== undefined) { fields.push(`email=$${idx++}`); values.push(data.email); }
  if (data.phone !== undefined) { fields.push(`phone=$${idx++}`); values.push(data.phone); }
  if (data.company !== undefined) { fields.push(`company=$${idx++}`); values.push(data.company); }
  if (data.status !== undefined) { fields.push(`status=$${idx++}`); values.push(data.status); }
  if (data.leadSource !== undefined) { fields.push(`lead_source=$${idx++}`); values.push(data.leadSource); }
  if (data.assignedTo !== undefined) { fields.push(`assigned_to=$${idx++}`); values.push(data.assignedTo); }
  if (fields.length) { values.push(id); await query(`UPDATE "Customers" SET ${fields.join(',')} WHERE id=$${idx}`, values); }
  return findCustomerById(id);
};

export const deleteCustomer = async (id) => {
  await query('DELETE FROM "Customers" WHERE id = $1', [id]);
};
