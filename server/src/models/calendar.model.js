import { createRequest, sql } from '../config/sqlserver.js';

/**
 * Get calendar events from Tasks and Activities within a date range.
 * Returns a unified list of events for the calendar view.
 */
export const listCalendarEvents = async (where = {}) => {
  const request = await createRequest();

  const startDate = where.startDate ? new Date(where.startDate) : new Date();
  const endDate = where.endDate ? new Date(where.endDate) : new Date();

  request.input('startDate', sql.DateTime2, startDate);
  request.input('endDate', sql.DateTime2, endDate);

  if (where.userId) {
    request.input('userId', sql.Int, where.userId);
  }

  const schemaReq = await createRequest();
  const schemaResult = await schemaReq.query(`
    SELECT
      CASE WHEN OBJECT_ID('Tasks', 'U') IS NOT NULL THEN 1 ELSE 0 END AS hasTasks,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL THEN 1 ELSE 0 END AS hasActivities,
      CASE WHEN OBJECT_ID('Appointments', 'U') IS NOT NULL THEN 1 ELSE 0 END AS hasAppointments,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'content') IS NOT NULL THEN 1 ELSE 0 END AS hasActivityContent,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'note') IS NOT NULL THEN 1 ELSE 0 END AS hasActivityNote,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'created_by') IS NOT NULL THEN 1 ELSE 0 END AS hasActivityCreatedBy,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'deal_id') IS NOT NULL THEN 1 ELSE 0 END AS hasActivityDealId
  `);

  const schema = schemaResult.recordset[0] || {};
  const hasTasks = Boolean(schema.hasTasks);
  const hasActivities = Boolean(schema.hasActivities);
  const hasAppointments = Boolean(schema.hasAppointments);
  const hasContent = Boolean(schema.hasActivityContent);
  const hasNote = Boolean(schema.hasActivityNote);
  const hasActivityCreatedBy = Boolean(schema.hasActivityCreatedBy);
  const hasActivityDealId = Boolean(schema.hasActivityDealId);

  const activityTextExpr = hasContent
    ? 'a.content'
    : hasNote
      ? 'a.note'
      : "''";

  const taskUserClause = where.userId ? 'AND t.assigned_to = @userId' : '';
  const appointmentUserClause = where.userId ? 'AND a.assigned_to = @userId' : '';

  let actUserClause = '';
  if (where.userId) {
    if (hasActivityCreatedBy) {
      actUserClause = 'AND a.created_by = @userId';
    } else {
      // If the Activities table cannot be filtered by creator, do not expose meeting activities to non-admin users.
      actUserClause = 'AND 1 = 0';
    }
  }

  const queryParts = [];

  if (hasTasks) {
    queryParts.push(`
      -- Tasks as calendar events (by due date)
      SELECT
        'task'          AS source,
        t.id            AS id,
        t.title         AS title,
        t.description   AS description,
        t.status        AS status,
        t.priority      AS priority,
        t.due_date      AS eventDate,
        NULL            AS type,
        u1.id           AS assigneeId,
        u1.name         AS assigneeName,
        c.id            AS customerId,
        c.name          AS customerName,
        d.id            AS dealId,
        d.title         AS dealTitle,
        NULL            AS remindAt
      FROM Tasks t
      LEFT JOIN Users u1 ON u1.id = t.assigned_to
      LEFT JOIN Customers c ON c.id = t.customer_id
      LEFT JOIN Deals d ON d.id = t.deal_id
      WHERE
        t.status NOT IN ('CANCELLED', 'DONE')
        AND t.due_date BETWEEN @startDate AND @endDate
        ${taskUserClause}
    `);
  }

  if (hasActivities) {
    queryParts.push(`
      -- Meeting activities as calendar events
      SELECT
        'meeting'       AS source,
        a.id            AS id,
        a.type + ': ' + LEFT(${activityTextExpr}, 80) AS title,
        ${activityTextExpr} AS description,
        NULL            AS status,
        NULL            AS priority,
        a.created_at    AS eventDate,
        a.type          AS type,
        ${hasActivityCreatedBy ? 'u2.id' : 'NULL'}           AS assigneeId,
        ${hasActivityCreatedBy ? 'u2.name' : 'NULL'}         AS assigneeName,
        c2.id           AS customerId,
        c2.name         AS customerName,
        ${hasActivityDealId ? 'd2.id' : 'NULL'}           AS dealId,
        ${hasActivityDealId ? 'd2.title' : 'NULL'}        AS dealTitle,
        NULL            AS remindAt
      FROM Activities a
      ${hasActivityCreatedBy ? 'LEFT JOIN Users u2 ON u2.id = a.created_by' : ''}
      LEFT JOIN Customers c2 ON c2.id = a.customer_id
      ${hasActivityDealId ? 'LEFT JOIN Deals d2 ON d2.id = a.deal_id' : ''}
      WHERE
        a.type = 'MEETING'
        AND a.created_at BETWEEN @startDate AND @endDate
        ${actUserClause}
    `);
  }

  if (hasAppointments) {
    queryParts.push(`
      -- Appointments as calendar events
      SELECT
        'appointment' AS source,
        a.id          AS id,
        a.title       AS title,
        a.description AS description,
        a.status      AS status,
        NULL          AS priority,
        a.start_time  AS eventDate,
        a.type AS type,
        u.id          AS assigneeId,
        u.name        AS assigneeName,
        c.id          AS customerId,
        c.name        AS customerName,
        d.id          AS dealId,
        d.title       AS dealTitle,
        a.remind_at   AS remindAt
      FROM Appointments a
      LEFT JOIN Users u ON u.id = a.assigned_to
      LEFT JOIN Customers c ON c.id = a.customer_id
      LEFT JOIN Deals d ON d.id = a.deal_id
      WHERE
        a.status = 'SCHEDULED'
        AND a.start_time BETWEEN @startDate AND @endDate
        ${appointmentUserClause}
    `);
  }

  if (queryParts.length === 0) {
    return [];
  }

  const query = `${queryParts.join('\nUNION ALL\n')}\nORDER BY eventDate ASC`;
  const result = await request.query(query);

  return result.recordset.map((row) => ({
    id: row.id,
    source: row.source,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    type: row.type,
    eventDate: row.eventDate,
    remindAt: row.remindAt || null,
    assignee: row.assigneeId ? { id: row.assigneeId, name: row.assigneeName } : null,
    customer: row.customerId ? { id: row.customerId, name: row.customerName } : null,
    deal: row.dealId ? { id: row.dealId, title: row.dealTitle } : null
  }));
};
