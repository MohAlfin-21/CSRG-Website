/**
 * Centralized Configuration for CSRG Frontend
 * Supports both Vite (import.meta.env.VITE_*) and CRA (process.env.REACT_APP_*) formats
 */

const str = (v) => (typeof v === 'string' ? v : undefined);

const envBackendUrl =
  (typeof import.meta !== 'undefined' && import.meta.env ? str(import.meta.env.VITE_BACKEND_URL) : undefined) ??
  (typeof import.meta !== 'undefined' && import.meta.env ? str(import.meta.env.REACT_APP_BACKEND_URL) : undefined) ??
  (typeof process !== 'undefined' && process.env ? str(process.env.REACT_APP_BACKEND_URL) : undefined);

const isProduction = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD);

export const BACKEND_URL = (() => {
  if (envBackendUrl !== undefined) {
    // Pada mode produksi, jika URL masih merujuk ke localhost:8000 / 127.0.0.1:8000 (misal akibat bawaan file .env dev),
    // paksa menjadi string kosong agar seluruh request diarahkan ke same-origin (/api).
    if (isProduction && (envBackendUrl === 'http://localhost:8000' || envBackendUrl === 'http://127.0.0.1:8000')) {
      return '';
    }
    return envBackendUrl;
  }
  return isProduction ? '' : 'http://localhost:8000';
})();

export const API_URL = `${BACKEND_URL}/api`;

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Skema data: dan blob: (preview in-memory / canvas / FileReader) dibiarkan apa adanya
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Normalisasi URL MinIO (baik http://localhost:9000/csrg-media/..., http://minio:9000/csrg-media/...,
  // maupun URL dengan host/port lain) menjadi path relatif same-origin /csrg-media/...
  if (trimmed.includes('/csrg-media/')) {
    return '/csrg-media/' + trimmed.split('/csrg-media/').pop().split('?')[0];
  }

  // URL eksternal absolut (HTTPS/HTTP seperti Unsplash, dll.) tetap dibuka apa adanya
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }

  // Aset statis publik frontend (misal: /MataElang.png, /mataelang_preview.png, /logo.png)
  // yang berawalan "/" tetapi bukan legacy upload backend ("/uploads/")
  if (trimmed.startsWith('/') && !trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  // Legacy local upload path (/uploads/photos/...) atau nama file saja (uuid.webp)
  // Dilayani melalui endpoint backend /api/files/photos/{filename}
  const filename = trimmed.split('/').pop().split('?')[0];
  return `${BACKEND_URL}/api/files/photos/${filename}`;
};
