import { query } from '../config/db.js';

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, title: row.title, description: row.description,
    startTime: row.start_time, endTime: row.end_time, location: row.location,
    customerId: row.customer_id, dealId: row.deal_id,
    assignedTo: row.assigned_to, createdBy: row.created_by,
    remindAt: row.remind_at, status: row.status,
    updatedAt: row.updated_at, createdAt: row.created_at
  };
};

export const createAppointment = async (data) => {
  const r = await query(
    `INSERT INTO "Appointments" (title,description,start_time,end_time,location,customer_id,deal_id,assigned_to,created_by,remind_at,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [data.title, data.description || null, new Date(data.startTime), new Date(data.endTime),
     data.location || null, data.customerId || null, data.dealId || null,
     data.assignedTo, data.createdBy, data.remindAt ? new Date(data.remindAt) : null,
     data.status || 'SCHEDULED']
  );
  return map(r.rows[0]);
};

export const findAppointments = async (where = {}) => {
  const clauses = ['1=1']; const values = [];
  if (where.startDate) { clauses.push(`start_time >= $${values.length + 1}`); values.push(new Date(where.startDate)); }
  if (where.endDate) { clauses.push(`start_time <= $${values.length + 1}`); values.push(new Date(where.endDate)); }
  if (where.userId) { clauses.push(`assigned_to = $${values.length + 1}`); values.push(where.userId); }
  if (where.status) { clauses.push(`status = $${values.length + 1}`); values.push(where.status); }
  const r = await query(
    `SELECT * FROM "Appointments" WHERE ${clauses.join(' AND ')} ORDER BY start_time ASC`, values
  );
  return r.rows.map(map);
};
