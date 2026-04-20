import { createRequest, sql } from '../config/sqlserver.js';

const productBaseQuery = `
  SELECT
    p.id,
    p.sku,
    p.name,
    p.category,
    p.unit,
    p.price,
    p.description,
    p.is_active AS isActive,
    p.created_by AS createdBy,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt,
    u.name AS creatorName
  FROM Products p
  INNER JOIN Users u ON u.id = p.created_by
`;

const mapProduct = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    price: Number(row.price),
    description: row.description,
    isActive: Boolean(row.isActive),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    creator: {
      id: row.createdBy,
      name: row.creatorName
    }
  };
};

export const listProducts = async (where = {}) => {
  const request = await createRequest();
  const clauses = [];

  if (where.search) {
    request.input('search', sql.NVarChar(255), `%${where.search}%`);
    clauses.push('(p.name LIKE @search OR p.sku LIKE @search OR ISNULL(p.category, \'\') LIKE @search)');
  }
  if (where.category) {
    request.input('category', sql.NVarChar(120), where.category);
    clauses.push('p.category = @category');
  }
  if (where.isActive !== undefined) {
    request.input('isActive', sql.Bit, where.isActive ? 1 : 0);
    clauses.push('p.is_active = @isActive');
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await request.query(`${productBaseQuery} ${whereSql} ORDER BY p.created_at DESC`);
  return result.recordset.map(mapProduct);
};

export const findProductById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const result = await request.query(`${productBaseQuery} WHERE p.id = @id`);
  return mapProduct(result.recordset[0]);
};

export const createProduct = async (data) => {
  const request = await createRequest();
  request.input('sku', sql.NVarChar(50), data.sku);
  request.input('name', sql.NVarChar(180), data.name);
  request.input('category', sql.NVarChar(120), data.category || null);
  request.input('unit', sql.NVarChar(30), data.unit || 'item');
  request.input('price', sql.Decimal(18, 2), data.price);
  request.input('description', sql.NVarChar(sql.MAX), data.description || null);
  request.input('isActive', sql.Bit, data.isActive === undefined ? 1 : (data.isActive ? 1 : 0));
  request.input('createdBy', sql.Int, data.createdBy);

  const result = await request.query(`
    INSERT INTO Products (sku, name, category, unit, price, description, is_active, created_by)
    OUTPUT INSERTED.id AS id
    VALUES (@sku, @name, @category, @unit, @price, @description, @isActive, @createdBy)
  `);

  return findProductById(result.recordset[0].id);
};

export const updateProduct = async (id, data) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const fields = ['updated_at = GETDATE()'];

  if (data.sku !== undefined) {
    request.input('sku', sql.NVarChar(50), data.sku);
    fields.push('sku = @sku');
  }
  if (data.name !== undefined) {
    request.input('name', sql.NVarChar(180), data.name);
    fields.push('name = @name');
  }
  if (data.category !== undefined) {
    request.input('category', sql.NVarChar(120), data.category || null);
    fields.push('category = @category');
  }
  if (data.unit !== undefined) {
    request.input('unit', sql.NVarChar(30), data.unit);
    fields.push('unit = @unit');
  }
  if (data.price !== undefined) {
    request.input('price', sql.Decimal(18, 2), data.price);
    fields.push('price = @price');
  }
  if (data.description !== undefined) {
    request.input('description', sql.NVarChar(sql.MAX), data.description || null);
    fields.push('description = @description');
  }
  if (data.isActive !== undefined) {
    request.input('isActive', sql.Bit, data.isActive ? 1 : 0);
    fields.push('is_active = @isActive');
  }

  await request.query(`UPDATE Products SET ${fields.join(', ')} WHERE id = @id`);
  return findProductById(id);
};

export const deleteProduct = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Products WHERE id = @id');
};
