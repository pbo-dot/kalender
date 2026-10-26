import * as store from './store.js';
import { esc } from './util.js';

// Streg-ikoner (24×24). Brug: icon('plus')
const ICONS = {
  todo: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
  skema: '<rect x="3" y="4" width="18" height="17" rx="4"/><path d="M3 9.5h18M9.5 9.5V21M14.5 9.5V21"/>',
  kalender: '<rect x="3" y="5" width="18" height="16" rx="4"/><path d="M8 3v4M16 3v4M3 10h18"/><circle cx="12" cy="15.5" r="1.5"/>',
  hold: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20c0-3-1.8-5.4-4.3-6.2"/>',
  mode: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  right: '<path d="m9 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  plan: '<path d="M5 4h10l4 4v12H5z"/><path d="M9 12h6M9 16h4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  split: '<path d="M7 4v16M17 4v16M3 9h8M13 15h8"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.8-1.1 1.5v.3M12 16.8h.01"/>',
  phone: '<rect x="6" y="2.5" width="12" height="19" rx="3.5"/><path d="M10.5 18.5h3"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/><path d="m9 12 2 2 4-4.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  apple: '<path d="M12 7c-4 0-6 3-6 7s2 6 4 6c1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 4-2 4-6s-2-7-6-7z"/><path d="M12 7c0-2 1-3 3-4"/>',
  bowl: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 4c0 2 2 2 2 4M14 4c0 2 2 2 2 4"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
};
export const icon = (name, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

// Samme tekst får altid samme farve (8 farvepar i style.css).
export function colorFor(text) {
  let h = 0;
  for (const ch of String(text).toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return 'c' + (h % 8);
}

const dlg = document.getElementById('modal');
const dlg2 = document.getElementById('modal2');

dlg.addEventListener('click', (ev) => {
  if (ev.target === dlg || ev.target.closest('[data-close]')) dlg.close();
});

export function openModal(html) {
  // Fokus på håndtaget, så tastaturet ikke springer op på telefonen.
  dlg.innerHTML = `<div class="grab" tabindex="-1" autofocus aria-hidden="true"></div>${html}`;
  if (!dlg.open) dlg.showModal();
  return dlg;
}
export const closeModal = () => dlg.close();

// Spørg brugeren og vent på svaret. buttons: [[værdi, tekst, 'filled'|'tonal'|'text'|'danger']]
export function choose(title, bodyHtml, buttons) {
  return new Promise((resolve) => {
    dlg2.innerHTML = `<div class="modal-form">
      <h2>${esc(title)}</h2>
      <div class="choose-body">${bodyHtml}</div>
      <footer>${buttons.map(([v, label, cls = 'filled']) =>
        `<button type="button" class="btn ${cls}" data-v="${v}">${esc(label)}</button>`).join('')}</footer>
    </div>`;
    dlg2.returnValue = '';
    dlg2.onclick = (ev) => {
      const b = ev.target.closest('[data-v]');
      if (b) dlg2.close(b.dataset.v);
      else if (ev.target === dlg2) dlg2.close('cancel');
    };
    dlg2.onclose = () => resolve(dlg2.returnValue || 'cancel');
    dlg2.showModal();
  });
}

export const confirmDelete = async (what) =>
  (await choose('Slet?', `<p>Vil du slette ${esc(what)}?</p>`, [['cancel', 'Annuller', 'text'], ['yes', 'Slet', 'filled danger']])) === 'yes';

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

// Fælles sidehoved: stor titel og evt. knapper til højre.
export const pageHead = (title, right = '') =>
  `<header class="page-head"><h1>${esc(title)}</h1>${right ? `<div class="head-actions">${right}</div>` : ''}</header>`;

// Navne der allerede er brugt, som forslag i "hvem"-felter.
export function peopleDatalist() {
  const names = new Set();
  for (const t of store.all('todos')) t.who && names.add(t.who);
  for (const m of store.all('teams')) m.adult && names.add(m.adult);
  return `<datalist id="people">${[...names].sort().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>`;
}

// Simpel formular i et panel. fields: {name,label,type,required,rows,options,half,placeholder}
export function formModal({ title, fields, values = {}, onSave, onDelete, deleteLabel = 'dette' }) {
  const field = (f) => {
    const v = values[f.name] ?? f.value ?? '';
    const id = 'f-' + f.name;
    const attrs = `id="${id}" name="${f.name}" ${f.required ? 'required' : ''} ${f.list ? `list="${f.list}"` : ''}
      ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''}`;
    let input;
    if (f.type === 'textarea') input = `<textarea ${attrs} rows="${f.rows || 4}">${esc(v)}</textarea>`;
    else if (f.type === 'select') input = `<select ${attrs}>${f.options.map(([k, l]) =>
      `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else input = `<input type="${f.type || 'text'}" ${attrs} value="${esc(v)}">`;
    return `<label class="field ${f.half ? 'half' : ''}" for="${id}"><span>${esc(f.label)}</span>${input}</label>`;
  };
  const d = openModal(`<form class="modal-form">
    <h2>${esc(title)}</h2>
    <div class="fields">${fields.map(field).join('')}</div>
    ${peopleDatalist()}
    <footer>
      ${onDelete ? '<button type="button" class="btn text danger" data-del>Slet</button>' : ''}
      <span class="spacer"></span>
      <button type="button" class="btn tonal" data-close>Annuller</button>
      <button class="btn filled">Gem</button>
    </footer>
  </form>`);
  const form = d.querySelector('form');
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const vals = {};
    for (const [k, v] of new FormData(form)) vals[k] = typeof v === 'string' ? v.trim() : v;
    onSave(vals);
    closeModal();
  };
  form.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (await confirmDelete(deleteLabel)) { onDelete(); closeModal(); }
  });
  if (matchMedia('(pointer: fine)').matches) form.querySelector('input,textarea,select')?.focus();
}
