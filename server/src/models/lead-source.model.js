import { query } from '../config/db.js';

export const LEAD_SOURCES = ['WEBSITE', 'FACEBOOK', 'ZALO', 'REFERRAL', 'EVENT', 'ADS', 'OTHER'];

export const getLeadSourceStats = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.assignedTo) { clauses.push(`assigned_to = $${values.length + 1}`); values.push(where.assignedTo); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const r = await query(`
    SELECT lead_source AS source, COUNT(*) AS total,
      SUM(CASE WHEN status='CONVERTED' THEN 1 ELSE 0 END) AS converted,
      SUM(CASE WHEN status='CONTACTED' THEN 1 ELSE 0 END) AS contacted,
      SUM(CASE WHEN status='NEW' THEN 1 ELSE 0 END) AS new_count
    FROM "Customers" ${w} GROUP BY lead_source
  `, values);

  const bySource = new Map(r.rows.map((row) => [row.source || 'OTHER', row]));
  return LEAD_SOURCES.map((source) => {
    const row = bySource.get(source);
    const total = Number(row?.total || 0);
    const converted = Number(row?.converted || 0);
    return {
      source, total, converted,
      contacted: Number(row?.contacted || 0),
      newCount: Number(row?.new_count || 0),
      conversionRate: total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0
    };
  });
};
