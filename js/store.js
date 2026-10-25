// Alle data ligger i én tabel "items" (Supabase) eller i localStorage (prøve-tilstand).
// Hele indholdet holdes i hukommelsen, så visningerne kan læse synkront.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { uid } from './util.js';

const COLLECTIONS = ['todos', 'lessons', 'events', 'teams', 'meetings'];
const cache = Object.fromEntries(COLLECTIONS.map((c) => [c, new Map()]));
const listeners = new Set();
let sb = null;
let session = null;
let allowed = true;
let onError = (msg) => console.error(msg);

export const isShared = () => !!sb;
export const needsLogin = () => !!sb && !session;
export const hasAccess = () => allowed;
export const userEmail = () => session?.user?.email || '';
export const setErrorHandler = (fn) => { onError = fn; };
export const subscribe = (fn) => listeners.add(fn);
const emit = (remote = false) => listeners.forEach((fn) => fn(remote));

export async function init() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    for (const c of COLLECTIONS) {
      try {
        for (const o of JSON.parse(localStorage.getItem('kalender:' + c) || '[]')) cache[c].set(o.id, o);
      } catch { /* tom eller blokeret lagring */ }
    }
    return;
  }

  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  session = (await sb.auth.getSession()).data.session;
  sb.auth.onAuthStateChange((_event, s) => {
    const changed = !!s !== !!session;
    session = s;
    if (changed) location.reload();
  });
  if (!session) return;

  const { data: me } = await sb.from('allowed_emails').select('email').eq('email', userEmail().toLowerCase());
  allowed = !!me?.length;
  if (!allowed) return;

  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('items').select('id,collection,data').range(from, from + 999);
    if (error) throw error;
    for (const r of data) cache[r.collection]?.set(r.id, r.data);
    if (data.length < 1000) break;
  }

  sb.channel('items')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, ({ eventType, new: row, old }) => {
      if (eventType === 'DELETE') {
        let had = false;
        for (const m of Object.values(cache)) had = m.delete(old.id) || had;
        if (!had) return; // vi har selv slettet den
      } else {
        const mine = cache[row.collection]?.get(row.id);
        if (mine && mine.updatedAt === row.data.updatedAt) return; // vores egen ændring
        cache[row.collection]?.set(row.id, row.data);
      }
      emit(true);
    })
    .subscribe();
}

export const all = (c) => [...cache[c].values()];
export const get = (c, id) => cache[c].get(id);

function saveLocal(c) {
  try {
    localStorage.setItem('kalender:' + c, JSON.stringify(all(c)));
  } catch {
    onError('Kunne ikke gemme i browseren.');
  }
}

// silent: gem uden at tegne siden igen (bruges mens man skriver).
export function put(c, obj, { silent = false } = {}) {
  obj.id ||= uid();
  obj.updatedAt = new Date().toISOString();
  obj.updatedBy = userEmail() || undefined;
  cache[c].set(obj.id, obj);
  if (sb) {
    sb.from('items')
      .upsert({ id: obj.id, collection: c, data: obj, updated_at: obj.updatedAt })
      .then(({ error }) => error && onError('Kunne ikke gemme: ' + error.message));
  } else {
    saveLocal(c);
  }
  if (!silent) emit();
  return obj;
}

export function remove(c, id) {
  cache[c].delete(id);
  if (sb) {
    sb.from('items').delete().eq('id', id)
      .then(({ error }) => error && onError('Kunne ikke slette: ' + error.message));
  } else {
    saveLocal(c);
  }
  emit();
}

export async function signIn(email) {
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + location.pathname },
  });
  if (error) throw error;
}

export const signOut = () => sb.auth.signOut();
