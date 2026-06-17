-- XaalisPay — Remise à zéro données transactionnelles (lancement pilote)
-- Conserve : app_state (profils/auth), xp_profiles, xp_auth_users
-- Préférer le bouton admin « Remise à zéro » qui met aussi à jour app_state.
-- Utiliser ce SQL uniquement si l'admin UI n'est pas disponible.

delete from public.xp_ledger_entries;
delete from public.xp_seller_balances;
delete from public.xp_payment_attempts;
delete from public.xp_webhook_events;
delete from public.xp_payouts;
delete from public.xp_orders;
delete from public.xp_products;

update public.xp_migration_meta
set migrated_at = now(),
    counts = '{"orders":0,"products":0,"payouts":0}'::jsonb
where id = 'main';

-- Puis dans /admin : « Remise à zéro » pour vider app_state JSON.
