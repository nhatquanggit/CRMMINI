import { query } from '../config/db.js';

const BASE = `
  SELECT i.*, d.title AS "dTitle", c.name AS "cName", u.name AS "uName"
  FROM "Invoices" i
  INNER JOIN "Deals" d ON d.id = i.deal_id
  INNER JOIN "Customers" c ON c.id = i.customer_id
  INNER JOIN "Users" u ON u.id = i.created_by
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, invoiceNo: row.invoice_no, dealId: row.deal_id, customerId: row.customer_id,
    status: row.status, subtotal: Number(row.subtotal), discountPct: Number(row.discount_pct || 0),
    taxPct: Number(row.tax_pct || 0), totalAmount: Number(row.total_amount),
    dueDate: row.due_date, paidAt: row.paid_at, notes: row.notes,
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
    deal: { id: row.deal_id, title: row.dTitle },
    customer: { id: row.customer_id, name: row.cName },
    creator: { id: row.created_by, name: row.uName }
  };
};

export const listInvoices = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.createdBy) { clauses.push(`i.created_by = $${values.length + 1}`); values.push(where.createdBy); }
  if (where.status) { clauses.push(`i.status = $${values.length + 1}`); values.push(where.status); }
  if (where.dealId) { clauses.push(`i.deal_id = $${values.length + 1}`); values.push(where.dealId); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY i.created_at DESC`, values);
  return r.rows.map(map);
};

export const findInvoiceById = async (id) => {
  const r = await query(`${BASE} WHERE i.id = $1`, [id]);
  const invoice = map(r.rows[0]);
  if (!invoice) return null;
  const items = await query(
    `SELECT ii.*, p.name AS "pName", p.sku AS "pSku", p.unit AS "pUnit"
     FROM "InvoiceItems" ii INNER JOIN "Products" p ON p.id = ii.product_id
     WHERE ii.invoice_id = $1 ORDER BY ii.id ASC`, [id]
  );
  invoice.items = items.rows.map((r2) => ({
    id: r2.id, invoiceId: r2.invoice_id, productId: r2.product_id,
    description: r2.description, quantity: Number(r2.quantity),
    unitPrice: Number(r2.unit_price), lineTotal: Number(r2.line_total),
    product: { id: r2.product_id, name: r2.pName, sku: r2.pSku, unit: r2.pUnit }
  }));
  return invoice;
};

export const createInvoice = async (data) => {
  const r = await query(
    `INSERT INTO "Invoices" (invoice_no,deal_id,customer_id,status,subtotal,discount_pct,tax_pct,total_amount,due_date,notes,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [data.invoiceNo, data.dealId, data.customerId, data.status || 'DRAFT', data.subtotal,
     data.discountPct || 0, data.taxPct || 0, data.totalAmount,
     data.dueDate ? new Date(data.dueDate) : null, data.notes || null, data.createdBy]
  );
  const invoiceId = r.rows[0].id;
  for (const item of (data.items || [])) {
    await query(
      `INSERT INTO "InvoiceItems" (invoice_id,product_id,description,quantity,unit_price,line_total) VALUES ($1,$2,$3,$4,$5,$6)`,
      [invoiceId, item.productId, item.description || null, item.quantity, item.unitPrice, item.lineTotal]
    );
  }
  return findInvoiceById(invoiceId);
};

export const updateInvoice = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const cols = { status: 'status', notes: 'notes', subtotal: 'subtotal', discountPct: 'discount_pct', taxPct: 'tax_pct', totalAmount: 'total_amount' };
  for (const [k, col] of Object.entries(cols)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  if (data.dueDate !== undefined) { fields.push(`due_date=$${idx++}`); values.push(data.dueDate ? new Date(data.dueDate) : null); }
  if (data.paidAt !== undefined) { fields.push(`paid_at=$${idx++}`); values.push(data.paidAt ? new Date(data.paidAt) : null); }
  values.push(id);
  await query(`UPDATE "Invoices" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  if (Array.isArray(data.items)) {
    await query('DELETE FROM "InvoiceItems" WHERE invoice_id = $1', [id]);
    for (const item of data.items) {
      await query(
        `INSERT INTO "InvoiceItems" (invoice_id,product_id,description,quantity,unit_price,line_total) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, item.productId, item.description || null, item.quantity, item.unitPrice, item.lineTotal]
      );
    }
  }
  return findInvoiceById(id);
};

export const deleteInvoice = async (id) => {
  await query('DELETE FROM "Invoices" WHERE id = $1', [id]);
};
