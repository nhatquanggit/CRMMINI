import { query } from '../config/db.js';

const BASE = `SELECT p.*, u.name AS "uName" FROM "Products" p INNER JOIN "Users" u ON u.id = p.created_by`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, sku: row.sku, name: row.name, category: row.category, unit: row.unit,
    price: Number(row.price), description: row.description, isActive: Boolean(row.is_active),
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
    creator: { id: row.created_by, name: row.uName }
  };
};

export const listProducts = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.search) { clauses.push(`(p.name ILIKE $${values.length + 1} OR p.sku ILIKE $${values.length + 1})`); values.push(`%${where.search}%`); }
  if (where.category) { clauses.push(`p.category = $${values.length + 1}`); values.push(where.category); }
  if (where.isActive !== undefined) { clauses.push(`p.is_active = $${values.length + 1}`); values.push(where.isActive); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY p.created_at DESC`, values);
  return r.rows.map(map);
};

export const findProductById = async (id) => {
  const r = await query(`${BASE} WHERE p.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createProduct = async (data) => {
  const r = await query(
    `INSERT INTO "Products" (sku,name,category,unit,price,description,is_active,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [data.sku, data.name, data.category || null, data.unit || 'item', data.price,
     data.description || null, data.isActive === undefined ? true : data.isActive, data.createdBy]
  );
  return findProductById(r.rows[0].id);
};

export const updateProduct = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const cols = { sku: 'sku', name: 'name', category: 'category', unit: 'unit', price: 'price', description: 'description', isActive: 'is_active' };
  for (const [k, col] of Object.entries(cols)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  values.push(id);
  await query(`UPDATE "Products" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findProductById(id);
};

export const deleteProduct = async (id) => {
  await query('DELETE FROM "Products" WHERE id = $1', [id]);
};
