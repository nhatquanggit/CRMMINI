import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAdminUserStore } from '../store/adminUserStore';
import { Navigate } from 'react-router-dom';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Role badge ──────────────────────────────────────────────

const ROLE_STYLES = {
  ADMIN:   'bg-purple-100 text-purple-700 ring-purple-200',
  MANAGER: 'bg-blue-100 text-blue-700 ring-blue-200',
  SALES:   'bg-green-100 text-green-700 ring-green-200'
};

const ROLE_LABELS = { ADMIN: 'Admin', MANAGER: 'Quản lý', SALES: 'Nhân viên' };

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ROLE_STYLES[role] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
      <Shield className="h-3 w-3" />
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ─── Role selector dropdown ───────────────────────────────────

function RoleSelect({ userId, currentRole, onChange }) {
  const [open, setOpen] = useState(false);
  const roles = ['ADMIN', 'MANAGER', 'SALES'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        <ChevronDown className="h-3.5 w-3.5" />
        Đổi vai trò
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-36 rounded-xl border border-slate-200 bg-white shadow-md py-1">
            {roles.map((r) => (
              <button
                key={r}
                disabled={r === currentRole}
                onClick={() => { setOpen(false); onChange(userId, r); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition
                  ${r === currentRole
                    ? 'bg-slate-50 text-slate-400 cursor-default'
                    : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <Shield className="h-3.5 w-3.5" />
                {ROLE_LABELS[r]}
                {r === currentRole && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm dialog (simple) ──────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
          >
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function UsersManagement() {
  const currentUser = useAuthStore((s) => s.user);

  // Only ADMINs can access this page
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <Navigate to="/app/dashboard" replace />;
  }

  const { users, loading, fetchUsers, changeRole, toggleActive, removeUser } = useAdminUserStore();

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // user to delete

  const load = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (filterRole) params.role = filterRole;
    if (filterActive !== '') params.isActive = filterActive;
    fetchUsers(params);
  };

  useEffect(() => { load(); }, [filterRole, filterActive]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    await removeUser(confirmDelete.id);
    setConfirmDelete(null);
  };

  const stats = {
    total: users.length,
    admin: users.filter((u) => u.role === 'ADMIN').length,
    manager: users.filter((u) => u.role === 'MANAGER').length,
    sales: users.filter((u) => u.role === 'SALES').length,
    inactive: users.filter((u) => !u.isActive).length
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản lý người dùng</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Phân quyền vai trò · Kích hoạt / Vô hiệu hóa tài khoản
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Tổng', value: stats.total, color: 'text-slate-900' },
          { label: 'Admin', value: stats.admin, color: 'text-purple-600' },
          { label: 'Quản lý', value: stats.manager, color: 'text-blue-600' },
          { label: 'Nhân viên', value: stats.sales, color: 'text-green-600' },
          { label: 'Đã khóa', value: stats.inactive, color: 'text-red-600' }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên / email..."
              className="h-9 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Tìm
          </button>
        </form>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Tất cả vai trò</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Quản lý</option>
          <option value="SALES">Nhân viên</option>
        </select>

        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-blue-400 focus:outline-none"
        >
          <option value="">Mọi trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="overflow-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3 text-right">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400">
                  <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">Không có người dùng nào</p>
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className={`transition hover:bg-slate-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {u.name}
                            {isSelf && (
                              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                Bạn
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                          {u.phone && <p className="text-xs text-slate-400">{u.phone}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600 ring-1 ring-green-200">
                          <UserCheck className="h-3 w-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500 ring-1 ring-red-200">
                          <UserX className="h-3 w-3" /> Đã khóa
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>

                    <td className="px-4 py-3">
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-2">
                          <RoleSelect
                            userId={u.id}
                            currentRole={u.role}
                            onChange={changeRole}
                          />

                          <button
                            onClick={() => toggleActive(u.id, !u.isActive)}
                            title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition
                              ${u.isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                                : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'}`}
                          >
                            {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>

                          <button
                            onClick={() => setConfirmDelete(u)}
                            title="Xóa người dùng"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Confirm delete dialog ── */}
      {confirmDelete && (
        <ConfirmDialog
          message={`Bạn có chắc muốn XÓA tài khoản "${confirmDelete.name}" (${confirmDelete.email})? Hành động này không thể hoàn tác.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
