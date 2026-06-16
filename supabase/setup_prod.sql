-- ═══════════════════════════════════════════════════════════════
-- XaalisPay — Setup production Supabase
-- Exécuter une fois dans Supabase → SQL Editor (dans l'ordre)
-- ═══════════════════════════════════════════════════════════════

-- 1) Persistance JSON (commandes, ledger, profils…)
-- L'API serveur utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- Aucune policy publique : anon/authenticated ne peuvent pas lire app_state.

create table if not exists public.app_state (
  id text primary key default 'main',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Retirer une éventuelle policy trop permissive (versions antérieures)
drop policy if exists "Service role full access" on public.app_state;

-- 2) Bucket images produits (public read, upload via service_role côté API)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

-- ═══════════════════════════════════════════════════════════════
-- Après exécution : vérifier dans Supabase
-- • Table app_state existe (1 ligne id=main après 1er déploiement)
-- • Bucket product-images public
-- • Authentication → URL : Site URL + Redirect /auth/callback
-- ═══════════════════════════════════════════════════════════════
