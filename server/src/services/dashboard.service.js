import { query } from '../config/db.js';

const isAdmin = (user) => user.role === 'ADMIN';
const DEAL_STAGES = ['LEAD', 'CONTACTED', 'NEGOTIATION', 'WON', 'LOST'];

export const getDashboardSummary = async (currentUser) => {
  const adminMode = isAdmin(currentUser);
  const values = adminMode ? [] : [currentUser.id];
  const cWhere = adminMode ? '' : 'WHERE assigned_to = $1';
  const dWhere = adminMode ? '' : 'WHERE owner_id = $1';
  const rWhere = adminMode ? "WHERE stage='WON'" : "WHERE owner_id=$1 AND stage='WON'";

  const [cRes, dRes, rRes] = await Promise.all([
    query(`SELECT COUNT(*) AS total FROM "Customers" ${cWhere}`, values),
    query(`SELECT COUNT(*) AS total FROM "Deals" ${dWhere}`, values),
    query(`SELECT COALESCE(SUM(value::numeric),0) AS revenue FROM "Deals" ${rWhere}`, values)
  ]);

  return {
    totalCustomers: Number(cRes.rows[0]?.total || 0),
    totalDeals: Number(dRes.rows[0]?.total || 0),
    totalRevenue: Number(rRes.rows[0]?.revenue || 0)
  };
};

export const getRevenueByMonth = async (currentUser) => {
  const adminMode = isAdmin(currentUser);
  const values = adminMode ? [] : [currentUser.id];
  const w = adminMode ? "WHERE stage='WON'" : "WHERE stage='WON' AND owner_id=$1";
  const r = await query(
    `SELECT TO_CHAR(created_at,'YYYY-MM') AS month, COALESCE(SUM(value::numeric),0) AS revenue
     FROM "Deals" ${w} GROUP BY month ORDER BY month`,
    values
  );
  return r.rows.map((row) => ({ month: row.month, revenue: Number(row.revenue) }));
};

export const getDealStatusBreakdown = async (currentUser) => {
  const adminMode = isAdmin(currentUser);
  const values = adminMode ? [] : [currentUser.id];
  const w = adminMode ? '' : 'WHERE owner_id=$1';
  const r = await query(`SELECT stage AS status, COUNT(*) AS total FROM "Deals" ${w} GROUP BY stage`, values);
  const counts = new Map(r.rows.map((row) => [row.status, Number(row.total)]));
  return DEAL_STAGES.map((status) => ({ status, total: counts.get(status) || 0 }));
};

export const getRecentActivities = async (currentUser, limit = 8) => {
  const adminMode = isAdmin(currentUser);

  if (adminMode) {
    const r = await query(`
      SELECT * FROM (
        SELECT a.created_at, a.type, a.content AS description
        FROM "Activities" a INNER JOIN "Customers" c ON c.id = a.customer_id
        UNION ALL
        SELECT d.created_at, 'DEAL_CREATED' AS type, CONCAT('Tạo deal: ', d.title, ' (', c.name, ')') AS description
        FROM "Deals" d INNER JOIN "Customers" c ON c.id = d.customer_id
      ) unified ORDER BY created_at DESC LIMIT $1
    `, [limit]);
    return r.rows.map((row) => ({ type: row.type, description: row.description, createdAt: row.created_at }));
  }

  const r = await query(`
    SELECT * FROM (
      SELECT a.created_at, a.type, a.content AS description
      FROM "Activities" a INNER JOIN "Customers" c ON c.id = a.customer_id
      WHERE c.assigned_to = $2
      UNION ALL
      SELECT d.created_at, 'DEAL_CREATED' AS type, CONCAT('Tạo deal: ', d.title, ' (', c.name, ')') AS description
      FROM "Deals" d INNER JOIN "Customers" c ON c.id = d.customer_id
      WHERE d.owner_id = $2
    ) unified ORDER BY created_at DESC LIMIT $1
  `, [limit, currentUser.id]);

  return r.rows.map((row) => ({ type: row.type, description: row.description, createdAt: row.created_at }));
};

export const getDashboardOverview = async (currentUser) => {
  const [summary, revenueByMonth, dealStatus, activities] = await Promise.all([
    getDashboardSummary(currentUser),
    getRevenueByMonth(currentUser),
    getDealStatusBreakdown(currentUser),
    getRecentActivities(currentUser, 8)
  ]);
  return { ...summary, revenueByMonth, dealStatus, activities };
};
