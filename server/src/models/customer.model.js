import { createRequest, sql } from '../config/sqlserver.js';

const customerBaseQuery = `
  SELECT
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c.status,
    c.lead_source AS leadSource,
    c.assigned_to AS assignedTo,
    c.created_at AS createdAt,
    u.id AS assigneeId,
    u.name AS assigneeName,
    u.email AS assigneeEmail,
    u.role AS assigneeRole
  FROM Customers c
  INNER JOIN Users u ON u.id = c.assigned_to
`;

const mapCustomer = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status,
    leadSource: row.leadSource,
    assignedTo: row.assignedTo,
    createdAt: row.createdAt,
    assignee: {
      id: row.assigneeId,
      name: row.assigneeName,
      email: row.assigneeEmail,
      role: row.assigneeRole
    }
  };
};

export const listCustomers = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.assignedTo) {
    request.input('assignedTo', sql.Int, where.assignedTo);
    clauses.push('c.assigned_to = @assignedTo');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${customerBaseQuery} ${whereSql} ORDER BY c.created_at DESC`);
  return result.recordset.map(mapCustomer);
};

export const findCustomerById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${customerBaseQuery} WHERE c.id = @id`);
  return mapCustomer(result.recordset[0]);
};

export const createCustomer = async (data) => {
  const request = await createRequest();
  request.input('name', sql.NVarChar(120), data.name);
  request.input('email', sql.NVarChar(255), data.email);
  request.input('phone', sql.NVarChar(30), data.phone);
  request.input('company', sql.NVarChar(180), data.company);
  request.input('status', sql.NVarChar(20), data.status || 'NEW');
  request.input('leadSource', sql.NVarChar(30), data.leadSource || 'OTHER');
  request.input('assignedTo', sql.Int, data.assignedTo);

  const result = await request.query(`
    INSERT INTO Customers (name, email, phone, company, status, lead_source, assigned_to)
    OUTPUT INSERTED.id AS id
    VALUES (@name, @email, @phone, @company, @status, @leadSource, @assignedTo)
  `);

  return findCustomerById(result.recordset[0].id);
};

export const updateCustomer = async (id, data) => {
  const fields = [];
  const request = await createRequest();
  request.input('id', sql.Int, id);

  if (data.name !== undefined) {
    request.input('name', sql.NVarChar(120), data.name);
    fields.push('name = @name');
  }
  if (data.email !== undefined) {
    request.input('email', sql.NVarChar(255), data.email);
    fields.push('email = @email');
  }
  if (data.phone !== undefined) {
    request.input('phone', sql.NVarChar(30), data.phone);
    fields.push('phone = @phone');
  }
  if (data.company !== undefined) {
    request.input('company', sql.NVarChar(180), data.company);
    fields.push('company = @company');
  }
  if (data.status !== undefined) {
    request.input('status', sql.NVarChar(20), data.status);
    fields.push('status = @status');
  }
  if (data.leadSource !== undefined) {
    request.input('leadSource', sql.NVarChar(30), data.leadSource);
    fields.push('lead_source = @leadSource');
  }
  if (data.assignedTo !== undefined) {
    request.input('assignedTo', sql.Int, data.assignedTo);
    fields.push('assigned_to = @assignedTo');
  }

  if (fields.length) {
    await request.query(`UPDATE Customers SET ${fields.join(', ')} WHERE id = @id`);
  }

  return findCustomerById(id);
};

export const deleteCustomer = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Customers WHERE id = @id');
};
