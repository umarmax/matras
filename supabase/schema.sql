-- Supabase schema for Matras TMA

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  category text not null,
  image_url text,
  width_options integer[] not null default '{160}',
  length_options integer[] not null default '{200}',
  rigidity text not null check (rigidity in ('soft', 'medium', 'hard')),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text not null,
  last_name text,
  username text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  items jsonb not null,
  total integer not null check (total >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  telegram_user_id bigint,
  telegram_username text,
  customer_name text,
  customer_phone text,
  delivery_address text,
  comment text,
  created_at timestamptz not null default now()
);

-- Migration: run this if table already exists
-- alter table public.orders add column if not exists customer_name text;
-- alter table public.orders add column if not exists customer_phone text;
-- alter table public.orders add column if not exists delivery_address text;
-- alter table public.orders add column if not exists comment text;

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select using (true);

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
