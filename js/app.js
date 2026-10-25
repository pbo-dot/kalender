import * as store from './store.js';
import { esc } from './util.js';
import { toast, icon } from './ui.js';
import { renderTodo } from './views/todo.js';
import { renderSkema } from './views/skema.js';
import { renderHolddeling } from './views/holddeling.js';
import { renderKalender } from './views/kalender.js';
import { renderHold } from './views/hold.js';
import { renderMoeder } from './views/moeder.js';

const main = document.getElementById('main');
const nav = document.getElementById('nav');
const TABS = [
  ['todo', 'To do', 'todo'],
  ['skema', 'Skema', 'skema'],
  ['kalender', 'Kalender', 'kalender'],
  ['hold', 'Hold', 'hold'],
  ['teammoede', 'Møde', 'mode'],
];
const routes = {
  todo: renderTodo,
  skema: renderSkema,
  holddeling: renderHolddeling,
  kalender: renderKalender,
  hold: renderHold,
  teammoede: renderMoeder,
};

// Når andre ændrer noget, venter vi med at tegne siden, til man er færdig med at skrive.
let pending = false;
let lastRoute = '';
function render(force = false) {
  const ae = document.activeElement;
  if (!force && ae && main.contains(ae) && ae.matches('input, textarea, select')) {
    pending = true;
    return;
  }
  pending = false;
  const [name, ...args] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const key = routes[name] ? name : 'skema';
  const navKey = key === 'holddeling' ? 'skema' : key;
  nav.querySelectorAll('a').forEach((a) => {
    const on = a.dataset.route === navKey;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (key !== 'holddeling') document.title = 'Teamkalender';
  main.onclick = main.oninput = main.onchange = main.onsubmit = main.onfocusout = null;
  routes[key](main, args.filter(Boolean));
  if (key !== lastRoute) {
    window.scrollTo(0, 0);
    main.classList.add('enter');
    setTimeout(() => main.classList.remove('enter'), 400);
  }
  lastRoute = key;
}
main.addEventListener('focusout', () => setTimeout(() => pending && render(), 0));

function renderLogin() {
  main.innerHTML = `<form class="card login" id="loginForm">
    <h1>Log ind</h1>
    <p class="sub">Du får et link på mail. Ingen adgangskode.</p>
    <label class="field" for="email"><span>Mail</span><input id="email" name="email" type="email" required autocomplete="email"></label>
    <button class="btn filled">Send link</button>
  </form>`;
  main.onsubmit = async (ev) => {
    ev.preventDefault();
    const email = new FormData(ev.target).get('email').trim();
    try {
      await store.signIn(email);
      main.innerHTML = `<div class="card login"><h1>Tjek din mail</h1>
        <p class="sub">Åbn linket i mailen til <b>${esc(email)}</b> på denne enhed.</p></div>`;
    } catch (err) {
      toast('Linket kunne ikke sendes: ' + err.message);
    }
  };
}

function renderNav() {
  nav.innerHTML = TABS.map(([route, label, ic]) =>
    `<a href="#/${route}" data-route="${route}"><i>${icon(ic)}</i><span>${label}</span></a>`).join('');
  if (store.isShared()) {
    nav.insertAdjacentHTML('beforeend', `<button type="button" class="nav-out" id="logout" title="Log ud (${esc(store.userEmail())})">
      <i>${icon('logout')}</i><span>Log ud</span></button>`);
    nav.querySelector('#logout').onclick = () => store.signOut();
  } else {
    document.getElementById('banner').innerHTML =
      `<p class="mode-pill">${icon('info')}Prøve-tilstand: gemmes kun på denne enhed</p>`;
  }
  nav.hidden = false;
}

async function boot() {
  store.setErrorHandler(toast);
  try {
    await store.init();
  } catch (err) {
    main.innerHTML = `<div class="empty">Kunne ikke hente data: ${esc(err.message)}. Prøv at genindlæse siden.</div>`;
    return;
  }
  if (store.needsLogin()) return renderLogin();
  if (!store.hasAccess()) {
    main.innerHTML = `<div class="card login"><h1>Ingen adgang</h1>
      <p class="sub">${esc(store.userEmail())} er ikke på lærerlisten endnu.</p>
      <button type="button" class="btn tonal" id="out">Log ud</button></div>`;
    main.querySelector('#out').onclick = () => store.signOut();
    return;
  }
  renderNav();
  store.subscribe((remote) => render(!remote));
  window.addEventListener('hashchange', () => render(true));
  render(true);
}

boot();
