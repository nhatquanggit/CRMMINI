import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckSquare,
  Users,
  Plus,
  RefreshCw
} from 'lucide-react';
import calendarApi from '../api/calendarApi';

// ─── Helpers ───────────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isToday = (d) => isSameDay(d, new Date());

// Map source/type → visual config
const eventConfig = (event) => {
  if (event.source === 'task') {
    const priorityColors = {
      URGENT: 'bg-purple-600 text-white',
      HIGH: 'bg-red-500 text-white',
      MEDIUM: 'bg-amber-500 text-white',
      LOW: 'bg-blue-500 text-white'
    };
    return {
      color: priorityColors[event.priority] || 'bg-blue-500 text-white',
      dot: 'bg-blue-500',
      icon: CheckSquare,
      label: 'Nhiệm vụ'
    };
  }
  if (event.source === 'appointment') {
    const isMeeting = event.type === 'MEETING';
    return {
      color: isMeeting ? 'bg-orange-500 text-white' : 'bg-green-500 text-white',
      dot: isMeeting ? 'bg-orange-500' : 'bg-green-500',
      icon: CalendarDays,
      label: isMeeting ? 'Cuộc hẹn (Meeting)' : 'Cuộc hẹn (Appointment)'
    };
  }
  // Meeting activity
  return {
    color: 'bg-orange-500 text-white',
    dot: 'bg-orange-500',
    icon: Users,
    label: 'Cuộc hẹn'
  };
};

// Build the 6-week grid for month view
const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay(); // 0=Sun

  const days = [];
  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Next month padding to fill 6 rows
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push(new Date(year, month + 1, d));
  }
  return days;
};

// ─── Event Popup ────────────────────────────────────────────────────────────

function EventPopup({ event, onClose }) {
  if (!event) return null;
  const cfg = eventConfig(event);
  const Icon = cfg.icon;
  const date = new Date(event.eventDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 rounded-t-2xl p-4 ${cfg.color}`}>
          <Icon className="h-5 w-5 shrink-0" />
          <span className="flex-1 font-semibold text-sm">{event.title}</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {date.toLocaleDateString('vi-VN', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
              {' '}
              {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {event.description && (
            <p className="text-slate-500 bg-slate-50 rounded-xl p-3 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {event.source === 'task' && event.priority && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                Mức độ: {event.priority}
              </span>
            )}
            {event.customer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                👤 {event.customer.name}
              </span>
            )}
            {event.deal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                🤝 {event.deal.title}
              </span>
            )}
            {event.assignee && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                ✔ {event.assignee.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Month Grid ──────────────────────────────────────────────────────────────

function MonthView({ year, month, events, onSelectEvent }) {
  const days = buildMonthGrid(year, month);
  const today = new Date();

  const eventsOnDay = (day) =>
    events.filter((e) => isSameDay(new Date(e.eventDate), day));

  return (
    <div className="flex-1 overflow-auto">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const dayEvents = eventsOnDay(day);
          const todayClass = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[110px] p-1.5 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/60'}`}
            >
              <span
                className={`mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium
                  ${todayClass ? 'bg-blue-600 text-white' : isCurrentMonth ? 'text-slate-800' : 'text-slate-300'}`}
              >
                {day.getDate()}
              </span>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const cfg = eventConfig(ev);
                  return (
                    <button
                      key={`${ev.source}-${ev.id}`}
                      onClick={() => onSelectEvent(ev)}
                      className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium leading-4 ${cfg.color} hover:opacity-80 transition`}
                    >
                      {ev.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-[11px] text-slate-400">
                    +{dayEvents.length - 3} nữa
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ───────────────────────────────────────────────────────────────

function WeekView({ currentDate, events, onSelectEvent }) {
  // Build 7 days of this week (Sun–Sat)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const eventsOnDay = (day) =>
    events.filter((e) => isSameDay(new Date(e.eventDate), day));

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {days.map((day, i) => (
          <div key={i} className="py-2 text-center">
            <p className="text-xs font-semibold text-slate-500">{WEEKDAYS_SHORT[i]}</p>
            <span
              className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
                ${isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-800'}`}
            >
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 divide-x divide-slate-100">
        {days.map((day, i) => {
          const dayEvents = eventsOnDay(day);
          return (
            <div key={i} className="min-h-[300px] p-2 space-y-1">
              {dayEvents.map((ev) => {
                const cfg = eventConfig(ev);
                const Icon = cfg.icon;
                return (
                  <button
                    key={`${ev.source}-${ev.id}`}
                    onClick={() => onSelectEvent(ev)}
                    className={`flex w-full items-start gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-medium ${cfg.color} hover:opacity-90 transition`}
                  >
                    <Icon className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="line-clamp-2 leading-4">{ev.title}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({ currentDate, events, onSelectEvent }) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.eventDate), currentDate))
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  return (
    <div className="flex-1 overflow-auto p-6">
      <h3 className="mb-4 text-base font-semibold text-slate-700">
        {currentDate.toLocaleDateString('vi-VN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })}
      </h3>

      {dayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <CalendarDays className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Không có sự kiện nào trong ngày này</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEvents.map((ev) => {
            const cfg = eventConfig(ev);
            const Icon = cfg.icon;
            const date = new Date(ev.eventDate);
            return (
              <button
                key={`${ev.source}-${ev.id}`}
                onClick={() => onSelectEvent(ev)}
                className="flex w-full items-start gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 hover:shadow-md transition"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {ev.customer && ` · ${ev.customer.name}`}
                  </p>
                  {ev.description && (
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{ev.description}</p>
                  )}
                </div>
                <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: 'bg-blue-500',   label: 'Task — Thấp' },
    { color: 'bg-amber-500',  label: 'Task — Trung bình' },
    { color: 'bg-red-500',    label: 'Task — Cao' },
    { color: 'bg-purple-600', label: 'Task — Khẩn cấp' },
    { color: 'bg-orange-500', label: 'Cuộc hẹn (Meeting)' },
    { color: 'bg-green-500',  label: 'Cuộc hẹn (Appointment)' }
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function AppointmentFormModal({ open, form, onChange, onSubmit, onClose, saving }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Tạo cuộc hẹn mới</h3>
            <p className="mt-1 text-sm text-slate-500">Nhập thông tin để lên lịch và nhận thông báo đúng ngày.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Tiêu đề
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                placeholder="Tên cuộc hẹn"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Loại
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              >
                <option value="APPOINTMENT">Cuộc hẹn (Appointment)</option>
                <option value="MEETING">Cuộc họp (Meeting)</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-700">
              Bắt đầu
              <input
                name="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                required
              />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              Kết thúc
              <input
                name="endTime"
                type="datetime-local"
                value={form.endTime}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
                required
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-slate-700">
            Nhắc trước
            <input
              name="remindAt"
              type="datetime-local"
              value={form.remindAt}
              onChange={onChange}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              placeholder="Chọn thời gian nhắc"
            />
            <span className="text-xs text-slate-400">Nếu để trống, hệ thống sẽ dùng giờ bắt đầu làm nhắc nhở.</span>
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            Ghi chú
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              className="w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white"
              placeholder="Thông tin thêm cho cuộc hẹn"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Đang lưu...' : 'Lưu cuộc hẹn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Calendar Page ──────────────────────────────────────────────────────

export default function Calendar() {
  const [viewMode, setViewMode] = useState('month'); // month | week | day
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [hasNotifiedToday, setHasNotifiedToday] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    remindAt: '',
    type: 'APPOINTMENT'
  });

  const normalizeEvents = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.events)) return payload.events;
    return [];
  };

  // Compute date range based on view
  const getDateRange = useCallback(() => {
    if (viewMode === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    // day
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [viewMode, currentDate]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const res = await calendarApi.getEvents(start, end);
      setEvents(normalizeEvents(res?.data));
    } catch (e) {
      console.error('Failed to load calendar events', e);
      setEvents([]);
      const status = e.response?.status;
      const message = e.response?.data?.message || e.message || 'Unknown error';
      toast.error(`Không thể tải lịch: ${status ? `HTTP ${status}` : ''} ${message}`);
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + direction);
    else if (viewMode === 'week') d.setDate(d.getDate() + direction * 7);
    else d.setDate(d.getDate() + direction);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  useEffect(() => {
    setHasNotifiedToday(false);
  }, [currentDate, viewMode]);

  const resetAppointmentForm = () => {
    setAppointmentForm({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      remindAt: '',
      type: 'APPOINTMENT'
    });
  };

  const handleAppointmentChange = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAppointment = async (event) => {
    event.preventDefault();

    const { title, startTime, endTime, location, description, remindAt } = appointmentForm;
    if (!title.trim() || !startTime || !endTime) {
      toast.error('Vui lòng điền tiêu đề và thời gian bắt đầu/kết thúc.');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (Number(endDate) <= Number(startDate)) {
      toast.error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    try {
      setSavingAppointment(true);
      await calendarApi.createAppointment({
        title: title.trim(),
        description: description.trim() || undefined,
        startTime,
        endTime,
        location: location.trim() || undefined,
        remindAt: remindAt || undefined,
        type: appointmentForm.type
      });

      toast.success('Đã tạo cuộc hẹn thành công.');
      setShowAppointmentForm(false);
      resetAppointmentForm();
      fetchEvents();
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Tạo cuộc hẹn thất bại: ${status ? `HTTP ${status}` : ''} ${message}`);
    } finally {
      setSavingAppointment(false);
    }
  };

  const notifyAppointment = (appointment) => {
    const reminderTime = appointment.remindAt ? new Date(appointment.remindAt) : new Date(appointment.eventDate);
    const title = appointment.title;
    const eventTime = reminderTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    toast(`Nhắc: ${title} lúc ${eventTime}`, { duration: 7000 });

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nhắc cuộc hẹn', {
        body: `${title} lúc ${eventTime}`
      });
    }
  };

  useEffect(() => {
    if (!window.Notification) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const todaysAppointments = events.filter(
      (event) => event.source === 'appointment' && isToday(new Date(event.eventDate))
    );

    if (todaysAppointments.length > 0 && !hasNotifiedToday) {
      toast.success(`Bạn có ${todaysAppointments.length} cuộc hẹn trong ngày hôm nay.`);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cuộc hẹn hôm nay', {
          body: `Bạn có ${todaysAppointments.length} cuộc hẹn trong ngày hôm nay.`
        });
      }
      setHasNotifiedToday(true);
    }
  }, [events, hasNotifiedToday]);

  useEffect(() => {
    const timers = [];

    events.forEach((event) => {
      if (event.source !== 'appointment') return;
      const remindDate = event.remindAt ? new Date(event.remindAt) : new Date(event.eventDate);
      const msUntilReminder = remindDate.getTime() - Date.now();
      if (msUntilReminder > 0 && msUntilReminder <= 24 * 60 * 60 * 1000) {
        timers.push(setTimeout(() => notifyAppointment(event), msUntilReminder));
      }
    });

    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
    };
  }, [events]);

  // Header title
  const headerTitle = () => {
    if (viewMode === 'month') {
      return `${MONTHS_VI[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'week') {
      const { start, end } = getDateRange();
      return `${start.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} – ${end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const totalEvents = events.length;
  const taskCount = events.filter((e) => e.source === 'task').length;
  const meetingCount = events.filter((e) => e.source === 'meeting').length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Page Header ── */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Lịch & Cuộc hẹn</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {loading
                ? 'Đang tải...'
                : `${totalEvents} sự kiện — ${taskCount} task, ${meetingCount} cuộc hẹn`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              {[
                { key: 'month', label: 'Tháng' },
                { key: 'week', label: 'Tuần' },
                { key: 'day', label: 'Ngày' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                    viewMode === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAppointmentForm(true)}
              className="rounded-xl border border-emerald-500 bg-white px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Tạo cuộc hẹn
            </button>

            {/* Refresh */}
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation bar */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={goToday}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Hôm nay
          </button>

          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <h2 className="text-base font-semibold text-slate-800">{headerTitle()}</h2>
        </div>
      </div>

      {/* ── Legend ── */}
      <Legend />

      {/* ── Calendar body ── */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <p className="text-sm">Đang tải sự kiện...</p>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'month' && (
            <MonthView
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
              events={events}
              onSelectEvent={setSelectedEvent}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onSelectEvent={setSelectedEvent}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onSelectEvent={setSelectedEvent}
            />
          )}
        </>
      )}

      {/* ── Appointment modal ── */}
      <AppointmentFormModal
        open={showAppointmentForm}
        form={appointmentForm}
        onChange={handleAppointmentChange}
        onSubmit={handleCreateAppointment}
        onClose={() => setShowAppointmentForm(false)}
        saving={savingAppointment}
      />

      {/* ── Event popup ── */}
      {selectedEvent && (
        <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
