import { query } from '../config/db.js';

export const listCalendarEvents = async (where = {}) => {
  const startDate = where.startDate ? new Date(where.startDate) : new Date();
  const endDate = where.endDate ? new Date(where.endDate) : new Date();
  const values = [startDate, endDate];

  const taskUserClause = where.userId ? `AND t.assigned_to = $${values.length + 1}` : '';
  if (where.userId) values.push(where.userId);

  const apptUserClause = where.userId ? `AND a.assigned_to = $${values.length + 1}` : '';
  if (where.userId) values.push(where.userId);

  const actUserClause = where.userId ? `AND act.created_by = $${values.length + 1}` : '';
  if (where.userId) values.push(where.userId);

  const r = await query(`
    SELECT 'task' AS source, t.id, t.title, t.description, t.status, t.priority,
      t.due_date AS event_date, NULL AS type,
      u1.id AS assignee_id, u1.name AS assignee_name,
      c.id AS customer_id, c.name AS customer_name,
      d.id AS deal_id, d.title AS deal_title, NULL AS remind_at
    FROM "Tasks" t
    LEFT JOIN "Users" u1 ON u1.id = t.assigned_to
    LEFT JOIN "Customers" c ON c.id = t.customer_id
    LEFT JOIN "Deals" d ON d.id = t.deal_id
    WHERE t.status NOT IN ('CANCELLED','DONE') AND t.due_date BETWEEN $1 AND $2 ${taskUserClause}

    UNION ALL

    SELECT 'appointment' AS source, a.id, a.title, a.description, a.status, NULL AS priority,
      a.start_time AS event_date, NULL AS type,
      u2.id AS assignee_id, u2.name AS assignee_name,
      c2.id AS customer_id, c2.name AS customer_name,
      d2.id AS deal_id, d2.title AS deal_title, a.remind_at
    FROM "Appointments" a
    LEFT JOIN "Users" u2 ON u2.id = a.assigned_to
    LEFT JOIN "Customers" c2 ON c2.id = a.customer_id
    LEFT JOIN "Deals" d2 ON d2.id = a.deal_id
    WHERE a.status = 'SCHEDULED' AND a.start_time BETWEEN $1 AND $2 ${apptUserClause}

    UNION ALL

    SELECT 'meeting' AS source, act.id, act.type || ': ' || LEFT(act.content,80) AS title,
      act.content AS description, NULL AS status, NULL AS priority,
      act.created_at AS event_date, act.type,
      u3.id AS assignee_id, u3.name AS assignee_name,
      c3.id AS customer_id, c3.name AS customer_name,
      d3.id AS deal_id, d3.title AS deal_title, NULL AS remind_at
    FROM "Activities" act
    LEFT JOIN "Users" u3 ON u3.id = act.created_by
    LEFT JOIN "Customers" c3 ON c3.id = act.customer_id
    LEFT JOIN "Deals" d3 ON d3.id = act.deal_id
    WHERE act.type = 'MEETING' AND act.created_at BETWEEN $1 AND $2 ${actUserClause}

    ORDER BY event_date ASC
  `, values);

  return r.rows.map((row) => ({
    id: row.id, source: row.source, title: row.title, description: row.description,
    status: row.status, priority: row.priority, type: row.type,
    eventDate: row.event_date, remindAt: row.remind_at || null,
    assignee: row.assignee_id ? { id: row.assignee_id, name: row.assignee_name } : null,
    customer: row.customer_id ? { id: row.customer_id, name: row.customer_name } : null,
    deal: row.deal_id ? { id: row.deal_id, title: row.deal_title } : null
  }));
};
