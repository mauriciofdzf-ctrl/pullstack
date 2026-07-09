-- Ejecuta esto en Supabase → SQL Editor
-- Crea tabla grading_submissions + bucket avatars

create table if not exists public.grading_submissions (
  id           bigint generated always as identity primary key,
  user_id      uuid references auth.users not null,
  player_name  text not null,
  card_year    text,
  brand        text,
  card_number  text,
  variation    text,
  raw_value    numeric,
  condition    text default 'Near Mint (NM)',
  grader       text default 'PSA',
  service_tier text default 'Bulk',
  notes        text,
  status       text default 'pending',
  created_at   timestamptz default now()
);
alter table public.grading_submissions enable row level security;

drop policy if exists "users_manage_own_grading" on grading_submissions;
drop policy if exists "admins_manage_grading"     on grading_submissions;

create policy "users_manage_own_grading" on grading_submissions
  for all using (auth.uid() = user_id);
create policy "admins_manage_grading" on grading_submissions
  for all using (get_my_role() = 'admin');

-- Bucket para fotos de perfil
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "avatars_public_read"  on storage.objects;
drop policy if exists "avatars_auth_upload"  on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "avatars_auth_upload" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
