import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CirclePlus,
  Mail,
  Pencil,
  Phone,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react';
import {
  createCustomerApi,
  deleteCustomerApi,
  getCustomersApi,
  updateCustomerApi
} from '../api/customerApi';
import { useAuthStore } from '../store/authStore';

const emptyForm = { name: '', email: '', phone: '', company: '', status: 'NEW', leadSource: 'OTHER' };

const LEAD_SOURCE_LABELS = {
  WEBSITE: 'Website',
  FACEBOOK: 'Facebook',
  ZALO: 'Zalo',
  REFERRAL: 'Gioi thieu',
  EVENT: 'Su kien',
  ADS: 'Quang cao',
  OTHER: 'Khac'
};

const STATUS_CONFIG = {
  NEW:       { label: 'Khach moi',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100',   dot: 'bg-blue-500'   },
  CONTACTED: { label: 'Da lien he',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100',  dot: 'bg-amber-500'  },
  CONVERTED: { label: 'Da chuyen',   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
};

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-600',
];

const getInitials = (name) => {
  const parts = (name || '').split(' ').filter(Boolean);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || '?').toUpperCase();
};

const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

function Customers() {
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const totalCustomers = items.length;
  const convertedCustomers = useMemo(
    () => items.filter((item) => item.status === 'CONVERTED').length,
    [items]
  );
  const contactedCustomers = useMemo(
    () => items.filter((item) => item.status === 'CONTACTED').length,
    [items]
  );

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getCustomersApi();
      setItems(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Khong tai duoc danh sach khach hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return items;
    }
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q)
    );
  }, [items, query]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await updateCustomerApi(editingId, form);
      } else {
        await createCustomerApi(form);
      }
      resetForm();
      await loadCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Luu khach hang that bai');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      email: item.email,
      phone: item.phone,
      company: item.company,
      status: item.status,
      leadSource: item.leadSource || 'OTHER'
    });
  };

  const onDelete = async (id) => {
    const confirmed = window.confirm('Ban chac chan muon xoa khach hang nay?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomerApi(id);
      await loadCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Xoa khach hang that bai');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Khach hang</h2>
            <p className="text-xs text-slate-500">Quan ly danh sach va trang thai cham soc</p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tim ten, email, cong ty..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tong khach hang', value: totalCustomers, color: 'from-violet-500 to-indigo-600' },
          { label: 'Dang lien he',    value: contactedCustomers, color: 'from-amber-500 to-orange-500' },
          { label: 'Da chuyen doi',   value: convertedCustomers, color: 'from-emerald-500 to-teal-600' },
        ].map((item) => (
          <article key={item.label} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`absolute right-3 top-3 h-8 w-8 rounded-lg bg-gradient-to-br ${item.color} opacity-10`} />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{item.label}</p>
            <p className={`mt-1 bg-gradient-to-br ${item.color} bg-clip-text text-2xl font-bold text-transparent`}>{item.value}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        {/* Form Panel */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            {editingId
              ? <><Pencil className="h-4 w-4 text-amber-500" /> Cap nhat khach hang</>
              : <><CirclePlus className="h-4 w-4 text-blue-600" /> Them khach hang</>}
          </h3>

          <form className="space-y-3" onSubmit={onSubmit}>
            {[{ name: 'name', label: 'Ho ten', placeholder: 'Nguyen Van A', type: 'text' },
              { name: 'email', label: 'Email', placeholder: 'email@congty.com', type: 'email' },
              { name: 'phone', label: 'So dien thoai', placeholder: '0901 234 567', type: 'text' },
              { name: 'company', label: 'Cong ty', placeholder: 'Ten cong ty', type: 'text' },
            ].map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{field.label}</label>
                <input
                  name={field.name}
                  type={field.type}
                  value={form[field.name]}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                  required
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Trang thai</label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, status: key }))}
                    className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-semibold transition ${
                      form.status === key
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-blue-500/20`
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {form.status === key && <Check className="h-3 w-3" />}
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Nguon lead</label>
              <select
                name="leadSource"
                value={form.leadSource}
                onChange={onChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              >
                {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Dang luu...' : editingId ? 'Cap nhat' : 'Them moi'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-4 w-4" /> Huy
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Table Panel */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-base font-bold text-slate-900">Danh sach khach hang</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{filtered.length} khach</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1,2,3,4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Khach hang</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Cong ty</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Trang thai</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Nguon</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Phu trach</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Hanh dong</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">Khong tim thay khach hang nao</td>
                    </tr>
                  ) : filtered.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(item.name)} text-xs font-bold text-white shadow-sm`}>
                            {getInitials(item.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="h-3 w-3" />{item.email}
                            </p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                              <Phone className="h-3 w-3" />{item.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />{item.company}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                          {LEAD_SOURCE_LABELS[item.leadSource] || item.leadSource || 'Khac'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-600">{item.assignee?.name || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Sua
                          </button>
                          {(user?.role === 'ADMIN' || item.assignedTo === user?.id) && (
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Xoa
                            </button>
                          )}
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

export default Customers;
