import { useEffect, useMemo, useState } from 'react';
import { CirclePlus, Headset, Pencil, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSupportTicketApi,
  deleteSupportTicketApi,
  getSupportTicketsApi,
  updateSupportTicketApi
} from '../api/supportTicketApi';
import { getCustomersApi } from '../api/customerApi';
import { useAuthStore } from '../store/authStore';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_STYLE = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-700'
};

const PRIORITY_STYLE = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-cyan-100 text-cyan-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-rose-100 text-rose-700'
};

const emptyForm = {
  subject: '',
  description: '',
  status: 'OPEN',
  priority: 'MEDIUM',
  category: '',
  customerId: '',
  assignedTo: '',
  dueDate: ''
};

function SupportTickets() {
  const user = useAuthStore((s) => s.user);
  const canManageAll = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      const okQ = !q || t.subject?.toLowerCase().includes(q) || t.ticketNo?.toLowerCase().includes(q);
      const okS = !statusFilter || t.status === statusFilter;
      const okP = !priorityFilter || t.priority === priorityFilter;
      return okQ && okS && okP;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  const stats = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
    done: tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length,
    urgent: tickets.filter((t) => t.priority === 'URGENT').length
  }), [tickets]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketRows, customerRows] = await Promise.all([
        getSupportTicketsApi(),
        getCustomersApi()
      ]);
      setTickets(ticketRows || []);
      setCustomers(customerRows || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Khong tai duoc support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onEdit = (ticket) => {
    setEditingId(ticket.id);
    setForm({
      subject: ticket.subject || '',
      description: ticket.description || '',
      status: ticket.status || 'OPEN',
      priority: ticket.priority || 'MEDIUM',
      category: ticket.category || '',
      customerId: ticket.customerId ? String(ticket.customerId) : '',
      assignedTo: ticket.assignedTo ? String(ticket.assignedTo) : '',
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().slice(0, 10) : ''
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        subject: form.subject,
        description: form.description,
        status: form.status,
        priority: form.priority,
        category: form.category || null,
        customerId: form.customerId ? Number(form.customerId) : null,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null
      };

      if (editingId) {
        await updateSupportTicketApi(editingId, payload);
        toast.success('Cap nhat ticket thanh cong');
      } else {
        await createSupportTicketApi(payload);
        toast.success('Tao ticket thanh cong');
      }

      resetForm();
      await loadData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Luu ticket that bai');
    } finally {
      setSaving(false);
    }
  };

  const onQuickStatus = async (ticket, status) => {
    try {
      const updated = await updateSupportTicketApi(ticket.id, { status });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      toast.success('Da cap nhat trang thai');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Khong cap nhat duoc trang thai');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Ban co chac muon xoa support ticket nay?')) return;
    try {
      await deleteSupportTicketApi(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success('Da xoa support ticket');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Xoa support ticket that bai');
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm">
            <Headset className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Support Tickets</h2>
            <p className="text-xs text-slate-500">Theo doi ticket ho tro theo khach hang, uu tien va SLA</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tong tickets</p><p className="text-2xl font-bold text-slate-900">{stats.all}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Dang mo</p><p className="text-2xl font-bold text-blue-700">{stats.open}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Da xu ly</p><p className="text-2xl font-bold text-emerald-700">{stats.done}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Muc URGENT</p><p className="text-2xl font-bold text-rose-700">{stats.urgent}</p></article>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[400px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            {editingId ? <><Pencil className="h-4 w-4 text-amber-500" /> Cap nhat ticket</> : <><CirclePlus className="h-4 w-4 text-blue-600" /> Tao ticket moi</>}
          </h3>

          <form className="space-y-3" onSubmit={onSubmit}>
            <input name="subject" value={form.subject} onChange={onChange} required placeholder="Tieu de ticket" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            <textarea name="description" value={form.description} onChange={onChange} required rows={3} placeholder="Mo ta van de" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />

            <div className="grid grid-cols-2 gap-2">
              <select name="status" value={form.status} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select name="priority" value={form.priority} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input name="category" value={form.category} onChange={onChange} placeholder="Category" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
              <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
            </div>

            <select name="customerId" value={form.customerId} onChange={onChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <option value="">Khong gan customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {canManageAll ? (
              <input
                name="assignedTo"
                value={form.assignedTo}
                onChange={onChange}
                type="number"
                min="1"
                placeholder="Assigned user ID (de trong = auto)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            ) : null}

            <div className="flex items-center gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {editingId ? 'Luu thay doi' : 'Tao ticket'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600">
                  Huy
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Danh sach support tickets</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tim ticket" className="rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
                <option value="">Status</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
                <option value="">Priority</option>
                {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Dang tai...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Chua co support ticket nao</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <article key={ticket.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">{ticket.ticketNo} {ticket.customer?.name ? `• ${ticket.customer.name}` : ''}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{ticket.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[ticket.status] || STATUS_STYLE.OPEN}`}>{ticket.status}</span>
                        <span className={`rounded-full px-2 py-0.5 ${PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.MEDIUM}`}>{ticket.priority}</span>
                        {ticket.category && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{ticket.category}</span>}
                        {ticket.assignee?.name && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Assignee: {ticket.assignee.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={ticket.status}
                        onChange={(e) => onQuickStatus(ticket, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => onEdit(ticket)} className="rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-600"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => onDelete(ticket.id)} className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
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

export default SupportTickets;
