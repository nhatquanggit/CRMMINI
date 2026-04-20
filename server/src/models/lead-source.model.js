import { createRequest, sql } from '../config/sqlserver.js';

export const LEAD_SOURCES = ['WEBSITE', 'FACEBOOK', 'ZALO', 'REFERRAL', 'EVENT', 'ADS', 'OTHER'];

export const getLeadSourceStats = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.assignedTo) {
    request.input('assignedTo', sql.Int, where.assignedTo);
    clauses.push('assigned_to = @assignedTo');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await request.query(`
    SELECT
      lead_source AS source,
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN status = 'CONTACTED' THEN 1 ELSE 0 END) AS contacted,
      SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END) AS newCount
    FROM Customers
    ${whereSql}
    GROUP BY lead_source
  `);

  // Fill missing sources so frontend always has all categories
  const bySource = new Map(result.recordset.map((r) => [r.source || 'OTHER', r]));

  return LEAD_SOURCES.map((source) => {
    const row = bySource.get(source);
    const total = Number(row?.total || 0);
    const converted = Number(row?.converted || 0);
    return {
      source,
      total,
      converted,
      contacted: Number(row?.contacted || 0),
      newCount: Number(row?.newCount || 0),
      conversionRate: total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0
    };
  });
};
