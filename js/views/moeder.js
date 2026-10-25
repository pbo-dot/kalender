import * as store from '../store.js';
import { esc, today, fmtLong, timeRange } from '../util.js';
import { formModal, icon } from '../ui.js';

export function renderMoeder(main) {
  const now = today();
  const all = store.all('meetings');
  const key = (m) => m.date + (m.start || '');
  const upcoming = all.filter((m) => m.date >= now).sort((a, b) => key(a).localeCompare(key(b)));
  const past = all.filter((m) => m.date < now).sort((a, b) => key(b).localeCompare(key(a)));

  const card = (m, next) => `<button type="button" class="card meeting ${next ? 'next' : ''}" data-edit="${m.id}">
    ${next ? '<span class="eyebrow">Næste møde</span>' : ''}
    <span class="meeting-date">${fmtLong(m.date)}</span>
    ${m.start || m.place ? `<span class="meta">
      ${m.start ? `<span>${icon('clock')}${esc(timeRange(m.start, m.end))}</span>` : ''}
      ${m.place ? `<span>${icon('pin')}${esc(m.place)}</span>` : ''}</span>` : ''}
    ${m.agenda ? `<span class="label">Dagsorden</span><span class="pre">${esc(m.agenda)}</span>` : ''}
    ${m.minutes ? `<span class="label">Referat</span><span class="pre">${esc(m.minutes)}</span>` : ''}
  </button>`;

  main.innerHTML = `
    <header class="page-head">
      <h1>Teammøde</h1>
      <div class="head-actions"><button type="button" class="btn filled" data-new>${icon('plus')}Nyt møde</button></div>
    </header>
    <div class="card-grid wide">
      ${upcoming.map((m, i) => card(m, i === 0)).join('') || '<div class="empty">Ingen kommende møder.</div>'}
    </div>
    ${past.length ? `<h2 class="section-title">Tidligere</h2><div class="card-grid wide">${past.map((m) => card(m)).join('')}</div>` : ''}`;

  main.onclick = (ev) => {
    const edit = ev.target.closest('[data-edit]');
    if (edit) return meetingModal(store.get('meetings', edit.dataset.edit));
    if (ev.target.closest('[data-new]')) meetingModal(null);
  };
}

function meetingModal(m) {
  formModal({
    title: m ? 'Teammøde' : 'Nyt teammøde',
    values: m || { date: today() },
    fields: [
      { name: 'date', label: 'Dato', type: 'date', required: true },
      { name: 'start', label: 'Fra', type: 'time', half: true },
      { name: 'end', label: 'Til', type: 'time', half: true },
      { name: 'place', label: 'Sted' },
      { name: 'agenda', label: 'Dagsorden', type: 'textarea', rows: 5, placeholder: '1. Siden sidst\n2. ...' },
      { name: 'minutes', label: 'Referat og aftaler', type: 'textarea', rows: 5 },
    ],
    onSave: (v) => store.put('meetings', { ...(m || {}), ...v }),
    onDelete: m ? () => store.remove('meetings', m.id) : null,
    deleteLabel: 'mødet',
  });
}
