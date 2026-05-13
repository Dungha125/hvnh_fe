import axios from '@/configs/axios.js';

/**
 * Gắn adapter cho CKEditor FileRepository (Image upload).
 * - Nếu có VITE_CKEDITOR_UPLOAD_URL: POST multipart, field mặc định "upload" (đổi bằng VITE_CKEDITOR_UPLOAD_FIELD).
 * - Nếu không: nhúng ảnh dạng data URL (base64) — không cần backend, HTML có thể nặng.
 */
export function ckeditorFileRepositoryUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
    new HybridUploadAdapter(loader);
}

class HybridUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then((file) => {
      const uploadUrl = import.meta.env.VITE_CKEDITOR_UPLOAD_URL?.trim();
      if (uploadUrl) {
        return this.uploadToServer(file, uploadUrl);
      }
      return this.readAsDataUrl(file);
    });
  }

  abort() {}

  readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ default: reader.result });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async uploadToServer(file, uploadUrl) {
    const field = import.meta.env.VITE_CKEDITOR_UPLOAD_FIELD?.trim() || 'upload';
    const fd = new FormData();
    fd.append(field, file);
    const res = await axios.post(uploadUrl, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const body = res?.data;
    const url =
      body?.url ??
      body?.default ??
      (typeof body?.data === 'string' ? body.data : body?.data?.url ?? body?.data?.path) ??
      body?.location ??
      null;
    if (!url) {
      throw new Error('Upload ảnh: API không trả URL (url / default / data).');
    }
    return { default: toAbsoluteImageUrl(url) };
  }
}

function toAbsoluteImageUrl(url) {
  if (typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
  if (!base) return url.startsWith('/') ? url : `/${url}`;
  return `${base}/${url.replace(/^\//, '')}`;
}
