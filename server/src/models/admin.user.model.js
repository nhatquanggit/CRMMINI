import { createRequest, sql } from '../config/sqlserver.js';

const SAFE_ROLES = ['ADMIN', 'MANAGER', 'SALES'];

const hasUsersIsActiveColumn = async () => {
  const request = await createRequest();
  const result = await request.query(`
    SELECT COL_LENGTH('Users', 'is_active') AS colLen
  `);
  return Boolean(result.recordset[0]?.colLen);
};

const mapUserPublic = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  isActive: row.isActive === undefined ? true : Boolean(row.isActive),
  createdAt: row.createdAt
});

/**
 * List all users with optional filters: role, search, isActive
 */
export const listUsers = async (where = {}) => {
  const hasIsActive = await hasUsersIsActiveColumn();
  const request = await createRequest();
  const conditions = ['1=1'];

  if (where.role && SAFE_ROLES.includes(where.role)) {
    request.input('role', sql.NVarChar(20), where.role);
    conditions.push('role = @role');
  }

  if (where.search) {
    request.input('search', sql.NVarChar(255), `%${where.search}%`);
    conditions.push('(name LIKE @search OR email LIKE @search)');
  }

  if (where.isActive !== undefined && hasIsActive) {
    const activeVal = where.isActive === 'true' || where.isActive === true ? 1 : 0;
    request.input('isActive', sql.Bit, activeVal);
    conditions.push('is_active = @isActive');
  }

  const whereClause = conditions.join(' AND ');
  const isActiveExpr = hasIsActive ? 'ISNULL(is_active, 1)' : 'CAST(1 AS BIT)';

  const result = await request.query(`
    SELECT
      id,
      name,
      email,
      phone,
      role,
      ${isActiveExpr} AS isActive,
      created_at AS createdAt
    FROM Users
    WHERE ${whereClause}
    ORDER BY created_at DESC
  `);

  return result.recordset.map(mapUserPublic);
};

/**
 * Get single user (public fields, no password)
 */
export const getUserById = async (id) => {
  const hasIsActive = await hasUsersIsActiveColumn();
  const request = await createRequest();
  request.input('id', sql.Int, id);
  const isActiveExpr = hasIsActive ? 'ISNULL(is_active, 1)' : 'CAST(1 AS BIT)';

  const result = await request.query(`
    SELECT
      id, name, email, phone, role,
      ${isActiveExpr} AS isActive,
      created_at AS createdAt
    FROM Users
    WHERE id = @id
  `);

  return result.recordset[0] ? mapUserPublic(result.recordset[0]) : null;
};

/**
 * Update role for a user (ADMIN only)
 */
export const updateUserRole = async (id, role) => {
  const hasIsActive = await hasUsersIsActiveColumn();
  if (!SAFE_ROLES.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const request = await createRequest();
  request.input('id', sql.Int, id);
  request.input('role', sql.NVarChar(20), role);
  const isActiveExpr = hasIsActive ? 'ISNULL(INSERTED.is_active, 1)' : 'CAST(1 AS BIT)';

  const result = await request.query(`
    UPDATE Users
    SET role = @role
    OUTPUT
      INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone,
      INSERTED.role, ${isActiveExpr} AS isActive,
      INSERTED.created_at AS createdAt
    WHERE id = @id
  `);

  return result.recordset[0] ? mapUserPublic(result.recordset[0]) : null;
};

/**
 * Activate or deactivate a user (ADMIN only)
 */
export const setUserActive = async (id, isActive) => {
  const hasIsActive = await hasUsersIsActiveColumn();
  if (!hasIsActive) {
    throw new Error('Users.is_active column does not exist. Please run migration 004_migrate_rbac.sql first.');
  }

  const request = await createRequest();
  request.input('id', sql.Int, id);
  request.input('isActive', sql.Bit, isActive ? 1 : 0);

  const result = await request.query(`
    UPDATE Users
    SET is_active = @isActive
    OUTPUT
      INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone,
      INSERTED.role, ISNULL(INSERTED.is_active, 1) AS isActive,
      INSERTED.created_at AS createdAt
    WHERE id = @id
  `);

  return result.recordset[0] ? mapUserPublic(result.recordset[0]) : null;
};

/**
 * Hard-delete a user (ADMIN only, cannot delete self)
 * Callers must ensure business logic (can't delete self) before calling.
 */
export const deleteUserById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);

  const result = await request.query(`
    DELETE FROM Users
    OUTPUT DELETED.id, DELETED.name, DELETED.email
    WHERE id = @id
  `);

  return result.recordset[0] || null;
};

/**
 * Count how many ADMINs still exist (to prevent removing the last admin)
 */
export const countAdmins = async () => {
  const hasIsActive = await hasUsersIsActiveColumn();
  const request = await createRequest();
  const activeClause = hasIsActive ? 'AND ISNULL(is_active, 1) = 1' : '';
  const result = await request.query(`
    SELECT COUNT(*) AS cnt FROM Users WHERE role = 'ADMIN' ${activeClause}
  `);
  return result.recordset[0]?.cnt || 0;
};
