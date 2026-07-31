-- ═══════════════════════════════════════════════════════════════════════════════
-- PullStackMX — Live streaming: clave RTMP permanente por host
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de PATCH_LIVE_STREAMS.sql)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Antes: cada clic en "Iniciar transmisión" creaba un Live Stream de Mux nuevo,
-- obligando a repegar la URL/clave en OBS cada vez. Mux mismo recomienda asignar
-- una sola clave por host y reutilizarla indefinidamente — eso es lo que hace esto.

drop table if exists public.live_stream_keys;

create table if not exists public.host_streams (
  host_id             uuid primary key references auth.users(id) on delete cascade,
  mux_live_stream_id  text unique not null,
  mux_playback_id     text,
  created_at          timestamptz default now() not null
);

alter table public.host_streams enable row level security;

drop policy if exists "host_streams_owner_or_admin_select" on public.host_streams;

create policy "host_streams_owner_or_admin_select"
  on public.host_streams for select
  using (auth.uid() = host_id or get_my_role() = 'admin');
-- Sin insert/update/delete para clientes: solo la Edge Function create-stream
-- (service role) escribe aquí, la primera vez que un host inicia transmisión.

create table if not exists public.host_stream_keys (
  host_id     uuid primary key references auth.users(id) on delete cascade,
  stream_key  text not null
);

alter table public.host_stream_keys enable row level security;

drop policy if exists "host_stream_keys_owner_or_admin_select" on public.host_stream_keys;

create policy "host_stream_keys_owner_or_admin_select"
  on public.host_stream_keys for select
  using (auth.uid() = host_id or get_my_role() = 'admin');

-- mux_live_stream_id ahora se repite entre varias filas de live_streams
-- (una por cada break del mismo host reutilizando su Live Stream de Mux).
alter table public.live_streams
  drop constraint if exists live_streams_mux_live_stream_id_key;
