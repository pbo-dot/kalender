import { VERSION, VERSION_DATE } from '../config.js';
import { fmtDate } from '../util.js';
import { openModal, icon } from '../ui.js';
import * as store from '../store.js';

// Kort forklaring af appens faner. Vises fra ?-knappen øverst.
const SECTIONS = [
  ['skema', 'Skema', 'c1', [
    'Vælg 0.A, 0.B eller Årgang. Det du lægger under Årgang, kommer i begge klasser.',
    'Tryk + for en ny lektion. Vælg "Fast i en periode" for f.eks. <span class="nowrap">uge 5–20</span>.',
    'Tryk på Plan, Voksne eller Holddeling på et kort. Holddeling åbner i ny fane.',
  ]],
  ['todo', 'To do', 'c3', [
    'Skriv opgave, hvem og frist. Sæt flueben, når den er klaret.',
  ]],
  ['kalender', 'Kalender', 'c0', [
    'Lærermøder (LM), afdelingsmøder (AM) og kurser for hele skoleåret.',
  ]],
  ['hold', 'Hold', 'c4', [
    'DSA-hold og årgangshold med voksne, tidspunkt og børn.',
  ]],
  ['mode', 'Møde', 'c2', [
    'Dagsorden og referat fra teammøder. Det næste møde står øverst.',
  ]],
  ['shield', 'Husk', 'c5', [
    'Kun fornavne eller initialer på børn. Intet om helbred, trivsel eller familie.',
  ]],
  ['phone', 'Som app', 'c6', [
    'iPhone: Del-knappen → "Føj til hjemmeskærm".',
    'Android: ⋮ → "Føj til startskærm".',
  ]],
];

export function openHelp() {
  const sections = store.isShared() ? SECTIONS : [...SECTIONS.slice(0, 5),
    ['info', 'Prøve-tilstand', 'c7', ['Data gemmes kun på denne enhed og deles ikke endnu.']], ...SECTIONS.slice(5)];
  openModal(`<div class="modal-form">
    <h2>Sådan virker appen</h2>
    <div class="help-list">${sections.map(([ic, title, color, lines]) => `<section class="help-item ${color}">
      <i>${icon(ic)}</i>
      <div><h3>${title}</h3><ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul></div>
    </section>`).join('')}</div>
    <p class="version">Version ${VERSION} · ${fmtDate(VERSION_DATE, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    <footer><button type="button" class="btn filled" data-close>Luk</button></footer>
  </div>`);
}
