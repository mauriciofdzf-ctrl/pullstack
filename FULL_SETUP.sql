-- ============================================================
-- PullStack — SQL Completo (corre esto COMPLETO en Supabase)
-- Borra y recrea todas las políticas + crea tablas faltantes
-- ============================================================

-- ============================================================
-- PROFILES (con trigger de auto-creación)
-- ============================================================
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique,
  display_name text,
  avatar_url   text,
  bio          text,
  role         text default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;

-- Trigger: auto-crea perfil al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 0. Función helper para roles (segura, sin recursión)
create or replace function public.get_my_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ── Políticas de profiles ──
drop policy if exists "Perfiles públicos visibles para todos" on profiles;
drop policy if exists "Usuarios pueden insertar su propio perfil" on profiles;
drop policy if exists "Usuarios pueden actualizar su propio perfil" on profiles;
drop policy if exists "admins_see_profiles"     on profiles;
drop policy if exists "public_read_profiles"    on profiles;
drop policy if exists "users_read_own_profile"  on profiles;
drop policy if exists "users_update_own_profile" on profiles;

create policy "public_read_profiles"     on profiles for select using (true);
create policy "users_insert_own_profile" on profiles for insert with check (auth.uid() = id);
create policy "users_update_own_profile" on profiles for update using (auth.uid() = id);

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists public.listings (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users not null,
  display_name text not null default '',
  title        text not null,
  description  text,
  sport        text,
  kind         text,
  txn_type     text,
  price        text,
  min_bid      text,
  grade        text,
  condition    text,
  image_url    text,
  active       boolean default true,
  ends_at      timestamptz,
  created_at   timestamptz default now()
);
alter table public.listings enable row level security;
alter table public.listings add column if not exists ends_at timestamptz;

drop policy if exists "public_read_active_listings" on listings;
drop policy if exists "users_insert_listings"       on listings;
drop policy if exists "users_update_own_listings"   on listings;
drop policy if exists "admins_manage_listings"      on listings;
drop policy if exists "admins_delete_listings"      on listings;

create policy "public_read_active_listings" on listings
  for select using (active = true or auth.uid() = user_id or get_my_role() = 'admin');

create policy "users_insert_listings" on listings
  for insert with check (auth.uid() = user_id);

create policy "users_update_own_listings" on listings
  for update using (auth.uid() = user_id or get_my_role() = 'admin');

create policy "admins_delete_listings" on listings
  for delete using (get_my_role() = 'admin');

-- ============================================================
-- BIDS
-- ============================================================
create table if not exists public.bids (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null,
  bidder_id   uuid references auth.users not null,
  bidder_name text not null default 'Anónimo',
  amount      numeric not null,
  created_at  timestamptz default now()
);
alter table public.bids enable row level security;

drop policy if exists "anyone_read_bids"  on bids;
drop policy if exists "users_insert_bids" on bids;

create policy "anyone_read_bids"  on bids for select using (true);
create policy "users_insert_bids" on bids for insert with check (auth.uid() = bidder_id);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists public.orders (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users not null,
  items        jsonb,
  total        text,
  contact_name text,
  phone        text,
  address      text,
  city         text,
  state        text,
  notes        text,
  status       text default 'pending',
  created_at   timestamptz default now()
);
alter table public.orders enable row level security;

drop policy if exists "users_insert_orders"  on orders;
drop policy if exists "users_read_own_orders" on orders;
drop policy if exists "admins_manage_orders" on orders;

create policy "users_insert_orders"   on orders for insert  with check (auth.uid() = user_id);
create policy "users_read_own_orders" on orders for select  using     (auth.uid() = user_id);
create policy "admins_manage_orders"  on orders for all     using     (get_my_role() = 'admin');

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table if not exists public.transactions (
  id                 bigint generated always as identity primary key,
  buyer_id           uuid references auth.users not null,
  seller_id          uuid references auth.users not null,
  listing_id         bigint not null,
  listing_title      text not null default '',
  buyer_name         text,
  seller_name        text,
  sale_price         text,
  sale_price_num     numeric default 0,
  commission_pct     numeric default 8,
  commission_amt     numeric default 0,
  total_paid         numeric default 0,
  payment_method     text,
  payment_reference  text,
  status             text default 'pending',
  verified_at        timestamptz,
  tracking_number    text,
  tracking_carrier   text,
  tracking_url       text,
  estimated_delivery text,
  created_at         timestamptz default now()
);
alter table public.transactions enable row level security;
alter table public.transactions add column if not exists tracking_number    text;
alter table public.transactions add column if not exists tracking_carrier   text;
alter table public.transactions add column if not exists tracking_url       text;
alter table public.transactions add column if not exists estimated_delivery text;

drop policy if exists "users_insert_txns"    on transactions;
drop policy if exists "users_read_own_txns"  on transactions;
drop policy if exists "admins_manage_txns"   on transactions;

create policy "users_insert_txns"   on transactions for insert with check (auth.uid() = buyer_id);
create policy "users_read_own_txns" on transactions for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "admins_manage_txns"  on transactions for all   using (get_my_role() = 'admin');

-- ============================================================
-- SETTINGS
-- ============================================================
create table if not exists public.settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);
alter table public.settings enable row level security;

drop policy if exists "public_read_settings"   on settings;
drop policy if exists "admins_manage_settings" on settings;

create policy "public_read_settings"   on settings for select using (true);
create policy "admins_manage_settings" on settings for all    using (get_my_role() = 'admin');

-- ============================================================
-- COLLECTION ITEMS
-- ============================================================
create table if not exists public.collection_items (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null,
  catalog_id int not null,
  name       text,
  sport      text,
  kind       text,
  price      text,
  added_at   timestamptz default now(),
  unique(user_id, catalog_id)
);
alter table public.collection_items enable row level security;

drop policy if exists "users_manage_own_collection" on collection_items;
create policy "users_manage_own_collection" on collection_items for all using (auth.uid() = user_id);

-- ============================================================
-- WISHLIST ITEMS (Wallet)
-- ============================================================
create table if not exists public.wishlist_items (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null,
  name       text not null,
  sport      text,
  notes      text,
  max_price  text,
  priority   text default 'medium',
  added_at   timestamptz default now()
);
alter table public.wishlist_items enable row level security;

drop policy if exists "users_manage_own_wishlist" on wishlist_items;
create policy "users_manage_own_wishlist" on wishlist_items for all using (auth.uid() = user_id);

-- ============================================================
-- DIRECT MESSAGES
-- ============================================================
create table if not exists public.direct_messages (
  id            bigint generated always as identity primary key,
  from_user_id  uuid references auth.users not null,
  to_user_id    uuid references auth.users not null,
  from_name     text not null default '',
  to_name       text not null default '',
  content       text not null,
  listing_id    bigint,
  listing_title text,
  action_type   text default 'general',
  bid_amount    text,
  read          boolean default false,
  created_at    timestamptz default now()
);
alter table public.direct_messages enable row level security;

drop policy if exists "users_read_own_dms"  on direct_messages;
drop policy if exists "users_insert_dms"    on direct_messages;
drop policy if exists "users_update_dms"    on direct_messages;
drop policy if exists "admins_manage_dms"   on direct_messages;

create policy "users_read_own_dms" on direct_messages
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "users_insert_dms" on direct_messages
  for insert with check (auth.uid() = from_user_id);

create policy "users_update_dms" on direct_messages
  for update using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "admins_manage_dms" on direct_messages
  for all using (get_my_role() = 'admin');

-- ============================================================
-- MESSAGES (soporte)
-- ============================================================
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null,
  content    text not null,
  from_admin boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;

drop policy if exists "users_manage_own_messages" on messages;
drop policy if exists "admins_read_all_messages"  on messages;

create policy "users_manage_own_messages" on messages for all using (auth.uid() = user_id);
create policy "admins_read_all_messages"  on messages for all using (get_my_role() = 'admin');

-- ============================================================
-- RAFFLE ENTRIES (Profile)
-- ============================================================
create table if not exists public.raffle_entries (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users not null,
  raffle_id  text,
  created_at timestamptz default now()
);
alter table public.raffle_entries enable row level security;

drop policy if exists "users_manage_own_raffle_entries" on raffle_entries;
create policy "users_manage_own_raffle_entries" on raffle_entries for all using (auth.uid() = user_id);

-- ============================================================
-- REALTIME (ignora si ya está)
-- ============================================================
do $$ begin
  begin alter publication supabase_realtime add table bids; exception when others then null; end;
  begin alter publication supabase_realtime add table direct_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table listings; exception when others then null; end;
  begin alter publication supabase_realtime add table transactions; exception when others then null; end;
end $$;

-- ============================================================
-- TU CUENTA COMO ADMIN
-- ============================================================
update public.profiles
  set role = 'admin'
  where id = (select id from auth.users where email = 'mauriciofdzf@gmail.com');
