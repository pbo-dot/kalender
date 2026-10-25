import * as store from '../store.js';
import { CLASSES, SLOTS, SUBJECTS } from '../config.js';
import { esc, uid, hueFor, fmtDate } from '../util.js';
import {
  DAYS, currentWeek, addWeeks, weeksBetween, dayDate, weekNo, weekLabel, describeWeeks, isWeekKey,
} from '../weeks.js';
import { openModal, closeModal, choose, toast } from '../ui.js';

// En lektion ("entry") ligger i én eller flere klasser, på en dag og et modul, fra uge `from` til `to`.
// Uger der er undtaget for en klasse står i `except` som "2026-W43:0.A".
// Plan, voksne og holddeling kan variere fra uge til uge og ligger i `weekly[uge]`.
export const isActive = (e, cls, week) =>
  e.classes.includes(cls) && week >= e.from && week <= e.to && !(e.except || []).includes(`${week}:${cls}`);

const isSeries = (e) => e.from !== e.to;
const isYearGroup = (e) => e.classes.length > 1;
const hasAnyActive = (e) => weeksBetween(e.from, e.to).some((w) => e.classes.some((c) => isActive(e, c, w)));
const lessonLabel = (n) => SLOTS.find((s) => s.lesson === n)?.time || `${n}. modul`;
const classLabel = (e) => (isYearGroup(e) ? '0. årgang' : e.classes[0]);
export const viewOf = (e) => (isYearGroup(e) ? 'aargang' : e.classes[0]);

export function renderSkema(main, [view = CLASSES[0], week]) {
  if (![...CLASSES, 'aargang'].includes(view)) view = CLASSES[0];
  if (!isWeekKey(week)) week = currentWeek();
  const lessons = store.all('lessons').sort((a, b) => a.subject.localeCompare(b.subject, 'da'));
  const tabs = [...CLASSES.map((c) => [c, c]), ['aargang', '0. årgang']];

  const cellEntries = (day, lesson) => lessons.filter((e) => e.day === day && e.lesson === lesson);

  const block = (e) => {
    const w = e.weekly?.[week] || {};
    const voksne = w.voksne || e.voksne;
    const hold = (w.hold || []).filter((h) => h.name || h.adult);
    return `<div class="lesson" style="--hue:${hueFor(e.subject)}">
      <button type="button" class="lesson-title" data-open="${e.id}">
        <span>${esc(e.subject)}</span>
        ${isYearGroup(e) && view !== 'aargang' ? '<span class="tag">årgang</span>' : ''}
        ${isSeries(e) ? `<span class="tag" title="Serie ${describeWeeks([e.from, e.to])}">uge ${weekNo(e.from)}–${weekNo(e.to)}</span>` : ''}
      </button>
      ${hold.length ? `<ul class="hold-summary">${hold.map((h) =>
        `<li><strong>${esc(h.name)}</strong>${h.adult ? `: ${esc(h.adult)}` : ''}</li>`).join('')}</ul>` : ''}
      <div class="pills">
        <button type="button" class="pill ${w.plan ? 'on' : ''}" data-open="${e.id}" data-tab="plan">Plan</button>
        <button type="button" class="pill ${voksne ? 'on' : ''}" data-open="${e.id}" data-tab="voksne">${voksne ? esc(voksne) : 'Voksne'}</button>
        <a class="pill ${hold.length ? 'on' : ''}" href="#/holddeling/${e.id}/${week}" target="_blank" rel="noopener">Holddeling</a>
      </div>
    </div>`;
  };

  const cell = (day, lesson) => {
    let html;
    if (view === 'aargang') {
      html = cellEntries(day, lesson).map((e) => {
        const active = CLASSES.filter((c) => isActive(e, c, week));
        if (!active.length) return '';
        if (isYearGroup(e) && active.length === e.classes.length) return block(e);
        return `<button type="button" class="lesson mini" data-open="${e.id}" style="--hue:${hueFor(e.subject)}">
          <span class="muted">${esc(active.join(' + '))}:</span> ${esc(e.subject)}</button>`;
      }).join('');
    } else {
      html = cellEntries(day, lesson).filter((e) => isActive(e, view, week)).map(block).join('');
    }
    return `<td>${html}<button type="button" class="add" data-add="${day}:${lesson}"
      aria-label="Tilføj ${DAYS[day]} ${lessonLabel(lesson)}">+</button></td>`;
  };

  const rows = SLOTS.map((s) => s.pause
    ? `<tr class="pause"><th scope="row">${esc(s.pause)}</th><td colspan="${DAYS.length}"></td></tr>`
    : `<tr><th scope="row"><span class="time">${esc(s.time)}</span></th>${DAYS.map((_, d) => cell(d, s.lesson)).join('')}</tr>`).join('');

  main.innerHTML = `
    <div class="page-head">
      <nav class="segmented" aria-label="Klasse">${tabs.map(([k, l]) =>
        `<a href="#/skema/${k}/${week}" class="${k === view ? 'active' : ''}">${l}</a>`).join('')}</nav>
      <div class="weeknav">
        <a class="btn icon" href="#/skema/${view}/${addWeeks(week, -1)}" aria-label="Forrige uge">‹</a>
        <div class="weeklabel"><strong>${weekLabel(week)}</strong>
          <span>${fmtDate(dayDate(week, 0))} – ${fmtDate(dayDate(week, 4))}</span></div>
        <a class="btn icon" href="#/skema/${view}/${addWeeks(week, 1)}" aria-label="Næste uge">›</a>
        ${week !== currentWeek() ? `<a class="btn ghost" href="#/skema/${view}/${currentWeek()}">Denne uge</a>` : ''}
      </div>
    </div>
    ${view === 'aargang' ? '<p class="hint">Det du lægger ind her, kommer automatisk i både 0.A og 0.B. Lektioner der kun er i én klasse, står med lille skrift.</p>' : ''}
    <div class="grid-wrap">
      <table class="skema">
        <thead><tr><th class="corner">Uge ${weekNo(week)}</th>${DAYS.map((d, i) =>
          `<th scope="col">${d}<span>${fmtDate(dayDate(week, i))}</span></th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="daylist">${DAYS.map((d, i) => `<section class="day">
      <h2>${d} <span>${fmtDate(dayDate(week, i))}</span></h2>
      ${SLOTS.filter((s) => s.lesson).map((s) =>
        `<div class="day-slot"><span class="time">${esc(s.time)}</span>${cell(i, s.lesson).replace(/^<td>|<\/td>$/g, '')}</div>`).join('')}
    </section>`).join('')}</div>`;

  main.onclick = (ev) => {
    const open = ev.target.closest('[data-open]');
    if (open) {
      const e = store.get('lessons', open.dataset.open);
      if (e) openLessonModal({ entry: e, week, tab: open.dataset.tab });
      return;
    }
    const add = ev.target.closest('[data-add]');
    if (add) {
      const [day, lesson] = add.dataset.add.split(':').map(Number);
      openLessonModal({ classes: view === 'aargang' ? [...CLASSES] : [view], day, lesson, week });
    }
  };
}

function weekSelect(name, selected, center) {
  const keys = new Set(weeksBetween(addWeeks(center, -26), addWeeks(center, 52)));
  keys.add(selected);
  return `<select id="f-${name}" name="${name}">${[...keys].sort().map((k) =>
    `<option value="${k}" ${k === selected ? 'selected' : ''}>${weekLabel(k)}</option>`).join('')}</select>`;
}

export function openLessonModal({ entry, classes, day, lesson, week, tab = 'plan' }) {
  const isNew = !entry;
  const e = entry || { classes, day, lesson, from: week, to: week, subject: '', voksne: '', weekly: {}, except: [] };
  const w = e.weekly?.[week] || {};
  const hold = (w.hold || []).filter((h) => h.name || h.adult);
  const date = fmtDate(dayDate(week, e.day), { day: 'numeric', month: 'long' });

  const d = openModal(`<form class="modal-form lesson-form">
    <h2>${isNew ? 'Ny lektion' : esc(e.subject)}</h2>
    <p class="muted">${esc(classLabel(e))}${isYearGroup(e) ? ' (0.A og 0.B)' : ''} · ${DAYS[e.day]} d. ${date} · uge ${weekNo(week)}</p>
    <div class="fields">
      <label for="f-subject">Fag / overskrift
        <input id="f-subject" name="subject" list="subjects" required value="${esc(e.subject)}" placeholder="F.eks. Dansk"></label>
      <datalist id="subjects">${SUBJECTS.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
      <label class="half" for="f-day">Dag
        <select id="f-day" name="day">${DAYS.map((n, i) => `<option value="${i}" ${i === e.day ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="half" for="f-lesson">Tidspunkt
        <select id="f-lesson" name="lesson">${SLOTS.filter((s) => s.lesson).map((s) =>
          `<option value="${s.lesson}" ${s.lesson === e.lesson ? 'selected' : ''}>${s.time}</option>`).join('')}</select></label>
      <fieldset class="repeat">
        <legend>Gentagelse</legend>
        <label class="radio"><input type="radio" name="repeat" value="once" ${isSeries(e) ? '' : 'checked'}> Kun uge ${weekNo(week)}</label>
        <label class="radio"><input type="radio" name="repeat" value="series" ${isSeries(e) ? 'checked' : ''}> Fast i en periode</label>
        <div class="series-fields" ${isSeries(e) ? '' : 'hidden'}>
          <label for="f-from">Fra ${weekSelect('from', e.from, week)}</label>
          <label for="f-to">Til og med ${weekSelect('to', isSeries(e) ? e.to : addWeeks(week, 10), week)}</label>
        </div>
      </fieldset>
    </div>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-tab="plan">Plan</button>
      <button type="button" role="tab" data-tab="voksne">Voksne</button>
      <button type="button" role="tab" data-tab="hold">Holddeling</button>
    </div>
    <div class="tabpanel" data-panel="plan">
      <label for="f-plan">Plan for uge ${weekNo(week)}
        <textarea id="f-plan" name="plan" rows="5" placeholder="Hvad skal vi lave?">${esc(w.plan)}</textarea></label>
    </div>
    <div class="tabpanel" data-panel="voksne">
      <label for="f-voksne">Faste voksne
        <input id="f-voksne" name="voksne" value="${esc(e.voksne)}" placeholder="F.eks. Caroline og Kaj"></label>
      <label for="f-weekVoksne">Andre voksne kun i uge ${weekNo(week)}
        <input id="f-weekVoksne" name="weekVoksne" value="${esc(w.voksne)}" placeholder="Lad stå tom hvis det er de faste"></label>
    </div>
    <div class="tabpanel" data-panel="hold">
      ${isNew
        ? '<p class="muted">Gem lektionen først, så kan du lave holddelingen.</p>'
        : `${hold.length ? `<ul class="hold-summary">${hold.map((h) => `<li><strong>${esc(h.name)}</strong>${h.adult ? `: ${esc(h.adult)}` : ''}</li>`).join('')}</ul>`
            : '<p class="muted">Ingen holddeling for denne dag endnu.</p>'}
           <a class="btn" href="#/holddeling/${e.id}/${week}" target="_blank" rel="noopener">Åbn holddeling i ny fane</a>`}
    </div>

    <footer>
      ${isNew ? '' : '<button type="button" class="btn ghost danger" data-del>Slet</button>'}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-close>Annuller</button>
      <button class="btn primary">Gem</button>
    </footer>
  </form>`);

  const form = d.querySelector('form');
  const showTab = (t) => {
    form.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === t));
    form.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t; });
  };
  showTab(tab);
  form.querySelector('.tabs').onclick = (ev) => ev.target.dataset.tab && showTab(ev.target.dataset.tab);
  form.querySelectorAll('[name=repeat]').forEach((r) => {
    r.onchange = () => { form.querySelector('.series-fields').hidden = form.repeat.value !== 'series'; };
  });
  if (isNew) form.subject.focus();

  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(form);
    const series = f.get('repeat') === 'series';
    const core = {
      subject: f.get('subject').trim(),
      day: +f.get('day'),
      lesson: +f.get('lesson'),
      from: series ? f.get('from') : week,
      to: series ? f.get('to') : week,
      voksne: f.get('voksne').trim(),
    };
    if (core.to < core.from) return toast('"Til og med" skal ligge efter "Fra".');
    const weekData = { ...w, plan: f.get('plan').trim(), voksne: f.get('weekVoksne').trim() };

    let toSave;
    if (isNew) {
      toSave = [{ ...e, id: uid(), ...core, weekly: { [week]: weekData } }];
    } else {
      const coreChanged = ['subject', 'day', 'lesson', 'voksne'].some((k) => core[k] !== e[k]);
      const rangeChanged = core.from !== e.from || core.to !== e.to;
      let scope = 'all';
      if (isSeries(e) && coreChanged && !rangeChanged) {
        scope = await choose('Gælder ændringen hele perioden?',
          `<p>${esc(e.subject)} ligger fast i ${describeWeeks([e.from, e.to])}.</p>`,
          [['cancel', 'Annuller', 'ghost'], ['week', `Kun uge ${weekNo(week)}`, ''], ['all', 'Hele perioden']]);
        if (scope === 'cancel') return;
      }
      if (scope === 'week') {
        const single = { ...structuredClone(e), id: uid(), ...core, from: week, to: week, except: [], weekly: { [week]: weekData } };
        const rest = structuredClone(e);
        rest.except = [...(rest.except || []), ...rest.classes.map((c) => `${week}:${c}`)];
        delete rest.weekly?.[week];
        toSave = [single, rest];
      } else {
        const upd = structuredClone(e);
        Object.assign(upd, core);
        upd.weekly = { ...(upd.weekly || {}), [week]: weekData };
        toSave = [upd];
      }
    }

    const target = toSave[0];
    const conflicts = findConflicts(target, toSave.map((x) => x.id));
    if (conflicts.length) {
      const list = conflicts.map(({ other, hits }) =>
        `<li><strong>${esc([...new Set(hits.map((h) => h.split(':')[1]))].join(' og '))}:</strong>
          ${esc(other.subject)}, ${describeWeeks(hits.map((h) => h.split(':')[0]))}</li>`).join('');
      const ans = await choose('Der ligger allerede noget i skemaet',
        `<p>${DAYS[target.day]} kl. ${lessonLabel(target.lesson)}:</p><ul class="conflicts">${list}</ul>
         <p>Skal ${esc(target.subject)} erstatte det, eller skal begge ting stå i skemaet?</p>`,
        [['cancel', 'Annuller', 'ghost'], ['both', 'Behold begge', ''], ['replace', 'Erstat']]);
      if (ans === 'cancel') return;
      if (ans === 'replace') {
        for (const { other, hits } of conflicts) {
          const o = structuredClone(other);
          o.except = [...new Set([...(o.except || []), ...hits])];
          if (hasAnyActive(o)) store.put('lessons', o); else store.remove('lessons', o.id);
        }
      }
    }
    for (const x of toSave) {
      if (hasAnyActive(x)) store.put('lessons', x); else store.remove('lessons', x.id);
    }
    closeModal();
    toast('Gemt');
  };

  form.querySelector('[data-del]')?.addEventListener('click', async () => {
    const ans = isSeries(e)
      ? await choose('Slet lektion', `<p>${esc(e.subject)} ligger fast i ${describeWeeks([e.from, e.to])}.</p>`,
        [['cancel', 'Annuller', 'ghost'], ['week', `Kun uge ${weekNo(week)}`, 'danger'], ['all', 'Hele perioden', 'danger']])
      : await choose('Slet lektion', `<p>Vil du slette ${esc(e.subject)} i uge ${weekNo(week)}?</p>`,
        [['cancel', 'Annuller', 'ghost'], ['all', 'Slet', 'danger']]);
    if (ans === 'cancel') return;
    if (ans === 'all') {
      store.remove('lessons', e.id);
    } else {
      const o = structuredClone(e);
      o.except = [...new Set([...(o.except || []), ...o.classes.map((c) => `${week}:${c}`)])];
      if (hasAnyActive(o)) store.put('lessons', o); else store.remove('lessons', o.id);
    }
    closeModal();
    toast('Slettet');
  });
}

// Find andre lektioner i samme klasse, dag og modul i de samme uger.
function findConflicts(entry, ignoreIds) {
  const out = [];
  for (const other of store.all('lessons')) {
    if (ignoreIds.includes(other.id) || other.day !== entry.day || other.lesson !== entry.lesson) continue;
    const from = entry.from > other.from ? entry.from : other.from;
    const to = entry.to < other.to ? entry.to : other.to;
    if (from > to) continue;
    const hits = [];
    for (const w of weeksBetween(from, to)) {
      for (const c of entry.classes) if (isActive(entry, c, w) && isActive(other, c, w)) hits.push(`${w}:${c}`);
    }
    if (hits.length) out.push({ other, hits });
  }
  return out;
}
