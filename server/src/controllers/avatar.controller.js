import asyncHandler from '../utils/asyncHandler.js';
import { uploadAvatarForUser } from '../services/avatar.service.js';
import { findLatestAvatarByUserId } from '../models/avatar.model.js';

export const getAvatar = asyncHandler(async (req, res) => {
  const avatar = await findLatestAvatarByUserId(req.user.id);
  res.json({
    success: true,
    data: avatar ? { imageUrl: avatar.imageUrl } : null
  });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const avatar = await uploadAvatarForUser({ userId: req.user.id, file: req.file });

  res.status(201).json({
    success: true,
    message: 'Avatar uploaded',
    data: avatar
  });
});
