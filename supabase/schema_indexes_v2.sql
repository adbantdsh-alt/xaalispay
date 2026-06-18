-- XaalisPay — Index performance v2
-- Exécuter après schema_v1.sql sur Supabase (SQL Editor ou psql)

-- Commandes : filtres vendeur + tri chronologique
create index if not exists xp_orders_seller_created_idx
  on public.xp_orders (seller_id, created_at desc);

create index if not exists xp_orders_seller_status_idx
  on public.xp_orders (seller_id, status);

create index if not exists xp_orders_created_at_idx
  on public.xp_orders (created_at desc);

create index if not exists xp_orders_status_created_idx
  on public.xp_orders (status, created_at desc);

-- Ledger : historique vendeur
create index if not exists xp_ledger_seller_created_idx
  on public.xp_ledger_entries (seller_id, created_at desc);

-- Payouts : historique vendeur
create index if not exists xp_payouts_seller_created_idx
  on public.xp_payouts (seller_id, created_at desc);

-- Tentatives paiement : lookup par slug commande
create index if not exists xp_payment_attempts_order_slug_idx
  on public.xp_payment_attempts (order_slug);

create index if not exists xp_payment_attempts_order_id_idx
  on public.xp_payment_attempts (order_id);

-- Produits : lien paiement
create index if not exists xp_products_payment_slug_idx
  on public.xp_products (payment_slug)
  where payment_slug <> '';
