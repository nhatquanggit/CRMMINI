import bcrypt from 'bcryptjs';
import ApiError from '../utils/apiError.js';
import { getPool, sql } from '../config/sqlserver.js';
import { signJwt } from '../utils/jwt.js';
import {
  bumpUserTokenVersionById,
  findUserByEmail,
  findUserById,
  findUserWithPasswordById,
  updateUserPasswordById,
  updateUserProfileById
} from '../models/user.model.js';

export const updateProfile = async (userId, payload) => {
  const nextEmail = payload.email?.trim();

  if (nextEmail) {
    const existing = await findUserByEmail(nextEmail);
    if (existing && existing.id !== userId) {
      throw new ApiError(409, 'Email already in use');
    }
  }

  await updateUserProfileById(userId, payload);
  return findUserById(userId);
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await findUserWithPasswordById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) {
    throw new ApiError(400, 'Old password is incorrect');
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPasswordById(userId, hashed);

  return { changed: true };
};

export const logoutOtherSessions = async (userId) => {
  const user = await bumpUserTokenVersionById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return {
    token: signJwt({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion || 0 }),
    user
  };
};

export const deleteOwnAccount = async (userId) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    const request = new sql.Request(transaction);
    request.input('userId', sql.Int, userId);

    await request.query(`
      DELETE FROM Deals
      WHERE owner_id = @userId
         OR customer_id IN (SELECT id FROM Customers WHERE assigned_to = @userId)
    `);

    await request.query(`
      DELETE FROM Activities
      WHERE customer_id IN (SELECT id FROM Customers WHERE assigned_to = @userId)
    `);

    await request.query('DELETE FROM Avatars WHERE user_id = @userId');
    await request.query('DELETE FROM Customers WHERE assigned_to = @userId');

    const result = await request.query('DELETE FROM Users OUTPUT DELETED.id AS id WHERE id = @userId');

    if (!result.recordset[0]) {
      throw new ApiError(404, 'User not found');
    }

    await transaction.commit();
    return { deleted: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
