import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, FileCheck2, Receipt, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDealsApi } from '../api/dealApi';
import { getProductsApi } from '../api/productApi';
import { createInvoiceApi, deleteInvoiceApi, getInvoicesApi, updateInvoiceStatusApi } from '../api/invoiceApi';

const STATUS_OPTIONS = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const STATUS_STYLE = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-rose-100 text-rose-700'
};

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

const emptyForm = {
  dealId: '',
  dueDate: '',
  discountPct: '0',
  taxPct: '8',
  notes: ''
};

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const [form, setForm] = useState(emptyForm);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceRows, dealRows, productRows] = await Promise.all([
        getInvoicesApi(statusFilter ? { status: statusFilter } : {}),
        getDealsApi(),
        getProductsApi({ isActive: 'true' })
      ]);
      setInvoices(invoiceRows || []);
      setDeals(dealRows || []);
      setProducts(productRows || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const totals = useMemo(() => {
    const total = invoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0);
    const paid = invoices.filter((i) => i.status === 'PAID').length;
    const due = invoices.filter((i) => i.status === 'SENT' || i.status === 'OVERDUE').length;
    return { all: invoices.length, total, paid, due };
  }, [invoices]);

  const draftSubtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.lineTotal || 0), 0),
    [items]
  );

  const draftTotal = useMemo(() => {
    const discountPct = Number(form.discountPct || 0);
    const taxPct = Number(form.taxPct || 0);
    const afterDiscount = draftSubtotal * (1 - discountPct / 100);
    return afterDiscount * (1 + taxPct / 100);
  }, [items, draftSubtotal, form.discountPct, form.taxPct]);

  const resetDraft = () => {
    setForm(emptyForm);
    setSelectedProductId('');
    setQuantity('1');
    setItems([]);
  };

  const addItem = () => {
    const product = products.find((p) => p.id === Number(selectedProductId));
    const qty = Number(quantity || 0);
    if (!product) {
      toast.error('Chọn sản phẩm trước khi thêm');
      return;
    }
    if (qty <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    const unitPrice = Number(product.price);
    const lineTotal = qty * unitPrice;

    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        lineTotal
      }
    ]);

    setSelectedProductId('');
    setQuantity('1');
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const createInvoice = async (event) => {
    event.preventDefault();

    if (!form.dealId) {
      toast.error('Chọn deal trước khi tạo hóa đơn');
      return;
    }
    if (items.length === 0) {
      toast.error('Hóa đơn cần ít nhất 1 dòng sản phẩm');
      return;
    }

    setSaving(true);
    try {
      await createInvoiceApi({
        dealId: Number(form.dealId),
        discountPct: Number(form.discountPct || 0),
        taxPct: Number(form.taxPct || 0),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : undefined,
        notes: form.notes || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          description: it.productName
        }))
      });

      toast.success('Tạo hóa đơn thành công');
      resetDraft();
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Tạo hóa đơn thất bại');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    try {
      const updated = await updateInvoiceStatusApi(id, status);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      toast.success('Cập nhật trạng thái hóa đơn thành công');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không cập nhật được trạng thái');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;
    try {
      await deleteInvoiceApi(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success('Đã xóa hóa đơn');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa hóa đơn thất bại');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
            <p className="text-xs text-slate-500">Quản lý hóa đơn theo deal và sản phẩm</p>
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
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tổng hóa đơn</p><p className="text-2xl font-bold text-slate-900">{totals.all}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Đã thanh toán</p><p className="text-2xl font-bold text-emerald-700">{totals.paid}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Chờ thanh toán</p><p className="text-2xl font-bold text-amber-700">{totals.due}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tổng doanh thu</p><p className="text-lg font-bold text-indigo-700">{money.format(totals.total)}</p></article>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <CirclePlus className="h-4 w-4 text-blue-600" /> Tạo hóa đơn mới
          </h3>

          <form className="space-y-3" onSubmit={createInvoice}>
            <select
              value={form.dealId}
              onChange={(e) => setForm((p) => ({ ...p, dealId: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              required
            >
              <option value="">Chọn deal</option>
              {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.discountPct} onChange={(e) => setForm((p) => ({ ...p, discountPct: e.target.value }))} placeholder="Discount %" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              <input type="number" value={form.taxPct} onChange={(e) => setForm((p) => ({ ...p, taxPct: e.target.value }))} placeholder="Tax %" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>

            <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Ghi chú" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600">Thêm sản phẩm</p>
              <div className="grid grid-cols-[1fr_90px_auto] gap-2">
                <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm">
                  <option value="">Chọn sản phẩm</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({money.format(p.price)})</option>)}
                </select>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm" />
                <button type="button" onClick={addItem} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Thêm</button>
              </div>

              <div className="space-y-1">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có item</p>
                ) : items.map((it, idx) => (
                  <div key={`${it.productId}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-xs">
                    <span>{it.productName} x {it.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{money.format(it.lineTotal)}</span>
                      <button type="button" onClick={() => removeItem(idx)} className="text-rose-500">x</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs">
                <span className="text-slate-500">Tạm tính</span>
                <span className="text-right font-semibold text-slate-700">{money.format(draftSubtotal)}</span>
                <span className="text-slate-500">Tổng dự kiến</span>
                <span className="text-right font-bold text-indigo-700">{money.format(draftTotal)}</span>
              </div>
            </div>

            <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              <FileCheck2 className="h-4 w-4" /> {saving ? 'Đang tạo...' : 'Tạo hóa đơn'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã hóa đơn</th>
                <th className="px-4 py-3">Deal / Khách hàng</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Đang tải...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Chưa có hóa đơn</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-700">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <p>{inv.deal?.title}</p>
                    <p>{inv.customer?.name}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{money.format(inv.totalAmount)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[inv.status] || STATUS_STYLE.DRAFT}`}>{inv.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select value={inv.status} onChange={(e) => changeStatus(inv.id, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => onDelete(inv.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

export default Invoices;
