import { query } from '../config/db.js';

const SAFE_ROLES = ['ADMIN', 'MANAGER', 'SALES'];

const map = (row) => ({
  id: row.id, name: row.name, email: row.email, phone: row.phone,
  role: row.role, isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  createdAt: row.created_at
});

export const listUsers = async (where = {}) => {
  const clauses = ['1=1']; const values = [];
  if (where.role && SAFE_ROLES.includes(where.role)) { clauses.push(`role = $${values.length + 1}`); values.push(where.role); }
  if (where.search) { clauses.push(`(name ILIKE $${values.length + 1} OR email ILIKE $${values.length + 1})`); values.push(`%${where.search}%`); }
  const r = await query(
    `SELECT id,name,email,phone,role,COALESCE(is_active,true) AS is_active,created_at FROM "Users" WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`,
    values
  );
  return r.rows.map(map);
};

export const getUserById = async (id) => {
  const r = await query(
    `SELECT id,name,email,phone,role,COALESCE(is_active,true) AS is_active,created_at FROM "Users" WHERE id = $1`, [id]
  );
  return r.rows[0] ? map(r.rows[0]) : null;
};

export const updateUserRole = async (id, role) => {
  if (!SAFE_ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
  const r = await query(
    `UPDATE "Users" SET role=$1 WHERE id=$2 RETURNING id,name,email,phone,role,COALESCE(is_active,true) AS is_active,created_at`,
    [role, id]
  );
  return r.rows[0] ? map(r.rows[0]) : null;
};

export const setUserActive = async (id, isActive) => {
  const r = await query(
    `UPDATE "Users" SET is_active=$1 WHERE id=$2 RETURNING id,name,email,phone,role,COALESCE(is_active,true) AS is_active,created_at`,
    [isActive, id]
  );
  return r.rows[0] ? map(r.rows[0]) : null;
};

export const deleteUserById = async (id) => {
  const r = await query('DELETE FROM "Users" WHERE id=$1 RETURNING id,name,email', [id]);
  return r.rows[0] || null;
};

export const countAdmins = async () => {
  const r = await query(`SELECT COUNT(*) AS cnt FROM "Users" WHERE role='ADMIN' AND COALESCE(is_active,true)=true`);
  return Number(r.rows[0]?.cnt || 0);
};
