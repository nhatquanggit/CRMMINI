import asyncHandler from '../utils/asyncHandler.js';
import {
  getAllUsers,
  getUserDetail,
  changeUserRole,
  toggleUserActive,
  removeUser
} from '../services/admin.user.service.js';

export const listUsersHandler = asyncHandler(async (req, res) => {
  const { role, search, isActive } = req.validated?.query || req.query;
  const users = await getAllUsers({ role, search, isActive });
  res.json({ success: true, data: users });
});

export const getUserHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = await getUserDetail(id);
  res.json({ success: true, data: user });
});

export const updateRoleHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  const updated = await changeUserRole(id, role, req.user.id);
  res.json({ success: true, message: 'Vai trò đã được cập nhật', data: updated });
});

export const toggleActiveHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { isActive } = req.body;
  const updated = await toggleUserActive(id, Boolean(isActive), req.user.id);
  res.json({ success: true, message: 'Trạng thái tài khoản đã cập nhật', data: updated });
});

export const deleteUserHandler = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const deleted = await removeUser(id, req.user.id);
  res.json({ success: true, message: 'Đã xóa người dùng', data: deleted });
});
