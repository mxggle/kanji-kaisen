create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  migrated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

drop policy if exists "Users can read their own app state" on public.user_app_state;
create policy "Users can read their own app state"
on public.user_app_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own app state" on public.user_app_state;
create policy "Users can insert their own app state"
on public.user_app_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own app state" on public.user_app_state;
create policy "Users can update their own app state"
on public.user_app_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
