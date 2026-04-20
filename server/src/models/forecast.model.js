import { createRequest, sql } from '../config/sqlserver.js';

const STAGE_WEIGHTS = {
  LEAD: 0.15,
  CONTACTED: 0.35,
  NEGOTIATION: 0.65,
  WON: 1,
  LOST: 0
};

const salesTargetBaseQuery = `
  SELECT
    st.id,
    st.owner_id AS ownerId,
    st.target_month AS targetMonth,
    st.target_value AS targetValue,
    st.note,
    st.created_by AS createdBy,
    st.created_at AS createdAt,
    st.updated_at AS updatedAt,
    owner.name AS ownerName,
    owner.email AS ownerEmail,
    creator.name AS creatorName
  FROM SalesTargets st
  INNER JOIN Users owner ON owner.id = st.owner_id
  INNER JOIN Users creator ON creator.id = st.created_by
`;

const mapTarget = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.ownerId,
    targetMonth: row.targetMonth,
    targetValue: Number(row.targetValue || 0),
    note: row.note,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    owner: {
      id: row.ownerId,
      name: row.ownerName,
      email: row.ownerEmail
    },
    creator: {
      id: row.createdBy,
      name: row.creatorName
    }
  };
};

export const listSalesTargets = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.ownerId) {
    request.input('ownerId', sql.Int, where.ownerId);
    clauses.push('st.owner_id = @ownerId');
  }
  if (where.targetMonth) {
    request.input('targetMonth', sql.Char(7), where.targetMonth);
    clauses.push('st.target_month = @targetMonth');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${salesTargetBaseQuery} ${whereSql} ORDER BY st.target_month DESC, owner.name ASC`);
  return result.recordset.map(mapTarget);
};

export const findSalesTargetById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${salesTargetBaseQuery} WHERE st.id = @id`);
  return mapTarget(result.recordset[0]);
};

export const createSalesTarget = async (data) => {
  const request = await createRequest();
  request.input('ownerId', sql.Int, data.ownerId);
  request.input('targetMonth', sql.Char(7), data.targetMonth);
  request.input('targetValue', sql.Decimal(18, 2), data.targetValue);
  request.input('note', sql.NVarChar(500), data.note || null);
  request.input('createdBy', sql.Int, data.createdBy);

  const result = await request.query(`
    INSERT INTO SalesTargets (owner_id, target_month, target_value, note, created_by)
    OUTPUT INSERTED.id AS id
    VALUES (@ownerId, @targetMonth, @targetValue, @note, @createdBy)
  `);

  return findSalesTargetById(result.recordset[0].id);
};

export const updateSalesTarget = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.ownerId !== undefined) {
    request.input('ownerId', sql.Int, data.ownerId);
    fields.push('owner_id = @ownerId');
  }
  if (data.targetMonth !== undefined) {
    request.input('targetMonth', sql.Char(7), data.targetMonth);
    fields.push('target_month = @targetMonth');
  }
  if (data.targetValue !== undefined) {
    request.input('targetValue', sql.Decimal(18, 2), data.targetValue);
    fields.push('target_value = @targetValue');
  }
  if (data.note !== undefined) {
    request.input('note', sql.NVarChar(500), data.note || null);
    fields.push('note = @note');
  }

  await request.query(`UPDATE SalesTargets SET ${fields.join(', ')} WHERE id = @id`);
  return findSalesTargetById(id);
};

export const deleteSalesTarget = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM SalesTargets WHERE id = @id');
};

export const listForecastOwners = async () => {
  const request = await createRequest();
  const result = await request.query(`
    SELECT DISTINCT
      u.id,
      u.name,
      u.email,
      u.role
    FROM Users u
    LEFT JOIN Deals d ON d.owner_id = u.id
    WHERE u.role IN ('ADMIN', 'MANAGER', 'SALES')
    ORDER BY u.name ASC
  `);

  return result.recordset.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role
  }));
};

export const getForecastOverview = async ({ ownerId, targetMonth }) => {
  const request = await createRequest();
  request.input('targetMonth', sql.Char(7), targetMonth);
  const filters = [];

  if (ownerId) {
    request.input('ownerId', sql.Int, ownerId);
    filters.push('u.id = @ownerId');
  }

  const whereSql = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const result = await request.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      ISNULL(st.target_value, 0) AS targetValue,
      ISNULL(won.monthWonRevenue, 0) AS wonRevenue,
      ISNULL(openPipeline.pipelineValue, 0) AS pipelineValue,
      ISNULL(openPipeline.weightedForecast, 0) AS weightedForecast,
      ISNULL(openPipeline.openDeals, 0) AS openDeals
    FROM Users u
    LEFT JOIN SalesTargets st ON st.owner_id = u.id AND st.target_month = @targetMonth
    LEFT JOIN (
      SELECT
        owner_id AS ownerId,
        SUM(CASE WHEN stage = 'WON' THEN ISNULL(value, 0) ELSE 0 END) AS monthWonRevenue
      FROM Deals
      WHERE CONVERT(char(7), created_at, 126) = @targetMonth
      GROUP BY owner_id
    ) won ON won.ownerId = u.id
    LEFT JOIN (
      SELECT
        owner_id AS ownerId,
        COUNT(*) AS openDeals,
        SUM(ISNULL(value, 0)) AS pipelineValue,
        SUM(
          CASE
            WHEN stage = 'LEAD' THEN ISNULL(value, 0) * 0.15
            WHEN stage = 'CONTACTED' THEN ISNULL(value, 0) * 0.35
            WHEN stage = 'NEGOTIATION' THEN ISNULL(value, 0) * 0.65
            WHEN stage = 'WON' THEN ISNULL(value, 0) * 1
            ELSE 0
          END
        ) AS weightedForecast
      FROM Deals
      WHERE stage <> 'LOST'
      GROUP BY owner_id
    ) openPipeline ON openPipeline.ownerId = u.id
    ${whereSql}
    ORDER BY weightedForecast DESC, targetValue DESC, u.name ASC
  `);

  return result.recordset.map((row) => {
    const targetValue = Number(row.targetValue || 0);
    const wonRevenue = Number(row.wonRevenue || 0);
    const pipelineValue = Number(row.pipelineValue || 0);
    const weightedForecast = Number(row.weightedForecast || 0);
    const gapToTarget = Math.max(0, targetValue - wonRevenue);
    const likelyAchievement = targetValue > 0 ? Number((((wonRevenue + weightedForecast) / targetValue) * 100).toFixed(1)) : 0;

    return {
      owner: {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role
      },
      targetValue,
      wonRevenue,
      pipelineValue,
      weightedForecast,
      openDeals: Number(row.openDeals || 0),
      gapToTarget,
      likelyAchievement,
      stageWeights: STAGE_WEIGHTS
    };
  });
};
