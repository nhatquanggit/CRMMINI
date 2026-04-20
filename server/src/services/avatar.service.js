import ApiError from '../utils/apiError.js';
import {
  countAvatarsByUserId,
  createAvatar,
  deleteAvatarById,
  findOldestAvatarByUserId
} from '../models/avatar.model.js';

const MAX_AVATARS_PER_USER = 20;

export const uploadAvatarForUser = async ({ userId, file }) => {
  if (!file) {
    throw new ApiError(400, 'Avatar file is required');
  }

  const mimeType = file.mimetype || 'image/jpeg';
  const imageBase64 = file.buffer.toString('base64');
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const totalAvatars = await countAvatarsByUserId(userId);

  // Enforce max 20 avatars per user by deleting the oldest before inserting a new one.
  if (totalAvatars >= MAX_AVATARS_PER_USER) {
    const oldest = await findOldestAvatarByUserId(userId);
    if (oldest) {
      await deleteAvatarById(oldest.id);
    }
  }

  return createAvatar({ userId, imageUrl });
};
