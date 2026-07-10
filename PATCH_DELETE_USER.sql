-- Ejecuta esto en Supabase → SQL Editor
-- Crea una función que permite al admin borrar cuentas de auth.users

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
