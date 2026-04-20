import { query } from '../config/db.js';

const BASE = `
  SELECT q.*, d.title AS "dTitle", c.name AS "cName", u.name AS "uName"
  FROM "Quotes" q
  INNER JOIN "Deals" d ON d.id = q.deal_id
  INNER JOIN "Customers" c ON c.id = q.customer_id
  INNER JOIN "Users" u ON u.id = q.created_by
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, quoteNo: row.quote_no, title: row.title,
    dealId: row.deal_id, customerId: row.customer_id,
    amount: Number(row.amount), discountPct: Number(row.discount_pct || 0),
    taxPct: Number(row.tax_pct || 0), finalAmount: Number(row.final_amount),
    status: row.status, validUntil: row.valid_until, terms: row.terms,
    signedAt: row.signed_at, createdBy: row.created_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
    deal: { id: row.deal_id, title: row.dTitle },
    customer: { id: row.customer_id, name: row.cName },
    creator: { id: row.created_by, name: row.uName }
  };
};

export const listQuotes = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.createdBy) { clauses.push(`q.created_by = $${values.length + 1}`); values.push(where.createdBy); }
  if (where.dealId) { clauses.push(`q.deal_id = $${values.length + 1}`); values.push(where.dealId); }
  if (where.status) { clauses.push(`q.status = $${values.length + 1}`); values.push(where.status); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY q.created_at DESC`, values);
  return r.rows.map(map);
};

export const findQuoteById = async (id) => {
  const r = await query(`${BASE} WHERE q.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createQuote = async (data) => {
  const r = await query(
    `INSERT INTO "Quotes" (quote_no,title,deal_id,customer_id,amount,discount_pct,tax_pct,final_amount,status,valid_until,terms,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [data.quoteNo, data.title, data.dealId, data.customerId, data.amount,
     data.discountPct || 0, data.taxPct || 0, data.finalAmount,
     data.status || 'DRAFT', data.validUntil ? new Date(data.validUntil) : null,
     data.terms || null, data.createdBy]
  );
  return findQuoteById(r.rows[0].id);
};

export const updateQuote = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const map2 = { title: 'title', amount: 'amount', discountPct: 'discount_pct', taxPct: 'tax_pct',
    finalAmount: 'final_amount', status: 'status', terms: 'terms' };
  for (const [k, col] of Object.entries(map2)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  if (data.validUntil !== undefined) { fields.push(`valid_until=$${idx++}`); values.push(data.validUntil ? new Date(data.validUntil) : null); }
  if (data.signedAt !== undefined) { fields.push(`signed_at=$${idx++}`); values.push(data.signedAt ? new Date(data.signedAt) : null); }
  values.push(id);
  await query(`UPDATE "Quotes" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findQuoteById(id);
};

export const deleteQuote = async (id) => {
  await query('DELETE FROM "Quotes" WHERE id = $1', [id]);
};
