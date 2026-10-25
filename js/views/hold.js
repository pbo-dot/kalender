import * as store from '../store.js';
import { esc } from '../util.js';
import { formModal, icon, colorFor } from '../ui.js';

const CATEGORIES = [['dsa', 'DSA'], ['aargang', 'Årgangshold']];

export function renderHold(main, [cat = 'dsa']) {
  if (!CATEGORIES.some(([k]) => k === cat)) cat = 'dsa';
  const teams = store.all('teams').filter((t) => t.category === cat)
    .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  const members = (t) => (t.members || '').split('\n').map((s) => s.trim()).filter(Boolean);

  main.innerHTML = `
    <header class="page-head">
      <h1>Hold</h1>
      <div class="head-actions"><button type="button" class="btn filled" data-new>${icon('plus')}Nyt hold</button></div>
    </header>
    <nav class="button-group" aria-label="Type">${CATEGORIES.map(([k, l]) =>
      `<a href="#/hold/${k}" class="${k === cat ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="card-grid">
      ${teams.map((t) => `<button type="button" class="card team ${colorFor(t.name)}" data-edit="${t.id}">
        <span class="team-name">${esc(t.name)}</span>
        <span class="meta">
          ${t.adult ? `<span>${icon('person')}${esc(t.adult)}</span>` : ''}
          ${t.when ? `<span>${icon('clock')}${esc(t.when)}</span>` : ''}
          ${t.place ? `<span>${icon('pin')}${esc(t.place)}</span>` : ''}
        </span>
        ${members(t).length ? `<span class="members"><b>${members(t).length} børn</b> · ${members(t).map(esc).join(', ')}</span>` : ''}
      </button>`).join('') || `<div class="empty">Ingen ${cat === 'dsa' ? 'DSA-hold' : 'årgangshold'} endnu.</div>`}
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
      { name: 'when', label: 'Hvornår', half: true, placeholder: 'F.eks. tirsdag 10–11' },
      { name: 'place', label: 'Hvor', half: true },
      { name: 'members', label: 'Børn (fornavn/initialer, én pr. linje)', type: 'textarea', rows: 7 },
      { name: 'note', label: 'Note', type: 'textarea', rows: 2 },
    ],
    onSave: (v) => store.put('teams', { ...(team || {}), ...v }),
    onDelete: team ? () => store.remove('teams', team.id) : null,
    deleteLabel: 'holdet',
  });
}
