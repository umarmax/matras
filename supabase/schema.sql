-- Supabase schema for Matras TMA (fresh install)
-- For an existing database, run the incremental migrations in ./migrations instead.

-- ── Categories: dynamic per-m² pricing ──
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  description   text,
  image_url     text,
  active        boolean not null default true,
  price_per_m2  integer not null default 0 check (price_per_m2 >= 0),
  minimum_price integer check (minimum_price is null or minimum_price >= 0),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null default 0 check (price >= 0), -- legacy/fallback; pricing is derived from category
  category text not null,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  width_options integer[] not null default '{160}',
  length_options integer[] not null default '{200}',
  rigidity text not null check (rigidity in ('soft', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_category_id on public.products (category_id);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text not null,
  last_name text,
  username text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  telegram_user_id bigint primary key,
  name             text,
  role             text not null default 'sales_manager'
                     check (role in ('owner', 'sales_manager')),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending'
    check (status in (
      'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled', 'completed'
    )),
  telegram_user_id bigint,
  telegram_username text,
  customer_name text,
  customer_phone text,
  delivery_address text,
  comment text,
  admin_note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_telegram_user_id on public.orders (telegram_user_id);

-- ── RLS ──
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.orders enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select using (true);

create policy "Active categories are viewable by everyone"
  on public.categories for select using (active = true);

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can view own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Allow order creation from app"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Admin mutations (categories, admins, order status) are performed by the
-- `admin-api` Edge Function with the service-role key after verifying the
-- caller's Telegram identity, so no anon/authenticated write policies exist here.
