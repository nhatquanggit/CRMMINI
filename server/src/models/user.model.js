import { query } from '../config/db.js';

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    tokenVersion: row.token_version,
    createdAt: row.created_at
  };
};

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM "Users" WHERE email = $1 LIMIT 1', [email]);
  return mapUser(result.rows[0]);
};

export const findUserById = async (id) => {
  const result = await query(
    'SELECT id, name, email, phone, role, token_version, created_at FROM "Users" WHERE id = $1 LIMIT 1',
    [id]
  );
  return mapUser(result.rows[0]);
};

export const findUserWithPasswordById = async (id) => {
  const result = await query('SELECT * FROM "Users" WHERE id = $1 LIMIT 1', [id]);
  return mapUser(result.rows[0]);
};

export const updateUserProfileById = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.name !== undefined) { fields.push(`name = $${idx++}`); values.push(payload.name); }
  if (payload.email !== undefined) { fields.push(`email = $${idx++}`); values.push(payload.email); }
  if (payload.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(payload.phone || null); }

  if (fields.length) {
    values.push(id);
    await query(`UPDATE "Users" SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  }
};

export const updateUserPasswordById = async (id, password) => {
  await query('UPDATE "Users" SET password = $1 WHERE id = $2', [password, id]);
};

export const bumpUserTokenVersionById = async (id) => {
  const result = await query(
    'UPDATE "Users" SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1 RETURNING id, name, email, phone, role, token_version, created_at',
    [id]
  );
  return mapUser(result.rows[0]);
};

export const createUser = async (data) => {
  const result = await query(
    'INSERT INTO "Users" (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.name, data.email, data.phone || null, data.password, data.role || 'SALES']
  );
  return mapUser(result.rows[0]);
};
