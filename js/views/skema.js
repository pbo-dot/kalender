import * as store from '../store.js';
import { CLASSES, SLOTS, SUBJECTS } from '../config.js';
import { esc, uid, fmtDate } from '../util.js';
import {
  DAYS, currentWeek, addWeeks, weeksBetween, dayDate, weekNo, weekLabel, describeWeeks, isWeekKey,
} from '../weeks.js';
import { openModal, closeModal, choose, toast, icon, colorFor } from '../ui.js';

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
const SHORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre'];

// Valgt dag på telefonen huskes, mens man bliver i samme uge.
let picked = { week: null, day: 0 };

export function renderSkema(main, [view = CLASSES[0], week]) {
  if (![...CLASSES, 'aargang'].includes(view)) view = CLASSES[0];
  if (!isWeekKey(week)) week = currentWeek();
  const isNow = week === currentWeek();
  const todayIdx = isNow ? Math.min(Math.max(new Date().getDay() - 1, 0), 4) : -1;
  if (picked.week !== week) picked = { week, day: Math.max(todayIdx, 0) };
  const sel = picked.day;

  const lessons = store.all('lessons').sort((a, b) => a.subject.localeCompare(b.subject, 'da'));
  const tabs = [...CLASSES.map((c) => [c, c]), ['aargang', 'Årgang']];

  const card = (e) => {
    const w = e.weekly?.[week] || {};
    const voksne = w.voksne || e.voksne;
    const hold = (w.hold || []).filter((h) => h.name || h.adult);
    return `<div class="lesson ${colorFor(e.subject)}">
      <button type="button" class="lesson-title" data-open="${e.id}">
        <span>${esc(e.subject)}</span>
        ${isYearGroup(e) && view !== 'aargang' ? '<span class="badge">årgang</span>' : ''}
        ${isSeries(e) ? `<span class="badge">uge ${weekNo(e.from)}–${weekNo(e.to)}</span>` : ''}
      </button>
      ${hold.length ? `<ul class="hold-lines">${hold.map((h) =>
        `<li><b>${esc(h.name)}</b>${h.adult ? `: ${esc(h.adult)}` : ''}</li>`).join('')}</ul>` : ''}
      <div class="chips">
        <button type="button" class="chip ${w.plan ? '' : 'off'}" data-open="${e.id}" data-tab="plan">${icon('plan')}Plan</button>
        <button type="button" class="chip ${voksne ? '' : 'off'}" data-open="${e.id}" data-tab="voksne">${icon('person')}<span>${voksne ? esc(voksne) : 'Voksne'}</span></button>
        <a class="chip ${hold.length ? '' : 'off'}" href="#/holddeling/${e.id}/${week}" target="_blank" rel="noopener">${icon('split')}${hold.length ? `${hold.length} hold` : 'Holddeling'}</a>
      </div>
    </div>`;
  };

  // Indholdet i ét felt (dag + modul).
  const cell = (day, lesson) => {
    const here = lessons.filter((e) => e.day === day && e.lesson === lesson);
    let html;
    if (view === 'aargang') {
      html = here.map((e) => {
        const active = CLASSES.filter((c) => isActive(e, c, week));
        if (!active.length) return '';
        if (isYearGroup(e) && active.length === e.classes.length) return card(e);
        return `<button type="button" class="lesson mini ${colorFor(e.subject)}" data-open="${e.id}">
          <b>${esc(active.join(' + '))}</b> ${esc(e.subject)}</button>`;
      }).join('');
    } else {
      html = here.filter((e) => isActive(e, view, week)).map(card).join('');
    }
    const label = `Tilføj ${DAYS[day]} ${lessonLabel(lesson)}`;
    return html
      ? `${html}<button type="button" class="add-more" data-add="${day}:${lesson}" aria-label="${label}">${icon('plus')}</button>`
      : `<button type="button" class="add-slot" data-add="${day}:${lesson}" aria-label="${label}">${icon('plus')}<span>Tilføj</span></button>`;
  };

  const pauseIcon = (s) => icon(/frokost/i.test(s.pause) ? 'bowl' : 'apple');

  // Computer: hele ugen som gitter.
  const grid = `<div class="week-grid" role="grid">
    <div></div>
    ${DAYS.map((d, i) => `<div class="wg-head ${i === todayIdx ? 'today' : ''}"><b>${d}</b>${fmtDate(dayDate(week, i))}</div>`).join('')}
    ${SLOTS.map((s) => s.pause
      ? `<div></div><div class="pause-band">${pauseIcon(s)}${esc(s.pause)}</div>`
      : `<div class="wg-time">${esc(s.time)}</div>${DAYS.map((_, d) => `<div class="wg-cell">${cell(d, s.lesson)}</div>`).join('')}`).join('')}
  </div>`;

  // Telefon: én dag ad gangen.
  const dayChips = `<div class="day-chips">${DAYS.map((_, i) =>
    `<button type="button" class="day-chip ${i === sel ? 'on' : ''} ${i === todayIdx ? 'today' : ''}" data-day="${i}"
      aria-pressed="${i === sel}">${SHORT[i]}<b>${dayDate(week, i).getDate()}</b></button>`).join('')}</div>`;
  const dayList = `<div class="day-list">${SLOTS.map((s) => s.pause
    ? `<div class="pause-band">${pauseIcon(s)}${esc(s.pause)}</div>`
    : `<div class="slot"><div class="slot-time">${esc(s.time).replace('–', '<br>')}</div><div class="slot-body">${cell(sel, s.lesson)}</div></div>`).join('')}
  </div>`;

  const freeLesson = SLOTS.filter((s) => s.lesson)
    .find((s) => !lessons.some((e) => e.day === sel && e.lesson === s.lesson && CLASSES.some((c) => isActive(e, c, week))))?.lesson || 1;

  main.innerHTML = `
    <header class="page-head">
      <h1>Skema</h1>
      <div class="head-actions">
        <div class="weeknav">
          <a class="icon-btn" href="#/skema/${view}/${addWeeks(week, -1)}" aria-label="Forrige uge">${icon('left')}</a>
          <div class="week-pill"><b>Uge ${weekNo(week)}</b><span>${fmtDate(dayDate(week, 0), { day: 'numeric' })}–${fmtDate(dayDate(week, 4))}</span></div>
          <a class="icon-btn" href="#/skema/${view}/${addWeeks(week, 1)}" aria-label="Næste uge">${icon('right')}</a>
        </div>
        ${isNow ? '' : `<a class="btn tonal" href="#/skema/${view}/${currentWeek()}">I dag</a>`}
        <button type="button" class="btn filled wide-only" data-add="${Math.max(todayIdx, 0)}:1">${icon('plus')}Lektion</button>
      </div>
    </header>
    <nav class="button-group" aria-label="Klasse">${tabs.map(([k, l]) =>
      `<a href="#/skema/${k}/${week}" class="${k === view ? 'on' : ''}" ${k === view ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="wide-only">${grid}</div>
    <div class="narrow-only">${dayChips}${dayList}</div>
    <button type="button" class="fab narrow-only" data-add="${sel}:${freeLesson}">${icon('plus')}Lektion</button>`;

  main.onclick = (ev) => {
    const dayBtn = ev.target.closest('[data-day]');
    if (dayBtn) {
      picked.day = +dayBtn.dataset.day;
      renderSkema(main, [view, week]);
      return;
    }
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
  const date = fmtDate(dayDate(week, e.day), { day: 'numeric', month: 'short' });

  const d = openModal(`<form class="modal-form lesson-form">
    <h2>${isNew ? 'Ny lektion' : esc(e.subject)}</h2>
    <p class="sub">${esc(classLabel(e))} · ${DAYS[e.day].toLowerCase()} ${date} · ${lessonLabel(e.lesson)}</p>
    <div class="fields">
      <label class="field" for="f-subject"><span>Fag</span>
        <input id="f-subject" name="subject" list="subjects" required value="${esc(e.subject)}" placeholder="F.eks. Dansk"></label>
      <datalist id="subjects">${SUBJECTS.map((s) => `<option value="${esc(s)}">`).join('')}</datalist>
      <label class="field half" for="f-day"><span>Dag</span>
        <select id="f-day" name="day">${DAYS.map((n, i) => `<option value="${i}" ${i === e.day ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="field half" for="f-lesson"><span>Tid</span>
        <select id="f-lesson" name="lesson">${SLOTS.filter((s) => s.lesson).map((s) =>
          `<option value="${s.lesson}" ${s.lesson === e.lesson ? 'selected' : ''}>${s.time}</option>`).join('')}</select></label>
    </div>
    <div class="choice" role="radiogroup" aria-label="Gentagelse">
      <label class="choice-chip"><input type="radio" name="repeat" value="once" ${isSeries(e) ? '' : 'checked'}>Kun uge ${weekNo(week)}</label>
      <label class="choice-chip"><input type="radio" name="repeat" value="series" ${isSeries(e) ? 'checked' : ''}>Fast i en periode</label>
    </div>
    <div class="fields series-fields" ${isSeries(e) ? '' : 'hidden'}>
      <label class="field half" for="f-from"><span>Fra</span>${weekSelect('from', e.from, week)}</label>
      <label class="field half" for="f-to"><span>Til og med</span>${weekSelect('to', isSeries(e) ? e.to : addWeeks(week, 10), week)}</label>
    </div>

    <div class="seg" role="tablist">
      <button type="button" role="tab" data-tab="plan">${icon('plan')}Plan</button>
      <button type="button" role="tab" data-tab="voksne">${icon('person')}Voksne</button>
      <button type="button" role="tab" data-tab="hold">${icon('split')}Hold</button>
    </div>
    <div class="tabpanel" data-panel="plan">
      <label class="field" for="f-plan"><span>Plan for uge ${weekNo(week)}</span>
        <textarea id="f-plan" name="plan" rows="4" placeholder="Hvad skal vi lave?">${esc(w.plan)}</textarea></label>
    </div>
    <div class="tabpanel" data-panel="voksne">
      <label class="field" for="f-voksne"><span>Faste voksne</span>
        <input id="f-voksne" name="voksne" value="${esc(e.voksne)}" placeholder="F.eks. Caroline og Kaj"></label>
      <label class="field" for="f-weekVoksne"><span>Andre kun i uge ${weekNo(week)}</span>
        <input id="f-weekVoksne" name="weekVoksne" value="${esc(w.voksne)}" placeholder="Tom = de faste"></label>
    </div>
    <div class="tabpanel" data-panel="hold">
      ${isNew
        ? '<p class="sub">Gem lektionen først.</p>'
        : `${hold.length ? `<ul class="hold-lines">${hold.map((h) => `<li><b>${esc(h.name)}</b>${h.adult ? `: ${esc(h.adult)}` : ''}</li>`).join('')}</ul>` : ''}
           <a class="btn tonal" href="#/holddeling/${e.id}/${week}" target="_blank" rel="noopener">${icon('open')}Åbn holddeling</a>`}
    </div>

    <footer>
      ${isNew ? '' : '<button type="button" class="btn text danger" data-del>Slet</button>'}
      <span class="spacer"></span>
      <button type="button" class="btn tonal" data-close>Annuller</button>
      <button class="btn filled">Gem</button>
    </footer>
  </form>`);

  const form = d.querySelector('form');
  const showTab = (t) => {
    form.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === t));
    form.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t; });
  };
  showTab(tab);
  form.querySelector('.seg').onclick = (ev) => { const b = ev.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); };
  form.querySelectorAll('[name=repeat]').forEach((r) => {
    r.onchange = () => { form.querySelector('.series-fields').hidden = form.repeat.value !== 'series'; };
  });
  if (isNew && matchMedia('(pointer: fine)').matches) form.subject.focus();

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
          [['cancel', 'Annuller', 'text'], ['week', `Kun uge ${weekNo(week)}`, 'tonal'], ['all', 'Hele perioden', 'filled']]);
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
        [['cancel', 'Annuller', 'text'], ['both', 'Behold begge', 'tonal'], ['replace', 'Erstat', 'filled']]);
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
        [['cancel', 'Annuller', 'text'], ['week', `Kun uge ${weekNo(week)}`, 'tonal danger'], ['all', 'Hele perioden', 'filled danger']])
      : await choose('Slet lektion', `<p>Vil du slette ${esc(e.subject)} i uge ${weekNo(week)}?</p>`,
        [['cancel', 'Annuller', 'text'], ['all', 'Slet', 'filled danger']]);
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
