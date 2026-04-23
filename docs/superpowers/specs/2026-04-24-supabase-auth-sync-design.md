# Supabase Auth and Sync Design

## Goal

Add Supabase email magic-link login and user data sync without losing existing anonymous local progress.

## Current State

The app stores user data in two Zustand persisted stores:

- `kanji-path-storage` for hearts, streak, completed checkpoints, and unlocked levels.
- `kanji-settings-storage` for handwriting skip preferences and app settings.

Existing users may already have meaningful data in browser localStorage. The sync design must treat that data as authoritative when the user logs in for the first time.

## Recommended Approach

Use Supabase Auth for identity and a single user-owned `user_app_state` table as a JSONB snapshot store. Keep the current client state structure intact and sync snapshots instead of normalizing the data into many relational tables.

This keeps the migration low-risk, avoids rewriting the learning flow, and leaves room to normalize later if the product needs richer analytics or server-side queries.

## Supabase Schema

```sql
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  migrated_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

create policy "Users can read their own app state"
on public.user_app_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own app state"
on public.user_app_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own app state"
on public.user_app_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

## Auth Flow

Use Supabase email magic links via `supabase.auth.signInWithOtp`. Supabase's current docs describe magic links as a passwordless email method, and the JavaScript client sends the link through `signInWithOtp` by default. The app will use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, matching current Supabase Next.js guidance.

The UI should expose login and logout from the Settings page, with a compact account indicator in the Header.

## Migration and Sync Flow

When a session becomes available:

1. Read the current local Zustand snapshots.
2. Fetch `user_app_state` for the authenticated user.
3. If no remote row exists, upload the local snapshots and set `migrated_at`.
4. If a remote row exists, merge local and remote snapshots.
5. Write the merged snapshot back to Zustand/localStorage.
6. Upsert the merged snapshot to Supabase.
7. Subscribe to store changes and debounce future upserts.

The migration must be idempotent. It should be safe to run on every login because it checks the remote row and merges deterministically.

## Merge Rules

Progress:

- `completedCheckpoints`: union of local and remote maps.
- `unlockedLevels`: union, preserving existing order where possible.
- `hearts`: max local/remote value, capped by merged `maxHearts`.
- `maxHearts`: max local/remote value.
- `lastLoginDate`: more recent date wins.
- `streak`: if dates match, max streak wins; otherwise use the streak from the state with the more recent `lastLoginDate`.

Settings:

- For first login, local settings win so the user's current device experience does not change.
- For subsequent logins, use remote settings unless local data has never been synced.
- Daily handwriting skip naturally expires by local date through existing app logic.

## Error Handling

If Supabase configuration is missing, the app stays fully local and hides/soft-disables auth controls with a clear settings message.

If sign-in fails, show the Supabase error message in the settings account panel.

If sync fails, keep local state as the source of truth, display a non-blocking sync error, and retry on the next store change or session refresh.

## Testing

Unit-test the pure merge and snapshot helpers first:

- Empty remote row uploads local state.
- Completed checkpoints and unlocked levels merge without loss.
- Hearts and max hearts use the safer larger values.
- Streak chooses the newer login date and preserves the larger streak for same-day data.
- Settings migration keeps local settings on first sync.

Manual verification:

- Login request sends a magic link.
- Existing local progress appears after login.
- Supabase row is created with the current progress/settings.
- A second browser/device receives the synced state after login.
- Logout leaves local state usable.
