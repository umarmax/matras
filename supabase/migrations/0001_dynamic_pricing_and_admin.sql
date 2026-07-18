-- Migration 0001: dynamic per-m² pricing, categories, admins, expanded order statuses
-- Safe to run on an existing production database. Idempotent where possible.
-- Run in Supabase SQL Editor (or `supabase db push`).

-- ─────────────────────────────────────────────────────────────
-- 1. CATEGORIES — configurable pricing per mattress category
-- ─────────────────────────────────────────────────────────────
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

comment on table public.categories is
  'Mattress categories with dynamic per-square-meter pricing. Editable from the admin panel.';

-- Seed the five categories. Prices are PLACEHOLDERS in UZS — adjust in the admin panel.
-- price_per_m2 = price per square meter; minimum_price = floor for small mattresses.
insert into public.categories (slug, name, description, price_per_m2, minimum_price, sort_order)
values
  ('orthopedic', 'Ортопедические', 'Матрасы с независимым пружинным блоком для здорового сна', 1500000, 2000000, 1),
  ('spring',     'Пружинные',      'Классический пружинный комфорт',                            1000000, 1500000, 2),
  ('foam',       'Беспружинные',   'Пена с эффектом памяти формы',                              1300000, 1800000, 3),
  ('kids',       'Детские',        'Гипоаллергенные матрасы с усиленной поддержкой',            900000,  1000000, 4),
  ('custom',     'На заказ',       'Матрас любого размера, изготовление за 2 дня',              1800000, 2500000, 5)
on conflict (slug) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 2. PRODUCTS — link to categories, keep legacy `price` for compatibility
-- ─────────────────────────────────────────────────────────────
alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null;

-- Backfill category_id from the existing text slug in products.category.
update public.products p
set category_id = c.id
from public.categories c
where p.category = c.slug
  and p.category_id is null;

create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_category_id on public.products (category_id);

-- ─────────────────────────────────────────────────────────────
-- 3. ADMINS — role-based access by Telegram user id
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  telegram_user_id bigint primary key,
  name             text,
  role             text not null default 'sales_manager'
                     check (role in ('owner', 'sales_manager')),
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

comment on table public.admins is
  'Telegram user ids granted admin access. Roles: owner (full), sales_manager (orders only). Customers are simply absent from this table.';

-- Seed the initial Owner (TELEGRAM_ADMIN_CHAT_ID from project handover).
insert into public.admins (telegram_user_id, name, role)
values (8627067211, 'Owner', 'owner')
on conflict (telegram_user_id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 4. ORDERS — expanded status pipeline + admin note
-- ─────────────────────────────────────────────────────────────
alter table public.orders
  add column if not exists admin_note text;

-- Replace the status check constraint with the full production pipeline.
-- 'completed' is kept valid so pre-existing rows never violate the constraint.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled', 'completed'
  ));

create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_telegram_user_id on public.orders (telegram_user_id);

-- ─────────────────────────────────────────────────────────────
-- 5. RLS
-- ─────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.admins enable row level security;

-- Public may read only ACTIVE categories (needed for price calculation in the app).
drop policy if exists "Active categories are viewable by everyone" on public.categories;
create policy "Active categories are viewable by everyone"
  on public.categories for select
  using (active = true);

-- No anon/authenticated policies on admins or category writes: all admin mutations
-- go through the `admin-api` Edge Function using the service-role key AFTER verifying
-- the caller's Telegram identity. With RLS enabled and no policy, direct anon access
-- is denied by default — the service role bypasses RLS.
