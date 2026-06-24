-- =============================================
-- PullStack — Supabase DB Setup
-- Ejecutar en: Supabase → SQL Editor
-- =============================================

-- 1. Tabla de perfiles
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  username      text unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  role          text default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz default now()
);

-- 2. Row Level Security
alter table public.profiles enable row level security;

create policy "Perfiles públicos visibles para todos"
  on profiles for select using (true);

create policy "Usuarios pueden insertar su propio perfil"
  on profiles for insert with check (auth.uid() = id);

create policy "Usuarios pueden actualizar su propio perfil"
  on profiles for update using (auth.uid() = id);

-- 3. Auto-crear perfil al registrarse
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

-- =============================================
-- 4. DESPUÉS de hacer tu primer login, ejecuta:
-- =============================================
-- update public.profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'mauriciofdzf@gmail.com');
