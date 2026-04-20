import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Users,
  Handshake,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import importExportApi from '../api/importExportApi';

// ─── Helpers ─────────────────────────────────────────────────

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── Export tab ───────────────────────────────────────────────

function ExportTab() {
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingDeals,     setLoadingDeals]     = useState(false);

  const handleExport = async (type) => {
    const isCustomers = type === 'customers';
    const setLoading = isCustomers ? setLoadingCustomers : setLoadingDeals;
    setLoading(true);
    try {
      const res = isCustomers
        ? await importExportApi.downloadCustomers()
        : await importExportApi.downloadDeals();

      const date = new Date().toISOString().slice(0, 10);
      const filename = isCustomers ? `customers_${date}.xlsx` : `deals_${date}.xlsx`;
      triggerDownload(res.data, filename);
      toast.success(`Đã tải xuống ${filename}`);
    } catch (e) {
      toast.error('Xuất file thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      key: 'customers',
      icon: Users,
      title: 'Xuất Khách hàng',
      desc: 'Tất cả thông tin khách hàng: tên, email, điện thoại, công ty, trạng thái, nhân viên phụ trách.',
      color: 'from-blue-500 to-blue-600',
      loading: loadingCustomers
    },
    {
      key: 'deals',
      icon: Handshake,
      title: 'Xuất Deals',
      desc: 'Danh sách deals: tiêu đề, giá trị, giai đoạn, khách hàng, nhân viên phụ trách.',
      color: 'from-purple-500 to-purple-600',
      loading: loadingDeals
    }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          File Excel (.xlsx) sẽ được tải về máy tính của bạn. Bạn chỉ thấy dữ liệu mà mình có quyền xem.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ key, icon: Icon, title, desc, color, loading }) => (
          <div key={key} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex flex-col gap-4">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
            <button
              onClick={() => handleExport(key)}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition disabled:opacity-60"
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {loading ? 'Đang xuất...' : 'Tải xuống Excel'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Import result summary ────────────────────────────────────

function ImportResult({ result }) {
  if (!result) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-500" />
        Kết quả Import
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Tổng dòng',    value: result.total,    color: 'text-slate-900' },
          { label: 'Hợp lệ',       value: result.valid,    color: 'text-blue-600' },
          { label: 'Thêm mới',     value: result.inserted, color: 'text-green-600' },
          { label: 'Bỏ qua',       value: result.skipped,  color: 'text-amber-600' }
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {result.errors?.length > 0 && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="mb-2 text-xs font-semibold text-red-700 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            Lỗi / Bỏ qua ({result.errors.length})
          </p>
          <ul className="max-h-40 overflow-y-auto space-y-1">
            {result.errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600">• {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Import tab ───────────────────────────────────────────────

const TEMPLATE_HEADERS = ['name', 'email', 'phone', 'company', 'status'];
const TEMPLATE_EXAMPLE = [
  ['Nguyễn Văn A', 'nguyenvana@example.com', '0901234567', 'Công ty ABC', 'NEW'],
  ['Trần Thị B',   'tranthib@example.com',   '0912345678', 'Tập đoàn XYZ', 'CONTACTED']
];

function ImportTab() {
  const fileInputRef  = useRef(null);
  const [file,        setFile]        = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState(null);
  const [dragOver,    setDragOver]    = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const ok = /\.(xlsx?|csv)$/i.test(f.name);
    if (!ok) { toast.error('Chỉ chấp nhận file .xlsx, .xls, .csv'); return; }
    setFile(f);
    setResult(null);
    setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await importExportApi.importCustomers(file, setProgress);
      setResult(res.data.data);
      toast.success(res.data.message);
      setFile(null);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Import thất bại');
    } finally {
      setUploading(false);
    }
  };

  // Download template CSV
  const downloadTemplate = () => {
    const lines = [
      TEMPLATE_HEADERS.join(','),
      ...TEMPLATE_EXAMPLE.map((r) => r.map((c) => `"${c}"`).join(','))
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, 'import_customers_template.csv');
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-2">
        <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
          <Info className="h-4 w-4" /> Hướng dẫn Import
        </p>
        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
          <li>File Excel (.xlsx) hoặc CSV, tối đa 5MB và 1.000 dòng.</li>
          <li>Bắt buộc: cột <code className="bg-amber-100 px-1 rounded">name</code>, <code className="bg-amber-100 px-1 rounded">email</code>.</li>
          <li>Tùy chọn: <code className="bg-amber-100 px-1 rounded">phone</code>, <code className="bg-amber-100 px-1 rounded">company</code>, <code className="bg-amber-100 px-1 rounded">status</code> (NEW/CONTACTED/CONVERTED).</li>
          <li>Email đã tồn tại sẽ bị bỏ qua (không ghi đè).</li>
        </ul>
        <button
          onClick={downloadTemplate}
          className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition"
        >
          <Download className="h-3.5 w-3.5" />
          Tải về file mẫu CSV
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={`relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition
          ${dragOver
            ? 'border-blue-400 bg-blue-50'
            : file
            ? 'border-green-400 bg-green-50'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {file ? (
          <>
            <FileSpreadsheet className="h-10 w-10 text-green-500" />
            <p className="text-sm font-semibold text-green-700">{file.name}</p>
            <p className="text-xs text-slate-400">
              {(file.size / 1024).toFixed(1)} KB · Click để đổi file
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              Kéo thả file vào đây hoặc <span className="text-blue-600 underline">chọn file</span>
            </p>
            <p className="text-xs text-slate-400">.xlsx, .xls, .csv · Tối đa 5MB</p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Đang upload...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
          : <><Upload className="h-4 w-4" /> Bắt đầu Import</>}
      </button>

      {/* Result */}
      <ImportResult result={result} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────

export default function ImportExport() {
  const [tab, setTab] = useState('export');

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Import / Export dữ liệu</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Xuất dữ liệu ra Excel · Nhập khách hàng từ file CSV/Excel
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 w-fit gap-1">
        {[
          { key: 'export', icon: Download, label: 'Xuất dữ liệu' },
          { key: 'import', icon: Upload,   label: 'Nhập dữ liệu' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all
              ${tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        {tab === 'export' ? <ExportTab /> : <ImportTab />}
      </div>
    </div>
  );
}
