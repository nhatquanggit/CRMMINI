import { createRequest, sql } from '../config/sqlserver.js';

const segmentBaseQuery = `
  SELECT
    s.id,
    s.name,
    s.description,
    s.status_filter AS statusFilter,
    s.source_filter AS sourceFilter,
    s.min_deals AS minDeals,
    s.min_total_deal_value AS minTotalDealValue,
    s.is_vip AS isVip,
    s.is_active AS isActive,
    s.created_by AS createdBy,
    s.created_at AS createdAt,
    s.updated_at AS updatedAt,
    u.name AS creatorName
  FROM Segments s
  INNER JOIN Users u ON u.id = s.created_by
`;

const mapSegment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    statusFilter: row.statusFilter,
    sourceFilter: row.sourceFilter,
    minDeals: row.minDeals === null ? null : Number(row.minDeals),
    minTotalDealValue: row.minTotalDealValue === null ? null : Number(row.minTotalDealValue),
    isVip: row.isVip === null ? null : Boolean(row.isVip),
    isActive: Boolean(row.isActive),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creator: { id: row.createdBy, name: row.creatorName }
  };
};

export const listSegments = async () => {
  const request = await createRequest();
  const result = await request.query(`${segmentBaseQuery} ORDER BY s.created_at DESC`);
  return result.recordset.map(mapSegment);
};

export const findSegmentById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${segmentBaseQuery} WHERE s.id = @id`);
  return mapSegment(result.recordset[0]);
};

export const createSegment = async (data) => {
  const request = await createRequest();
  request.input('name', sql.NVarChar(120), data.name);
  request.input('description', sql.NVarChar(500), data.description || null);
  request.input('statusFilter', sql.NVarChar(20), data.statusFilter || null);
  request.input('sourceFilter', sql.NVarChar(30), data.sourceFilter || null);
  request.input('minDeals', sql.Int, data.minDeals ?? null);
  request.input('minTotalDealValue', sql.Decimal(18, 2), data.minTotalDealValue ?? null);
  request.input('isVip', sql.Bit, data.isVip === undefined ? null : (data.isVip ? 1 : 0));
  request.input('isActive', sql.Bit, data.isActive === undefined ? 1 : (data.isActive ? 1 : 0));
  request.input('createdBy', sql.Int, data.createdBy);

  const result = await request.query(`
    INSERT INTO Segments (name, description, status_filter, source_filter, min_deals, min_total_deal_value, is_vip, is_active, created_by)
    OUTPUT INSERTED.id AS id
    VALUES (@name, @description, @statusFilter, @sourceFilter, @minDeals, @minTotalDealValue, @isVip, @isActive, @createdBy)
  `);

  return findSegmentById(result.recordset[0].id);
};

export const updateSegment = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.name !== undefined) {
    request.input('name', sql.NVarChar(120), data.name);
    fields.push('name = @name');
  }
  if (data.description !== undefined) {
    request.input('description', sql.NVarChar(500), data.description || null);
    fields.push('description = @description');
  }
  if (data.statusFilter !== undefined) {
    request.input('statusFilter', sql.NVarChar(20), data.statusFilter || null);
    fields.push('status_filter = @statusFilter');
  }
  if (data.sourceFilter !== undefined) {
    request.input('sourceFilter', sql.NVarChar(30), data.sourceFilter || null);
    fields.push('source_filter = @sourceFilter');
  }
  if (data.minDeals !== undefined) {
    request.input('minDeals', sql.Int, data.minDeals ?? null);
    fields.push('min_deals = @minDeals');
  }
  if (data.minTotalDealValue !== undefined) {
    request.input('minTotalDealValue', sql.Decimal(18, 2), data.minTotalDealValue ?? null);
    fields.push('min_total_deal_value = @minTotalDealValue');
  }
  if (data.isVip !== undefined) {
    request.input('isVip', sql.Bit, data.isVip === null ? null : (data.isVip ? 1 : 0));
    fields.push('is_vip = @isVip');
  }
  if (data.isActive !== undefined) {
    request.input('isActive', sql.Bit, data.isActive ? 1 : 0);
    fields.push('is_active = @isActive');
  }

  await request.query(`UPDATE Segments SET ${fields.join(', ')} WHERE id = @id`);
  return findSegmentById(id);
};

export const deleteSegment = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Segments WHERE id = @id');
};

export const getSegmentMembers = async (segment) => {
  const request = await createRequest();
  const clauses = ['1=1'];

  if (segment.statusFilter) {
    request.input('statusFilter', sql.NVarChar(20), segment.statusFilter);
    clauses.push('c.status = @statusFilter');
  }

  if (segment.sourceFilter) {
    request.input('sourceFilter', sql.NVarChar(30), segment.sourceFilter);
    clauses.push('ISNULL(c.lead_source, \'OTHER\') = @sourceFilter');
  }

  if (segment.isVip !== null && segment.isVip !== undefined) {
    request.input('isVip', sql.Bit, segment.isVip ? 1 : 0);
    // VIP heuristic: has won deal or total deal value >= 500m
    if (segment.isVip) {
      clauses.push('(ISNULL(stats.totalDealValue, 0) >= 500000000 OR ISNULL(stats.wonCount, 0) > 0)');
    } else {
      clauses.push('(ISNULL(stats.totalDealValue, 0) < 500000000 AND ISNULL(stats.wonCount, 0) = 0)');
    }
  }

  if (segment.minDeals !== null && segment.minDeals !== undefined) {
    request.input('minDeals', sql.Int, segment.minDeals);
    clauses.push('ISNULL(stats.dealCount, 0) >= @minDeals');
  }

  if (segment.minTotalDealValue !== null && segment.minTotalDealValue !== undefined) {
    request.input('minTotalDealValue', sql.Decimal(18, 2), segment.minTotalDealValue);
    clauses.push('ISNULL(stats.totalDealValue, 0) >= @minTotalDealValue');
  }

  const whereSql = clauses.join(' AND ');

  const result = await request.query(`
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c.company,
      c.status,
      ISNULL(c.lead_source, 'OTHER') AS leadSource,
      c.created_at AS createdAt,
      ISNULL(stats.dealCount, 0) AS dealCount,
      ISNULL(stats.totalDealValue, 0) AS totalDealValue,
      ISNULL(stats.wonCount, 0) AS wonCount
    FROM Customers c
    LEFT JOIN (
      SELECT
        d.customer_id AS customerId,
        COUNT(*) AS dealCount,
        SUM(ISNULL(d.value, 0)) AS totalDealValue,
        SUM(CASE WHEN d.stage = 'WON' THEN 1 ELSE 0 END) AS wonCount
      FROM Deals d
      GROUP BY d.customer_id
    ) stats ON stats.customerId = c.id
    WHERE ${whereSql}
    ORDER BY c.created_at DESC
  `);

  return result.recordset.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    company: r.company,
    status: r.status,
    leadSource: r.leadSource,
    createdAt: r.createdAt,
    dealCount: Number(r.dealCount || 0),
    totalDealValue: Number(r.totalDealValue || 0),
    wonCount: Number(r.wonCount || 0)
  }));
};
