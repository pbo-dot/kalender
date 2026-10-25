export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const pad = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());
export const parseDate = (s) => new Date(s + 'T00:00');
export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) =>
  (typeof d === 'string' ? parseDate(d) : d).toLocaleDateString('da-DK', opts);
export const fmtLong = (d) => fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' });

export const timeRange = (a, b) => [a, b].filter(Boolean).join('–');
