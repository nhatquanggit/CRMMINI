import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { getAvatarApi, uploadAvatarApi } from '../../api/settingsApi';

type AvatarUploaderProps = {
  onUploaded?: (imageUrl: string) => void;
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function AvatarUploader({ onUploaded }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const loadCurrentAvatar = async () => {
      try {
        const result = await getAvatarApi();
        if (result?.imageUrl) {
          setPreview(result.imageUrl);
          onUploaded?.(result.imageUrl);
        }
      } catch {
        // Keep silent because users may not have an avatar yet.
      }
    };

    loadCurrentAvatar();
  }, [onUploaded]);

  const canUpload = useMemo(() => !uploading, [uploading]);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Chi chap nhan JPG, PNG hoac WEBP.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kich thuoc toi da la 5MB.');
      return false;
    }

    return true;
  };

  const handleFile = async (file: File) => {
    if (!canUpload || !validateFile(file)) {
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const result = await uploadAvatarApi(file);
      setPreview(result.imageUrl);
      onUploaded?.(result.imageUrl);
      toast.success('Cap nhat avatar thanh cong.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload avatar that bai.');
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  };

  const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={async (event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            await handleFile(file);
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-5 transition ${
          dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-sm">
            {preview ? (
              <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-400">
                <ImagePlus className="h-10 w-10" />
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Keo tha anh vao day hoac bam de chon</p>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP. Toi da 5MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onInputChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Cap nhat avatar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarUploader;
