import { query } from '../config/db.js';

export const getCustomersForExport = async (userId, isAdmin) => {
  const values = [];
  const w = isAdmin ? '' : `WHERE c.assigned_to = $${values.length + 1}`;
  if (!isAdmin) values.push(userId);
  const r = await query(
    `SELECT c.id, c.name, c.email, c.phone, c.company, c.status, u.name AS "assigneeName", c.created_at AS "createdAt"
     FROM "Customers" c LEFT JOIN "Users" u ON u.id = c.assigned_to ${w} ORDER BY c.created_at DESC`,
    values
  );
  return r.rows;
};

export const getDealsForExport = async (userId, isAdmin) => {
  const values = [];
  const w = isAdmin ? '' : `WHERE d.owner_id = $${values.length + 1}`;
  if (!isAdmin) values.push(userId);
  const r = await query(
    `SELECT d.id, d.title, d.value, d.stage, c.name AS "customerName", u.name AS "ownerName", d.created_at AS "createdAt"
     FROM "Deals" d LEFT JOIN "Customers" c ON c.id = d.customer_id LEFT JOIN "Users" u ON u.id = d.owner_id ${w} ORDER BY d.created_at DESC`,
    values
  );
  return r.rows;
};

export const bulkInsertCustomers = async (rows, defaultAssignedTo) => {
  const inserted = []; const skipped = []; const errors = [];
  for (const row of rows) {
    try {
      const exists = await query('SELECT id FROM "Customers" WHERE email = $1', [row.email]);
      if (exists.rows.length > 0) {
        skipped.push({ email: row.email, reason: 'Email đã tồn tại' });
        continue;
      }
      const r = await query(
        `INSERT INTO "Customers" (name,email,phone,company,status,assigned_to) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,name,email`,
        [row.name, row.email, row.phone || '', row.company || '', row.status || 'NEW', defaultAssignedTo]
      );
      inserted.push(r.rows[0]);
    } catch (e) {
      errors.push({ row: row.name || row.email, reason: e.message });
    }
  }
  return { inserted, skipped, errors };
};
