import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, Filter, Layers, Pencil, Search, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSegmentApi,
  deleteSegmentApi,
  getSegmentMembersApi,
  getSegmentsApi,
  updateSegmentApi
} from '../api/segmentApi';
import { useAuthStore } from '../store/authStore';

const emptyForm = {
  name: '',
  description: '',
  statusFilter: '',
  sourceFilter: '',
  minDeals: '',
  minTotalDealValue: '',
  isVip: '',
  isActive: true
};

const sourceOptions = [
  'WEBSITE',
  'FACEBOOK',
  'ZALO',
  'REFERRAL',
  'EVENT',
  'ADS',
  'OTHER'
];

const statusOptions = ['NEW', 'CONTACTED', 'CONVERTED'];

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

function Segments() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const selectedSegment = useMemo(() => segments.find((s) => s.id === selectedId) || null, [segments, selectedId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return segments;
    const q = query.toLowerCase();
    return segments.filter((s) =>
      s.name?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      s.statusFilter?.toLowerCase().includes(q) ||
      s.sourceFilter?.toLowerCase().includes(q)
    );
  }, [segments, query]);

  const loadSegments = async () => {
    setLoading(true);
    try {
      const rows = await getSegmentsApi();
      setSegments(rows || []);
      if (!selectedId && rows?.length) {
        setSelectedId(rows[0].id);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được danh sach segment');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (id) => {
    if (!id) {
      setMembers([]);
      return;
    }

    setMemberLoading(true);
    try {
      const data = await getSegmentMembersApi(id);
      setMembers(data.members || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được members cua segment');
      setMembers([]);
    } finally {
      setMemberLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMembers(selectedId);
    } else {
      setMembers([]);
    }
  }, [selectedId]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onEdit = (segment) => {
    setEditingId(segment.id);
    setForm({
      name: segment.name || '',
      description: segment.description || '',
      statusFilter: segment.statusFilter || '',
      sourceFilter: segment.sourceFilter || '',
      minDeals: segment.minDeals === null || segment.minDeals === undefined ? '' : String(segment.minDeals),
      minTotalDealValue: segment.minTotalDealValue === null || segment.minTotalDealValue === undefined ? '' : String(segment.minTotalDealValue),
      isVip: segment.isVip === null || segment.isVip === undefined ? '' : (segment.isVip ? 'true' : 'false'),
      isActive: Boolean(segment.isActive)
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('Ban khong co quyen quan ly segment');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      statusFilter: form.statusFilter || null,
      sourceFilter: form.sourceFilter || null,
      minDeals: form.minDeals === '' ? null : Number(form.minDeals),
      minTotalDealValue: form.minTotalDealValue === '' ? null : Number(form.minTotalDealValue),
      isVip: form.isVip === '' ? null : form.isVip === 'true',
      isActive: Boolean(form.isActive)
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateSegmentApi(editingId, payload);
        toast.success('Cap nhat segment thanh cong');
      } else {
        await createSegmentApi(payload);
        toast.success('Tạo segment thanh cong');
      }

      resetForm();
      await loadSegments();
      if (selectedId) await loadMembers(selectedId);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Luu segment that bai');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!canManage) {
      toast.error('Ban khong co quyen xoa segment');
      return;
    }
    if (!window.confirm('Ban co chac muon xoa segment nay?')) return;

    try {
      await deleteSegmentApi(id);
      toast.success('Da xoa segment');
      const next = segments.filter((s) => s.id !== id);
      setSegments(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || null);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa segment that bai');
    }
  };

  const totalMembers = members.length;
  const avgDealValue = members.length
    ? members.reduce((sum, m) => sum + Number(m.totalDealValue || 0), 0) / members.length
    : 0;

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white shadow-sm">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Customer Segments</h2>
            <p className="text-xs text-slate-500">Phân nhóm khách hàng theo điều kiện hành vi và giá trị</p>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tim segment..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tong segment</p><p className="text-2xl font-bold text-slate-900">{segments.length}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Dang active</p><p className="text-2xl font-bold text-emerald-700">{segments.filter((s) => s.isActive).length}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Members segment chon</p><p className="text-2xl font-bold text-blue-700">{totalMembers}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Deal value TB</p><p className="text-lg font-bold text-indigo-700">{money.format(avgDealValue || 0)}</p></article>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_360px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            {editingId ? <><Pencil className="h-4 w-4 text-amber-500" /> Cap nhat segment</> : <><CirclePlus className="h-4 w-4 text-blue-600" /> Tạo segment</>}
          </h3>

          {!canManage && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Tai khoan cua ban chi co quyen xem segment.
            </p>
          )}

          <form className="space-y-3" onSubmit={onSubmit}>
            <input name="name" value={form.name} onChange={onChange} placeholder="Ten segment" required disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Mo ta" rows={2} disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />

            <div className="grid grid-cols-2 gap-2">
              <select name="statusFilter" value={form.statusFilter} onChange={onChange} disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <option value="">Status: all</option>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select name="sourceFilter" value={form.sourceFilter} onChange={onChange} disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                <option value="">Source: all</option>
                {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input name="minDeals" type="number" min="0" value={form.minDeals} onChange={onChange} placeholder="Min deals" disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              <input name="minTotalDealValue" type="number" min="0" value={form.minTotalDealValue} onChange={onChange} placeholder="Min deal value" disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>

            <select name="isVip" value={form.isVip} onChange={onChange} disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <option value="">VIP: all</option>
              <option value="true">VIP only</option>
              <option value="false">Non-VIP only</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} disabled={!canManage} />
              Active
            </label>

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving || !canManage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {editingId ? 'Luu thay doi' : 'Tạo segment'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
                  Hủy
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Danh sach segment</h3>
            <span className="text-xs text-slate-500">{filtered.length} muc</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Dang tai...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Filter className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Chưa có segment nao</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((segment) => {
                const active = segment.id === selectedId;
                return (
                  <article
                    key={segment.id}
                    className={`cursor-pointer p-4 transition ${active ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedId(segment.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{segment.name}</p>
                        <p className="line-clamp-2 text-xs text-slate-500">{segment.description || 'Khong co mo ta'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                          {segment.statusFilter && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{segment.statusFilter}</span>}
                          {segment.sourceFilter && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">{segment.sourceFilter}</span>}
                          {segment.isVip !== null && segment.isVip !== undefined && (
                            <span className={`rounded-full px-2 py-0.5 ${segment.isVip ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                              {segment.isVip ? 'VIP' : 'Non-VIP'}
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 ${segment.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {segment.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(segment);
                            }}
                            className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(segment.id);
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <UsersRound className="h-4 w-4 text-indigo-600" />
              Members{selectedSegment ? ` - ${selectedSegment.name}` : ''}
            </h3>
            <span className="text-xs text-slate-500">{members.length} khach hang</span>
          </div>

          {!selectedSegment ? (
            <div className="p-8 text-center text-sm text-slate-400">Chọn 1 segment để xem danh sách khach hang</div>
          ) : memberLoading ? (
            <div className="space-y-2 p-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Không có khách hàng nào phù hợp</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m) => (
                <article key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{m.name}</p>
                    <p className="text-xs text-slate-500">{m.email || 'No email'} • {m.phone || 'No phone'}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{m.status}</span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">{m.leadSource}</span>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Deals: {m.dealCount}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-700">{money.format(m.totalDealValue || 0)}</p>
                    <p className="text-xs text-slate-500">Won: {m.wonCount}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Segments;
