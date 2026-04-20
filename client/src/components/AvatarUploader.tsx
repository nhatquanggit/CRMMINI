import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, MoonStar, Sun, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { uploadAvatarApi } from '../api/settingsApi';

type AvatarUploaderProps = {
  initialAvatar?: string;
  onUploaded?: (avatarUrl: string) => void;
  darkMode?: boolean;
  onThemeChange?: (nextMode: boolean) => void;
};

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function AvatarUploader({ initialAvatar = '', onUploaded, darkMode = false, onThemeChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialAvatar);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreviewUrl(initialAvatar);
  }, [initialAvatar]);

  const currentImage = useMemo(() => previewUrl || 'https://placehold.co/160x160/e2e8f0/64748b?text=Avatar', [previewUrl]);

  const openPicker = () => inputRef.current?.click();

  const validateFile = (file: File) => {
    if (!ACCEPT_TYPES.includes(file.type)) {
      toast.error('Chi ho tro jpg, png, webp');
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setLoading(true);
    toast.loading('Dang tai avatar...', { id: 'avatar-upload' });

    try {
      // Backend API enforces: max 20 avatars/user, deletes oldest before saving a new one.
      const result = await uploadAvatarApi(file);
      setPreviewUrl(result.imageUrl);
      onUploaded?.(result.imageUrl);
      toast.success('Cap nhat avatar thanh cong', { id: 'avatar-upload' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Tai avatar that bai', { id: 'avatar-upload' });
    } finally {
      setLoading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] lg:p-7">
      <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Avatar ho so</h3>
          <p className="mt-1 text-sm text-slate-500">Tai len anh dai dien ro rang de giao dien co diem nhan va de nhan biet tai khoan nhanh hon.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
          Ho tro JPG, PNG, WEBP toi da 3MB
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <div
            onDrop={onDrop}
            onDragOver={(event) => event.preventDefault()}
            className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100 shadow-sm"
          >
            <img src={currentImage} alt="avatar preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 hidden items-center justify-center bg-slate-900/45 text-white group-hover:flex">
              <UploadCloud className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5 lg:p-6">
          <p className="text-sm font-semibold text-slate-900">Keo tha anh vao day hoac chon tu thiet bi</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Avatar se duoc dong bo len thanh ben trai, thanh tren va cac khu vuc tai khoan de giao dien nhat quan hon khi chuyen trang.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {loading ? 'Dang tai len...' : 'Cap nhat avatar'}
            </button>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Drop zone active</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Theme giao dien</p>
              <p className="mt-1 text-sm text-slate-500">Chuyen nhanh che do sang va toi ngay tai khu vuc avatar.</p>
            </div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() => onThemeChange?.(false)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  !darkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onThemeChange?.(true)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  darkMode ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'
                }`}
              >
                <MoonStar className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
    </section>
  );
}

export default AvatarUploader;
