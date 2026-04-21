import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart2, CalendarDays, FileSpreadsheet, FileText, Headset,
  LayoutDashboard, Layers, LogOut, Menu, Package, Receipt,
  Settings, Handshake, Shield, TrendingUp, Users, Workflow, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import AIAssistantFab from './AIAssistantFab';

function AppLayout() {
  const brandLogo = '/images/brand-logo.png';
  const [logoFailed, setLogoFailed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const language = useUiStore((state) => state.language);

  const text = language === 'en'
    ? {
        dashboard: 'Dashboard', customers: 'Customers', deals: 'Deals',
        quotes: 'Quotes', products: 'Products', invoices: 'Invoices',
        leadSources: 'Lead Sources', segments: 'Segments',
        supportTickets: 'Support Tickets', forecasts: 'Forecasts',
        calendar: 'Calendar', reports: 'Reports', users: 'User Management',
        importExport: 'Import / Export', settings: 'Settings', logout: 'Logout',
      }
    : {
        dashboard: 'Tổng quan', customers: 'Khách hàng', deals: 'Deals',
        quotes: 'Báo giá', products: 'Sản phẩm', invoices: 'Hóa đơn',
        leadSources: 'Nguồn lead', segments: 'Phân khúc',
        supportTickets: 'Hỗ trợ', forecasts: 'Dự báo',
        calendar: 'Lịch', reports: 'Báo cáo', users: 'Người dùng',
        importExport: 'Import / Export', settings: 'Cài đặt', logout: 'Đăng xuất',
      };

  const onLogout = () => { clearAuth(); navigate('/'); };
  const closeMobile = () => setMobileOpen(false);

  const menuClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  const NavItems = ({ onItemClick }) => (
    <>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Menu</p>
      <div className="space-y-0.5">
        {[
          { to: '/app/dashboard', icon: LayoutDashboard, label: text.dashboard },
          { to: '/app/customers', icon: Users, label: text.customers },
          { to: '/app/deals', icon: Handshake, label: text.deals },
          { to: '/app/quotes', icon: FileText, label: text.quotes },
          { to: '/app/products', icon: Package, label: text.products },
          { to: '/app/invoices', icon: Receipt, label: text.invoices },
          { to: '/app/lead-sources', icon: Workflow, label: text.leadSources },
          { to: '/app/segments', icon: Layers, label: text.segments },
          { to: '/app/support-tickets', icon: Headset, label: text.supportTickets },
          { to: '/app/forecasts', icon: TrendingUp, label: text.forecasts },
          { to: '/app/calendar', icon: CalendarDays, label: text.calendar },
          { to: '/app/reports', icon: BarChart2, label: text.reports },
          { to: '/app/import-export', icon: FileSpreadsheet, label: text.importExport },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={menuClass} onClick={onItemClick}>
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <>
            <p className="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin</p>
            <NavLink to="/app/users" className={menuClass} onClick={onItemClick}>
              <Shield className="h-4 w-4 shrink-0" />
              <span>{text.users}</span>
            </NavLink>
          </>
        )}
      </div>
    </>
  );

  const SidebarLogo = () => (
    <div className="border-b border-slate-100 px-4 py-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 p-2 shadow-sm">
        {logoFailed ? (
          <div className="flex h-16 items-center gap-3 px-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-extrabold tracking-tight text-slate-900">Quang CRM</span>
              <span className="block truncate text-[10px] font-medium text-slate-500">Personal CRM Solutions</span>
            </div>
          </div>
        ) : (
          <img src={brandLogo} alt="Quang CRM" className="h-16 w-full object-contain" onError={() => setLogoFailed(true)} />
        )}
      </div>
      <p className="mt-2 truncate px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Quang CRM Workspace
      </p>
    </div>
  );

  const SidebarFooter = ({ onItemClick }) => (
    <div className="border-t border-slate-100 p-3 space-y-1">
      <NavLink
        to="/app/settings"
        onClick={onItemClick}
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
        onClick={() => { onItemClick?.(); onLogout(); }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span>{text.logout}</span>
      </button>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarLogo />
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4">
          <NavItems />
        </nav>
        <SidebarFooter />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Quang CRM</span>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto hide-scrollbar px-3 py-4">
          <NavItems onItemClick={closeMobile} />
        </nav>
        <SidebarFooter onItemClick={closeMobile} />
      </aside>

      {/* ── Topbar ── */}
      <div className="fixed left-0 right-0 top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm lg:left-60">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo mobile center */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <LayoutDashboard className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-bold text-slate-900">Quang CRM</span>
          </div>

          {/* User info */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow">
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{user?.role || 'ADMIN'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="h-screen overflow-y-auto p-4 pt-[60px] lg:ml-60 lg:p-6 lg:pt-[68px]">
        <div className="mx-auto w-full max-w-[1500px]">
          <Outlet />
        </div>
      </main>

      <AIAssistantFab />
    </div>
  );
}

export default AppLayout;
