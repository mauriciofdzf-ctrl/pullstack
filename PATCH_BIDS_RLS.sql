-- Ejecuta esto en Supabase → SQL Editor
-- 1) Permite que cualquier usuario autenticado vea las pujas (necesario para subastas)
-- 2) Permite que admins eliminen cualquier anuncio

-- ─── Tabla bids: visibilidad pública de pujas ─────────────────────────────────
alter table public.bids enable row level security;

drop policy if exists "public_read_bids"    on bids;
drop policy if exists "auth_insert_bids"    on bids;
drop policy if exists "admins_manage_bids"  on bids;

-- Cualquier usuario (incluso anónimo) puede ver las pujas de una subasta
create policy "public_read_bids" on bids
  for select using (true);

-- Solo usuarios autenticados pueden pujar (en su propio nombre)
create policy "auth_insert_bids" on bids
  for insert with check (auth.uid() = bidder_id);

-- Admins pueden gestionar todo
create policy "admins_manage_bids" on bids
  for all using (get_my_role() = 'admin');

-- ─── Tabla listings: admins pueden eliminar cualquier anuncio ─────────────────
drop policy if exists "admins_delete_listings" on listings;

create policy "admins_delete_listings" on listings
  for delete using (get_my_role() = 'admin');
