-- ═══════════════════════════════════════════════════════════════════════════════
-- PullStackMX — Venta de spots por equipo (fijo o rifa) para breaks
-- Ejecutar en: Supabase Dashboard → SQL Editor (después de PATCH_LIVE_STREAMS*.sql)
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.live_streams
  add column if not exists spot_mode           text check (spot_mode in ('fixed', 'raffle')),
  add column if not exists spot_price           numeric,
  add column if not exists raffle_team_pool     text[],
  add column if not exists randomizer_run_at    timestamptz,
  add column if not exists notified_starting_at timestamptz;


-- ── break_spots ──────────────────────────────────────────────────────────────────
-- Un spot por equipo (modo fijo) o por número anónimo (modo rifa). Los clientes
-- nunca escriben aquí directo — todo pasa por Edge Functions con service role o
-- el RPC del randomizer, igual que host_streams/host_stream_keys.

create table if not exists public.break_spots (
  id                          bigint generated always as identity primary key,
  live_stream_id              bigint references public.live_streams(id) on delete cascade not null,
  position                    int not null,
  label                       text not null,
  price                       numeric not null,
  status                      text not null default 'available'
                                 check (status in ('available', 'pending_payment', 'sold')),
  buyer_id                    uuid references auth.users(id),
  assigned_team                text,
  reserved_at                 timestamptz,
  stripe_checkout_session_id  text,
  created_at                  timestamptz default now() not null,
  unique (live_stream_id, position)
);

create index if not exists idx_break_spots_stream on public.break_spots(live_stream_id, status);

alter table public.break_spots enable row level security;

drop policy if exists "break_spots_select_all" on public.break_spots;

create policy "break_spots_select_all"
  on public.break_spots for select
  using (true);
-- Sin insert/update/delete para clientes.

do $$ begin
  alter publication supabase_realtime add table public.break_spots;
exception when duplicate_object then null;
end $$;


-- ── Randomizer (modo rifa) ─────────────────────────────────────────────────────
-- Corre una sola vez por break. Los resultados se transmiten en vivo a todos los
-- espectadores — un re-run cambiaría equipos ya vistos por los compradores, así
-- que no se permite; una corrección de error humano es manual por un admin.

create or replace function public.run_break_randomizer(p_live_stream_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id   uuid;
  v_pool      text[];
  v_shuffled  text[];
  v_sold_count int;
begin
  select host_id, raffle_team_pool into v_host_id, v_pool
    from public.live_streams where id = p_live_stream_id;

  if v_host_id is null then
    raise exception 'Break no encontrado';
  end if;
  if auth.uid() != v_host_id and get_my_role() != 'admin' then
    raise exception 'No tienes permiso para correr el randomizer de este break';
  end if;
  if exists (select 1 from public.live_streams where id = p_live_stream_id and randomizer_run_at is not null) then
    raise exception 'El randomizer para este break ya se corrió';
  end if;

  select count(*) into v_sold_count
    from public.break_spots where live_stream_id = p_live_stream_id and status = 'sold';

  if v_pool is null or v_sold_count != array_length(v_pool, 1) then
    raise exception 'No todos los spots están vendidos todavía';
  end if;

  select array_agg(t order by random()) into v_shuffled from unnest(v_pool) t;

  with sold as (
    select id, row_number() over (order by id) rn
    from public.break_spots
    where live_stream_id = p_live_stream_id and status = 'sold'
  )
  update public.break_spots b
    set assigned_team = v_shuffled[sold.rn]
    from sold
    where b.id = sold.id;

  update public.live_streams set randomizer_run_at = now() where id = p_live_stream_id;
end;
$$;


-- ── Barrido de reservas abandonadas ───────────────────────────────────────────
-- Respaldo por si el webhook de Stripe no llega (red, caída). Stripe expira sus
-- sesiones de checkout a los ~30 min; 35 min da margen para que el webhook sea
-- el mecanismo principal y esto solo sea un backstop.

create or replace function public.release_stale_pending_spots()
returns void
language sql
security definer
set search_path = public
as $$
  update public.break_spots
    set status = 'available', buyer_id = null, reserved_at = null, stripe_checkout_session_id = null
    where status = 'pending_payment' and reserved_at < now() - interval '35 minutes';
$$;
