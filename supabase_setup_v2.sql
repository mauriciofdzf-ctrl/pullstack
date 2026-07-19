-- =============================================
-- PullStack — Setup v2: Tablas faltantes
-- Pegar y ejecutar en Supabase → SQL Editor
-- =============================================

-- ── Función helper para verificar rol admin ──────────────────────────────────
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid()
$$ language sql security definer stable;

-- ── 1. LISTINGS (anuncios de usuarios) ───────────────────────────────────────
create table if not exists public.listings (
  id            bigint generated always as identity primary key,
  user_id       uuid references auth.users on delete cascade not null,
  display_name  text not null,
  title         text not null,
  description   text,
  sport         text not null default 'General',
  kind          text not null default 'card' check (kind in ('card','box','accessory')),
  txn_type      text not null default 'sale',
  price         text,
  min_bid       text,
  reserve_price numeric,
  grade         text,
  condition     text,
  image_url     text,
  active        boolean default true,
  ends_at       timestamptz,
  created_at    timestamptz default now()
);

alter table public.listings enable row level security;

create policy "listings_select_all"   on listings for select using (true);
create policy "listings_insert_own"   on listings for insert with check (auth.uid() = user_id);
create policy "listings_update_own"   on listings for update using (auth.uid() = user_id);
create policy "listings_delete_own"   on listings for delete using (auth.uid() = user_id);
create policy "listings_admin_update" on listings for update using (get_my_role() = 'admin');
create policy "listings_admin_delete" on listings for delete using (get_my_role() = 'admin');

-- ── 2. BIDS (pujas en subasta) ────────────────────────────────────────────────
create table if not exists public.bids (
  id           bigint generated always as identity primary key,
  listing_id   bigint references public.listings on delete cascade not null,
  user_id      uuid references auth.users on delete cascade not null,
  display_name text not null,
  amount       numeric not null,
  created_at   timestamptz default now()
);

alter table public.bids enable row level security;

create policy "bids_select_all"  on bids for select using (true);
create policy "bids_insert_auth" on bids for insert with check (auth.uid() = user_id);

-- ── 3. TRANSACTIONS (compras confirmadas) ─────────────────────────────────────
create table if not exists public.transactions (
  id                 bigint generated always as identity primary key,
  buyer_id           uuid references auth.users on delete set null,
  seller_id          uuid references auth.users on delete set null,
  listing_id         bigint,
  listing_title      text not null,
  sale_price         text,
  sale_price_num     numeric,
  commission_pct     numeric,
  commission_amt     numeric,
  total_paid         numeric,
  payment_method     text,
  payment_reference  text,
  status             text default 'pending' check (status in ('pending','verified','shipped','delivered','cancelled')),
  buyer_name         text,
  seller_name        text,
  tracking_number    text,
  created_at         timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "txn_buyer_select"   on transactions for select using (auth.uid() = buyer_id);
create policy "txn_seller_select"  on transactions for select using (auth.uid() = seller_id);
create policy "txn_insert_auth"    on transactions for insert with check (auth.uid() = buyer_id);
create policy "txn_admin_all"      on transactions for all using (get_my_role() = 'admin');

-- ── 4. DIRECT MESSAGES (mensajes P2P entre usuarios) ─────────────────────────
create table if not exists public.direct_messages (
  id             bigint generated always as identity primary key,
  from_user_id   uuid references auth.users on delete cascade not null,
  to_user_id     uuid references auth.users on delete cascade not null,
  from_name      text not null,
  to_name        text not null,
  content        text not null,
  listing_id     bigint,
  listing_title  text,
  action_type    text,
  bid_amount     text,
  read           boolean default false,
  created_at     timestamptz default now()
);

alter table public.direct_messages enable row level security;

create policy "dm_select_participant" on direct_messages
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "dm_insert_auth" on direct_messages
  for insert with check (auth.uid() = from_user_id);

create policy "dm_update_recipient" on direct_messages
  for update using (auth.uid() = to_user_id);

create policy "dm_admin_all" on direct_messages
  for all using (get_my_role() = 'admin');

-- ── 5. MESSAGES (soporte / chat con admin) ───────────────────────────────────
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users on delete cascade not null,
  content     text not null,
  from_admin  boolean default false,
  read        boolean default false,
  created_at  timestamptz default now()
);

alter table public.messages enable row level security;

create policy "msg_select_own"   on messages for select using (auth.uid() = user_id);
create policy "msg_insert_own"   on messages for insert with check (auth.uid() = user_id);
create policy "msg_admin_all"    on messages for all using (get_my_role() = 'admin');

-- ── 6. SETTINGS (configuración global del admin) ─────────────────────────────
create table if not exists public.settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz default now()
);

alter table public.settings enable row level security;

create policy "settings_select_all"   on settings for select using (true);
create policy "settings_admin_write"  on settings for all using (get_my_role() = 'admin');

-- Valores iniciales
insert into public.settings (key, value) values
  ('show_catalog',  'true'),
  ('catalog_hidden','[]'),
  ('catalog_extra', '[]'),
  ('spei_banco',    ''),
  ('spei_clabe',    ''),
  ('spei_beneficiario', 'PullStackMX'),
  ('mp_usuario',    ''),
  ('mp_link',       ''),
  ('oxxo_link',     ''),
  ('tarjeta_link',  ''),
  ('landing_hero_title', 'PULLSTACKMX'),
  ('show_aprende',  'true'),
  ('show_grading',  'false'),
  ('show_live',     'true'),
  ('show_community','true'),
  ('show_chat',     'false'),
  ('show_raffles',  'false')
on conflict (key) do nothing;

-- ── 7. WISHLIST ITEMS (lista de deseos manual + "guardar para después") ──────
create table if not exists public.wishlist_items (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users on delete cascade not null,
  listing_id  bigint references public.listings on delete cascade,
  catalog_id  int,
  name        text not null,
  sport       text,
  image_url   text,
  notes       text,
  max_price   text,
  priority    text default 'medium' check (priority in ('low','medium','high')),
  added_at    timestamptz default now()
);

alter table public.wishlist_items enable row level security;

create policy "wish_select_own"  on wishlist_items for select using (auth.uid() = user_id);
create policy "wish_insert_own"  on wishlist_items for insert with check (auth.uid() = user_id);
create policy "wish_delete_own"  on wishlist_items for delete using (auth.uid() = user_id);

-- ── 8. PORTFOLIO ITEMS (colección personal, sin necesidad de catálogo) ────────
-- Ampliar collection_items para soportar items custom (catalog_id nullable)
alter table public.collection_items
  alter column catalog_id drop not null;

alter table public.collection_items
  add column if not exists image_url text,
  add column if not exists custom boolean default false,
  add column if not exists description text,
  add column if not exists condition text;

-- Ajustar el unique constraint para que solo aplique cuando catalog_id no es null
alter table public.collection_items
  drop constraint if exists collection_items_user_id_catalog_id_key;

create unique index if not exists collection_items_catalog_unique
  on public.collection_items (user_id, catalog_id)
  where catalog_id is not null;

-- ── 9. RPCs para Admin ────────────────────────────────────────────────────────
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Solo admins pueden cambiar roles';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.delete_user(target_user_id uuid)
returns void as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Solo admins pueden eliminar usuarios';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;

-- ── 10. Storage bucket para imágenes ─────────────────────────────────────────
-- Ejecutar en Supabase Dashboard → Storage → Create bucket
-- Nombre: listing-images  |  Public: true
-- O ejecutar:
insert into storage.buckets (id, name, public)
  values ('listing-images', 'listing-images', true)
  on conflict (id) do nothing;

create policy "listing_images_select" on storage.objects
  for select using (bucket_id = 'listing-images');

create policy "listing_images_insert" on storage.objects
  for insert with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

create policy "listing_images_delete" on storage.objects
  for delete using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── 11. Realtime para DMs y Bids ─────────────────────────────────────────────
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.listings;

-- ── LISTO ─────────────────────────────────────────────────────────────────────
-- Verificar:
-- select tablename from pg_tables where schemaname = 'public' order by tablename;
