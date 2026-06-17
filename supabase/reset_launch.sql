-- XaalisPay — Wipe complet (partir de zéro)
-- Préférer le bouton admin « Wipe complet » (met aussi à jour app_state + Supabase Auth).
-- SQL manuel : tables relationnelles uniquement.

delete from public.xp_ledger_entries;
delete from public.xp_seller_balances;
delete from public.xp_payment_attempts;
delete from public.xp_webhook_events;
delete from public.xp_payouts;
delete from public.xp_orders;
delete from public.xp_products;
delete from public.xp_profiles;
delete from public.xp_auth_users;

update public.xp_migration_meta
set migrated_at = now(),
    counts = '{}'::jsonb
where id = 'main';

-- app_state : vider via /admin → Wipe complet, ou manuellement :
-- update public.app_state set data = '{"authUsers":[],"profiles":[],"products":[],"orders":[],"ledgerEntries":[],"sellerBalances":[],"paymentAttempts":[],"webhookEvents":[],"payouts":[],"adminAuditLog":[]}'::jsonb where id = 'main';

-- Supabase Auth : supprimer les users dans Dashboard → Authentication → Users
-- ou via le bouton admin (API service_role).
