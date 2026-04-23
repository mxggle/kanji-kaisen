# Supabase Auth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase email magic-link login and safe progress/settings sync for existing local users.

**Architecture:** Keep the two existing Zustand persisted stores as the app's runtime state. Add Supabase Auth identity, a pure merge layer for local/remote snapshots, and a client-side sync coordinator that runs after login and debounces later writes.

**Tech Stack:** Next.js App Router, React client components, Zustand, Supabase JS, Node test runner.

---

## File Structure

- Create `lib/sync/types.ts`: shared snapshot and row types.
- Create `lib/sync/merge.ts`: pure conflict-resolution logic.
- Create `lib/sync/merge.test.mjs`: unit tests for migration merge behavior.
- Create `lib/sync/local-state.ts`: read/apply current Zustand snapshots.
- Create `lib/supabase/client.ts`: browser Supabase client factory with env guards.
- Create `lib/auth-store.ts`: auth/session state and magic-link actions.
- Create `lib/sync/sync-engine.ts`: login migration and debounced upsert wiring.
- Create `components/Auth/AccountPanel.tsx`: settings page auth/sync UI.
- Modify `app/layout.tsx`: install auth/sync bootstrap client component.
- Modify `components/Header.tsx`: show account status compactly.
- Modify `app/settings/page.tsx`: render account panel.
- Create `supabase/user_app_state.sql`: SQL schema and RLS policies.
- Modify `package.json` and lockfile: add Supabase dependency and test scripts if needed.

## Tasks

### Task 1: Add Merge Tests

- [ ] Write failing tests in `lib/sync/merge.test.mjs` for checkpoint union, unlocked level union, hearts/maxHearts, streak date selection, and first-login settings preference.
- [ ] Run `node --experimental-strip-types lib/sync/merge.test.mjs` and verify it fails because `mergeSnapshots` does not exist.

### Task 2: Implement Merge Layer

- [ ] Create `lib/sync/types.ts`.
- [ ] Create `lib/sync/merge.ts` with `mergeSnapshots(local, remote, options)`.
- [ ] Run merge tests and verify they pass.

### Task 3: Add Supabase Dependency and Client

- [ ] Install `@supabase/supabase-js`.
- [ ] Create `lib/supabase/client.ts` with `getSupabaseClient()` and `isSupabaseConfigured()`.
- [ ] Ensure missing env vars do not throw during local-only use.

### Task 4: Add Auth Store

- [ ] Create `lib/auth-store.ts` with session/user/loading/error/sent flags.
- [ ] Add `initializeAuth`, `signInWithEmail`, and `signOut` actions.
- [ ] Use `supabase.auth.getSession`, `onAuthStateChange`, `signInWithOtp`, and `signOut`.

### Task 5: Add Local Snapshot Helpers

- [ ] Create `lib/sync/local-state.ts` to snapshot current `useProgressStore` and `useSettingsStore` state.
- [ ] Add apply helpers that update Zustand from merged snapshots without resetting actions.

### Task 6: Add Sync Engine

- [ ] Create `lib/sync/sync-engine.ts`.
- [ ] On authenticated session, fetch `user_app_state`, merge with local state, apply merged state locally, and upsert remotely.
- [ ] Subscribe to store changes after initial sync and debounce upserts.
- [ ] Expose sync status for UI.

### Task 7: Add Bootstrap Component

- [ ] Create a client bootstrap component that initializes auth and sync once.
- [ ] Render it in `app/layout.tsx`.

### Task 8: Add Account UI

- [ ] Create `components/Auth/AccountPanel.tsx`.
- [ ] Add account panel to settings page.
- [ ] Add compact account status to Header without disrupting hearts/streak layout.

### Task 9: Add Supabase SQL

- [ ] Create `supabase/user_app_state.sql` with table, RLS, and policies from the design.

### Task 10: Verify

- [ ] Run unit tests.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm build`.
- [ ] Start dev server if needed for manual verification.
