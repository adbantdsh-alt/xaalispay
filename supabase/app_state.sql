-- À exécuter une fois dans Supabase → SQL Editor
create table if not exists public.app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Accès via service_role uniquement (API serveur)
create policy "Service role full access"
  on public.app_state
  for all
  using (true)
  with check (true);
