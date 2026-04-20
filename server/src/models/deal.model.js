import { createRequest, sql } from '../config/sqlserver.js';

const dealBaseQuery = `
  SELECT
    d.id,
    d.title,
    d.value,
    d.stage,
    d.customer_id AS customerId,
    d.owner_id AS ownerId,
    d.created_at AS createdAt,
    c.id AS customerRefId,
    c.name AS customerName,
    c.email AS customerEmail,
    c.company AS customerCompany,
    c.status AS customerStatus,
    u.id AS ownerRefId,
    u.name AS ownerName,
    u.email AS ownerEmail,
    u.role AS ownerRole
  FROM Deals d
  INNER JOIN Customers c ON c.id = d.customer_id
  INNER JOIN Users u ON u.id = d.owner_id
`;

const mapDeal = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    value: Number(row.value),
    stage: row.stage,
    customerId: row.customerId,
    ownerId: row.ownerId,
    createdAt: row.createdAt,
    customer: {
      id: row.customerRefId,
      name: row.customerName,
      email: row.customerEmail,
      company: row.customerCompany,
      status: row.customerStatus
    },
    owner: {
      id: row.ownerRefId,
      name: row.ownerName,
      email: row.ownerEmail,
      role: row.ownerRole
    }
  };
};

export const listDeals = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.ownerId) {
    request.input('ownerId', sql.Int, where.ownerId);
    clauses.push('d.owner_id = @ownerId');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${dealBaseQuery} ${whereSql} ORDER BY d.created_at DESC`);
  return result.recordset.map(mapDeal);
};

export const findDealById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${dealBaseQuery} WHERE d.id = @id`);
  return mapDeal(result.recordset[0]);
};

export const createDeal = async (data) => {
  const request = await createRequest();
  request.input('title', sql.NVarChar(180), data.title);
  request.input('value', sql.Decimal(18, 2), data.value);
  request.input('stage', sql.NVarChar(20), data.stage || 'LEAD');
  request.input('customerId', sql.Int, data.customerId);
  request.input('ownerId', sql.Int, data.ownerId);

  const result = await request.query(`
    INSERT INTO Deals (title, value, stage, customer_id, owner_id)
    OUTPUT INSERTED.id AS id
    VALUES (@title, @value, @stage, @customerId, @ownerId)
  `);

  return findDealById(result.recordset[0].id);
};

export const updateDeal = async (id, data) => {
  const fields = [];
  const request = await createRequest();
  request.input('id', sql.Int, id);

  if (data.title !== undefined) {
    request.input('title', sql.NVarChar(180), data.title);
    fields.push('title = @title');
  }
  if (data.value !== undefined) {
    request.input('value', sql.Decimal(18, 2), data.value);
    fields.push('value = @value');
  }
  if (data.stage !== undefined) {
    request.input('stage', sql.NVarChar(20), data.stage);
    fields.push('stage = @stage');
  }
  if (data.customerId !== undefined) {
    request.input('customerId', sql.Int, data.customerId);
    fields.push('customer_id = @customerId');
  }
  if (data.ownerId !== undefined) {
    request.input('ownerId', sql.Int, data.ownerId);
    fields.push('owner_id = @ownerId');
  }

  if (fields.length) {
    await request.query(`UPDATE Deals SET ${fields.join(', ')} WHERE id = @id`);
  }

  return findDealById(id);
};
