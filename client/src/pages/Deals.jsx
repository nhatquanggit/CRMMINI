import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CirclePlus,
  CircleX,
  FilePenLine,
  GripVertical,
  Handshake,
  PhoneCall,
  Search,
  Sprout,
  UserCircle2
} from 'lucide-react';
import { createDealApi, getDealsApi, updateDealApi } from '../api/dealApi';
import { getCustomersApi } from '../api/customerApi';

const STAGES = [
  { key: 'LEAD',        label: 'Khách hàng mới',       tone: 'bg-sky-500',     chip: 'bg-sky-50 text-sky-700 border-sky-200',       icon: Sprout },
  { key: 'CONTACTED',   label: 'Đã tiếp cận',          tone: 'bg-cyan-500',    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',     icon: PhoneCall },
  { key: 'NEGOTIATION', label: 'Đang đàm phán',        tone: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 border-violet-200', icon: FilePenLine },
  { key: 'WON',         label: 'Đã chốt - Thành công', tone: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
  { key: 'LOST',        label: 'Thất bại',             tone: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-700 border-rose-200',     icon: CircleX },
];

const emptyForm = {
  title: '',
  value: '',
  customerId: '',
  stage: 'LEAD'
};

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

function Deals() {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [draggingId, setDraggingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [dealData, customerData] = await Promise.all([getDealsApi(), getCustomersApi()]);
      setDeals(dealData);
      setCustomers(customerData);
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được dữ liệu deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedDeals = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.key] = deals.filter((deal) => deal.stage === stage.key);
      return acc;
    }, {});
  }, [deals]);

  const filteredDeals = useMemo(() => {
    if (!query.trim()) {
      return groupedDeals;
    }

    const normalized = query.toLowerCase();
    const next = {};

    STAGES.forEach((stage) => {
      next[stage.key] = (groupedDeals[stage.key] || []).filter((deal) => {
        return (
          deal.title?.toLowerCase().includes(normalized) ||
          deal.customer?.name?.toLowerCase().includes(normalized) ||
          deal.owner?.name?.toLowerCase().includes(normalized)
        );
      });
    });

    return next;
  }, [groupedDeals, query]);

  const stageTotals = useMemo(() => {
    const totals = {};

    STAGES.forEach((stage) => {
      totals[stage.key] = (groupedDeals[stage.key] || []).reduce((sum, item) => sum + Number(item.value || 0), 0);
    });

    return totals;
  }, [groupedDeals]);

  const boardTotal = useMemo(
    () => Object.values(stageTotals).reduce((sum, value) => sum + Number(value || 0), 0),
    [stageTotals]
  );

  const totalDeals = useMemo(() => deals.length, [deals]);

  const onCreateDeal = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await createDealApi({
        title: form.title,
        value: Number(form.value),
        customerId: Number(form.customerId),
        stage: form.stage
      });
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo deal thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = async (stage) => {
    if (!draggingId) {
      return;
    }

    const current = deals.find((item) => item.id === draggingId);
    if (!current || current.stage === stage) {
      setDraggingId(null);
      return;
    }

    try {
      await updateDealApi(draggingId, { stage });
      setDeals((prev) => prev.map((item) => (item.id === draggingId ? { ...item, stage } : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Không cập nhật được stage');
    } finally {
      setDraggingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pipeline Deals</h2>
            <p className="text-xs text-slate-500">Quản lý giao dịch theo từng giai đoạn</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm deal, khách hàng, owner..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>
      </section>

      {/* Create form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
          <CirclePlus className="h-4 w-4 text-blue-600" /> Tạo giao dịch mới
        </h3>
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={onCreateDeal}>
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Tiêu đề giao dịch"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            required
          />
          <input
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
            placeholder="Giá trị (VND)"
            type="number"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            required
          />
          <select
            value={form.customerId}
            onChange={(e) => setForm((p) => ({ ...p, customerId: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            required
          >
            <option value="">Chọn khách hàng</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={form.stage}
            onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          >
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            <CirclePlus className="h-4 w-4" />
            {saving ? 'Đang tạo...' : 'Tạo'}
          </button>
        </form>
      </section>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      )}

      {/* Pipeline stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tổng giá trị', value: money.format(boardTotal), color: 'text-blue-700', bg: 'from-blue-500 to-indigo-600' },
          { label: 'Số giao dịch', value: totalDeals, color: 'text-violet-700', bg: 'from-violet-500 to-purple-600' },
          { label: 'Đã chốt (WON)', value: (groupedDeals['WON'] || []).length, color: 'text-emerald-700', bg: 'from-emerald-500 to-teal-600' },
          { label: 'Thất bại (LOST)', value: (groupedDeals['LOST'] || []).length, color: 'text-rose-700', bg: 'from-rose-500 to-pink-600' },
        ].map((item) => (
          <article key={item.label} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`absolute right-0 top-0 h-full w-1 bg-gradient-to-b ${item.bg}`} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
          </article>
        ))}
      </section>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid gap-3 lg:grid-cols-5">
          {STAGES.map((s) => (
            <div key={s.key} className="h-48 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-3 shadow-sm">
          <div className="flex min-w-max gap-3">
            {STAGES.map((stage) => (
              <article
                key={stage.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage.key)}
                className="w-[280px] min-w-[280px] rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {(() => {
                  const StageIcon = stage.icon;
                  return (
                <header className="rounded-t-2xl border-b border-slate-100 bg-slate-50/80 p-3">
                  <div className={`h-1.5 w-full rounded-full ${stage.tone}`} />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
                        <StageIcon className="h-3.5 w-3.5" />
                      </span>
                      <h3 className="text-xs font-bold tracking-wide text-slate-700">{stage.label}</h3>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${stage.chip}`}>
                      {(filteredDeals[stage.key] || []).length}
                    </span>
                  </div>
                  <p className="mt-1 text-base font-bold text-slate-900">{money.format(stageTotals[stage.key] || 0)}</p>
                </header>
                  );
                })()}

                <div className="space-y-2 p-2">
                  {(filteredDeals[stage.key] || []).map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggingId(deal.id)}
                      className="cursor-move rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800 leading-snug">{deal.title}</p>
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                      </div>
                      <p className="text-base font-bold text-slate-900">{money.format(Number(deal.value || 0))}</p>
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="h-2 w-2 rounded-full bg-blue-400" />
                          <span className="truncate">{deal.customer?.name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <UserCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{deal.owner?.name || 'N/A'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{new Date(deal.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}

                  {(!filteredDeals[stage.key] || !filteredDeals[stage.key].length) && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
                      <p className="text-xs text-slate-400">Chưa có giao dịch</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Deals;
