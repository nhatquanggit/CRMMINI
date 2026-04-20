import { useEffect, useMemo, useState } from 'react';
import { Box, CirclePlus, PackageSearch, Pencil, Search, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createProductApi, deleteProductApi, getProductsApi, updateProductApi } from '../api/productApi';
import { useAuthStore } from '../store/authStore';

const emptyForm = {
  sku: '',
  name: '',
  category: '',
  unit: 'item',
  price: '',
  description: '',
  isActive: true
};

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

function Products() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const rows = await getProductsApi({ search: query || undefined });
      setProducts(rows || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được danh mục sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const totals = useMemo(() => ({
    all: products.length,
    active: products.filter((p) => p.isActive).length,
    categoryCount: new Set(products.map((p) => p.category).filter(Boolean)).size,
    avgPrice: products.length ? products.reduce((s, p) => s + Number(p.price || 0), 0) / products.length : 0
  }), [products]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({
      sku: item.sku,
      name: item.name,
      category: item.category || '',
      unit: item.unit || 'item',
      price: String(item.price ?? ''),
      description: item.description || '',
      isActive: Boolean(item.isActive)
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('Bạn không có quyền chỉnh sửa danh mục sản phẩm');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        category: form.category || null,
        unit: form.unit,
        price: Number(form.price),
        description: form.description || null,
        isActive: Boolean(form.isActive)
      };

      if (editingId) {
        await updateProductApi(editingId, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await createProductApi(payload);
        toast.success('Tạo sản phẩm thành công');
      }

      resetForm();
      await loadProducts();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!canManage) {
      toast.error('Bạn không có quyền xóa sản phẩm');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      await deleteProductApi(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success('Đã xóa sản phẩm');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Product Catalog</h2>
            <p className="text-xs text-slate-500">Danh mục sản phẩm dùng cho báo giá và hóa đơn</p>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, SKU, category..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tổng sản phẩm</p><p className="text-2xl font-bold text-slate-900">{totals.all}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Đang active</p><p className="text-2xl font-bold text-emerald-700">{totals.active}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Số danh mục</p><p className="text-2xl font-bold text-blue-700">{totals.categoryCount}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Giá trung bình</p><p className="text-lg font-bold text-indigo-700">{money.format(totals.avgPrice || 0)}</p></article>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            {editingId ? <><Pencil className="h-4 w-4 text-amber-500" /> Cập nhật sản phẩm</> : <><CirclePlus className="h-4 w-4 text-blue-600" /> Thêm sản phẩm</>}
          </h3>

          {!canManage && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Tài khoản của bạn chỉ có quyền xem danh mục sản phẩm.
            </p>
          )}

          <form className="space-y-3" onSubmit={onSubmit}>
            <input name="sku" value={form.sku} onChange={onChange} placeholder="SKU (VD: PRO-001)" required disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <input name="name" value={form.name} onChange={onChange} placeholder="Tên sản phẩm" required disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <input name="category" value={form.category} onChange={onChange} placeholder="Danh mục (VD: CRM, SaaS...)" disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input name="unit" value={form.unit} onChange={onChange} placeholder="Đơn vị" disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              <input name="price" type="number" value={form.price} onChange={onChange} placeholder="Giá" required disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>
            <textarea name="description" value={form.description} onChange={onChange} placeholder="Mô tả ngắn" rows={3} disabled={!canManage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={onChange} disabled={!canManage} />
              Active
            </label>

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving || !canManage} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {editingId ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
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
            <h3 className="text-sm font-bold text-slate-900">Danh sách sản phẩm</h3>
            <span className="text-xs text-slate-500">{filtered.length} mục</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <PackageSearch className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <article key={item.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                        <Tag className="h-3 w-3" /> {item.category || 'N/A'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.unit}</span>
                      <span className={`rounded-full px-2 py-0.5 ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-sm font-bold text-indigo-700">{money.format(item.price)}</p>
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => onEdit(item)} className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => onDelete(item.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
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

export default Products;
