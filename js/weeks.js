// Uger skrives som "2026-W05", så de kan sammenlignes som tekst.
export const DAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

export function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const week = Math.ceil(((date - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return { year, week };
}

export const weekKey = (year, week) => `${year}-W${String(week).padStart(2, '0')}`;
export const weekOf = (d) => { const { year, week } = isoWeek(d); return weekKey(year, week); };
export const currentWeek = () => weekOf(new Date());

export function parseWeek(key) {
  const [y, w] = key.split('-W');
  return { year: +y, week: +w };
}
export const isWeekKey = (s) => /^\d{4}-W\d{2}$/.test(s || '');

export function mondayOf(key) {
  const { year, week } = parseWeek(key);
  const jan4 = new Date(year, 0, 4);
  const offset = (jan4.getDay() || 7) - 1;
  return new Date(year, 0, 4 - offset + (week - 1) * 7);
}

export function dayDate(key, dayIdx) {
  const d = mondayOf(key);
  d.setDate(d.getDate() + dayIdx);
  return d;
}

export function addWeeks(key, n) {
  const d = mondayOf(key);
  d.setDate(d.getDate() + 7 * n);
  return weekOf(d);
}

export function weeksBetween(from, to) {
  const out = [];
  for (let k = from; k <= to && out.length < 300; k = addWeeks(k, 1)) out.push(k);
  return out;
}

export const weekNo = (key) => parseWeek(key).week;
export const weekLabel = (key) => {
  const { year, week } = parseWeek(key);
  return `Uge ${week} · ${year}`;
};

// "uge 5–20" eller "uge 43"
export function describeWeeks(keys) {
  const sorted = [...new Set(keys)].sort();
  if (sorted.length === 1) return `uge ${weekNo(sorted[0])}`;
  return `uge ${weekNo(sorted[0])}–${weekNo(sorted.at(-1))} (${sorted.length} uger)`;
}
