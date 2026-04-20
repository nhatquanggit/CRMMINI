import {
  listUsers,
  getUserById,
  updateUserRole,
  setUserActive,
  deleteUserById,
  countAdmins
} from '../models/admin.user.model.js';
import ApiError from '../utils/apiError.js';

export const getAllUsers = async (filters = {}) => {
  return listUsers(filters);
};

export const getUserDetail = async (id) => {
  const user = await getUserById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
};

export const changeUserRole = async (targetId, role, currentUserId) => {
  // Cannot change own role via this endpoint (use Settings instead)
  if (targetId === currentUserId) {
    throw new ApiError(400, 'Không thể tự đổi vai trò của mình');
  }

  // If downgrading from ADMIN, make sure at least 1 ADMIN remains
  if (role !== 'ADMIN') {
    const target = await getUserById(targetId);
    if (!target) throw new ApiError(404, 'User not found');

    if (target.role === 'ADMIN') {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        throw new ApiError(400, 'Hệ thống phải có ít nhất 1 ADMIN');
      }
    }
  }

  const updated = await updateUserRole(targetId, role);
  if (!updated) throw new ApiError(404, 'User not found');
  return updated;
};

export const toggleUserActive = async (targetId, isActive, currentUserId) => {
  if (targetId === currentUserId) {
    throw new ApiError(400, 'Không thể tự vô hiệu hóa tài khoản của mình');
  }

  // Cannot deactivate the last admin
  if (!isActive) {
    const target = await getUserById(targetId);
    if (target?.role === 'ADMIN') {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        throw new ApiError(400, 'Không thể vô hiệu hóa ADMIN duy nhất');
      }
    }
  }

  const updated = await setUserActive(targetId, isActive);
  if (!updated) throw new ApiError(404, 'User not found');
  return updated;
};

export const removeUser = async (targetId, currentUserId) => {
  if (targetId === currentUserId) {
    throw new ApiError(400, 'Không thể xóa tài khoản của chính mình');
  }

  const target = await getUserById(targetId);
  if (!target) throw new ApiError(404, 'User not found');

  if (target.role === 'ADMIN') {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      throw new ApiError(400, 'Không thể xóa ADMIN duy nhất của hệ thống');
    }
  }

  const deleted = await deleteUserById(targetId);
  return deleted;
};
