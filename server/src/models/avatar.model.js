import { query } from '../config/db.js';

export const countAvatarsByUserId = async (userId) => {
  const r = await query('SELECT COUNT(*) AS total FROM "Avatars" WHERE user_id = $1', [userId]);
  return Number(r.rows[0]?.total || 0);
};

export const findOldestAvatarByUserId = async (userId) => {
  const r = await query(
    'SELECT id, image_url AS "imageUrl", created_at AS "createdAt" FROM "Avatars" WHERE user_id=$1 ORDER BY created_at ASC LIMIT 1',
    [userId]
  );
  return r.rows[0] || null;
};

export const deleteAvatarById = async (id) => {
  await query('DELETE FROM "Avatars" WHERE id = $1', [id]);
};

export const findLatestAvatarByUserId = async (userId) => {
  const r = await query(
    'SELECT id, image_url AS "imageUrl", created_at AS "createdAt" FROM "Avatars" WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  return r.rows[0] || null;
};

export const createAvatar = async ({ userId, imageUrl }) => {
  const r = await query(
    'INSERT INTO "Avatars" (user_id, image_url) VALUES ($1,$2) RETURNING id, user_id AS "userId", image_url AS "imageUrl", created_at AS "createdAt"',
    [userId, imageUrl]
  );
  return r.rows[0];
};
