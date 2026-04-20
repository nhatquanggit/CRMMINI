import { createRequest, sql } from '../config/sqlserver.js';

const quoteBaseQuery = `
  SELECT
    q.id,
    q.quote_no AS quoteNo,
    q.title,
    q.deal_id AS dealId,
    q.customer_id AS customerId,
    q.amount,
    q.discount_pct AS discountPct,
    q.tax_pct AS taxPct,
    q.final_amount AS finalAmount,
    q.status,
    q.valid_until AS validUntil,
    q.terms,
    q.signed_at AS signedAt,
    q.created_by AS createdBy,
    q.created_at AS createdAt,
    q.updated_at AS updatedAt,
    d.title AS dealTitle,
    c.name AS customerName,
    u.name AS creatorName
  FROM Quotes q
  INNER JOIN Deals d ON d.id = q.deal_id
  INNER JOIN Customers c ON c.id = q.customer_id
  INNER JOIN Users u ON u.id = q.created_by
`;

const mapQuote = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    quoteNo: row.quoteNo,
    title: row.title,
    dealId: row.dealId,
    customerId: row.customerId,
    amount: Number(row.amount),
    discountPct: Number(row.discountPct || 0),
    taxPct: Number(row.taxPct || 0),
    finalAmount: Number(row.finalAmount),
    status: row.status,
    validUntil: row.validUntil,
    terms: row.terms,
    signedAt: row.signedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deal: { id: row.dealId, title: row.dealTitle },
    customer: { id: row.customerId, name: row.customerName },
    creator: { id: row.createdBy, name: row.creatorName }
  };
};

export const listQuotes = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.createdBy) {
    request.input('createdBy', sql.Int, where.createdBy);
    clauses.push('q.created_by = @createdBy');
  }
  if (where.dealId) {
    request.input('dealId', sql.Int, where.dealId);
    clauses.push('q.deal_id = @dealId');
  }
  if (where.status) {
    request.input('status', sql.NVarChar(20), where.status);
    clauses.push('q.status = @status');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${quoteBaseQuery} ${whereSql} ORDER BY q.created_at DESC`);
  return result.recordset.map(mapQuote);
};

export const findQuoteById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${quoteBaseQuery} WHERE q.id = @id`);
  return mapQuote(result.recordset[0]);
};

export const createQuote = async (data) => {
  const request = await createRequest();
  request.input('quoteNo', sql.NVarChar(30), data.quoteNo);
  request.input('title', sql.NVarChar(180), data.title);
  request.input('dealId', sql.Int, data.dealId);
  request.input('customerId', sql.Int, data.customerId);
  request.input('amount', sql.Decimal(18, 2), data.amount);
  request.input('discountPct', sql.Decimal(5, 2), data.discountPct || 0);
  request.input('taxPct', sql.Decimal(5, 2), data.taxPct || 0);
  request.input('finalAmount', sql.Decimal(18, 2), data.finalAmount);
  request.input('status', sql.NVarChar(20), data.status || 'DRAFT');
  request.input('validUntil', sql.DateTime2, data.validUntil ? new Date(data.validUntil) : null);
  request.input('terms', sql.NVarChar(sql.MAX), data.terms || null);
  request.input('createdBy', sql.Int, data.createdBy);

  const result = await request.query(`
    INSERT INTO Quotes (quote_no, title, deal_id, customer_id, amount, discount_pct, tax_pct, final_amount, status, valid_until, terms, created_by)
    OUTPUT INSERTED.id AS id
    VALUES (@quoteNo, @title, @dealId, @customerId, @amount, @discountPct, @taxPct, @finalAmount, @status, @validUntil, @terms, @createdBy)
  `);

  return findQuoteById(result.recordset[0].id);
};

export const updateQuote = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.title !== undefined) {
    request.input('title', sql.NVarChar(180), data.title);
    fields.push('title = @title');
  }
  if (data.amount !== undefined) {
    request.input('amount', sql.Decimal(18, 2), data.amount);
    fields.push('amount = @amount');
  }
  if (data.discountPct !== undefined) {
    request.input('discountPct', sql.Decimal(5, 2), data.discountPct);
    fields.push('discount_pct = @discountPct');
  }
  if (data.taxPct !== undefined) {
    request.input('taxPct', sql.Decimal(5, 2), data.taxPct);
    fields.push('tax_pct = @taxPct');
  }
  if (data.finalAmount !== undefined) {
    request.input('finalAmount', sql.Decimal(18, 2), data.finalAmount);
    fields.push('final_amount = @finalAmount');
  }
  if (data.status !== undefined) {
    request.input('status', sql.NVarChar(20), data.status);
    fields.push('status = @status');
  }
  if (data.validUntil !== undefined) {
    request.input('validUntil', sql.DateTime2, data.validUntil ? new Date(data.validUntil) : null);
    fields.push('valid_until = @validUntil');
  }
  if (data.terms !== undefined) {
    request.input('terms', sql.NVarChar(sql.MAX), data.terms || null);
    fields.push('terms = @terms');
  }
  if (data.signedAt !== undefined) {
    request.input('signedAt', sql.DateTime2, data.signedAt ? new Date(data.signedAt) : null);
    fields.push('signed_at = @signedAt');
  }

  await request.query(`UPDATE Quotes SET ${fields.join(', ')} WHERE id = @id`);
  return findQuoteById(id);
};

export const deleteQuote = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Quotes WHERE id = @id');
};
