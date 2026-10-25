-- Kør hele filen i Supabase: SQL Editor -> New query -> indsæt -> Run.

create table if not exists public.allowed_emails (
  email text primary key
);

create table if not exists public.items (
  id text primary key,
  collection text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.items enable row level security;
alter table public.allowed_emails enable row level security;

-- Kun lærere hvis mail står i allowed_emails, kan se og ændre data.
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_emails where email = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "laerere" on public.items;
create policy "laerere" on public.items
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

drop policy if exists "se egen mail" on public.allowed_emails;
create policy "se egen mail" on public.allowed_emails
  for select to authenticated using (email = lower(auth.jwt() ->> 'email'));

-- Ændringer vises med det samme hos de andre.
alter publication supabase_realtime add table public.items;

-- Tilføj lærerne (små bogstaver):
-- insert into public.allowed_emails (email) values
--   ('caroline@skole.dk'),
--   ('kollega@skole.dk');
