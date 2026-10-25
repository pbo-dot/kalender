import * as store from '../store.js';
import { EVENT_TYPES } from '../config.js';
import { esc, isoDate, today, fmtLong, timeRange } from '../util.js';
import { isoWeek } from '../weeks.js';
import { formModal } from '../ui.js';

// Årskalender august–juni, som skolens egen. Viser kun lærermøder, afdelingsmøder og kurser.
const MONTHS = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
const WD = ['S', 'M', 'T', 'O', 'T', 'F', 'L'];

const schoolYearOf = (d) => (d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1);

export function renderKalender(main, [yearArg]) {
  const start = /^\d{4}$/.test(yearArg || '') ? +yearArg : schoolYearOf(new Date());
  const events = store.all('events');
  const byDate = new Map();
  for (const ev of events) {
    if (!byDate.has(ev.date)) byDate.set(ev.date, []);
    byDate.get(ev.date).push(ev);
  }
  for (const list of byDate.values()) list.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  const now = today();
  const upcoming = events.filter((e) => e.date >= now)
    .sort((a, b) => (a.date + (a.start || '')).localeCompare(b.date + (b.start || ''))).slice(0, 6);

  const months = Array.from({ length: 11 }, (_, i) => new Date(start, 7 + i, 1));
  const chip = (ev) => `<button type="button" class="ev ev-${esc(ev.type)}" data-ev="${ev.id}"
    title="${esc(EVENT_TYPES[ev.type]?.label)} ${esc(timeRange(ev.start, ev.end))} ${esc(ev.title)}">${esc(EVENT_TYPES[ev.type]?.short || ev.type)}</button>`;

  const rows = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    return `<tr>${months.map((m) => {
      const d = new Date(m.getFullYear(), m.getMonth(), day);
      if (d.getMonth() !== m.getMonth()) return '<td class="nil"></td>';
      const key = isoDate(d);
      const wd = d.getDay();
      const cls = [wd === 0 || wd === 6 ? 'weekend' : '', key === now ? 'today' : ''].join(' ');
      return `<td class="${cls}" data-date="${key}">
        <span class="dn">${day}</span><span class="wd">${WD[wd]}</span>
        ${(byDate.get(key) || []).map(chip).join('')}
        ${wd === 1 ? `<span class="wk">uge ${isoWeek(d).week}</span>` : ''}
      </td>`;
    }).join('')}</tr>`;
  }).join('');

  main.innerHTML = `
    <div class="page-head">
      <h1>Lærerkalender</h1>
      <div class="weeknav">
        <a class="btn icon" href="#/kalender/${start - 1}" aria-label="Forrige skoleår">‹</a>
        <div class="weeklabel"><strong>Skoleåret ${start}/${String(start + 1).slice(2)}</strong></div>
        <a class="btn icon" href="#/kalender/${start + 1}" aria-label="Næste skoleår">›</a>
        <button type="button" class="btn primary" data-new>Tilføj</button>
      </div>
    </div>
    <div class="legend">${Object.entries(EVENT_TYPES).map(([k, t]) =>
      `<span><i class="ev ev-${k}">${t.short}</i> ${t.label}</span>`).join('')}</div>

    <section class="upcoming">
      <h2>Næste</h2>
      ${upcoming.length ? `<ul>${upcoming.map((e) => `<li><button type="button" data-ev="${e.id}">
        <i class="ev ev-${esc(e.type)}">${esc(EVENT_TYPES[e.type]?.short)}</i>
        <span><strong>${esc(e.title || EVENT_TYPES[e.type]?.label)}</strong>
        <small>${fmtLong(e.date)}${e.start ? ` · kl. ${esc(timeRange(e.start, e.end))}` : ''}${e.place ? ` · ${esc(e.place)}` : ''}</small></span>
      </button></li>`).join('')}</ul>` : '<p class="muted">Ingen kommende møder eller kurser.</p>'}
    </section>

    <div class="grid-wrap">
      <table class="year">
        <thead><tr>${months.map((m) => `<th scope="col">${MONTHS[m.getMonth()]}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="hint">Tryk på en dag for at tilføje et møde eller kursus.</p>`;

  main.onclick = (ev) => {
    const evBtn = ev.target.closest('[data-ev]');
    if (evBtn) return eventModal(store.get('events', evBtn.dataset.ev));
    if (ev.target.closest('[data-new]')) return eventModal(null, now);
    const cell = ev.target.closest('[data-date]');
    if (cell) eventModal(null, cell.dataset.date);
  };
}

function eventModal(ev, date) {
  formModal({
    title: ev ? 'Rediger' : 'Nyt møde eller kursus',
    values: ev || { date, type: 'lm' },
    fields: [
      { name: 'type', label: 'Type', type: 'select', options: Object.entries(EVENT_TYPES).map(([k, t]) => [k, t.label]) },
      { name: 'title', label: 'Titel', placeholder: 'Valgfri, f.eks. "Førstehjælp"' },
      { name: 'date', label: 'Dato', type: 'date', required: true },
      { name: 'start', label: 'Fra kl.', type: 'time', half: true },
      { name: 'end', label: 'Til kl.', type: 'time', half: true },
      { name: 'place', label: 'Sted' },
      { name: 'note', label: 'Note', type: 'textarea', rows: 3 },
    ],
    onSave: (v) => store.put('events', { ...(ev || {}), ...v }),
    onDelete: ev ? () => store.remove('events', ev.id) : null,
    deleteLabel: 'aftalen',
  });
}
