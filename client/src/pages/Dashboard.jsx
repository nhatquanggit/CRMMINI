import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Handshake,
  Plus,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Sprout,
} from 'lucide-react';
import { getDashboardApi } from '../api/dashboardApi';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../i18n';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const STAGE_CONFIG = [
  { key: 'LEAD',        label: 'Khách mới',   icon: Sprout,       color: 'bg-sky-500',     text: 'text-sky-600',     light: 'bg-sky-50'     },
  { key: 'CONTACTED',   label: 'Đã liên hệ',  icon: PhoneCall,    color: 'bg-cyan-500',    text: 'text-cyan-600',    light: 'bg-cyan-50'    },
  { key: 'NEGOTIATION', label: 'Đàm phán',    icon: Handshake,    color: 'bg-violet-500',  text: 'text-violet-600',  light: 'bg-violet-50'  },
  { key: 'WON',         label: 'Thành công',  icon: CheckCircle2, color: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
  { key: 'LOST',        label: 'Thất bại',    icon: XCircle,      color: 'bg-rose-500',    text: 'text-rose-600',    light: 'bg-rose-50'    },
];

const safePercent = (current, previous) => {
  if (!previous || previous <= 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
};

const activityIconByType = (type) => {
  const upperType = String(type || '').toUpperCase();

  if (upperType.includes('DEAL')) {
    return Handshake;
  }
  if (upperType.includes('CALL') || upperType.includes('EMAIL') || upperType.includes('MEETING')) {
    return Activity;
  }
  return AlertCircle;
};

const ActivityEmptyState = ({ tr }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center">
    <Activity className="h-8 w-8 text-gray-400" />
    <p className="mt-3 text-sm font-semibold text-gray-700">{tr('noActivity')}</p>
    <p className="mt-1 text-sm text-gray-500">{tr('noActivityDesc')}</p>
  </div>
);

const KpiCard = ({ title, value, icon: Icon, trend, color = 'text-slate-500', vsLastMonth, noDataCompare }) => {
  const hasTrend = typeof trend === 'number';
  const isPositive = hasTrend ? trend >= 0 : true;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
          <p className="mt-2 break-all text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <Icon className={`h-5 w-5 shrink-0 ${color}`} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        {hasTrend ? (
          <>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-slate-400">{vsLastMonth}</span>
          </>
        ) : (
          <span className="text-xs text-slate-400">{noDataCompare}</span>
        )}
      </div>
    </article>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
      <div className="mt-3 h-4 w-96 animate-pulse rounded bg-gray-100" />
      <div className="mt-5 flex gap-3">
        <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-10 w-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </section>

    <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <article key={item} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-8 w-28 animate-pulse rounded bg-slate-200" />
        </article>
      ))}
    </section>

    <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <article className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-72 animate-pulse rounded-xl bg-slate-100" />
      </article>
      <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 h-72 animate-pulse rounded-xl bg-slate-100" />
      </article>
    </section>

    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </section>
  </div>
);

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const language = useUiStore((state) => state.language);
  const tr = useTranslation(language);

  const STAGE_CONFIG_I18N = [
    { key: 'LEAD',        label: tr('stageLead'),        icon: Sprout,       color: 'bg-sky-500',     text: 'text-sky-600',     light: 'bg-sky-50'     },
    { key: 'CONTACTED',   label: tr('stageContacted'),   icon: PhoneCall,    color: 'bg-cyan-500',    text: 'text-cyan-600',    light: 'bg-cyan-50'    },
    { key: 'NEGOTIATION', label: tr('stageNegotiation'), icon: Handshake,    color: 'bg-violet-500',  text: 'text-violet-600',  light: 'bg-violet-50'  },
    { key: 'WON',         label: tr('stageWon'),         icon: CheckCircle2, color: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    { key: 'LOST',        label: tr('stageLost'),        icon: XCircle,      color: 'bg-rose-500',    text: 'text-rose-600',    light: 'bg-rose-50'    },
  ];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    totalCustomers: 0,
    totalDeals: 0,
    totalRevenue: 0,
    revenueByMonth: [],
    dealStatus: [],
    activities: []
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getDashboardApi();
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Không tải được dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const revenueTrend = useMemo(() => {
    if (data.revenueByMonth.length < 2) return null;
    const arr = data.revenueByMonth;
    const current = arr[arr.length - 1].revenue;
    const previous = arr[arr.length - 2].revenue;
    return safePercent(current, previous);
  }, [data.revenueByMonth]);

  const dealTrend = null;
  const customerTrend = null;

  const statusData = useMemo(() => data.dealStatus.filter((item) => item.total > 0), [data.dealStatus]);

  const onRefresh = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getDashboardApi();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-full space-y-5">
      {/* ── Header ── */}
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
              {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{tr('greeting')}, {user?.name || 'Admin'} 👋</h1>
            <p className="mt-1 text-sm text-blue-100">{tr('dashboardSubtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              <RefreshCw className="h-4 w-4" /> {tr('refresh')}
            </button>
            <Link to="/app/customers"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20">
              <UserPlus className="h-4 w-4" /> {tr('addCustomer')}
            </Link>
            <Link to="/app/deals"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50">
              <Plus className="h-4 w-4" /> {tr('createDeal')}
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* ── KPI ── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard title={tr('totalCustomers')} value={data.totalCustomers} icon={Users} trend={customerTrend} color="text-violet-500" vsLastMonth={tr('vsLastMonth')} noDataCompare={tr('noDataCompare')} />
        <KpiCard title={tr('totalDeals')} value={data.totalDeals} icon={Handshake} trend={dealTrend} color="text-blue-500" vsLastMonth={tr('vsLastMonth')} noDataCompare={tr('noDataCompare')} />
        <KpiCard title={tr('revenue')} value={money.format(data.totalRevenue)} icon={CircleDollarSign} trend={revenueTrend} color="text-emerald-500" vsLastMonth={tr('vsLastMonth')} noDataCompare={tr('noDataCompare')} />
      </section>

      {/* ── Pipeline stages + Activity ── */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Pipeline stages — chiếm 1/3 */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">{tr('currentPipeline')}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{tr('dealsByStage')}</p>
          </div>
          <div className="space-y-3">
            {STAGE_CONFIG_I18N.map((stage) => {
              const count = statusData.find((s) => s.status === stage.key)?.total || 0;
              const pct = data.totalDeals ? Math.round((count / data.totalDeals) * 100) : 0;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                    <stage.icon className={`h-4 w-4 shrink-0 ${stage.text}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700">{stage.label}</p>
                      <span className={`text-xs font-bold ${stage.text}`}>{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-1.5 rounded-full ${stage.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {statusData.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">{tr('noDeals')}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">
                {data.totalDeals ? Math.round(((statusData.find((s) => s.status === 'WON')?.total || 0) / data.totalDeals) * 100) : 0}%
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">{tr('winRate')}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-lg font-bold text-slate-700">{data.activities.length}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{tr('activities')}</p>
            </div>
          </div>
        </article>

        {/* Activity feed — chiếm 2/3 */}
        <article className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{tr('recentActivities')}</h2>
              <p className="mt-0.5 text-xs text-slate-400">{tr('latestUpdates')}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {data.activities.length} {tr('events')}
            </span>
          </div>

          {data.activities.length ? (
            <div className="relative space-y-0 overflow-y-auto" style={{ maxHeight: '420px' }}>
              {/* Vertical timeline line */}
              <div className="absolute left-[19px] top-0 h-full w-px bg-slate-100" />
              {data.activities.map((activity, index) => {
                const Icon = activityIconByType(activity.type);
                return (
                  <div key={`${activity.type}-${activity.createdAt}-${index}`}
                    className="relative flex gap-4 py-3 pl-1 pr-2">
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <Icon className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="text-sm font-semibold text-slate-800">{activity.type}</p>
                        <p className="shrink-0 text-[11px] text-slate-400">
                          {new Date(activity.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{activity.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <ActivityEmptyState tr={tr} />
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
