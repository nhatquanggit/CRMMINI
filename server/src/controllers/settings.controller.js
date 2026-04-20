import asyncHandler from '../utils/asyncHandler.js';
import { changePassword, deleteOwnAccount, logoutOtherSessions, updateProfile } from '../services/settings.service.js';

export const updateProfileHandler = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, message: 'Profile updated', data: user });
});

export const changePasswordHandler = asyncHandler(async (req, res) => {
  const result = await changePassword(req.user.id, req.body.oldPassword, req.body.newPassword);
  res.status(200).json({ success: true, message: 'Password changed', data: result });
});

export const logoutOtherSessionsHandler = asyncHandler(async (req, res) => {
  const result = await logoutOtherSessions(req.user.id);
  res.status(200).json({ success: true, message: 'Other sessions logged out', data: result });
});

export const deleteOwnAccountHandler = asyncHandler(async (req, res) => {
  const result = await deleteOwnAccount(req.user.id);
  res.status(200).json({ success: true, message: 'Account deleted', data: result });
});
