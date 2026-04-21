import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart2, CalendarDays, FileSpreadsheet, FileText, Headset, LayoutDashboard, Layers, LogOut, Package, Receipt, Search, Settings, Handshake, Shield, TrendingUp, Users, Workflow } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import AIAssistantFab from './AIAssistantFab';

function AppLayout() {
  const brandLogo = '/images/brand-logo.png';
  const [logoFailed, setLogoFailed] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const language = useUiStore((state) => state.language);

  const text = language === 'en'
    ? {
        dashboard: 'Dashboard',
        customers: 'Customers',
        deals: 'Deals',
        quotes: 'Quotes',
        products: 'Products',
        invoices: 'Invoices',
        leadSources: 'Lead Sources',
        segments: 'Segments',
        supportTickets: 'Support Tickets',
        forecasts: 'Forecasts',
        calendar: 'Calendar',
        reports: 'Reports',
        users: 'User Management',
        importExport: 'Import / Export',
        settings: 'Settings',
        logout: 'Logout',
        search: 'Search deals, customers...'
      }
    : {
        dashboard: 'Tổng quan',
        customers: 'Khách hàng',
        deals: 'Deals',
        quotes: 'Báo giá',
        products: 'Sản phẩm',
        invoices: 'Hóa đơn',
        leadSources: 'Nguồn lead',
        segments: 'Phân khúc',
        supportTickets: 'Hỗ trợ',
        forecasts: 'Dự báo',
        calendar: 'Lịch',
        reports: 'Báo cáo',
        users: 'Người dùng',
        importExport: 'Import / Export',
        settings: 'Cài đặt',
        logout: 'Đăng xuất',
        search: 'Tìm deal, khách hàng...'
      };

  const onLogout = () => {
    clearAuth();
    navigate('/');
  };

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive
        ? 'bg-slate-900 text-white shadow-sm'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* ── Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex overflow-hidden">
        {/* Logo */}
        <div className="border-b border-slate-100 px-4 py-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-2 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)]">
            {logoFailed ? (
              <div className="flex h-20 items-center gap-3 px-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-base font-extrabold tracking-tight text-slate-900">Quang CRM</span>
                  <span className="block truncate text-[11px] font-medium text-slate-500">Personal CRM Solutions</span>
                </div>
              </div>
            ) : (
              <img
                src={brandLogo}
                alt="Quang CRM"
                className="h-20 w-full object-contain"
                onError={() => setLogoFailed(true)}
              />
            )}
          </div>
          <p className="mt-2 truncate px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Quang CRM Workspace
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Menu</p>
          <div className="space-y-0.5">
            <NavLink to="/app/dashboard" className={menuClass}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>{text.dashboard}</span>
            </NavLink>
            <NavLink to="/app/customers" className={menuClass}>
              <Users className="h-4 w-4 shrink-0" />
              <span>{text.customers}</span>
            </NavLink>
            <NavLink to="/app/deals" className={menuClass}>
              <Handshake className="h-4 w-4 shrink-0" />
              <span>{text.deals}</span>
            </NavLink>
            <NavLink to="/app/quotes" className={menuClass}>
              <FileText className="h-4 w-4 shrink-0" />
              <span>{text.quotes}</span>
            </NavLink>
            <NavLink to="/app/products" className={menuClass}>
              <Package className="h-4 w-4 shrink-0" />
              <span>{text.products}</span>
            </NavLink>
            <NavLink to="/app/invoices" className={menuClass}>
              <Receipt className="h-4 w-4 shrink-0" />
              <span>{text.invoices}</span>
            </NavLink>
            <NavLink to="/app/lead-sources" className={menuClass}>
              <Workflow className="h-4 w-4 shrink-0" />
              <span>{text.leadSources}</span>
            </NavLink>
            <NavLink to="/app/segments" className={menuClass}>
              <Layers className="h-4 w-4 shrink-0" />
              <span>{text.segments}</span>
            </NavLink>
            <NavLink to="/app/support-tickets" className={menuClass}>
              <Headset className="h-4 w-4 shrink-0" />
              <span>{text.supportTickets}</span>
            </NavLink>
            <NavLink to="/app/forecasts" className={menuClass}>
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span>{text.forecasts}</span>
            </NavLink>
            <NavLink to="/app/calendar" className={menuClass}>
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>{text.calendar}</span>
            </NavLink>
            <NavLink to="/app/reports" className={menuClass}>
              <BarChart2 className="h-4 w-4 shrink-0" />
              <span>{text.reports}</span>
            </NavLink>
            <NavLink to="/app/import-export" className={menuClass}>
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>{text.importExport}</span>
            </NavLink>
            {user?.role === 'ADMIN' && (
              <>
                <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin</p>
                <NavLink to="/app/users" className={menuClass}>
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>{text.users}</span>
                </NavLink>
              </>
            )}
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <NavLink
            to="/app/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>{text.settings}</span>
          </NavLink>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{text.logout}</span>
          </button>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <div className="fixed left-0 right-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm lg:left-60">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div />
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
              </div>
              <div className="hidden min-w-0 lg:block">
                <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{user?.role || 'ADMIN'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="h-screen overflow-y-auto p-4 pt-[68px] lg:ml-60 lg:p-6 lg:pt-[72px]">
        <div className="mx-auto w-full max-w-[1500px]">
          <Outlet />
        </div>
      </main>

      <AIAssistantFab />
    </div>
  );
}

export default AppLayout;
