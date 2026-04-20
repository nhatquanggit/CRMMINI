import { createRequest, sql } from '../config/sqlserver.js';

const activityBaseQuery = `
  SELECT
    a.id,
    a.type,
    a.content,
    a.customer_id AS customerId,
    a.deal_id AS dealId,
    a.created_by AS createdBy,
    a.created_at AS createdAt,
    a.updated_at AS updatedAt,
    c.id AS customerRefId,
    c.name AS customerName,
    c.email AS customerEmail,
    d.id AS dealRefId,
    d.title AS dealTitle,
    u.id AS creatorId,
    u.name AS creatorName,
    u.email AS creatorEmail,
    u.role AS creatorRole
  FROM Activities a
  LEFT JOIN Customers c ON c.id = a.customer_id
  LEFT JOIN Deals d ON d.id = a.deal_id
  LEFT JOIN Users u ON u.id = a.created_by
`;

const mapActivity = (row) => ({
  id: row.id,
  type: row.type,
  content: row.content,
  customerId: row.customerId,
  dealId: row.dealId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  customer: row.customerRefId ? {
    id: row.customerRefId,
    name: row.customerName,
    email: row.customerEmail
  } : null,
  deal: row.dealRefId ? {
    id: row.dealRefId,
    title: row.dealTitle
  } : null,
  creator: {
    id: row.creatorId,
    name: row.creatorName,
    email: row.creatorEmail,
    role: row.creatorRole
  }
});

export const listActivities = async (where = {}) => {
  const request = await createRequest();
  const clauses = ['a.id IS NOT NULL'];

  if (where.customerId) {
    request.input('customerId', sql.Int, where.customerId);
    clauses.push('a.customer_id = @customerId');
  }

  if (where.dealId) {
    request.input('dealId', sql.Int, where.dealId);
    clauses.push('a.deal_id = @dealId');
  }

  if (where.type) {
    request.input('type', sql.NVarChar(20), where.type);
    clauses.push('a.type = @type');
  }

  if (where.fromDate) {
    request.input('fromDate', sql.DateTime2, new Date(where.fromDate));
    clauses.push('a.created_at >= @fromDate');
  }

  if (where.toDate) {
    request.input('toDate', sql.DateTime2, new Date(where.toDate));
    clauses.push('a.created_at <= @toDate');
  }

  if (where.createdBy) {
    request.input('createdBy', sql.Int, where.createdBy);
    clauses.push('a.created_by = @createdBy');
  }

  const whereSql = `WHERE ${clauses.join(' AND ')}`;
  const result = await request.query(`${activityBaseQuery} ${whereSql} ORDER BY a.created_at DESC`);
  return result.recordset.map(mapActivity);
};

export const findActivityById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${activityBaseQuery} WHERE a.id = @id`);
  return result.recordset.length > 0 ? mapActivity(result.recordset[0]) : null;
};

export const createActivity = async (data) => {
  const request = await createRequest();
  request.input('type', sql.NVarChar(20), data.type);
  request.input('content', sql.NVarChar(sql.MAX), data.content);
  request.input('customerId', sql.Int, data.customerId || null);
  request.input('dealId', sql.Int, data.dealId || null);
  request.input('createdBy', sql.Int, data.createdBy);

  const result = await request.query(`
    INSERT INTO Activities (type, content, customer_id, deal_id, created_by, created_at, updated_at)
    OUTPUT INSERTED.id AS id
    VALUES (@type, @content, @customerId, @dealId, @createdBy, GETDATE(), GETDATE())
  `);

  const activityId = result.recordset[0].id;
  return findActivityById(activityId);
};

export const updateActivity = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  
  const updates = [];
  if (data.type) {
    request.input('type', sql.NVarChar(20), data.type);
    updates.push('type = @type');
  }
  if (data.content) {
    request.input('content', sql.NVarChar(sql.MAX), data.content);
    updates.push('content = @content');
  }
  
  if (updates.length === 0) {
    return findActivityById(id);
  }

  updates.push('updated_at = GETDATE()');
  const setSql = updates.join(', ');

  await request.query(`UPDATE Activities SET ${setSql} WHERE id = @id`);
  return findActivityById(id);
};

export const deleteActivity = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Activities WHERE id = @id');
};

