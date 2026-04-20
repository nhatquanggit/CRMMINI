import { query } from '../config/db.js';

const BASE = `SELECT s.*, u.name AS "uName" FROM "Segments" s INNER JOIN "Users" u ON u.id = s.created_by`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, name: row.name, description: row.description,
    statusFilter: row.status_filter, sourceFilter: row.source_filter,
    minDeals: row.min_deals === null ? null : Number(row.min_deals),
    minTotalDealValue: row.min_total_deal_value === null ? null : Number(row.min_total_deal_value),
    isVip: row.is_vip, isActive: Boolean(row.is_active),
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
    creator: { id: row.created_by, name: row.uName }
  };
};

export const listSegments = async () => {
  const r = await query(`${BASE} ORDER BY s.created_at DESC`);
  return r.rows.map(map);
};

export const findSegmentById = async (id) => {
  const r = await query(`${BASE} WHERE s.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createSegment = async (data) => {
  const r = await query(
    `INSERT INTO "Segments" (name,description,status_filter,source_filter,min_deals,min_total_deal_value,is_vip,is_active,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [data.name, data.description || null, data.statusFilter || null, data.sourceFilter || null,
     data.minDeals ?? null, data.minTotalDealValue ?? null,
     data.isVip === undefined ? null : data.isVip,
     data.isActive === undefined ? true : data.isActive, data.createdBy]
  );
  return findSegmentById(r.rows[0].id);
};

export const updateSegment = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const cols = { name: 'name', description: 'description', statusFilter: 'status_filter',
    sourceFilter: 'source_filter', minDeals: 'min_deals', minTotalDealValue: 'min_total_deal_value',
    isVip: 'is_vip', isActive: 'is_active' };
  for (const [k, col] of Object.entries(cols)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  values.push(id);
  await query(`UPDATE "Segments" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findSegmentById(id);
};

export const deleteSegment = async (id) => {
  await query('DELETE FROM "Segments" WHERE id = $1', [id]);
};

export const getSegmentMembers = async (segment) => {
  const clauses = ['1=1']; const values = [];
  if (segment.statusFilter) { clauses.push(`c.status = $${values.length + 1}`); values.push(segment.statusFilter); }
  if (segment.sourceFilter) { clauses.push(`COALESCE(c.lead_source,'OTHER') = $${values.length + 1}`); values.push(segment.sourceFilter); }
  if (segment.minDeals != null) { clauses.push(`COALESCE(stats.deal_count,0) >= $${values.length + 1}`); values.push(segment.minDeals); }
  if (segment.minTotalDealValue != null) { clauses.push(`COALESCE(stats.total_deal_value,0) >= $${values.length + 1}`); values.push(segment.minTotalDealValue); }
  if (segment.isVip === true) { clauses.push(`(COALESCE(stats.total_deal_value,0) >= 500000000 OR COALESCE(stats.won_count,0) > 0)`); }
  if (segment.isVip === false) { clauses.push(`(COALESCE(stats.total_deal_value,0) < 500000000 AND COALESCE(stats.won_count,0) = 0)`); }

  const r = await query(`
    SELECT c.id, c.name, c.email, c.phone, c.company, c.status,
      COALESCE(c.lead_source,'OTHER') AS "leadSource", c.created_at AS "createdAt",
      COALESCE(stats.deal_count,0) AS "dealCount",
      COALESCE(stats.total_deal_value,0) AS "totalDealValue",
      COALESCE(stats.won_count,0) AS "wonCount"
    FROM "Customers" c
    LEFT JOIN (
      SELECT customer_id, COUNT(*) AS deal_count,
        SUM(COALESCE(value,0)) AS total_deal_value,
        SUM(CASE WHEN stage='WON' THEN 1 ELSE 0 END) AS won_count
      FROM "Deals" GROUP BY customer_id
    ) stats ON stats.customer_id = c.id
    WHERE ${clauses.join(' AND ')}
    ORDER BY c.created_at DESC
  `, values);

  return r.rows.map((row) => ({
    id: row.id, name: row.name, email: row.email, phone: row.phone,
    company: row.company, status: row.status, leadSource: row.leadSource,
    createdAt: row.createdAt, dealCount: Number(row.dealCount),
    totalDealValue: Number(row.totalDealValue), wonCount: Number(row.wonCount)
  }));
};
