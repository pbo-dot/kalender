import * as store from '../store.js';
import { esc, fmtDate, today } from '../util.js';
import { formModal, peopleDatalist, confirmDelete, icon, pageHead } from '../ui.js';

let showDone = false;

export function renderTodo(main) {
  const todos = store.all('todos');
  const open = todos.filter((t) => !t.done)
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.createdAt.localeCompare(b.createdAt));
  const done = todos.filter((t) => t.done).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const now = today();

  const item = (t) => `<li class="todo ${t.done ? 'done' : ''} ${!t.done && t.due && t.due < now ? 'overdue' : ''}">
    <label class="check" for="t-${t.id}">
      <input type="checkbox" id="t-${t.id}" data-toggle="${t.id}" ${t.done ? 'checked' : ''} aria-label="Færdig">
      <span aria-hidden="true">${icon('todo')}</span>
    </label>
    <button type="button" class="todo-text" data-edit="${t.id}">
      <span>${esc(t.text)}</span>
      ${t.who || t.due ? `<small>${[t.who && esc(t.who), t.due && fmtDate(t.due, { weekday: 'short', day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}</small>` : ''}
    </button>
    <button type="button" class="icon-btn quiet" data-del="${t.id}" aria-label="Slet">${icon('close')}</button>
  </li>`;

  main.innerHTML = `
    ${pageHead('To do')}
    <form class="card quick-add" id="todoForm">
      <label class="field grow" for="todo-text"><span>Ny opgave</span>
        <input id="todo-text" name="text" placeholder="Hvad skal gøres?" required></label>
      <label class="field" for="todo-who"><span>Hvem</span><input id="todo-who" name="who" list="people"></label>
      <label class="field" for="todo-due"><span>Frist</span><input id="todo-due" name="due" type="date"></label>
      <button class="btn filled">${icon('plus')}Tilføj</button>
      ${peopleDatalist()}
    </form>
    <ul class="todo-list">${open.map(item).join('') || '<li class="empty">Ingen åbne opgaver.</li>'}</ul>
    ${done.length ? `<details class="done-list" ${showDone ? 'open' : ''}><summary>Færdige (${done.length})</summary>
      <ul class="todo-list">${done.map(item).join('')}</ul></details>` : ''}`;

  main.querySelector('details')?.addEventListener('toggle', (ev) => { showDone = ev.target.open; });

  main.onsubmit = (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    store.put('todos', {
      text: f.get('text').trim(), who: f.get('who').trim(), due: f.get('due'),
      done: false, createdAt: new Date().toISOString(),
    });
    main.querySelector('#todo-text')?.focus();
  };

  main.onchange = (ev) => {
    const id = ev.target.dataset.toggle;
    if (!id) return;
    store.put('todos', { ...store.get('todos', id), done: ev.target.checked });
  };

  main.onclick = async (ev) => {
    const del = ev.target.closest('[data-del]');
    if (del) {
      const t = store.get('todos', del.dataset.del);
      if (await confirmDelete(`"${t.text}"`)) store.remove('todos', t.id);
      return;
    }
    const edit = ev.target.closest('[data-edit]');
    if (edit) {
      const t = store.get('todos', edit.dataset.edit);
      formModal({
        title: 'Opgave',
        values: t,
        fields: [
          { name: 'text', label: 'Opgave', required: true },
          { name: 'who', label: 'Hvem', list: 'people', half: true },
          { name: 'due', label: 'Frist', type: 'date', half: true },
          { name: 'note', label: 'Note', type: 'textarea', rows: 3 },
        ],
        onSave: (v) => store.put('todos', { ...t, ...v }),
        onDelete: () => store.remove('todos', t.id),
        deleteLabel: 'opgaven',
      });
    }
  };
}
