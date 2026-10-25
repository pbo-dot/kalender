import * as store from './store.js';
import { esc } from './util.js';

const dlg = document.getElementById('modal');
const dlg2 = document.getElementById('modal2');

dlg.addEventListener('click', (ev) => {
  if (ev.target === dlg || ev.target.closest('[data-close]')) dlg.close();
});

export function openModal(html) {
  dlg.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}
export const closeModal = () => dlg.close();

// Spørg brugeren og vent på svaret. buttons: [[værdi, tekst, klasse]]
export function choose(title, bodyHtml, buttons) {
  return new Promise((resolve) => {
    dlg2.innerHTML = `<div class="modal-form">
      <h2>${esc(title)}</h2>
      <div class="choose-body">${bodyHtml}</div>
      <footer>${buttons.map(([v, label, cls = 'primary']) =>
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
  (await choose('Slet?', `<p>Vil du slette ${esc(what)}?</p>`, [['cancel', 'Annuller', 'ghost'], ['yes', 'Slet', 'danger']])) === 'yes';

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

// Navne der allerede er brugt, som forslag i "hvem"-felter.
export function peopleDatalist() {
  const names = new Set();
  for (const t of store.all('todos')) t.who && names.add(t.who);
  for (const m of store.all('teams')) m.adult && names.add(m.adult);
  return `<datalist id="people">${[...names].sort().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>`;
}

// Simpel formular i en dialog. fields: {name,label,type,required,rows,options,half,placeholder}
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
    return `<label class="${f.half ? 'half' : ''}" for="${id}">${esc(f.label)}${input}</label>`;
  };
  const d = openModal(`<form class="modal-form">
    <h2>${esc(title)}</h2>
    <div class="fields">${fields.map(field).join('')}</div>
    ${peopleDatalist()}
    <footer>
      ${onDelete ? '<button type="button" class="btn ghost danger" data-del>Slet</button>' : ''}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-close>Annuller</button>
      <button class="btn primary">Gem</button>
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
  form.querySelector('input,textarea,select')?.focus();
}
