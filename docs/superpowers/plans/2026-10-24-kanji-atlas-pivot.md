# Kanji Atlas Pivot Implementation Plan

> **For agentic workers:** This plan is executed by a self-paced `/loop` session. Steps use checkbox (`- [ ]`) syntax for tracking. Tick a box in the same commit that completes it. Read "Working method" before starting.

**Goal:** Turn Kanji Kaisen from a gamified practice path into a browse-first kanji reference site (a "kanji atlas") with an optional study layer that never punishes the learner. Growth should come from search traffic: one indexable page per kanji, per radical and per theme.

**Why:** The practice flow is heavy (up to 40 screens per checkpoint, no saved progress mid-checkpoint), punishing (hearts lost on wrong answers and even on AI request errors, then locked for the day), and partly broken (12 checkpoints can't be finished). The site's most valuable content — about 10k example words, 231 radical stories and KanjiVG stroke order for every kanji — is hidden or unused, and almost nothing is server-rendered, so search engines can't find it. A reference site with radical-based "Logic, Not Magic" explanations reuses most of the existing code and data.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, Zustand, kanji-recognizer, wanakana, KanjiVG, Node test runner (`pnpm test`).

---

## Product decisions (made by the owner; do not reopen)

1. **English first.** UI and content stay English. No Chinese locale in this plan.
2. **Classic practice flow is kept but demoted.** Move it to `/practice`, link it as a secondary nav entry, and don't delete it.
3. **Hide Supabase login.** Remove the header account icon and the Settings account panel from the UI. Keep the code and `AuthSyncBootstrap` so existing signed-in users keep syncing.
4. **No hearts, streaks or locks.** Remove them from the UI and from gameplay. Keep the store fields, because persisted local state and the Supabase `ProgressSnapshot` (`lib/sync/types.ts`) depend on them.
5. **No new Gemini calls.** Tracing on new pages uses the local kanji-recognizer only. The AI handwriting challenge stays only inside the classic practice flow.
6. **Out of scope (Phase 3, decided later from traffic data):** SRS scheduling, a Chinese locale, AI handwriting critique on new pages, and syncing study lists to Supabase.

## Facts from the review (verify; don't trust blindly)

- `lib/kanji-db.json`: 2211 kanji from kanjiapi.dev (KANJIDIC2-based; see `scripts/seed-kanji.mjs`). Fields are `char, meaning, onyomi[], kunyomi[], jlpt, strokeCount, frequency, grade`. JLPT split: N5 79, N4 166, N3 367, N2 367, N1 1232. Readings use KANJIDIC notation (`-か`, `ふる.い`, `ふる-`).
- `lib/kanji-alive-categorized.json`: 215 radical groups and 1235 kanji. Each kanji has `examples`, about 8 vocabulary entries on average, shaped like `["赤外線（せきがいせん）", "infrared rays"]`. 112 of the 10,156 entries start with `*`; find out what Kanji Alive means by it and handle it. **No page shows these examples today.** The source CSV (`kanji_alive_media/`) is not in the repo.
- 12 kanji are in kanji-alive but not in kanji-db: 誰 的 分 孝 可 身 々 頃 無 里 畑 坊. When a learner reaches one, `components/Learning/LearningModal.tsx` returns `null` while the body scroll lock is still active, so 12 checkpoints can never be completed. Example: 分 is the third kanji in the katana N4 checkpoint.
- `lib/compiled-stories.json` holds 231 radical stories (`key, char, name, meaning, origin, story, position, transformsMeaning, exampleKanji[]`) but only 9 of the 10 category stories. `lib/stories/categories/textiles-plants-food.md` exists but is missing from the compiled JSON. Fix it via `scripts/compile-stories.js`. 16 story keys (the `*hen` left-side variants, such as `kihen` and `itohen`) have no kanji-alive group.
- `lib/radical-category-map.json` maps each radical key to one of the 10 themes.
- `lib/checkpoints.ts` derives levels from school grade, not JLPT. 745 of 1235 kanji disagree with kanji-db's real JLPT level. **Checkpoint IDs embed this level (for example `rad-sanzui-n5`) and are stored in users' `completedCheckpoints`, so don't change checkpoint generation.** Atlas pages use the real JLPT level from kanji-db.
- `public/kanjivg/kanji/*.svg`: 11,661 files under CC BY-SA 3.0 (see `public/kanjivg/COPYING`). Groups carry `kvg:element`, `kvg:radical="general"` and `kvg:position` attributes, plus a `StrokeNumbers` group. This is usable for assigning radicals to kanji outside kanji-alive. `public/kanjivg_backup` is a 77 MB duplicate.
- `/heatmap` (`components/Dashboard.tsx`, `FilterPanel`, `KanjiGrid`, `KanjiCard`) and `/kanji/[char]` already exist, but nothing links to them.
- `/learn`, `/category/[slug]` and `/settings` render `null` until mounted, so they produce no server-rendered HTML.
- The landing page (`app/page.tsx`) advertises SRS and a progress dashboard that don't exist.
- `app/page-new.tsx` is an unused leftover.
- `components/Learning/PhaseQuiz.tsx` contains a decent distractor-ranking algorithm (`buildOptions`) worth extracting and reusing.
- The site's production URL is not in the repo. Vercel exposes `VERCEL_PROJECT_PRODUCTION_URL` at build time.

## Target information architecture

| Route | Purpose | Rendering |
|---|---|---|
| `/` | Search-first home: big search box, kanji of the day, browse by JLPT / theme / radical / strokes, plus the "Logic, Not Magic" pitch with only true claims | Server page with a client search island |
| `/kanji/[char]` | **Core page.** Meaning, readings, JLPT, grade, strokes, frequency, static and animated stroke order, try-writing, examples, radical and story summary, same-radical kanji, prev/next, save/status | SSG for every kanji |
| `/radicals` | Radical index grouped by theme | SSG |
| `/radical/[key]` | Full radical story plus a grid of every kanji using it | SSG |
| `/categories` | Index of the 10 themes | SSG |
| `/category/[slug]` | Theme story, its radicals, its kanji, and a "Practice this theme (classic)" link | SSG (replaces the old practice page at this URL) |
| `/browse` | Filterable, sortable list (JLPT, strokes, frequency, theme/radical); filters live in URL query params | Server-rendered first paint, client filtering |
| `/search?q=` | Full search results | Server-rendered, `noindex` |
| `/my-list` | Saved kanji with learning/known status | Client, `noindex` |
| `/study` | Flashcards and multiple-choice quiz over a chosen deck | Client, `noindex` |
| `/practice`, `/practice/[slug]` | The old practice path, moved here unchanged except for the fixes below | Client |
| `/about` | What the site is, plus data credits and licenses | SSG |
| `/settings` | Trimmed: classic-practice handwriting toggles, feedback link, reset actions | Client, `noindex` |

Redirects in `next.config.ts`: `/learn` → `/practice` and `/heatmap` → `/browse` (non-permanent is fine).

**Bundle rule:** the full atlas dataset (with examples) is server-only (use `import "server-only"`; the package is already a dependency). Client components receive props, or use a slim search index (char, meanings, readings, jlpt, strokes, frequency) loaded lazily from a static JSON file. Check that the big JSON never lands in `.next/static`.

---

## Tasks

### Phase 0 — Foundation and fixes

- [x] **0.1 Baseline.** Run `pnpm install`, `pnpm lint`, `pnpm test` and `pnpm build` on the untouched tree. Record any pre-existing failures in the Deviations log; don't silently fix unrelated ones. If the build fails only because `next/font/google` can't reach Google Fonts, read `/root/.ccr/README.md` and the proxy status first. Never disable TLS verification.
- [x] **0.2 Fix the 12 broken checkpoints.**
  - Add 誰 的 分 孝 可 身 頃 無 里 畑 坊 to `lib/kanji-db.json` with real JLPT levels and frequency ranks. Prefer kanjiapi.dev data in the same shape `scripts/seed-kanji.mjs` produces. Fall back to the kanji-alive fields plus KANJIDIC knowledge.
  - 々 is an iteration mark: give it a sensible entry or drop it from the practice path, and document the choice.
  - In `LearningModal`, skip a kanji with missing data (or show an error state with a close button) instead of returning `null` under a scroll lock.
  - Add a test that every checkpoint kanji exists in `KANJI_DATA`.
- [x] **0.3 Unified atlas dataset.**
  - Write `scripts/build-kanji-atlas.mjs` (add a `pnpm data:atlas` script). It produces `lib/atlas/kanji-atlas.json` and `public/data/search-index.json` from the existing JSON files plus KanjiVG.
  - Record shape: `{ char, meanings: string[], onyomi: string[], kunyomi: string[], jlpt, grade, strokeCount, frequency, radical: { key, char } | null, category: string | null, examples: { word, reading, meaning, special?: boolean }[] }`.
  - Radical assignment: use the kanji-alive group first. Otherwise take the KanjiVG `kvg:radical="general"` element and map it to a radical key via char and variant forms (`scripts/radical_char_map.json`, story chars, `*hen` variants). Log how many remain unassigned.
  - The 2211 kanji-db entries are the canonical set (including the 12 just added). Kanji-alive data enriches them. Output must be deterministic and committed.
  - Also fix the missing Textiles, Plants & Food category story in `compiled-stories.json`.
- [x] **0.4 Data access module `lib/atlas/`** (server-only for full data).
  - Functions: `getAllKanji`, `getKanji(char)`, `getKanjiByRadical`, `getKanjiByCategory`, `getKanjiByJlpt`, `getNeighbors(char)` (same JLPT level, ordered by frequency), `getAllRadicals`, `getRadical(key)` (story merged with kanji list), `getCategories`, `getCategory(slug)`.
  - Reading formatters: KANJIDIC `ふる.い` → `ふる(い)`, keep meaningful prefix/suffix dashes, romaji via wanakana.
  - Unit tests for formatters and lookups.
- [x] **0.5 Cleanup.** Delete `public/kanjivg_backup/` and `app/page-new.tsx` after confirming nothing references them.

### Phase 1 — The atlas

- [x] **1.1 Kanji detail page `/kanji/[char]`.**
  - Render every kanji with `generateStaticParams`. Make sure both raw and percent-encoded URLs resolve.
  - Content:
    - Big character, meanings, JLPT/grade/strokes/frequency badges.
    - On/kun readings with romaji.
    - **Static numbered stroke diagram** inlined server-side from the KanjiVG SVG.
    - **Animated stroke order** with replay (the `KanjiCanvas` view mode).
    - **"Try writing"** toggle (the `KanjiCanvas` practice mode: Clear/Hint, no scoring, no API).
    - **Examples** (word, reading, meaning; handle the `*` entries).
    - **Composition:** a radical chip linking to `/radical/[key]`, a story summary and a "Read the full story" link.
    - Same-radical kanji grid, theme link, prev/next links.
    - A slot for the save/status controls added in 2.2.
  - Handle kanji with no SVG, examples or radical gracefully.
  - Replace the wrong "Back to Dashboard → /" link.
- [x] **1.2 Radicals.**
  - `/radicals`: every radical that has a story or kanji, grouped by theme, showing char, name, meaning and kanji count.
  - `/radical/[key]`: char, name, meaning, origin, story, position, how it changes meaning, example kanji with explanations (link the ones that exist), full kanji grid sorted by JLPT then frequency, theme link and prev/next radical.
- [x] **1.3 Move classic practice.**
  - Move `app/learn/page.tsx` → `app/practice/page.tsx` and the practice version of `app/category/[slug]/page.tsx` → `app/practice/[slug]/page.tsx`.
  - Update internal links (`CategoryCard`, settings back button, and so on) and add the `/learn` redirect.
  - Add a slim "Classic practice mode" banner linking back to the atlas.
  - Checkpoint IDs and stored progress must keep working.
- [x] **1.4 Themes.**
  - `/categories`: 10 cards that reuse the `CategoryCard` look and `public/images/categories/*.png`, without progress bars.
  - `/category/[slug]`, server-rendered: the theme story inline (the `CategoryStoryModal` content), radical cards linking to `/radical/[key]`, the theme's kanji grid, and a "Practice this theme (classic)" link to `/practice/[slug]`.
- [x] **1.5 Browse `/browse`.**
  - Evolve `Dashboard` into this page: JLPT, stroke range, sort (frequency/strokes/JLPT), plus a theme or radical filter if cheap.
  - Filters sync to query params (for example `/browse?jlpt=N5`).
  - The first paint is server-rendered. Keep it fast on mobile with 2211 cards (pagination or progressive rendering).
  - Add the `/heatmap` redirect.
- [x] **1.6 Search.**
  - `lib/atlas/search.ts` is a pure, unit-tested function. It matches kanji characters in the query, English meanings (exact > word-prefix > substring), kana readings (katakana/hiragana normalized, KANJIDIC `.`/`-` stripped) and romaji (wanakana). Results are ranked by match quality, then frequency.
  - Instant results dropdown in the header and on the home page, using the slim index. Enter goes to `/search?q=`.
- [x] **1.7 Home page rewrite (`app/page.tsx`).**
  - Content: hero with brand, the "Logic, Not Magic" pitch and the big search box; kanji of the day (deterministic by date, drawn from N5–N3); browse by JLPT with counts; the 10 themes; featured radicals (氵 木 火 亻 口 …); browse by stroke count.
  - Keep the radical composition demo and the three pillars, but rewrite the copy so every claim is true. Remove the SRS and dashboard claims.
  - Primary CTAs: "Browse kanji" and "Start with N5".
  - Keep the dark visual identity.
- [x] **1.8 Global chrome.**
  - Header nav on every page: Browse, Radicals, Themes, Study, My List, a search entry point, and Practice (classic) as a secondary item, with a mobile menu.
  - Remove hearts, streak and the account icon from the header.
  - Footer: add links to About, Browse, Radicals and Practice (classic); keep the feedback card, GitHub and contact links.
- [ ] **1.9 SEO.**
  - `metadataBase` from `NEXT_PUBLIC_SITE_URL`, falling back to `https://${VERCEL_PROJECT_PRODUCTION_URL}` and then `http://localhost:3000`. Add the variable to `.env.local.example`.
  - Root title template `%s | Kanji Kaisen` and a new site description.
  - `generateMetadata` for kanji, radical and theme pages: title like `海 – sea: stroke order, readings & examples`, description built from meanings, readings and JLPT, a canonical URL and basic Open Graph tags.
  - `app/sitemap.ts` (static pages plus every kanji, radical and theme) and `app/robots.ts` (disallow `/api`, `/search`, `/study`, `/my-list`, `/settings`). Add `noindex` to those pages.
  - Confirm with `curl` against `pnpm start` that `/kanji/海` HTML contains its meaning, readings and examples.
- [x] **1.10 About and credits `/about`.**
  - Explain what the site is.
  - Data sources and licenses, each verified from the source rather than assumed: KanjiVG (Ulrich Apel, CC BY-SA 3.0, link); Kanji Alive (verify the license, expected CC BY 4.0, link); KANJIDIC2 via kanjiapi.dev (EDRDG, verify the license, links).
  - Link the page from the footer.
- [x] **1.11 Radical story spot-check.** Review the stories of the ~25 radicals with the most kanji. Fix clear factual errors in `lib/stories/radicals/*.md`, then recompile with `scripts/compile-stories.js`. List doubtful claims in the final report rather than guessing.

### Phase 2 — Light study layer (never punishing)

- [x] **2.1 Study store `lib/study-store.ts`.**
  - Zustand `persist` with its own storage key.
  - Per-kanji entry `{ status: "learning" | "known", addedAt, updatedAt }`.
  - Actions: save/unsave, set status, clear.
  - Pure helpers covered by `*.test.mjs` tests.
- [x] **2.2 Save controls.** On the detail page, add a Save toggle and a "Still learning / Known" switch. Optionally add a small save toggle on grid cards.
- [ ] **2.3 `/my-list`.** Show saved kanji filtered by status, with counts, a "Study these" button and a "Review N still-learning kanji" button. Include an empty state that points to Browse.
- [x] **2.4 Shared quiz logic.** Extract the `PhaseQuiz` distractor algorithm into `lib/atlas/quiz.ts` with tests, and make `PhaseQuiz` import it so the logic isn't duplicated.
- [ ] **2.5 `/study`.**
  - Deck sources: My list (all or still-learning), a JLPT level, a radical, or a theme. Deep links from radical, theme and list pages, for example `/study?radical=sanzui`.
  - Modes:
    - **Flashcards:** flip from kanji to meanings and readings. "Knew it" / "Still learning" updates the status of saved kanji and offers to save unsaved ones.
    - **Quiz:** meaning multiple choice built with `lib/atlas/quiz.ts`.
  - No hearts, no locks, can exit anytime, ends with a session summary.
- [x] **2.6 De-gamify the classic flow and trim Settings.**
  - Wrong answers and failed or errored AI checks no longer cost hearts. Remove the "Out of Hearts" gate and the heart counter in `LearningModal`.
  - Keep the store shape and make sure the sync merge tests still pass.
  - Settings: stop rendering `AccountPanel` (keep the component), relabel the handwriting toggles as classic-practice settings, and point the back button sensibly.
- [ ] **2.7 Analytics.** Keep `trackEvent`. Add `search_performed`, `kanji_viewed`, `radical_viewed`, `kanji_saved`, `kanji_status_changed`, `trace_used`, `study_started` and `study_completed` with small, useful properties. These are the data for the later Phase 3 decision.

### Wrap-up

- [ ] **W.1 Docs and versioning.** Update `README.md` (new positioning, features, routes, data sources and credits, dev commands). Add a CHANGELOG `[2.0.0]` entry, set the version to 2.0.0 in `package.json` and the footer, and update the root `metadata` in `app/layout.tsx`.
- [ ] **W.2 Full QA.**
  - Run `pnpm build && pnpm start`, then drive Chromium with Playwright. It is preinstalled: `require('playwright')` works and `chromium.launch()` needs no options; don't run `playwright install`.
  - Pages to check at 390 px and 1280 px wide: `/`, home search, `/kanji/海`, `/kanji/分`, `/radical/sanzui`, `/radicals`, `/categories`, `/category/nature-elements`, `/browse?jlpt=N5`, `/search?q=water`, `/search?q=mizu`, `/my-list`, a full `/study` flashcard and quiz session, `/practice` and the katana N4 checkpoint (contains 分).
  - Check for no console errors and no horizontal scroll.
  - Save screenshots to the scratchpad, not the repo.
  - Check that redirects work and that no large JSON landed in `.next/static`.
- [ ] **W.3 Independent review.** Spawn a fresh review subagent on the full diff against `main`, briefed on the goals but not on your conclusions. It should look at correctness, classic-flow regressions, SSR/SEO gaps, client bundle size and accessibility basics. Verify its findings and fix the real ones.
- [ ] **W.4 Final report and stop.** Append a "Final report" section to this file:
  - What shipped (routes and features).
  - Deviations.
  - Doubtful radical-story claims.
  - Unassigned-radical count.
  - What the owner must do: set `NEXT_PUBLIC_SITE_URL` in Vercel if the production domain is custom, submit `/sitemap.xml` to Google Search Console, and check the Vercel deploy.
  - Phase 3 candidates.

  Commit, push, then stop the loop.

---

## Working method

- **Each loop iteration:**
  1. `git pull origin claude/zen-sagan-9123o5`.
  2. Read this file.
  3. Take the next unchecked task(s) in order.
  4. Implement, then verify: `pnpm lint`, `pnpm test` and `pnpm build` must all pass, plus a quick Playwright look at any changed page.
  5. Tick the boxes, commit with a clear conventional message, and push.
- **Git:** push only to `claude/zen-sagan-9123o5` with `git push -u origin claude/zen-sagan-9123o5`. If the push fails on a network error, retry with backoff. Never force-push. Don't open a pull request; the owner hasn't asked for one.
- **Order:** finish Phase 0 in the main session first, because 0.3 and 0.4 define the data API everything else uses. Then do Phase 1, Phase 2 and the wrap-up. Small tasks may be batched into one iteration.
- **Subagents:** after Phase 0, independent work can run in parallel subagents. Good examples: radical pages, browse plus search, and the study store plus its pages.
  - Give each one a precise brief: the goal, the `lib/atlas` API, the files it owns, and what "done" means.
  - Shared files (`components/Header.tsx`, `components/Footer.tsx`, `app/layout.tsx`, `next.config.ts`, `app/sitemap.ts`, `package.json`) are edited by the main session only.
  - Use `isolation: "worktree"` if parallel agents could touch overlapping files.
  - The main session reviews every subagent's result, integrates it and runs the full verification before pushing.
- **Matching style:** match the surrounding code's naming, idiom and comment density. Reuse existing components (`KanjiCanvas`, `KanjiCard`, `KanjiGrid`, `FilterPanel`, story modal content, theme colors and images) instead of rebuilding them.
- **When the plan is wrong:** if the data doesn't match or an approach doesn't work, adapt, add a line to the Deviations log below, and continue. Stop only for a genuine blocker that needs the owner; record it in the log and the final report.
- **Done:** every box above is ticked, W.2 passed, the final report is appended and pushed, and the loop is stopped.

## Deviations log

_(append entries here as `- YYYY-MM-DD task — what changed and why`)_

- 2026-10-24 0.1 — Baseline on the untouched tree was clean: `pnpm lint` 0 problems, `pnpm test` 14/14, `pnpm build` OK (Google Fonts reachable). Nothing pre-existing to record.
- 2026-10-24 0.2 — kanjiapi.dev (and edrdg.org) are blocked by the session's network policy (proxy 403), so the 11 entries come from the KANJIDIC2-derived `davidluzgouveia/kanji-data` `kanji.json` (strokes, grade, Mainichi frequency, meanings, readings; on-readings converted to katakana to match kanji-db). That source has no "new JLPT" level for any of the 11 — which is exactly why kanjiapi's JLPT lists skipped them — so levels were set from the old 4-level JLPT (4→N5, 2→N3, 1→N1) adjusted by common N-level lists: 分 N5; 的 可 身 無 誰 畑 坊 N3; 頃 里 N2; 孝 N1. Treat these levels as editorial, not official (there is no official post-2010 list).
- 2026-10-24 0.2 — 々 kept in the practice path (dropping it would change checkpoint contents) and given a kanji-db entry: meaning "iteration mark, repeats the previous kanji", no readings, 3 strokes, JLPT N4 (it appears in N4 words like 人々・時々), frequency 9999, no grade. LearningModal now shows a "Kanji data missing → Skip / Close" state instead of returning `null` under the scroll lock.
- 2026-10-24 0.3 — Kanji Alive's `*` marks example words with an irregular reading (jukujikun/ateji or a reading outside the kanji's list: 今日 きょう, 眼鏡 めがね, 海老 えび). The build strips it and sets `special: true`.
- 2026-10-24 0.3 — `kanji-atlas.json` is `{ kanji: AtlasKanji[], radicals: AtlasRadicalSummary[] }` rather than a bare array, so radical metadata (display char, name, meaning, theme, kanji count) lives next to the kanji and the server module never needs the Kanji Alive file. Unknown frequency (kanji-db's 9999 fallback) is `null`.
- 2026-10-24 0.3 — Radical assignment: 1234 kanji from Kanji Alive, 962 from KanjiVG (`general`, then `tradit`/`nelson` radical groups; element, then `kvg:original`, normalized via `radical_char_map.json`), 27 unassigned (mostly the 鬼, 虍 and 麻 families, which have no Kanji Alive group or story): 釈麻竜魅斉耐亀虚虐魔鬼虎虜魂鼓肇隷匿魁彗爽邑爵虞采麿々.
- 2026-10-24 0.3 — Story/group char mismatches: `gen.md` describes 元 and `hoko.md` describes 矛, but those Kanji Alive groups hold 言 (警) and 戈 (成戦我). The atlas overrides the display char to 言/戈; the story text itself is for 1.11. Other mismatches (kanji-alive 臣 vs story 辶 for shinnyou, 卜 vs 攵 for bokuzukuri, 人 vs 亻 for ninben…) are Kanji Alive group-char errors; the story char is used.
- 2026-10-24 0.3 — The 16 story-only `*hen` radicals keep their own pages; `getRadical` exposes `variantOf` (e.g. kihen → ki) and lists the base radical's kanji.
- 2026-10-24 0.3 — Textiles story was missing because `compile-stories.js` built the filename `textiles,-plants-food`; it now strips commas. Added `pnpm data:stories` alongside `pnpm data:atlas`.
- 2026-10-24 0.4 — `lib/atlas/core.ts` holds the pure `createAtlas(data, stories)`; `lib/atlas/index.ts` (`import "server-only"`) binds it to the JSON. `server-only` throws outside the react-server condition, so tests exercise `core.ts` with the same files read from disk. Pure modules use explicit `.ts` relative imports so Node's strip-types runner can load them; `allowImportingTsExtensions` was enabled in `tsconfig.json` for that (safe with `noEmit`). Extras beyond the plan's list: `getRadicalSummary`, `getRadicalNeighbors`, `getKanjiOfTheDay`, `decodeParam`, plus client-safe `lib/atlas/categories.ts` (CATEGORIES/slugs, re-exported from `lib/checkpoints.ts`) and `lib/atlas/paths.ts`.
- 2026-10-24 0.5 — Note for W.2/W.3: before any atlas page exists, `.next/static` already has a ~1 MB client chunk, presumably the Kanji Alive/kanji-db JSON pulled in by the practice path. Pre-existing; check it doesn't grow.
- 2026-10-24 1.10 — Licenses checked from source: KanjiVG README/COPYING (CC BY-SA 3.0) and the Kanji alive `kanji-data-media` README (CC BY 4.0; attribution name "Kanji alive"). The EDRDG site (and kanjiapi.dev) is blocked from this session, so the KANJIDIC2 licence *version* could not be verified: a 2017 KANJIDIC2 header found in an npm package says CC BY-SA 3.0, and EDRDG is believed to use 4.0 now. The About page says "EDRDG licence (Creative Commons Attribution-ShareAlike)" without a version and links the EDRDG licence page — owner should confirm. The About page also credits davidluzgouveia/kanji-data (used in 0.2) and states that JLPT levels are unofficial.
- 2026-10-24 1.8/1.9 — Agent worktrees live in `.claude/worktrees/`; added to `.gitignore`, ESLint ignores and the tsconfig `exclude` so lint/typecheck don't scan them.
- 2026-10-24 1.11 — Reviewed the 28 radicals with the most kanji plus gen and hoko; fixed 15 stories (gen rewritten as 言, hoko as 戈; stroke count of 彳; positions for 禾 月 金 貝 力 糸; 税 = 禾+兑; 頁 "page" is a sound loan; 度 宅 早 繁 component glosses; 艹 is the crown form of 艸; 一 is an indicator, not a finger pictograph). `DISPLAY_CHAR_OVERRIDES` removed. 矛 lost its (wrong) hoko assignment, so 28 kanji are now unassigned.
- 2026-10-24 1.11 — Doubtful claims left unchanged (for the final report): gonben/kuchi state the "sound waves" origin of 言 as fact (Shuowen: 口 + 辛 phonetic; others: tongue/reed pipe); ukanmuri "the dot is a chimney" (usually the roof ridge); ito "top part is the cocoon" (Shuowen: twisted silk skein); kane "smelting furnace with nuggets" (accounts conflict: 今 phonetic + 土, or a casting mould); onna "or seated at a loom" (standard: kneeling woman, crossed arms); ichi 万 = "一 + symbol for many" (万 is an old variant of 萬, a scorpion); ninben 体 = 亻+本 (historically a popular form standing for 體); oogai 顔 glossed vaguely without 彦. Data note: some story examples sit outside their radical's Kanji Alive group (案 under ukanmuri, 天 under ichi, 行 under gyouninben, 言 under kuchi), and 書 (radical 曰) is in the `hi` group.
- 2026-10-24 2.1 — Pure helpers live in `lib/study-list.ts` (tested by `lib/study-list.test.mjs`); `lib/study-store.ts` (key `kanji-study-list`) wraps them and adds `useStudyStoreHydrated()` so client components can avoid hydration mismatches. `setStatus` on an unsaved kanji saves it.
- 2026-10-24 2.4 — `buildMeaningOptions(target, pool)` in `lib/atlas/quiz.ts` takes the category on each candidate instead of reading checkpoints; PhaseQuiz builds its pool from KANJI_DATA + checkpoint categories, so its options are unchanged. The old second "fallback" loop was dropped because the ranked list already contains the whole pool.
- 2026-10-24 2.6 — Hearts removed from the classic flow ahead of 2.6's Settings part: PhaseQuiz/PhaseChallenge no longer take `onFail`; LearningModal drops the heart counter, the "Out of Hearts" gate and the `heart_lost`/`out_of_hearts` events. `shouldLoseHeartForQuizSelection` and its test were removed. Store fields and actions are untouched.
- 2026-10-24 1.5 — `/browse` defaults to JLPT order (N5→N1, then frequency); `?sort=frequency|strokes` for the others. Both theme (`?theme=<slug>`) and radical (`?radical=<key>`) filters shipped. Filter changes use `history.replaceState` (no RSC refetch, no history entries). All 2223 slim records ride in the RSC payload (~570 KB raw / ~82 KB gzipped HTML); the first 120 tiles are server-rendered, "Show more" adds 120. Filter logic is the tested `components/Browse/filters.ts`. The old Dashboard/FilterPanel/KanjiGrid/KanjiCard and `/heatmap` page were removed.
- 2026-10-24 1.6 — `searchKanji` scores: typed kanji 1000; exact meaning 100 > exact kana 95 > exact romaji 85 > meaning word-prefix 70 > kana prefix 60 > romaji prefix 50 > meaning substring 40; ties by frequency then JLPT. A reading's okurigana-less stem also counts as exact (ふる.い matches ふる). `/search` caps at 100 results, robots `noindex, follow`. The header shows the SearchBox inline at ≥1280 px and in the mobile menu; between those widths it shows a search icon linking to `/search`.
- 2026-10-24 1.1 — `dynamicParams = false` with all 2223 pages prerendered; raw and percent-encoded URLs both resolve. The irregular-reading marker is an `<abbr>` plus a visible footnote (works on touch). `KanjiCanvas` got a small fix: `animate()` threw an uncaught TypeError when the canvas was destroyed mid-animation (also seen in the classic flow before the fix). `lib/atlas/kanjivg.ts` uses `turbopackIgnore` so Turbopack doesn't try to bundle 11k SVGs. `components/StrokeLearning.tsx` was unused and removed.
- 2026-10-24 1.2–1.4 — Theme pages group the kanji grid by JLPT level (Nature & Elements has 584). Practice pages get metadata from `app/practice/layout.tsx`. Story modal copy says "theme" instead of "category". Practice pages stay client-rendered (moved unchanged, as planned). Verified: `/practice` → Tools & Weapons → Katana Radical (N4) runs to "Checkpoint Mastered!" through 分 and stores `rad-katana-n4`.
- 2026-10-24 1.7 — Home is a server page (revalidated hourly so the kanji of the day rolls over) with client islands for the search box, floating kanji and the composition demo. Claims rewritten: no SRS, dashboard or AI claims; stats come from the data (kanji, radicals, example words); 海 is described as "water + a sound part (每)".
- 2026-10-24 2.2 — `StudyControls` (Save toggle + Still learning/Known radiogroup) on the kanji page; it shows a skeleton until the store hydrates. No save toggle on grid cards (optional, skipped to keep tiles server-rendered).
- 2026-10-24 2.7 — Events added: `kanji_viewed`, `radical_viewed` (via a small `TrackEvent` client component on server pages), `search_performed` (/search page and dropdown selections), `kanji_saved`, `kanji_status_changed`, `trace_used` (start/completed). `study_started`/`study_completed` come with /study.
