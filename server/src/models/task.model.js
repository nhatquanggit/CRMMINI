import { createRequest, sql } from '../config/sqlserver.js';

const taskBaseQuery = `
  SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.customer_id AS customerId,
    t.deal_id AS dealId,
    t.assigned_to AS assignedTo,
    t.created_by AS createdBy,
    t.due_date AS dueDate,
    t.remind_at AS remindAt,
    t.completed_at AS completedAt,
    t.created_at AS createdAt,
    t.updated_at AS updatedAt,
    c.id AS customerRefId,
    c.name AS customerName,
    d.id AS dealRefId,
    d.title AS dealTitle,
    u1.id AS assigneeId,
    u1.name AS assigneeName,
    u1.email AS assigneeEmail,
    u2.id AS creatorId,
    u2.name AS creatorName,
    u2.email AS creatorEmail
  FROM Tasks t
  LEFT JOIN Customers c ON c.id = t.customer_id
  LEFT JOIN Deals d ON d.id = t.deal_id
  LEFT JOIN Users u1 ON u1.id = t.assigned_to
  LEFT JOIN Users u2 ON u2.id = t.created_by
`;

const mapTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  customerId: row.customerId,
  dealId: row.dealId,
  dueDate: row.dueDate,
  remindAt: row.remindAt,
  completedAt: row.completedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  customer: row.customerRefId ? {
    id: row.customerRefId,
    name: row.customerName
  } : null,
  deal: row.dealRefId ? {
    id: row.dealRefId,
    title: row.dealTitle
  } : null,
  assignee: {
    id: row.assigneeId,
    name: row.assigneeName,
    email: row.assigneeEmail
  },
  creator: {
    id: row.creatorId,
    name: row.creatorName,
    email: row.creatorEmail
  }
});

export const listTasks = async (where = {}) => {
  const request = await createRequest();
  const clauses = ['t.id IS NOT NULL'];

  if (where.customerId) {
    request.input('customerId', sql.Int, where.customerId);
    clauses.push('t.customer_id = @customerId');
  }

  if (where.dealId) {
    request.input('dealId', sql.Int, where.dealId);
    clauses.push('t.deal_id = @dealId');
  }

  if (where.assignedTo) {
    request.input('assignedTo', sql.Int, where.assignedTo);
    clauses.push('t.assigned_to = @assignedTo');
  }

  if (where.status) {
    request.input('status', sql.NVarChar(20), where.status);
    clauses.push('t.status = @status');
  }

  if (where.priority) {
    request.input('priority', sql.NVarChar(20), where.priority);
    clauses.push('t.priority = @priority');
  }

  if (where.fromDate) {
    request.input('fromDate', sql.DateTime2, new Date(where.fromDate));
    clauses.push('t.due_date >= @fromDate');
  }

  if (where.toDate) {
    request.input('toDate', sql.DateTime2, new Date(where.toDate));
    clauses.push('t.due_date <= @toDate');
  }

  if (where.isOverdue) {
    clauses.push('t.due_date < GETDATE() AND t.status != \'DONE\' AND t.status != \'CANCELLED\'');
  }

  const orderBy = where.orderBy || 't.due_date ASC';
  const whereSql = `WHERE ${clauses.join(' AND ')}`;
  const result = await request.query(`${taskBaseQuery} ${whereSql} ORDER BY ${orderBy}`);
  return result.recordset.map(mapTask);
};

export const findTaskById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${taskBaseQuery} WHERE t.id = @id`);
  return result.recordset.length > 0 ? mapTask(result.recordset[0]) : null;
};

export const createTask = async (data) => {
  const request = await createRequest();
  request.input('title', sql.NVarChar(255), data.title);
  request.input('description', sql.NVarChar(sql.MAX), data.description);
  request.input('priority', sql.NVarChar(20), data.priority || 'MEDIUM');
  request.input('customerId', sql.Int, data.customerId || null);
  request.input('dealId', sql.Int, data.dealId || null);
  request.input('assignedTo', sql.Int, data.assignedTo);
  request.input('createdBy', sql.Int, data.createdBy);
  request.input('dueDate', sql.DateTime2, new Date(data.dueDate));
  request.input('remindAt', sql.DateTime2, data.remindAt ? new Date(data.remindAt) : null);

  const result = await request.query(`
    INSERT INTO Tasks (title, description, priority, customer_id, deal_id, assigned_to, created_by, due_date, remind_at, created_at, updated_at)
    OUTPUT INSERTED.id AS id
    VALUES (@title, @description, @priority, @customerId, @dealId, @assignedTo, @createdBy, @dueDate, @remindAt, GETDATE(), GETDATE())
  `);

  const taskId = result.recordset[0].id;
  return findTaskById(taskId);
};

export const updateTask = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  
  const updates = [];
  if (data.title) {
    request.input('title', sql.NVarChar(255), data.title);
    updates.push('title = @title');
  }
  if (data.description) {
    request.input('description', sql.NVarChar(sql.MAX), data.description);
    updates.push('description = @description');
  }
  if (data.status) {
    request.input('status', sql.NVarChar(20), data.status);
    updates.push('status = @status');
    if (data.status === 'DONE') {
      updates.push('completed_at = GETDATE()');
    }
  }
  if (data.priority) {
    request.input('priority', sql.NVarChar(20), data.priority);
    updates.push('priority = @priority');
  }
  if (data.dueDate) {
    request.input('dueDate', sql.DateTime2, new Date(data.dueDate));
    updates.push('due_date = @dueDate');
  }
  if (data.assignedTo) {
    request.input('assignedTo', sql.Int, data.assignedTo);
    updates.push('assigned_to = @assignedTo');
  }
  
  if (updates.length === 0) {
    return findTaskById(id);
  }

  updates.push('updated_at = GETDATE()');
  const setSql = updates.join(', ');

  await request.query(`UPDATE Tasks SET ${setSql} WHERE id = @id`);
  return findTaskById(id);
};

export const deleteTask = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Tasks WHERE id = @id');
};
