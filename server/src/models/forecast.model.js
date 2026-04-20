import { query } from '../config/db.js';

const BASE = `
  SELECT st.*, owner.name AS "ownerName", owner.email AS "ownerEmail", creator.name AS "creatorName"
  FROM "SalesTargets" st
  INNER JOIN "Users" owner ON owner.id = st.owner_id
  INNER JOIN "Users" creator ON creator.id = st.created_by
`;

const map = (row) => {
  if (!row) return null;
  return {
    id: row.id, ownerId: row.owner_id, targetMonth: row.target_month,
    targetValue: Number(row.target_value || 0), note: row.note,
    createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
    owner: { id: row.owner_id, name: row.ownerName, email: row.ownerEmail },
    creator: { id: row.created_by, name: row.creatorName }
  };
};

export const listSalesTargets = async (where = {}) => {
  const clauses = []; const values = [];
  if (where.ownerId) { clauses.push(`st.owner_id = $${values.length + 1}`); values.push(where.ownerId); }
  if (where.targetMonth) { clauses.push(`st.target_month = $${values.length + 1}`); values.push(where.targetMonth); }
  const w = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const r = await query(`${BASE} ${w} ORDER BY st.target_month DESC`, values);
  return r.rows.map(map);
};

export const findSalesTargetById = async (id) => {
  const r = await query(`${BASE} WHERE st.id = $1`, [id]);
  return map(r.rows[0]);
};

export const createSalesTarget = async (data) => {
  const r = await query(
    `INSERT INTO "SalesTargets" (owner_id,target_month,target_value,note,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [data.ownerId, data.targetMonth, data.targetValue, data.note || null, data.createdBy]
  );
  return findSalesTargetById(r.rows[0].id);
};

export const updateSalesTarget = async (id, data) => {
  const fields = ['updated_at=NOW()']; const values = []; let idx = 1;
  const cols = { ownerId: 'owner_id', targetMonth: 'target_month', targetValue: 'target_value', note: 'note' };
  for (const [k, col] of Object.entries(cols)) {
    if (data[k] !== undefined) { fields.push(`${col}=$${idx++}`); values.push(data[k]); }
  }
  values.push(id);
  await query(`UPDATE "SalesTargets" SET ${fields.join(',')} WHERE id=$${idx}`, values);
  return findSalesTargetById(id);
};

export const deleteSalesTarget = async (id) => {
  await query('DELETE FROM "SalesTargets" WHERE id = $1', [id]);
};

export const listForecastOwners = async () => {
  const r = await query(
    `SELECT DISTINCT u.id, u.name, u.email, u.role FROM "Users" u
     WHERE u.role IN ('ADMIN','MANAGER','SALES') ORDER BY u.name ASC`
  );
  return r.rows;
};

export const getForecastOverview = async ({ ownerId, targetMonth }) => {
  const values = [targetMonth];
  const ownerFilter = ownerId ? `WHERE u.id = $${values.length + 1}` : '';
  if (ownerId) values.push(ownerId);

  const r = await query(`
    SELECT u.id, u.name, u.email, u.role,
      COALESCE(st.target_value, 0) AS target_value,
      COALESCE(won.won_revenue, 0) AS won_revenue,
      COALESCE(pipe.pipeline_value, 0) AS pipeline_value,
      COALESCE(pipe.weighted_forecast, 0) AS weighted_forecast,
      COALESCE(pipe.open_deals, 0) AS open_deals
    FROM "Users" u
    LEFT JOIN "SalesTargets" st ON st.owner_id = u.id AND st.target_month = $1
    LEFT JOIN (
      SELECT owner_id, SUM(CASE WHEN stage='WON' THEN COALESCE(value,0) ELSE 0 END) AS won_revenue
      FROM "Deals" WHERE TO_CHAR(created_at,'YYYY-MM') = $1 GROUP BY owner_id
    ) won ON won.owner_id = u.id
    LEFT JOIN (
      SELECT owner_id, COUNT(*) AS open_deals, SUM(COALESCE(value,0)) AS pipeline_value,
        SUM(CASE WHEN stage='LEAD' THEN COALESCE(value,0)*0.15
                 WHEN stage='CONTACTED' THEN COALESCE(value,0)*0.35
                 WHEN stage='NEGOTIATION' THEN COALESCE(value,0)*0.65
                 WHEN stage='WON' THEN COALESCE(value,0) ELSE 0 END) AS weighted_forecast
      FROM "Deals" WHERE stage <> 'LOST' GROUP BY owner_id
    ) pipe ON pipe.owner_id = u.id
    ${ownerFilter}
    ORDER BY weighted_forecast DESC
  `, values);

  return r.rows.map((row) => {
    const targetValue = Number(row.target_value || 0);
    const wonRevenue = Number(row.won_revenue || 0);
    const weightedForecast = Number(row.weighted_forecast || 0);
    return {
      owner: { id: row.id, name: row.name, email: row.email, role: row.role },
      targetValue, wonRevenue,
      pipelineValue: Number(row.pipeline_value || 0),
      weightedForecast,
      openDeals: Number(row.open_deals || 0),
      gapToTarget: Math.max(0, targetValue - wonRevenue),
      likelyAchievement: targetValue > 0 ? Number((((wonRevenue + weightedForecast) / targetValue) * 100).toFixed(1)) : 0
    };
  });
};
