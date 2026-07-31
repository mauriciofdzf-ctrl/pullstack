-- ═══════════════════════════════════════════════════════════════════════════════
-- PullStackMX — Notificaciones dentro de la app (breaks programados / por empezar)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Nota: la parte de "break_starting" necesita la extensión pg_cron, que puede
-- requerir plan Pro de Supabase — si el `create extension` de abajo falla por
-- permisos, activa "pg_cron" desde Database → Extensions en el dashboard primero.
-- ═══════════════════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id             bigint generated always as identity primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  type           text not null check (type in ('break_scheduled', 'break_starting')),
  live_stream_id bigint references public.live_streams(id) on delete cascade,
  read           boolean not null default false,
  created_at     timestamptz default now() not null
);

create index if not exists idx_notifications_user on public.notifications(user_id, read, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own_read" on public.notifications;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own_read"
  on public.notifications for update
  using (auth.uid() = user_id);
-- Sin insert/delete para clientes: solo Edge Functions (service role) y el cron.

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;


-- ── "Está por empezar" vía pg_cron ────────────────────────────────────────────

create extension if not exists pg_cron;

create or replace function public.notify_breaks_starting_soon()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select id from public.live_streams
    where status = 'scheduled'
      and notified_starting_at is null
      and scheduled_at is not null
      and scheduled_at <= now() + interval '45 minutes'
      and scheduled_at > now()
  loop
    insert into public.notifications (user_id, type, live_stream_id)
    select id, 'break_starting', r.id from public.profiles;

    update public.live_streams set notified_starting_at = now() where id = r.id;
  end loop;

  perform public.release_stale_pending_spots();
end;
$$;

select cron.schedule(
  'notify-breaks-starting-soon',
  '*/10 * * * *',
  $$select public.notify_breaks_starting_soon()$$
);
