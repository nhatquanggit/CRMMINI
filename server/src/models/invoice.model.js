import { createRequest, sql } from '../config/sqlserver.js';

const invoiceBaseQuery = `
  SELECT
    i.id,
    i.invoice_no AS invoiceNo,
    i.deal_id AS dealId,
    i.customer_id AS customerId,
    i.status,
    i.subtotal,
    i.discount_pct AS discountPct,
    i.tax_pct AS taxPct,
    i.total_amount AS totalAmount,
    i.due_date AS dueDate,
    i.paid_at AS paidAt,
    i.notes,
    i.created_by AS createdBy,
    i.created_at AS createdAt,
    i.updated_at AS updatedAt,
    d.title AS dealTitle,
    c.name AS customerName,
    u.name AS creatorName
  FROM Invoices i
  INNER JOIN Deals d ON d.id = i.deal_id
  INNER JOIN Customers c ON c.id = i.customer_id
  INNER JOIN Users u ON u.id = i.created_by
`;

const mapInvoice = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    invoiceNo: row.invoiceNo,
    dealId: row.dealId,
    customerId: row.customerId,
    status: row.status,
    subtotal: Number(row.subtotal),
    discountPct: Number(row.discountPct || 0),
    taxPct: Number(row.taxPct || 0),
    totalAmount: Number(row.totalAmount),
    dueDate: row.dueDate,
    paidAt: row.paidAt,
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deal: { id: row.dealId, title: row.dealTitle },
    customer: { id: row.customerId, name: row.customerName },
    creator: { id: row.createdBy, name: row.creatorName }
  };
};

export const listInvoices = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.createdBy) {
    request.input('createdBy', sql.Int, where.createdBy);
    clauses.push('i.created_by = @createdBy');
  }
  if (where.status) {
    request.input('status', sql.NVarChar(20), where.status);
    clauses.push('i.status = @status');
  }
  if (where.dealId) {
    request.input('dealId', sql.Int, where.dealId);
    clauses.push('i.deal_id = @dealId');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${invoiceBaseQuery} ${whereSql} ORDER BY i.created_at DESC`);
  return result.recordset.map(mapInvoice);
};

export const findInvoiceById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);

  const invoiceResult = await request.query(`${invoiceBaseQuery} WHERE i.id = @id`);
  const invoice = mapInvoice(invoiceResult.recordset[0]);
  if (!invoice) return null;

  const itemRequest = await createRequest();
  itemRequest.input('invoiceId', sql.Int, id);
  const itemResult = await itemRequest.query(`
    SELECT
      ii.id,
      ii.invoice_id AS invoiceId,
      ii.product_id AS productId,
      ii.description,
      ii.quantity,
      ii.unit_price AS unitPrice,
      ii.line_total AS lineTotal,
      p.name AS productName,
      p.sku AS productSku,
      p.unit AS productUnit
    FROM InvoiceItems ii
    INNER JOIN Products p ON p.id = ii.product_id
    WHERE ii.invoice_id = @invoiceId
    ORDER BY ii.id ASC
  `);

  invoice.items = itemResult.recordset.map((r) => ({
    id: r.id,
    invoiceId: r.invoiceId,
    productId: r.productId,
    description: r.description,
    quantity: Number(r.quantity),
    unitPrice: Number(r.unitPrice),
    lineTotal: Number(r.lineTotal),
    product: {
      id: r.productId,
      name: r.productName,
      sku: r.productSku,
      unit: r.productUnit
    }
  }));

  return invoice;
};

export const createInvoice = async (data) => {
  const request = await createRequest();
  request.input('invoiceNo', sql.NVarChar(30), data.invoiceNo);
  request.input('dealId', sql.Int, data.dealId);
  request.input('customerId', sql.Int, data.customerId);
  request.input('status', sql.NVarChar(20), data.status || 'DRAFT');
  request.input('subtotal', sql.Decimal(18, 2), data.subtotal);
  request.input('discountPct', sql.Decimal(5, 2), data.discountPct || 0);
  request.input('taxPct', sql.Decimal(5, 2), data.taxPct || 0);
  request.input('totalAmount', sql.Decimal(18, 2), data.totalAmount);
  request.input('dueDate', sql.DateTime2, data.dueDate ? new Date(data.dueDate) : null);
  request.input('notes', sql.NVarChar(sql.MAX), data.notes || null);
  request.input('createdBy', sql.Int, data.createdBy);

  const insertInvoice = await request.query(`
    INSERT INTO Invoices (invoice_no, deal_id, customer_id, status, subtotal, discount_pct, tax_pct, total_amount, due_date, notes, created_by)
    OUTPUT INSERTED.id AS id
    VALUES (@invoiceNo, @dealId, @customerId, @status, @subtotal, @discountPct, @taxPct, @totalAmount, @dueDate, @notes, @createdBy)
  `);

  const invoiceId = insertInvoice.recordset[0].id;

  for (const item of data.items) {
    const itemReq = await createRequest();
    itemReq.input('invoiceId', sql.Int, invoiceId);
    itemReq.input('productId', sql.Int, item.productId);
    itemReq.input('description', sql.NVarChar(255), item.description || null);
    itemReq.input('quantity', sql.Decimal(18, 2), item.quantity);
    itemReq.input('unitPrice', sql.Decimal(18, 2), item.unitPrice);
    itemReq.input('lineTotal', sql.Decimal(18, 2), item.lineTotal);

    await itemReq.query(`
      INSERT INTO InvoiceItems (invoice_id, product_id, description, quantity, unit_price, line_total)
      VALUES (@invoiceId, @productId, @description, @quantity, @unitPrice, @lineTotal)
    `);
  }

  return findInvoiceById(invoiceId);
};

export const updateInvoice = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.status !== undefined) {
    request.input('status', sql.NVarChar(20), data.status);
    fields.push('status = @status');
  }
  if (data.dueDate !== undefined) {
    request.input('dueDate', sql.DateTime2, data.dueDate ? new Date(data.dueDate) : null);
    fields.push('due_date = @dueDate');
  }
  if (data.notes !== undefined) {
    request.input('notes', sql.NVarChar(sql.MAX), data.notes || null);
    fields.push('notes = @notes');
  }
  if (data.subtotal !== undefined) {
    request.input('subtotal', sql.Decimal(18, 2), data.subtotal);
    fields.push('subtotal = @subtotal');
  }
  if (data.discountPct !== undefined) {
    request.input('discountPct', sql.Decimal(5, 2), data.discountPct);
    fields.push('discount_pct = @discountPct');
  }
  if (data.taxPct !== undefined) {
    request.input('taxPct', sql.Decimal(5, 2), data.taxPct);
    fields.push('tax_pct = @taxPct');
  }
  if (data.totalAmount !== undefined) {
    request.input('totalAmount', sql.Decimal(18, 2), data.totalAmount);
    fields.push('total_amount = @totalAmount');
  }
  if (data.paidAt !== undefined) {
    request.input('paidAt', sql.DateTime2, data.paidAt ? new Date(data.paidAt) : null);
    fields.push('paid_at = @paidAt');
  }

  await request.query(`UPDATE Invoices SET ${fields.join(', ')} WHERE id = @id`);

  if (Array.isArray(data.items)) {
    const delReq = await createRequest();
    delReq.input('invoiceId', sql.Int, id);
    await delReq.query('DELETE FROM InvoiceItems WHERE invoice_id = @invoiceId');

    for (const item of data.items) {
      const insReq = await createRequest();
      insReq.input('invoiceId', sql.Int, id);
      insReq.input('productId', sql.Int, item.productId);
      insReq.input('description', sql.NVarChar(255), item.description || null);
      insReq.input('quantity', sql.Decimal(18, 2), item.quantity);
      insReq.input('unitPrice', sql.Decimal(18, 2), item.unitPrice);
      insReq.input('lineTotal', sql.Decimal(18, 2), item.lineTotal);
      await insReq.query(`
        INSERT INTO InvoiceItems (invoice_id, product_id, description, quantity, unit_price, line_total)
        VALUES (@invoiceId, @productId, @description, @quantity, @unitPrice, @lineTotal)
      `);
    }
  }

  return findInvoiceById(id);
};

export const deleteInvoice = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Invoices WHERE id = @id');
};
