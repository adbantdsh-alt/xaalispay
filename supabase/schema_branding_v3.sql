-- XaalisPay — Branding vendeur (photo profil + bannière)
-- Exécuter sur Supabase si XP_RELATIONAL_DUAL_WRITE est actif

alter table public.xp_profiles
  add column if not exists avatar_url text default '',
  add column if not exists cover_url text default '';
