import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, Pencil, Target, Trash2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSalesTargetApi,
  deleteSalesTargetApi,
  getForecastOverviewApi,
  updateSalesTargetApi
} from '../api/forecastApi';
import { useAuthStore } from '../store/authStore';

const currentMonthKey = () => new Date().toISOString().slice(0, 7);

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const emptyForm = (month) => ({
  ownerId: '',
  targetMonth: month,
  targetValue: '',
  note: ''
});

function Forecasts() {
  const user = useAuthStore((s) => s.user);
  const canManageAll = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [month, setMonth] = useState(currentMonthKey());
  const [ownerFilter, setOwnerFilter] = useState('');
  const [dashboard, setDashboard] = useState({
    month: currentMonthKey(),
    summary: {
      totalTarget: 0,
      totalWonRevenue: 0,
      totalPipelineValue: 0,
      totalWeightedForecast: 0,
      totalOpenDeals: 0,
      gapToTarget: 0,
      likelyAchievement: 0
    },
    owners: [],
    forecasts: [],
    targets: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm(currentMonthKey()));

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getForecastOverviewApi({
        month,
        ownerId: canManageAll && ownerFilter ? Number(ownerFilter) : undefined
      });
      setDashboard(data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được forecast dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [month, ownerFilter]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, targetMonth: month }));
  }, [month]);

  const targets = useMemo(() => dashboard.targets || [], [dashboard.targets]);
  const forecasts = useMemo(() => dashboard.forecasts || [], [dashboard.forecasts]);
  const owners = useMemo(() => dashboard.owners || [], [dashboard.owners]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm(month));
  };

  const onEdit = (target) => {
    setEditingId(target.id);
    setForm({
      ownerId: String(target.ownerId || ''),
      targetMonth: target.targetMonth || month,
      targetValue: String(target.targetValue || ''),
      note: target.note || ''
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ownerId: canManageAll ? (form.ownerId ? Number(form.ownerId) : undefined) : undefined,
        targetMonth: form.targetMonth,
        targetValue: Number(form.targetValue || 0),
        note: form.note || null
      };

      if (editingId) {
        await updateSalesTargetApi(editingId, payload);
        toast.success('Cap nhat target thanh cong');
      } else {
        await createSalesTargetApi(payload);
        toast.success('Tạo target thanh cong');
      }

      resetForm();
      await loadDashboard();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Luu target that bai');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Ban co chac muon xoa sales target nay?')) return;
    try {
      await deleteSalesTargetApi(id);
      toast.success('Da xoa sales target');
      await loadDashboard();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa sales target that bai');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Sales Forecasting</h2>
            <p className="text-xs text-slate-500">Target thang, weighted pipeline va kha nang dat doanh so</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
          {canManageAll && (
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="">Tất cả owner</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name}</option>
              ))}
            </select>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-5">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tong target</p><p className="text-lg font-bold text-slate-900">{money.format(dashboard.summary.totalTarget || 0)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Won revenue</p><p className="text-lg font-bold text-emerald-700">{money.format(dashboard.summary.totalWonRevenue || 0)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Weighted forecast</p><p className="text-lg font-bold text-blue-700">{money.format(dashboard.summary.totalWeightedForecast || 0)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Open pipeline</p><p className="text-lg font-bold text-indigo-700">{money.format(dashboard.summary.totalPipelineValue || 0)}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Likely achievement</p><p className="text-2xl font-bold text-fuchsia-700">{dashboard.summary.likelyAchievement || 0}%</p></article>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            {editingId ? <><Pencil className="h-4 w-4 text-amber-500" /> Cap nhat target</> : <><CirclePlus className="h-4 w-4 text-blue-600" /> Tạo target moi</>}
          </h3>

          <form className="space-y-3" onSubmit={onSubmit}>
            {canManageAll && (
              <select name="ownerId" value={form.ownerId} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" required={!editingId}>
                <option value="">Chon owner</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} ({owner.role})</option>)}
              </select>
            )}
            <input type="month" name="targetMonth" value={form.targetMonth} onChange={onChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <input type="number" min="0" name="targetValue" value={form.targetValue} onChange={onChange} required placeholder="Target doanh thu" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <textarea name="note" value={form.note} onChange={onChange} rows={3} placeholder="Ghi chu target" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                <Target className="h-4 w-4" /> {editingId ? 'Luu thay doi' : 'Tạo target'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
                  Hủy
                </button>
              )}
            </div>
          </form>

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Targets thang {month}</h4>
              <span className="text-xs text-slate-500">{targets.length} muc</span>
            </div>
            {targets.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có target nao</p>
            ) : (
              targets.map((target) => (
                <article key={target.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{target.owner?.name}</p>
                      <p className="text-xs text-slate-500">{target.targetMonth}</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">{money.format(target.targetValue)}</p>
                      {target.note && <p className="mt-1 text-xs text-slate-500">{target.note}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onEdit(target)} className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => onDelete(target.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Bang forecast theo owner</h3>
            <span className="text-xs text-slate-500">{forecasts.length} owner</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Dang tai...</div>
          ) : forecasts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Chưa có dữ liệu forecast</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Won</th>
                    <th className="px-4 py-3">Weighted</th>
                    <th className="px-4 py-3">Pipeline</th>
                    <th className="px-4 py-3">Gap</th>
                    <th className="px-4 py-3">% Dat du kien</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((item) => (
                    <tr key={item.owner.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{item.owner.name}</p>
                        <p className="text-xs text-slate-500">{item.owner.role}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{money.format(item.targetValue)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{money.format(item.wonRevenue)}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{money.format(item.weightedForecast)}</td>
                      <td className="px-4 py-3 text-indigo-700">{money.format(item.pipelineValue)}</td>
                      <td className="px-4 py-3 text-rose-700">{money.format(item.gapToTarget)}</td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{item.likelyAchievement}%</p>
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${Math.min(100, item.likelyAchievement)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Forecasts;
