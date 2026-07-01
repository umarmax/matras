-- Исправление RLS для оформления заказов из TMA (anon-ключ)

drop policy if exists "Authenticated users can create orders" on public.orders;

create policy "Allow order creation from app"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- Разрешить anon создавать заказы без привязки к auth.users
drop policy if exists "Users can view own orders" on public.orders;

create policy "Users can view own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anon can view orders by telegram id"
  on public.orders
  for select
  to anon
  using (telegram_user_id is not null);
