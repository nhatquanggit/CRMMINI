import { createRequest, sql } from '../config/sqlserver.js';

const mapAppointment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    customerId: row.customer_id,
    dealId: row.deal_id,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    remindAt: row.remind_at,
    type: row.type,
    status: row.status,
    updatedAt: row.updated_at,
    createdAt: row.created_at
  };
};

export const createAppointment = async (data) => {
  const request = await createRequest();
  request.input('title', sql.NVarChar(255), data.title);
  request.input('description', sql.NVarChar(sql.MAX), data.description || null);
  request.input('startTime', sql.DateTime2, new Date(data.startTime));
  request.input('endTime', sql.DateTime2, new Date(data.endTime));
  request.input('location', sql.NVarChar(255), data.location || null);
  request.input('customerId', sql.Int, data.customerId || null);
  request.input('dealId', sql.Int, data.dealId || null);
  request.input('assignedTo', sql.Int, data.assignedTo);
  request.input('createdBy', sql.Int, data.createdBy);
  request.input('remindAt', sql.DateTime2, data.remindAt ? new Date(data.remindAt) : null);
  request.input('type', sql.NVarChar(20), data.type || 'APPOINTMENT');
  request.input('status', sql.NVarChar(20), data.status || 'SCHEDULED');

  const result = await request.query(`
    INSERT INTO Appointments (title, description, start_time, end_time, location, customer_id, deal_id, assigned_to, created_by, remind_at, type, status)
    OUTPUT INSERTED.*
    VALUES (@title, @description, @startTime, @endTime, @location, @customerId, @dealId, @assignedTo, @createdBy, @remindAt, @type, @status)
  `);

  return mapAppointment(result.recordset[0]);
};

export const findAppointments = async (where = {}) => {
  const request = await createRequest();

  let whereClause = '';
  if (where.startDate) {
    request.input('startDate', sql.DateTime2, new Date(where.startDate));
    whereClause += ' AND start_time >= @startDate';
  }
  if (where.endDate) {
    request.input('endDate', sql.DateTime2, new Date(where.endDate));
    whereClause += ' AND start_time <= @endDate';
  }
  if (where.userId) {
    request.input('userId', sql.Int, where.userId);
    whereClause += ' AND assigned_to = @userId';
  }
  if (where.status) {
    request.input('status', sql.NVarChar(20), where.status);
    whereClause += ' AND status = @status';
  }

  const result = await request.query(`
    SELECT * FROM Appointments
    WHERE 1=1 ${whereClause}
    ORDER BY start_time ASC
  `);

  return result.recordset.map(mapAppointment);
};