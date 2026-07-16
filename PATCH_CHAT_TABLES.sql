-- ═══════════════════════════════════════════════════════════════════════════════
-- PullStackMX — Tablas de mensajería y chat
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. chat_messages ───────────────────────────────────────────────────────────
-- Chat comunitario en vivo (/chat) · realtime por sala

create table if not exists chat_messages (
  id            bigint generated always as identity primary key,
  user_id       uuid   references auth.users(id) on delete cascade not null,
  display_name  text   not null,
  room          text   not null default 'general',
  content       text   not null check (char_length(content) <= 500),
  created_at    timestamptz default now() not null
);

create index if not exists idx_chat_messages_room
  on chat_messages(room, created_at asc);

alter table chat_messages enable row level security;

drop policy if exists "auth read chat"         on chat_messages;
drop policy if exists "auth insert own chat"   on chat_messages;

create policy "auth read chat"
  on chat_messages for select
  using (auth.role() = 'authenticated');

create policy "auth insert own chat"
  on chat_messages for insert
  with check (auth.uid() = user_id);

do $$ begin
  alter publication supabase_realtime add table chat_messages;
exception when duplicate_object then null;
end $$;


-- ── 2. direct_messages ─────────────────────────────────────────────────────────
-- Mensajes directos entre usuarios (/messages → DMs)

create table if not exists direct_messages (
  id            bigint generated always as identity primary key,
  from_user_id  uuid references auth.users(id) on delete cascade not null,
  to_user_id    uuid references auth.users(id) on delete cascade not null,
  from_name     text not null,
  to_name       text not null,
  content       text not null,
  action_type   text not null default 'general',
  listing_title text,
  read          boolean not null default false,
  created_at    timestamptz default now() not null
);

create index if not exists idx_dm_from   on direct_messages(from_user_id, created_at desc);
create index if not exists idx_dm_to     on direct_messages(to_user_id,   created_at desc);
create index if not exists idx_dm_unread on direct_messages(to_user_id, read) where not read;

alter table direct_messages enable row level security;

drop policy if exists "Users read own DMs"      on direct_messages;
drop policy if exists "Auth users send DMs"     on direct_messages;
drop policy if exists "Recipients update read"  on direct_messages;

create policy "Users read own DMs"
  on direct_messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Auth users send DMs"
  on direct_messages for insert
  with check (auth.uid() = from_user_id);

create policy "Recipients update read"
  on direct_messages for update
  using  (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- Realtime para el badge de DMs sin leer en la Navbar
do $$ begin
  alter publication supabase_realtime add table direct_messages;
exception when duplicate_object then null;
end $$;


-- ── 3. messages ────────────────────────────────────────────────────────────────
-- Chat de soporte usuario ↔ admin (/messages → Soporte)

create table if not exists messages (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  content     text not null,
  from_admin  boolean not null default false,
  created_at  timestamptz default now() not null
);

alter table messages enable row level security;

drop policy if exists "Users read own support"   on messages;
drop policy if exists "Users insert support"     on messages;
drop policy if exists "Admins read all support"  on messages;
drop policy if exists "Admins insert replies"    on messages;

create policy "Users read own support"
  on messages for select
  using (auth.uid() = user_id);

create policy "Users insert support"
  on messages for insert
  with check (auth.uid() = user_id and not from_admin);

-- Admins leen todos los mensajes de soporte
create policy "Admins read all support"
  on messages for select
  using (get_my_role() = 'admin');

-- Admins pueden insertar respuestas (para futura funcionalidad)
create policy "Admins insert replies"
  on messages for insert
  with check (get_my_role() = 'admin');
