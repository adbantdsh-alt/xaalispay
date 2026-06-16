-- À exécuter une fois dans Supabase → SQL Editor
-- Préférer supabase/setup_prod.sql (script complet prod)

create table if not exists public.app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Aucune policy : seul service_role (API serveur) accède — bypass RLS.
-- Ne pas ajouter de policy "using (true)" : exposerait toute la base au anon key.

drop policy if exists "Service role full access" on public.app_state;
