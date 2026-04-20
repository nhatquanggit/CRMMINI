import { createRequest, sql } from '../config/sqlserver.js';

export const countAvatarsByUserId = async (userId) => {
  const request = await createRequest();
  request.input('userId', sql.Int, userId);

  const result = await request.query(`
    SELECT COUNT(*) AS total
    FROM Avatars
    WHERE user_id = @userId
  `);

  return result.recordset[0]?.total || 0;
};

export const findOldestAvatarByUserId = async (userId) => {
  const request = await createRequest();
  request.input('userId', sql.Int, userId);

  const result = await request.query(`
    SELECT TOP 1
      id,
      image_url AS imageUrl,
      created_at AS createdAt
    FROM Avatars
    WHERE user_id = @userId
    ORDER BY created_at ASC
  `);

  return result.recordset[0] || null;
};

export const deleteAvatarById = async (id) => {
  const request = await createRequest();
  request.input('id', sql.Int, id);
  await request.query('DELETE FROM Avatars WHERE id = @id');
};

export const findLatestAvatarByUserId = async (userId) => {
  const request = await createRequest();
  request.input('userId', sql.Int, userId);

  const result = await request.query(`
    SELECT TOP 1
      id,
      image_url AS imageUrl,
      created_at AS createdAt
    FROM Avatars
    WHERE user_id = @userId
    ORDER BY created_at DESC
  `);

  return result.recordset[0] || null;
};

export const createAvatar = async ({ userId, imageUrl }) => {
  const request = await createRequest();
  request.input('userId', sql.Int, userId);
  request.input('imageUrl', sql.NVarChar(sql.MAX), imageUrl);

  const result = await request.query(`
    INSERT INTO Avatars (user_id, image_url)
    OUTPUT INSERTED.id AS id, INSERTED.user_id AS userId, INSERTED.image_url AS imageUrl, INSERTED.created_at AS createdAt
    VALUES (@userId, @imageUrl)
  `);

  return result.recordset[0];
};
