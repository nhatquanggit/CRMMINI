import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart2,
  CircleDollarSign,
  Handshake,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { getDashboardApi } from '../api/dashboardApi';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const STAGE_COLORS = {
  LEAD: '#38bdf8',
  CONTACTED: '#22d3ee',
  NEGOTIATION: '#818cf8',
  WON: '#34d399',
  LOST: '#f87171',
};

const STAGE_LABELS = {
  LEAD: 'Moi',
  CONTACTED: 'Da lien he',
  NEGOTIATION: 'Dam phan',
  WON: 'Thanh cong',
  LOST: 'That bai',
};

const labelMonth = (monthKey) => {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  return `T${month}/${year.slice(2)}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-1.5 text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-sm font-bold">
          {money.format(entry.value)}
        </p>
      ))}
    </div>
  );
};

function Reports() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    totalCustomers: 0,
    totalDeals: 0,
    totalRevenue: 0,
    revenueByMonth: [],
    dealStatus: [],
    activities: [],
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getDashboardApi();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Khong tai duoc du lieu bao cao');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const revenueByMonth = useMemo(
    () => data.revenueByMonth.map((item) => ({ ...item, label: labelMonth(item.month) })),
    [data.revenueByMonth]
  );

  const statusData = useMemo(
    () => data.dealStatus
      .filter((item) => item.total > 0)
      .map((item) => ({ ...item, name: STAGE_LABELS[item.status] || item.status })),
    [data.dealStatus]
  );

  const won = statusData.find((s) => s.status === 'WON')?.total || 0;
  const lost = statusData.find((s) => s.status === 'LOST')?.total || 0;
  const winRate = data.totalDeals ? Math.round((won / data.totalDeals) * 100) : 0;

  const kpis = [
    { label: 'Tong doanh thu', value: money.format(data.totalRevenue), icon: CircleDollarSign, iconColor: 'text-emerald-500', bar: 'bg-emerald-500', sub: `${won} deal da chot` },
    { label: 'Tong khach hang', value: data.totalCustomers, icon: Users, iconColor: 'text-violet-500', bar: 'bg-violet-500', sub: 'Trong he thong' },
    { label: 'Tong giao dich', value: data.totalDeals, icon: Handshake, iconColor: 'text-blue-500', bar: 'bg-blue-500', sub: `${won} WON / ${lost} LOST` },
    { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, iconColor: winRate >= 50 ? 'text-emerald-500' : 'text-rose-500', bar: winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500', sub: winRate >= 50 ? 'Hieu suat tot' : 'Can cai thien' },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1,2].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-5 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-200" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Analytics</p>
          </div>
          <h1 className="mt-1 text-xl font-bold">Bao cao & Phan tich</h1>
          <p className="mt-0.5 text-sm text-indigo-200">Tong hop hieu suat kinh doanh theo thoi gian thuc</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
          Lam moi
        </button>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{kpi.label}</p>
              <kpi.icon className={`h-4 w-4 shrink-0 ${kpi.iconColor}`} />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
          </article>
        ))}
      </section>

      {/* Charts row */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Revenue Area Chart */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Doanh thu theo thang</h2>
              <p className="mt-0.5 text-xs text-slate-400">Bien dong doanh thu deal da chot</p>
            </div>
            {revenueByMonth.length >= 2 && (() => {
              const last = revenueByMonth[revenueByMonth.length - 1].revenue;
              const prev = revenueByMonth[revenueByMonth.length - 2].revenue;
              const diff = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;
              return (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {diff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(diff)}% thang nay
                </span>
              );
            })()}
          </div>

          {revenueByMonth.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1e6)}tr`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revenueGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Chua co du lieu doanh thu
            </div>
          )}
        </article>

        {/* Deal Status Donut */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Trang thai giao dich</h2>
            <p className="mt-0.5 text-xs text-slate-400">Phan bo theo stage</p>
          </div>
          {statusData.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={48} paddingAngle={3}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STAGE_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} deals`} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
              Chua co du lieu
            </div>
          )}
        </article>
      </section>

      {/* Bar chart + Activities */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* Monthly bar chart */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">So sanh doanh thu cac thang</h2>
            <p className="mt-0.5 text-xs text-slate-400">Bieu do cot theo thang</p>
          </div>
          {revenueByMonth.length ? (
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1e6)}tr`} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-sm text-slate-400">Chua co du lieu</div>
          )}
        </article>

        {/* Recent Activities */}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Hoat dong gan day</h2>
              <p className="mt-0.5 text-xs text-slate-400">Log hoat dong cua team</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {data.activities.length}
            </span>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {data.activities.length ? data.activities.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50">
                <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700">{a.type}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{a.description}</p>
                </div>
                <p className="shrink-0 text-[10px] text-slate-400">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            )) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">Chua co hoat dong</div>
            )}
          </div>
        </article>
      </section>

      {/* Stage breakdown table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Chi tiet theo giai doan</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Giai doan', 'So deal', 'Ty le', 'Trang thai'].map((h) => (
                  <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {statusData.map((s) => {
                const pct = data.totalDeals ? Math.round((s.total / data.totalDeals) * 100) : 0;
                const color = STAGE_COLORS[s.status] || '#94a3b8';
                return (
                  <tr key={s.status} className="transition hover:bg-slate-50/60">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-slate-700">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-slate-900">{s.total}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: `${color}18`, color }}>
                        {STAGE_LABELS[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {statusData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">Chua co du lieu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Reports;
