import axios from '@/configs/axios.js';

function toAbsoluteImageUrl(url) {
  if (typeof url !== 'string') return url;
  if (/^https?:\/\//i.test(url)) return url;
  const base = String(import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
  if (!base) return url.startsWith('/') ? url : `/${url}`;
  return `${base}/${url.replace(/^\//, '')}`;
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

/** Gắn FileRepository để CK5 upload ảnh (API hoặc base64). */
export function ckeditorFileRepositoryUploadAdapterPlugin(editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader) =>
    new HybridUploadAdapter(loader);
}
