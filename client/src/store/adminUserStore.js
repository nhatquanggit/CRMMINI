import { create } from 'zustand';
import adminUserApi from '../api/adminUserApi';
import { toast } from 'sonner';

export const useAdminUserStore = create((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async (filters = {}) => {
    set({ loading: true });
    try {
      const res = await adminUserApi.list(filters);
      set({ users: res.data.data || [] });
    } catch (e) {
      toast.error('Không tải được danh sách người dùng');
    } finally {
      set({ loading: false });
    }
  },

  changeRole: async (id, role) => {
    try {
      const res = await adminUserApi.updateRole(id, role);
      const updated = res.data.data;
      set((s) => ({ users: s.users.map((u) => (u.id === id ? updated : u)) }));
      toast.success('Đã cập nhật vai trò');
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cập nhật vai trò thất bại');
      return false;
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const res = await adminUserApi.setActive(id, isActive);
      const updated = res.data.data;
      set((s) => ({ users: s.users.map((u) => (u.id === id ? updated : u)) }));
      toast.success(isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Thao tác thất bại');
      return false;
    }
  },

  removeUser: async (id) => {
    try {
      await adminUserApi.remove(id);
      set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      toast.success('Đã xóa người dùng');
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa thất bại');
      return false;
    }
  }
}));
