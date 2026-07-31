-- ═══════════════════════════════════════════════════════════════════════════════
-- PullStackMX — Live streaming (breaks en vivo con Mux)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════


-- ── 1. Capacidad "vendedor verificado" ──────────────────────────────────────────
-- Puede iniciar transmisiones además de los admins. Columna separada del `role`
-- binario existente (user/admin) para no tocar el CHECK constraint ni el RPC
-- set_user_role, que asume exactamente esos dos valores.

alter table public.profiles
  add column if not exists is_verified_seller boolean not null default false;

create or replace function public.set_verified_seller(target_id uuid, verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if get_my_role() != 'admin' then
    raise exception 'Solo admins pueden verificar vendedores';
  end if;
  update public.profiles set is_verified_seller = verified where id = target_id;
end;
$$;


-- ── 2. live_streams ──────────────────────────────────────────────────────────────
-- Metadata pública de cada break/transmisión (/live). Las filas solo las crea/
-- actualiza el service role desde las Edge Functions — los clientes no insertan.

create table if not exists public.live_streams (
  id                     bigint generated always as identity primary key,
  host_id                uuid references auth.users(id) on delete cascade not null,
  host_display_name      text not null,
  title                  text not null,
  sport                  text not null default 'General',
  status                 text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  mux_live_stream_id     text unique,
  mux_playback_id        text,
  mux_asset_id           text,
  mux_asset_playback_id  text,
  scheduled_at           timestamptz,
  started_at             timestamptz,
  ended_at               timestamptz,
  created_at             timestamptz default now() not null
);

create index if not exists idx_live_streams_status on public.live_streams(status, created_at desc);

alter table public.live_streams enable row level security;

drop policy if exists "live_streams_select_all"     on public.live_streams;
drop policy if exists "live_streams_admin_all"      on public.live_streams;
drop policy if exists "live_streams_host_update_own" on public.live_streams;

create policy "live_streams_select_all"
  on public.live_streams for select
  using (true);

create policy "live_streams_admin_all"
  on public.live_streams for all
  using (get_my_role() = 'admin');

create policy "live_streams_host_update_own"
  on public.live_streams for update
  using (auth.uid() = host_id);

do $$ begin
  alter publication supabase_realtime add table public.live_streams;
exception when duplicate_object then null;
end $$;


-- ── 3. live_stream_keys ───────────────────────────────────────────────────────────
-- Stream key RTMP (secreto). Tabla separada de live_streams porque RLS es a nivel
-- de fila, no de columna: así el key solo es legible por su host o un admin, nunca
-- por el resto de los viewers que sí pueden leer live_streams.

create table if not exists public.live_stream_keys (
  live_stream_id  bigint primary key references public.live_streams(id) on delete cascade,
  stream_key      text not null
);

alter table public.live_stream_keys enable row level security;

drop policy if exists "live_stream_keys_host_or_admin_select" on public.live_stream_keys;

create policy "live_stream_keys_host_or_admin_select"
  on public.live_stream_keys for select
  using (
    get_my_role() = 'admin'
    or exists (
      select 1 from public.live_streams s
      where s.id = live_stream_keys.live_stream_id and s.host_id = auth.uid()
    )
  );
-- Sin insert/update/delete para clientes: solo la Edge Function create-stream
-- (usando el service role key) escribe en esta tabla.
