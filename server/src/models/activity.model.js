import { query } from '../config/db.js';

const BASE = `
  SELECT a.*,
    c.id AS "cId", c.name AS "cName", c.email AS "cEmail",
    d.id AS "dId", d.title AS "dTitle",
    u.id AS "uId", u.name AS "uName", u.email AS "uEmail", u.role AS "uRole"
  FROM "Activities" a
  LEFT JOIN "Customers" c ON c.id = a.customer_id
  LEFT JOIN "Deals" d ON d.id = a.deal_id
  LEFT JOIN "Users" u ON u.id = a.created_by
`;

const map = (row) => ({
  id: row.id, type: row.type, content: row.content,
  customerId: row.customer_id, dealId: row.deal_id,
  createdAt: row.created_at, updatedAt: row.updated_at,
  customer: row.cId ? { id: row.cId, name: row.cName, email: row.cEmail } : null,
  deal: row.dId ? { id: row.dId, title: row.dTitle } : null,
  creator: { id: row.uId, name: row.uName, email: row.uEmail, role: row.uRole }
});

export const listActivities = async (where = {}) => {
  const clauses = ['a.id IS NOT NULL']; const values = [];
  if (where.customerId) { clauses.push(`a.customer_id = $${values.length + 1}`); values.push(where.customerId); }
  if (where.dealId) { clauses.push(`a.deal_id = $${values.length + 1}`); values.push(where.dealId); }
  if (where.type) { clauses.push(`a.type = $${values.length + 1}`); values.push(where.type); }
  if (where.fromDate) { clauses.push(`a.created_at >= $${values.length + 1}`); values.push(new Date(where.fromDate)); }
  if (where.toDate) { clauses.push(`a.created_at <= $${values.length + 1}`); values.push(new Date(where.toDate)); }
  if (where.createdBy) { clauses.push(`a.created_by = $${values.length + 1}`); values.push(where.createdBy); }
  const r = await query(`${BASE} WHERE ${clauses.join(' AND ')} ORDER BY a.created_at DESC`, values);
  return r.rows.map(map);
};

export const findActivityById = async (id) => {
  const r = await query(`${BASE} WHERE a.id = $1`, [id]);
  return r.rows[0] ? map(r.rows[0]) : null;
};

export const createActivity = async (data) => {
  const r = await query(
    `INSERT INTO "Activities" (type, content, customer_id, deal_id, created_by, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING id`,
    [data.type, data.content, data.customerId || null, data.dealId || null, data.createdBy]
  );
  return findActivityById(r.rows[0].id);
};

export const updateActivity = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  if (data.type) { fields.push(`type=$${idx++}`); values.push(data.type); }
  if (data.content) { fields.push(`content=$${idx++}`); values.push(data.content); }
  values.push(id);
  await query(`UPDATE "Activities" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findActivityById(id);
};

export const deleteActivity = async (id) => {
  await query('DELETE FROM "Activities" WHERE id = $1', [id]);
};
