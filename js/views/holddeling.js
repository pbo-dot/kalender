import * as store from '../store.js';
import { esc, fmtLong } from '../util.js';
import { dayDate, weekNo, isWeekKey } from '../weeks.js';
import { SLOTS } from '../config.js';
import { viewOf } from './skema.js';
import { icon, peopleDatalist } from '../ui.js';

// Holddeling for én lektion på én bestemt dag. Åbnes typisk i en ny fane.
export function renderHolddeling(main, [id, week]) {
  const e = store.get('lessons', id);
  if (!e || !isWeekKey(week)) {
    main.innerHTML = '<div class="empty">Lektionen findes ikke længere. Den er måske blevet slettet.</div>';
    return;
  }
  const entry = structuredClone(e);
  entry.weekly ||= {};
  entry.weekly[week] ||= {};
  const wk = entry.weekly[week];
  wk.hold ||= [];

  const prevWeek = Object.keys(entry.weekly).filter((k) => k < week && entry.weekly[k].hold?.length).sort().at(-1);
  const time = SLOTS.find((s) => s.lesson === e.lesson)?.time || '';
  document.title = `Holddeling ${e.subject} – Teamkalender`;

  main.innerHTML = `
    <header class="page-head">
      <div>
        <a class="back" href="#/skema/${viewOf(e)}/${week}">${icon('left')}Skema</a>
        <h1>Holddeling</h1>
        <p class="sub">${esc(e.subject)} · ${esc(e.classes.join(' + '))} · ${fmtLong(dayDate(week, e.day))} · ${esc(time)}</p>
      </div>
    </header>
    <p class="note">${icon('info')}Kun fornavne eller initialer.</p>
    <div class="card-grid">
      ${wk.hold.map((h, i) => `<section class="card hold-card" data-i="${i}">
        <label class="field" for="hn-${i}"><span>Hold</span>
          <input id="hn-${i}" data-f="name" value="${esc(h.name)}" placeholder="F.eks. Dansk værksted 0.B"></label>
        <label class="field" for="ha-${i}"><span>Voksne</span>
          <input id="ha-${i}" data-f="adult" value="${esc(h.adult)}" list="people" placeholder="F.eks. Caroline"></label>
        <label class="field" for="hm-${i}"><span>Børn (én pr. linje)</span>
          <textarea id="hm-${i}" data-f="members" rows="7">${esc(h.members)}</textarea></label>
        <button type="button" class="btn text danger" data-remove="${i}">${icon('trash')}Fjern hold</button>
      </section>`).join('')}
      ${wk.hold.length ? '' : '<div class="empty">Ingen hold endnu.</div>'}
    </div>
    ${peopleDatalist()}
    <div class="actions">
      <button type="button" class="btn filled" data-addhold>${icon('plus')}Tilføj hold</button>
      ${prevWeek && !wk.hold.length ? `<button type="button" class="btn tonal" data-copy>${icon('copy')}Kopiér fra uge ${weekNo(prevWeek)}</button>` : ''}
    </div>`;

  let timer;
  const save = (silent) => { clearTimeout(timer); store.put('lessons', entry, { silent }); };

  main.oninput = (ev) => {
    const card = ev.target.closest('[data-i]');
    if (!card || !ev.target.dataset.f) return;
    wk.hold[+card.dataset.i][ev.target.dataset.f] = ev.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => save(true), 500);
  };
  main.onfocusout = () => { if (timer) save(true); timer = null; };
  main.onclick = (ev) => {
    if (ev.target.closest('[data-addhold]')) {
      wk.hold.push({ name: '', adult: '', members: '' });
      save(false);
      main.querySelector(`#hn-${wk.hold.length - 1}`)?.focus();
    } else if (ev.target.closest('[data-copy]')) {
      wk.hold = structuredClone(entry.weekly[prevWeek].hold);
      save(false);
    } else if (ev.target.closest('[data-remove]')) {
      wk.hold.splice(+ev.target.closest('[data-remove]').dataset.remove, 1);
      save(false);
    }
  };
}
