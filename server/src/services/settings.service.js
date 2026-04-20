import bcrypt from 'bcryptjs';
import ApiError from '../utils/apiError.js';
import { query, withTransaction } from '../config/db.js';
import { signJwt } from '../utils/jwt.js';
import {
  bumpUserTokenVersionById, findUserByEmail, findUserById,
  findUserWithPasswordById, updateUserPasswordById, updateUserProfileById
} from '../models/user.model.js';

export const updateProfile = async (userId, payload) => {
  const nextEmail = payload.email?.trim();
  if (nextEmail) {
    const existing = await findUserByEmail(nextEmail);
    if (existing && existing.id !== userId) throw new ApiError(409, 'Email already in use');
  }
  await updateUserProfileById(userId, payload);
  return findUserById(userId);
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await findUserWithPasswordById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) throw new ApiError(400, 'Old password is incorrect');
  const hashed = await bcrypt.hash(newPassword, 10);
  await updateUserPasswordById(userId, hashed);
  return { changed: true };
};

export const logoutOtherSessions = async (userId) => {
  const user = await bumpUserTokenVersionById(userId);
  if (!user) throw new ApiError(404, 'User not found');
  return {
    token: signJwt({ userId: user.id, role: user.role, tokenVersion: user.tokenVersion || 0 }),
    user
  };
};

export const deleteOwnAccount = async (userId) => {
  return withTransaction(async (client) => {
    await client.query(`DELETE FROM "Deals" WHERE owner_id=$1 OR customer_id IN (SELECT id FROM "Customers" WHERE assigned_to=$1)`, [userId]);
    await client.query(`DELETE FROM "Activities" WHERE customer_id IN (SELECT id FROM "Customers" WHERE assigned_to=$1)`, [userId]);
    await client.query('DELETE FROM "Avatars" WHERE user_id=$1', [userId]);
    await client.query('DELETE FROM "Customers" WHERE assigned_to=$1', [userId]);
    const r = await client.query('DELETE FROM "Users" WHERE id=$1 RETURNING id', [userId]);
    if (!r.rows[0]) throw new ApiError(404, 'User not found');
    return { deleted: true };
  });
};
