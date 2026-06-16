-- XaalisPay — Schéma relationnel v1
-- Exécuter après supabase/setup_prod.sql
-- Source de vérité actuelle : app_state (JSON). Cette migration crée des tables miroir
-- pour analytics, exports et migration progressive. Lancer via /admin → Migrer.

-- Métadonnées migration
create table if not exists public.xp_migration_meta (
  id text primary key default 'main',
  migrated_at timestamptz,
  counts jsonb not null default '{}'::jsonb
);

alter table public.xp_migration_meta enable row level security;

create table if not exists public.xp_profiles (
  id text primary key,
  username text not null,
  display_name text not null,
  business_name text not null,
  phone text,
  role text default 'seller',
  email_verified_at timestamptz,
  username_changed_at timestamptz,
  payout_method text,
  payout_phone text,
  auto_payout_enabled boolean default false,
  auto_payout_mode text,
  auto_payout_min_amount integer,
  auto_payout_fixed_amount integer,
  auto_payout_min_completed_orders integer,
  created_at timestamptz not null
);

create table if not exists public.xp_auth_users (
  id text primary key,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null
);

create table if not exists public.xp_products (
  id text primary key,
  seller_id text not null references public.xp_profiles(id) on delete cascade,
  payment_slug text not null default '',
  name text not null,
  description text default '',
  price integer not null,
  delivery_cost integer default 0,
  delivery_hours integer not null,
  note text default '',
  image text default '',
  active boolean default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists xp_products_seller_idx on public.xp_products(seller_id);

create table if not exists public.xp_orders (
  id text primary key,
  seller_id text not null references public.xp_profiles(id) on delete cascade,
  product_id text,
  slug text not null,
  pin text not null,
  client_name text not null,
  client_first_name text default '',
  client_phone text not null,
  client_address text default '',
  client_note text default '',
  product_name text not null,
  product_price integer not null,
  delivery_cost integer default 0,
  delivery_hours integer not null,
  status text not null,
  payment_method text,
  payment_reference text,
  payment_provider text,
  payment_provider_id text,
  payment_provider_status text,
  payment_provider_message text,
  paid_at timestamptz,
  delivery_deadline_at timestamptz,
  delivery_validated_at timestamptz,
  delivery_code_issued_at timestamptz,
  delivery_code_expires_at timestamptz,
  client_delivery_confirmed_at timestamptz,
  protection_ends_at timestamptz,
  dispute_reason text,
  dispute_photos jsonb default '[]'::jsonb,
  dispute_media jsonb default '[]'::jsonb,
  dispute_opened_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  buyer_protection_fee integer,
  seller_commission integer,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists xp_orders_seller_idx on public.xp_orders(seller_id);
create index if not exists xp_orders_status_idx on public.xp_orders(status);
create index if not exists xp_orders_slug_idx on public.xp_orders(slug);

create table if not exists public.xp_ledger_entries (
  id text primary key,
  seller_id text not null references public.xp_profiles(id) on delete cascade,
  order_id text,
  payout_id text,
  webhook_event_id text,
  type text not null,
  pocket text not null,
  amount integer not null,
  direction text not null,
  reference text not null unique,
  description text,
  created_at timestamptz not null
);

create index if not exists xp_ledger_seller_idx on public.xp_ledger_entries(seller_id);

create table if not exists public.xp_seller_balances (
  seller_id text primary key references public.xp_profiles(id) on delete cascade,
  escrow_balance integer default 0,
  available_balance integer default 0,
  blocked_balance integer default 0,
  paid_out_balance integer default 0,
  updated_at timestamptz not null
);

create table if not exists public.xp_payment_attempts (
  id text primary key,
  order_id text not null,
  order_slug text not null,
  seller_id text not null,
  payment_reference text not null,
  payment_method text not null,
  provider text not null,
  provider_id text,
  payment_url text,
  qr_code text,
  status text not null,
  message text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.xp_webhook_events (
  id text primary key,
  provider text not null,
  event_key text not null,
  reference text,
  status text not null,
  payload jsonb,
  created_at timestamptz not null
);

create table if not exists public.xp_payouts (
  id text primary key,
  seller_id text not null references public.xp_profiles(id) on delete cascade,
  amount integer not null,
  net_amount integer,
  fee integer,
  method text not null,
  phone text not null,
  status text not null,
  provider text,
  provider_id text,
  failure_reason text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists xp_payouts_seller_idx on public.xp_payouts(seller_id);
create index if not exists xp_payouts_status_idx on public.xp_payouts(status);

-- RLS activé, accès service_role uniquement (pas de policies publiques)
alter table public.xp_profiles enable row level security;
alter table public.xp_auth_users enable row level security;
alter table public.xp_products enable row level security;
alter table public.xp_orders enable row level security;
alter table public.xp_ledger_entries enable row level security;
alter table public.xp_seller_balances enable row level security;
alter table public.xp_payment_attempts enable row level security;
alter table public.xp_webhook_events enable row level security;
alter table public.xp_payouts enable row level security;
