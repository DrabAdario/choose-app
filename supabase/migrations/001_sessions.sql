-- Run in Supabase SQL Editor (or supabase db push) once per project.
-- Sessions store poll JSON in `state`; RLS is permissive for anon (MVP: UUID is the join secret).

create table if not exists public.sessions (
  id uuid primary key,
  tool text not null default 'poll',
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists sessions_updated_at_idx on public.sessions (updated_at desc);

alter table public.sessions enable row level security;

-- Allow the browser client (anon JWT) to create and read/update any row.
-- Anyone with the project anon key could list or mutate all sessions; acceptable only for low-stakes demos.
-- Tighten with invite tokens or auth before production PII.

create policy "sessions_select_anon"
  on public.sessions
  for select
  to anon, authenticated
  using (true);

create policy "sessions_insert_anon"
  on public.sessions
  for insert
  to anon, authenticated
  with check (true);

create policy "sessions_update_anon"
  on public.sessions
  for update
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update on table public.sessions to anon, authenticated;

-- Realtime: broadcast row changes to subscribed clients.
alter publication supabase_realtime add table public.sessions;
