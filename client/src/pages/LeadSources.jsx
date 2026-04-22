import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Globe, Megaphone, Share2, Smartphone, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUiStore } from '../store/uiStore';
import { useTranslation } from '../i18n';
import { getLeadSourceStatsApi } from '../api/leadSourceApi';

const SOURCE_CONFIG = {
  WEBSITE: { label: 'Website', icon: Globe, color: 'from-blue-500 to-cyan-500' },
  FACEBOOK: { label: 'Facebook', icon: Users2, color: 'from-indigo-500 to-blue-600' },
  ZALO: { label: 'Zalo', icon: Smartphone, color: 'from-sky-500 to-blue-500' },
  REFERRAL: { label: 'Giới thiệu', icon: Share2, color: 'from-emerald-500 to-teal-600' },
  EVENT: { label: 'Sự kiện', icon: BarChart3, color: 'from-violet-500 to-purple-600' },
  ADS: { label: 'Quảng cáo', icon: Megaphone, color: 'from-amber-500 to-orange-500' },
  OTHER: { label: 'Khác', icon: BarChart3, color: 'from-slate-500 to-slate-600' }
};

function LeadSources() {
  const language = useUiStore((s) => s.language);
  const tr = useTranslation(language);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalLeads: 0, totalConverted: 0, conversionRate: 0 });
  const [breakdown, setBreakdown] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getLeadSourceStatsApi();
      setSummary(data.summary || { totalLeads: 0, totalConverted: 0, conversionRate: 0 });
      setBreakdown(data.breakdown || []);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không tải được thong ke nguon lead');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const maxTotal = useMemo(() => Math.max(1, ...breakdown.map((b) => b.total)), [breakdown]);

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Lead Source Analytics</h2>
          <p className="text-xs text-slate-500">Theo dõi hiệu quả các kênh tạo khách hàng</p>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Tong leads</p><p className="text-2xl font-bold text-slate-900">{summary.totalLeads}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Đã chuyển đổi</p><p className="text-2xl font-bold text-emerald-700">{summary.totalConverted}</p></article>
        <article className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Ty le chuyển đổi</p><p className="text-2xl font-bold text-indigo-700">{summary.conversionRate}%</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="space-y-2 p-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <div className="space-y-3">
            {breakdown.map((item) => {
              const cfg = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.OTHER;
              const Icon = cfg.icon;
              const width = Math.max(2, Math.round((item.total / maxTotal) * 100));

              return (
                <article key={item.source} className="rounded-xl border border-slate-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{cfg.label}</p>
                        <p className="text-xs text-slate-500">{item.converted}/{item.total} chuyển đổi ({item.conversionRate}%)</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{item.total}</p>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full bg-gradient-to-r ${cfg.color}`} style={{ width: `${width}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default LeadSources;

