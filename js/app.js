import * as store from './store.js';
import { esc } from './util.js';
import { toast } from './ui.js';
import { renderTodo } from './views/todo.js';
import { renderSkema } from './views/skema.js';
import { renderHolddeling } from './views/holddeling.js';
import { renderKalender } from './views/kalender.js';
import { renderHold } from './views/hold.js';
import { renderMoeder } from './views/moeder.js';

const main = document.getElementById('main');
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
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === navKey));
  if (key !== 'holddeling') document.title = 'Teamkalender';
  main.onclick = main.oninput = main.onchange = main.onsubmit = main.onfocusout = null;
  routes[key](main, args.filter(Boolean));
}
main.addEventListener('focusout', () => setTimeout(() => pending && render(), 0));

function renderLogin() {
  document.getElementById('nav').hidden = true;
  main.innerHTML = `<form class="login card" id="loginForm">
    <h1>Log ind</h1>
    <p>Skriv din mail, så sender vi dig et link. Du skal ikke bruge en adgangskode.</p>
    <label for="email">Mail<input id="email" name="email" type="email" required autocomplete="email"></label>
    <button class="btn primary">Send link</button>
  </form>`;
  main.onsubmit = async (ev) => {
    ev.preventDefault();
    const email = new FormData(ev.target).get('email').trim();
    try {
      await store.signIn(email);
      main.innerHTML = `<div class="login card"><h1>Tjek din mail</h1>
        <p>Vi har sendt et link til <strong>${esc(email)}</strong>. Åbn det på denne enhed for at logge ind.</p></div>`;
    } catch (err) {
      toast('Linket kunne ikke sendes: ' + err.message);
    }
  };
}

function renderUserBox() {
  const box = document.getElementById('user');
  if (store.isShared()) {
    box.innerHTML = `<span>${esc(store.userEmail())}</span> <button type="button" class="btn ghost small" id="logout">Log ud</button>`;
    box.querySelector('#logout').onclick = () => store.signOut();
  } else {
    document.getElementById('banner').innerHTML =
      '<p class="banner">Prøve-tilstand: Data gemmes kun i denne browser og deles ikke med de andre lærere endnu.</p>';
  }
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
  renderUserBox();
  if (!store.hasAccess()) {
    document.getElementById('nav').hidden = true;
    main.innerHTML = `<div class="login card"><h1>Ingen adgang endnu</h1>
      <p>${esc(store.userEmail())} er ikke på listen over lærere. Bed den der har oprettet appen, om at tilføje dig.</p></div>`;
    return;
  }
  store.subscribe((remote) => render(!remote));
  window.addEventListener('hashchange', () => render(true));
  render(true);
}

boot();
