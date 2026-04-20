import { query } from '../config/db.js';

const BASE = `
  SELECT d.*,
    c.id AS "cId", c.name AS "cName", c.email AS "cEmail", c.company AS "cCompany", c.status AS "cStatus",
    u.id AS "oId", u.name AS "oName", u.email AS "oEmail", u.role AS "oRole"
  FROM "Deals" d
  INNER JOIN "Customers" c ON c.id = d.customer_id
  INNER JOIN "Users" u ON u.id = d.owner_id
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, title: row.title, value: Number(row.value), stage: row.stage,
    customerId: row.customer_id, ownerId: row.owner_id, createdAt: row.created_at,
    customer: { id: row.cId, name: row.cName, email: row.cEmail, company: row.cCompany, status: row.cStatus },
    owner: { id: row.oId, name: row.oName, email: row.oEmail, role: row.oRole }
  };
};

export const listDeals = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.ownerId) { clauses.push(`d.owner_id = $${values.length + 1}`); values.push(where.ownerId); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY d.created_at DESC`, values);
  return r.rows.map(map);
};

export const findDealById = async (id) => {
  const r = await query(`${BASE} WHERE d.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createDeal = async (data) => {
  const r = await query(
    `INSERT INTO "Deals" (title, value, stage, customer_id, owner_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [data.title, data.value, data.stage || 'LEAD', data.customerId, data.ownerId]
  );
  return findDealById(r.rows[0].id);
};

export const updateDeal = async (id, data) => {
  const fields = []; const values = []; let idx = 1;
  if (data.title !== undefined) { fields.push(`title=$${idx++}`); values.push(data.title); }
  if (data.value !== undefined) { fields.push(`value=$${idx++}`); values.push(data.value); }
  if (data.stage !== undefined) { fields.push(`stage=$${idx++}`); values.push(data.stage); }
  if (data.customerId !== undefined) { fields.push(`customer_id=$${idx++}`); values.push(data.customerId); }
  if (data.ownerId !== undefined) { fields.push(`owner_id=$${idx++}`); values.push(data.ownerId); }
  if (fields.length) { values.push(id); await query(`UPDATE "Deals" SET ${fields.join(',')} WHERE id=$${idx}`, values); }
  return findDealById(id);
};
