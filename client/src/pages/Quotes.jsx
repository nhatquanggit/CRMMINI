import { useEffect, useMemo, useState } from 'react';
import { FileText, PlusCircle, RefreshCw, Trash2, Send, CheckCircle2, PenSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../i18n';
import { createQuoteApi, deleteQuoteApi, getQuotesApi, updateQuoteStatusApi } from '../api/quoteApi';
import { getDealsApi } from '../api/dealApi';

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'SIGNED'];
const STATUS_STYLE = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  EXPIRED: 'bg-amber-100 text-amber-700',
  SIGNED: 'bg-purple-100 text-purple-700'
};

const emptyForm = {
  title: '',
  dealId: '',
  amount: '',
  discountPct: '0',
  taxPct: '8',
  validUntil: '',
  terms: ''
};

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export default function Quotes() {
  const language = useUiStore((s) => s.language);
  const tr = useTranslation(language);
  const [quotes, setQuotes] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [q, d] = await Promise.all([getQuotesApi(statusFilter ? { status: statusFilter } : {}), getDealsApi()]);
      setQuotes(q || []);
      setDeals(d || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được báo giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const totals = useMemo(() => ({
    all: quotes.length,
    sent: quotes.filter((q) => q.status === 'SENT').length,
    approved: quotes.filter((q) => q.status === 'APPROVED' || q.status === 'SIGNED').length,
    value: quotes.reduce((s, q) => s + Number(q.finalAmount || 0), 0)
  }), [quotes]);

  const onCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createQuoteApi({
        title: form.title,
        dealId: Number(form.dealId),
        amount: Number(form.amount),
        discountPct: Number(form.discountPct || 0),
        taxPct: Number(form.taxPct || 0),
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
        terms: form.terms
      });
      setForm(emptyForm);
      toast.success('Tạo báo giá thành công');
      await loadData();
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Tạo báo giá thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onChangeStatus = async (id, status) => {
    try {
      const updated = await updateQuoteStatusApi(id, status);
      setQuotes((prev) => prev.map((q) => (q.id === id ? updated : q)));
      toast.success('Cập nhật trạng thái thành công');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Xóa báo giá này?')) return;
    try {
      await deleteQuoteApi(id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      toast.success('Đã xóa báo giá');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quote & Contract</h2>
            <p className="text-xs text-slate-500">Quản lý báo giá và trạng thái ký hợp đồng</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={loadData} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tổng báo giá</p><p className="text-2xl font-bold text-slate-900">{totals.all}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Đã gửi</p><p className="text-2xl font-bold text-blue-700">{totals.sent}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Đồng ý/Ký</p><p className="text-2xl font-bold text-emerald-700">{totals.approved}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tổng giá trị</p><p className="text-xl font-bold text-indigo-700">{money.format(totals.value)}</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><PlusCircle className="h-4 w-4" /> Tạo báo giá mới</h3>
        <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input required value={form.title} onChange={(e)=>setForm((p)=>({...p,title:e.target.value}))} placeholder="Tiêu đề báo giá" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <select required value={form.dealId} onChange={(e)=>setForm((p)=>({...p,dealId:e.target.value}))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
            <option value="">Chọn deal</option>
            {deals.map((d)=> <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <input required type="number" value={form.amount} onChange={(e)=>setForm((p)=>({...p,amount:e.target.value}))} placeholder="Giá trị gốc" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="date" value={form.validUntil} onChange={(e)=>setForm((p)=>({...p,validUntil:e.target.value}))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" value={form.discountPct} onChange={(e)=>setForm((p)=>({...p,discountPct:e.target.value}))} placeholder="Discount %" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input type="number" value={form.taxPct} onChange={(e)=>setForm((p)=>({...p,taxPct:e.target.value}))} placeholder="Tax %" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
          <input value={form.terms} onChange={(e)=>setForm((p)=>({...p,terms:e.target.value}))} placeholder="Điều khoản ngắn" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm md:col-span-2" />
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
            <PenSquare className="h-4 w-4" /> {saving ? 'Đang tạo...' : 'Tạo báo giá'}
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Deal/Khách hàng</th>
              <th className="px-4 py-3">Giá trị cuối</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Đang tải...</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Chưa có báo giá</td></tr>
            ) : quotes.map((q) => (
              <tr key={q.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{q.quoteNo}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{q.title}</p>
                  <p className="text-xs text-slate-400">{q.validUntil ? `Hiệu lực: ${new Date(q.validUntil).toLocaleDateString('vi-VN')}` : 'Không giới hạn'}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <p>{q.deal?.title}</p>
                  <p>{q.customer?.name}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-indigo-700">{money.format(q.finalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[q.status] || STATUS_STYLE.DRAFT}`}>{q.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={q.status}
                      onChange={(e)=>onChangeStatus(q.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>onChangeStatus(q.id, 'SENT')} title="Gửi báo giá" className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-blue-600"><Send className="h-4 w-4" /></button>
                    <button onClick={()=>onChangeStatus(q.id, 'SIGNED')} title="Đánh dấu đã ký" className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></button>
                    <button onClick={()=>onDelete(q.id)} title="Xóa" className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

