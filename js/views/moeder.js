import * as store from '../store.js';
import { esc, today, fmtLong, timeRange } from '../util.js';
import { formModal } from '../ui.js';

export function renderMoeder(main) {
  const now = today();
  const all = store.all('meetings');
  const key = (m) => m.date + (m.start || '');
  const upcoming = all.filter((m) => m.date >= now).sort((a, b) => key(a).localeCompare(key(b)));
  const past = all.filter((m) => m.date < now).sort((a, b) => key(b).localeCompare(key(a)));

  const card = (m, next) => `<article class="card meeting ${next ? 'next' : ''}">
    <header>
      <div>
        ${next ? '<span class="eyebrow">Næste møde</span>' : ''}
        <h2>${fmtLong(m.date)}</h2>
        <p class="muted">${[m.start && `kl. ${esc(timeRange(m.start, m.end))}`, m.place && esc(m.place)].filter(Boolean).join(' · ')}</p>
      </div>
      <button type="button" class="btn ghost" data-edit="${m.id}">Rediger</button>
    </header>
    ${m.agenda ? `<h3>Dagsorden</h3><p class="pre">${esc(m.agenda)}</p>` : ''}
    ${m.minutes ? `<h3>Referat</h3><p class="pre">${esc(m.minutes)}</p>` : ''}
  </article>`;

  main.innerHTML = `
    <div class="page-head">
      <h1>Teammøde</h1>
      <button type="button" class="btn primary" data-new>Nyt møde</button>
    </div>
    <div class="meetings">
      ${upcoming.map((m, i) => card(m, i === 0)).join('') || '<div class="empty">Der er ingen kommende teammøder.</div>'}
    </div>
    ${past.length ? `<h2 class="section-title">Tidligere møder</h2>
      <div class="meetings">${past.map((m) => card(m)).join('')}</div>` : ''}`;

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
      { name: 'start', label: 'Fra kl.', type: 'time', half: true },
      { name: 'end', label: 'Til kl.', type: 'time', half: true },
      { name: 'place', label: 'Sted' },
      { name: 'agenda', label: 'Dagsorden', type: 'textarea', rows: 6, placeholder: '1. Siden sidst\n2. ...' },
      { name: 'minutes', label: 'Referat og aftaler', type: 'textarea', rows: 6 },
    ],
    onSave: (v) => store.put('meetings', { ...(m || {}), ...v }),
    onDelete: m ? () => store.remove('meetings', m.id) : null,
    deleteLabel: 'mødet',
  });
}
