import * as store from '../store.js';
import { esc } from '../util.js';
import { formModal } from '../ui.js';

const CATEGORIES = [['dsa', 'DSA'], ['aargang', 'Årgangsholddeling']];

export function renderHold(main, [cat = 'dsa']) {
  if (!CATEGORIES.some(([k]) => k === cat)) cat = 'dsa';
  const teams = store.all('teams').filter((t) => t.category === cat)
    .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  const members = (t) => (t.members || '').split('\n').map((s) => s.trim()).filter(Boolean);

  main.innerHTML = `
    <div class="page-head">
      <h1>Hold</h1>
      <nav class="segmented" aria-label="Type">${CATEGORIES.map(([k, l]) =>
        `<a href="#/hold/${k}" class="${k === cat ? 'active' : ''}">${l}</a>`).join('')}</nav>
      <button type="button" class="btn primary" data-new>Nyt hold</button>
    </div>
    <p class="notice">Skriv kun fornavne eller initialer på børnene.</p>
    <div class="hold-grid">
      ${teams.map((t) => `<article class="card team" data-edit="${t.id}" role="button" tabindex="0">
        <h2>${esc(t.name)}</h2>
        <dl>
          ${t.adult ? `<dt>Voksne</dt><dd>${esc(t.adult)}</dd>` : ''}
          ${t.when ? `<dt>Hvornår</dt><dd>${esc(t.when)}</dd>` : ''}
          ${t.place ? `<dt>Hvor</dt><dd>${esc(t.place)}</dd>` : ''}
        </dl>
        ${members(t).length ? `<p class="members"><strong>${members(t).length} børn:</strong> ${members(t).map(esc).join(', ')}</p>` : ''}
        ${t.note ? `<p class="muted pre">${esc(t.note)}</p>` : ''}
      </article>`).join('') || `<div class="empty">Der er ingen ${cat === 'dsa' ? 'DSA-hold' : 'årgangshold'} endnu.</div>`}
    </div>`;

  main.onclick = (ev) => {
    const edit = ev.target.closest('[data-edit]');
    if (edit) return teamModal(store.get('teams', edit.dataset.edit), cat);
    if (ev.target.closest('[data-new]')) teamModal(null, cat);
  };
}

function teamModal(team, category) {
  formModal({
    title: team ? team.name : 'Nyt hold',
    values: team || { category },
    fields: [
      { name: 'name', label: 'Holdnavn', required: true, placeholder: 'F.eks. DSA hold 1' },
      { name: 'category', label: 'Type', type: 'select', options: CATEGORIES, half: true },
      { name: 'adult', label: 'Voksne', list: 'people', half: true },
      { name: 'when', label: 'Hvornår', half: true, placeholder: 'F.eks. tirsdag 2. modul' },
      { name: 'place', label: 'Hvor', half: true },
      { name: 'members', label: 'Børn (én pr. linje)', type: 'textarea', rows: 8 },
      { name: 'note', label: 'Note', type: 'textarea', rows: 3 },
    ],
    onSave: (v) => store.put('teams', { ...(team || {}), ...v }),
    onDelete: team ? () => store.remove('teams', team.id) : null,
    deleteLabel: 'holdet',
  });
}
