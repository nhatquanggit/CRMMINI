import { createRequest, sql } from '../config/sqlserver.js';

const isAdmin = (user) => user.role === 'ADMIN';

const DEAL_STAGES = ['LEAD', 'CONTACTED', 'NEGOTIATION', 'WON', 'LOST'];

export const getDashboardSummary = async (currentUser) => {
  const dealCondition = isAdmin(currentUser) ? '' : ' WHERE owner_id = @userId';
  const customerCondition = isAdmin(currentUser) ? '' : ' WHERE assigned_to = @userId';

  const countCustomersRequest = await createRequest();
  const countDealsRequest = await createRequest();
  const revenueRequest = await createRequest();

  if (!isAdmin(currentUser)) {
    countCustomersRequest.input('userId', sql.Int, currentUser.id);
    countDealsRequest.input('userId', sql.Int, currentUser.id);
    revenueRequest.input('userId', sql.Int, currentUser.id);
  }

  const [customerResult, dealResult, revenueResult] = await Promise.all([
    countCustomersRequest.query(`SELECT COUNT(*) AS total FROM Customers${customerCondition}`),
    countDealsRequest.query(`SELECT COUNT(*) AS total FROM Deals${dealCondition}`),
    revenueRequest.query(
      `SELECT ISNULL(SUM(CAST(value AS DECIMAL(18, 2))), 0) AS revenue FROM Deals${
        dealCondition ? `${dealCondition} AND stage = 'WON'` : " WHERE stage = 'WON'"
      }`
    )
  ]);

  return {
    totalCustomers: customerResult.recordset[0]?.total || 0,
    totalDeals: dealResult.recordset[0]?.total || 0,
    totalRevenue: Number(revenueResult.recordset[0]?.revenue || 0)
  };
};

export const getRevenueByMonth = async (currentUser) => {
  const request = await createRequest();

  if (!isAdmin(currentUser)) {
    request.input('userId', sql.Int, currentUser.id);
  }

  const result = await request.query(`
    SELECT
      CONVERT(char(7), created_at, 126) AS month,
      ISNULL(SUM(CAST(value AS DECIMAL(18, 2))), 0) AS revenue
    FROM Deals
    WHERE stage = 'WON' ${isAdmin(currentUser) ? '' : 'AND owner_id = @userId'}
    GROUP BY CONVERT(char(7), created_at, 126)
    ORDER BY month
  `);

  return result.recordset.map((item) => ({
    month: item.month,
    revenue: Number(item.revenue)
  }));
};

export const getDealStatusBreakdown = async (currentUser) => {
  const request = await createRequest();

  if (!isAdmin(currentUser)) {
    request.input('userId', sql.Int, currentUser.id);
  }

  const result = await request.query(`
    SELECT
      stage AS status,
      COUNT(*) AS total
    FROM Deals
    ${isAdmin(currentUser) ? '' : 'WHERE owner_id = @userId'}
    GROUP BY stage
  `);

  const counts = new Map(result.recordset.map((row) => [row.status, row.total]));
  return DEAL_STAGES.map((status) => ({ status, total: counts.get(status) || 0 }));
};

export const getRecentActivities = async (currentUser, limit = 8) => {
  const schemaRequest = await createRequest();
  const schemaResult = await schemaRequest.query(`
    SELECT
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'content') IS NOT NULL THEN 1 ELSE 0 END AS hasContent,
      CASE WHEN OBJECT_ID('Activities', 'U') IS NOT NULL AND COL_LENGTH('Activities', 'note') IS NOT NULL THEN 1 ELSE 0 END AS hasNote
  `);
  const schema = schemaResult.recordset[0] || {};
  const hasContent = Boolean(schema.hasContent);
  const hasNote = Boolean(schema.hasNote);
  const activityTextExpr = hasContent
    ? 'a.content'
    : hasNote
      ? 'a.note'
      : "''";

  const request = await createRequest();
  request.input('limit', sql.Int, limit);

  if (!isAdmin(currentUser)) {
    request.input('userId', sql.Int, currentUser.id);
  }

  const result = await request.query(`
    WITH unified AS (
      SELECT
        a.created_at AS createdAt,
        a.type AS type,
        ${activityTextExpr} AS description
      FROM Activities a
      INNER JOIN Customers c ON c.id = a.customer_id
      ${isAdmin(currentUser) ? '' : 'WHERE c.assigned_to = @userId'}

      UNION ALL

      SELECT
        d.created_at AS createdAt,
        'DEAL_CREATED' AS type,
        CONCAT('Tao deal: ', d.title, ' (', c.name, ')') AS description
      FROM Deals d
      INNER JOIN Customers c ON c.id = d.customer_id
      ${isAdmin(currentUser) ? '' : 'WHERE d.owner_id = @userId'}
    )
    SELECT TOP (@limit)
      createdAt,
      type,
      description
    FROM unified
    ORDER BY createdAt DESC
  `);

  return result.recordset.map((row) => ({
    type: row.type,
    description: row.description,
    createdAt: row.createdAt
  }));
};

export const getDashboardOverview = async (currentUser) => {
  const [summary, revenueByMonth, dealStatus, activities] = await Promise.all([
    getDashboardSummary(currentUser),
    getRevenueByMonth(currentUser),
    getDealStatusBreakdown(currentUser),
    getRecentActivities(currentUser, 8)
  ]);

  return {
    ...summary,
    revenueByMonth,
    dealStatus,
    activities
  };
};
