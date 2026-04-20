import { createRequest, sql } from '../config/sqlserver.js';

/**
 * Fetch all customers for export (admin sees all, sales sees own)
 */
export const getCustomersForExport = async (userId, isAdmin) => {
  const request = await createRequest();
  let whereClause = '';
  if (!isAdmin) {
    request.input('userId', sql.Int, userId);
    whereClause = 'WHERE c.assigned_to = @userId';
  }

  const result = await request.query(`
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.status,
      u.name  AS assigneeName,
      c.created_at AS createdAt
    FROM Customers c
    LEFT JOIN Users u ON u.id = c.assigned_to
    ${whereClause}
    ORDER BY c.created_at DESC
  `);

  return result.recordset;
};

/**
 * Fetch all deals for export
 */
export const getDealsForExport = async (userId, isAdmin) => {
  const request = await createRequest();
  let whereClause = '';
  if (!isAdmin) {
    request.input('userId', sql.Int, userId);
    whereClause = 'WHERE d.owner_id = @userId';
  }

  const result = await request.query(`
    SELECT
      d.id,
      d.title,
      d.value,
      d.stage,
      c.name   AS customerName,
      u.name   AS ownerName,
      d.created_at AS createdAt
    FROM Deals d
    LEFT JOIN Customers c ON c.id = d.customer_id
    LEFT JOIN Users u ON u.id = d.owner_id
    ${whereClause}
    ORDER BY d.created_at DESC
  `);

  return result.recordset;
};

/**
 * Bulk insert customers from import data.
 * Each row: { name, email, phone, company, status, assignedTo }
 * Returns { inserted, skipped, errors }
 */
export const bulkInsertCustomers = async (rows, defaultAssignedTo) => {
  const inserted = [];
  const skipped = [];
  const errors = [];

  for (const row of rows) {
    try {
      const request = await createRequest();
      request.input('name',       sql.NVarChar(120), row.name);
      request.input('email',      sql.NVarChar(255), row.email);
      request.input('phone',      sql.NVarChar(30),  row.phone || '');
      request.input('company',    sql.NVarChar(180), row.company || '');
      request.input('status',     sql.NVarChar(20),  row.status || 'NEW');
      request.input('assignedTo', sql.Int,            defaultAssignedTo);

      const result = await request.query(`
        IF NOT EXISTS (SELECT 1 FROM Customers WHERE email = @email)
        BEGIN
          INSERT INTO Customers (name, email, phone, company, status, assigned_to)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.email
          VALUES (@name, @email, @phone, @company, @status, @assignedTo)
        END
      `);

      if (result.recordset.length > 0) {
        inserted.push(result.recordset[0]);
      } else {
        skipped.push({ email: row.email, reason: 'Email đã tồn tại' });
      }
    } catch (e) {
      errors.push({ row: row.name || row.email, reason: e.message });
    }
  }

  return { inserted, skipped, errors };
};
