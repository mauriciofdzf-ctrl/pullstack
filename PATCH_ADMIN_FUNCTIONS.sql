-- Ejecuta todo esto en Supabase → SQL Editor
-- Arregla: cambio de rol que no persiste + borrar cuentas

-- ─── 1. Cambiar rol de usuario ─────────────────────────────────────────────────
-- Usa SECURITY DEFINER para bypasear RLS (el update directo lo bloquea)
create or replace function set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Solo admins pueden cambiar roles';
  end if;
  if target_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  if new_role not in ('user', 'admin') then
    raise exception 'Rol inválido';
  end if;
  update profiles set role = new_role where id = target_id;
end;
$$;

-- ─── 2. Eliminar cuenta ────────────────────────────────────────────────────────
create or replace function delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Solo admins pueden borrar cuentas';
  end if;
  if target_id = auth.uid() then
    raise exception 'No puedes borrar tu propia cuenta';
  end if;
  delete from auth.users where id = target_id;
end;
$$;
