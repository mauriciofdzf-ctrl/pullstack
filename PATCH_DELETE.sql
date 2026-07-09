-- Ejecuta esto en Supabase → SQL Editor
-- Permite a usuarios eliminar sus propios anuncios y pedidos

drop policy if exists "users_delete_own_listings" on listings;
create policy "users_delete_own_listings" on listings
  for delete using (auth.uid() = user_id);

drop policy if exists "users_delete_own_orders" on orders;
create policy "users_delete_own_orders" on orders
  for delete using (auth.uid() = user_id);
