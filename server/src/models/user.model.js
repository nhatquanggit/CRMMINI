import { createRequest, sql } from '../config/sqlserver.js';

const mapUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    tokenVersion: row.tokenVersion,
    createdAt: row.createdAt
  };
};

export const findUserByEmail = async (email) => {
  const request = await createRequest();
  request.input('email', sql.NVarChar(255), email);

  const result = await request.query(`
    SELECT TOP 1
      id,
      name,
      email,
      phone,
      password,
      role,
      token_version AS tokenVersion,
      created_at AS createdAt
    FROM Users
    WHERE email = @email
  `);

  return mapUser(result.recordset[0]);
};

export const findUserById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);

  const result = await request.query(`
    SELECT TOP 1
      id,
      name,
      email,
      phone,
      role,
      token_version AS tokenVersion,
      created_at AS createdAt
    FROM Users
    WHERE id = @id
  `);

  const user = result.recordset[0];
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tokenVersion: user.tokenVersion,
        createdAt: user.createdAt
      }
    : null;
};

export const findUserWithPasswordById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);

  const result = await request.query(`
    SELECT TOP 1
      id,
      name,
      email,
      phone,
      password,
      role,
      token_version AS tokenVersion,
      created_at AS createdAt
    FROM Users
    WHERE id = @id
  `);

  return mapUser(result.recordset[0]);
};

export const updateUserProfileById = async (id, payload) => {
  const fields = [];
  const request = await createRequest();
  request.input('id', sql.Int, id);

  if (payload.name !== undefined) {
    request.input('name', sql.NVarChar(120), payload.name);
    fields.push('name = @name');
  }

  if (payload.email !== undefined) {
    request.input('email', sql.NVarChar(255), payload.email);
    fields.push('email = @email');
  }

  if (payload.phone !== undefined) {
    request.input('phone', sql.NVarChar(30), payload.phone || null);
    fields.push('phone = @phone');
  }

  if (fields.length) {
    await request.query(`UPDATE Users SET ${fields.join(', ')} WHERE id = @id`);
  }
};

export const updateUserPasswordById = async (id, password) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  request.input('password', sql.NVarChar(255), password);

  await request.query('UPDATE Users SET password = @password WHERE id = @id');
};

export const bumpUserTokenVersionById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);

  const result = await request.query(`
    UPDATE Users
    SET token_version = ISNULL(token_version, 0) + 1
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.phone, INSERTED.role, INSERTED.token_version AS tokenVersion, INSERTED.created_at AS createdAt
    WHERE id = @id
  `);

  return result.recordset[0] || null;
};

export const createUser = async (data) => {
  const request = await createRequest();
  request.input('name', sql.NVarChar(120), data.name);
  request.input('email', sql.NVarChar(255), data.email);
  request.input('phone', sql.NVarChar(30), data.phone || null);
  request.input('password', sql.NVarChar(255), data.password);
  request.input('role', sql.NVarChar(20), data.role);

  const result = await request.query(`
    INSERT INTO Users (name, email, phone, password, role)
    OUTPUT
      INSERTED.id,
      INSERTED.name,
      INSERTED.email,
      INSERTED.phone,
      INSERTED.password,
      INSERTED.role,
      INSERTED.token_version AS tokenVersion,
      INSERTED.created_at AS createdAt
    VALUES (@name, @email, @phone, @password, @role)
  `);

  return mapUser(result.recordset[0]);
};
