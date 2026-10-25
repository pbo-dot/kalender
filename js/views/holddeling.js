import * as store from '../store.js';
import { esc, fmtLong } from '../util.js';
import { dayDate, weekNo, isWeekKey } from '../weeks.js';
import { SLOTS } from '../config.js';
import { viewOf } from './skema.js';

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
    <div class="page-head">
      <div>
        <a class="back" href="#/skema/${viewOf(e)}/${week}">‹ Til skemaet</a>
        <h1>Holddeling · ${esc(e.subject)}</h1>
        <p class="muted">${esc(e.classes.join(' og '))} · ${fmtLong(dayDate(week, e.day))} · kl. ${esc(time)}</p>
      </div>
    </div>
    <p class="notice">Skriv kun fornavne eller initialer, og ingen oplysninger om børnenes helbred, trivsel eller lignende.</p>
    <div class="hold-grid">
      ${wk.hold.map((h, i) => `<section class="card hold-card" data-i="${i}">
        <label for="hn-${i}">Hold / værksted
          <input id="hn-${i}" data-f="name" value="${esc(h.name)}" placeholder="F.eks. Dansk værksted, 0.B"></label>
        <label for="ha-${i}">Voksne
          <input id="ha-${i}" data-f="adult" value="${esc(h.adult)}" list="people" placeholder="F.eks. Caroline"></label>
        <label for="hm-${i}">Børn <span class="muted">(én pr. linje)</span>
          <textarea id="hm-${i}" data-f="members" rows="8">${esc(h.members)}</textarea></label>
        <button type="button" class="btn ghost danger" data-remove="${i}">Fjern hold</button>
      </section>`).join('')}
      ${wk.hold.length ? '' : '<div class="empty">Der er ingen hold endnu. Tilføj det første hold herunder.</div>'}
    </div>
    <div class="actions">
      <button type="button" class="btn primary" data-addhold>Tilføj hold</button>
      ${prevWeek && !wk.hold.length ? `<button type="button" class="btn" data-copy>Kopiér holdene fra uge ${weekNo(prevWeek)}</button>` : ''}
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
