// Small fetch wrapper: adds the JWT, parses JSON, throws readable errors.
const KEY = 'cirrs_token';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => (t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized();
  if (raw && res.ok) return res;
  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    const msg = data?.errors?.join('. ') || data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// Downloads a protected file (CSV) through fetch so the token is sent
export async function download(path, filename) {
  const res = await api(path, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

// Resize + compress a photo in the browser so uploads stay well under the 5 MB limit
export function fileToDataUrl(file, maxSide = 1280, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file'));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = url;
  });
}
