# Story Atlas Redesign Implementation Plan

> **For agentic workers:** The main session runs this plan and hands independent workstreams to subagents, each in its own git worktree. Steps use checkbox (`- [ ]`) syntax. Tick a box in the commit that completes it. Read "Contracts" and "Working method" before starting a phase.

**Goal:** Turn the v2.0.0 kanji atlas (branch `claude/zen-sagan-9123o5`, unreleased) into a story-first, reading-first atlas built on the radical method. Every radical shows its sourced journey from ancient forms to today. Every kanji shows how it is read in real words, which parts carry meaning and sound, and how it was built where a source says so. Progress is five shades of ink per kanji, and each theme's illustration regains colour as its kanji darken. Teachers get printable worksheets, a projector mode and no-signup share links.

**Why:** See `reports/汉字学习者痛点与目标人群.md` (audience) and `reports/中文汉字学习者市场调研.md` (Chinese edition). The primary audience is English-speaking self-learners from N5 to N2 who are burnt out by review debt or who look up confusing kanji next to WaniKani or Anki. Their top pains are readings (on/kun, which reading in which word), review debt, meanings detached from real words, and look-alikes. The differentiator is the radical method told with rigour: etymology with sources, kept apart from labelled memory stories, and meaning parts kept apart from sound parts. Art must sit on the usage path (stroke animation, ink progress, worksheets, share cards), never as decoration alone.

**Tech stack:** Next.js 16 App Router, React 19, Tailwind 4, Zustand, kanji-recognizer, wanakana, KanjiVG, Node test runner (`pnpm test`).

**Design source:** claude.ai Design artifact https://claude.ai/artifact/HuvZ2NqRWoBnhPaRWykyC9. Read boards with the Artifact tool (`action: "read"`, `path: "project/<Board>.dc.html"`). Target boards: `Story-Radical`, `Story-Kanji`, `M-Story`, `Share-Card`, `Today`, `Theme`, `Learn`, `Teach`, `M-Home`, `M-Theme`, `M-Learn`, `System`. Ignore `Dir*`, `Main` and `Home`. The ancient glyphs and the "picture" drawings in the mockups are hand-drawn placeholders, not data.

---

## Product decisions (made by the owner; do not reopen)

1. **Audience and language.** English UI, Japanese kanji only. No Chinese edition yet. The data is split into a language-neutral character core and a Japanese layer so a Chinese edition can be added later.
2. **No punishment.** No hearts, lock-outs, streaks or forced daily queues in any new flow. Study is optional. Classic practice stays at `/practice` unchanged.
3. **Ink, not levels.** Each kanji has one of five ink shades: 白 Not met, 淡 Met, 中 Learning, 濃 Familiar, 印 Mastered. Themes have no order and no numbers.
4. **Rigour.** Etymology is shown only with a source and is kept apart from mnemonics, which are labelled "Memory story". Ancient forms come only from Wikimedia Commons files that are public domain, or CC0 files traced from Academia Sinica (小学堂). Files sourced from Richard Sears are excluded. Where no ancient form exists, none is shown. Ancient forms are never drawn or invented.
5. **Skins.** 夜 Night (dark, full-colour theme art, per-theme glow) is the brand default. 墨 Ink (paper, ink-wash art, one vermilion accent) is for daytime and printing. Worksheets always print in 墨.
6. **Teachers** get only three things: printable worksheets, a projector mode and share links that need no account (the set is encoded in the URL, with no backend).
7. **In Chinese probe.** A collapsed "In Chinese" note on kanji pages (simplified/traditional and pinyin from Unihan), plus analytics, measures interest before any Chinese edition is built.
8. **Fonts:** Shippori Mincho B1 (Japanese display), Cormorant Garamond (Latin display), Zen Kaku Gothic New (UI). They replace Inter and Noto Sans JP.

## Decisions taken in this plan (owner may change)

- **No review queue or "N to review" badge.** The `System` and `Today` boards show "12 to review" and spaced intervals. The audience report says ink must not be tied to due reviews, or review debt comes back. Ink rises through the four-step loop and the learner can set any shade by hand. Wrong answers never lower a shade. A "Revisit" list (kanji at 淡/中, oldest first) is offered on My list as a suggestion with no count in the header.
- **No "picture" stage yet.** The journey shows only sourced stages (oracle bone, bronze, seal) plus today's form drawn from KanjiVG. The data model keeps an optional `picture` slot for commissioned art.
- **The four-step loop is a full-screen layer on the kanji page** (`/kanji/海#learn`), not a second set of 2,384 pages. Theme and home CTAs deep-link to it.
- **Share cards are drawn in the browser** (canvas, 1080×1350 PNG, download or Web Share). Per-kanji OG images at build time are deferred because they would add thousands of renders to every build.
- **Kanji without an official JLPT level** (most of the 161 added jōyō kanji) get N1. This follows the unofficial lists, where N1 means "the rest of jōyō". They are flagged `jlptEditorial: true`.

## Facts checked while planning (verify; don't trust blindly)

- `lib/kanji-db.json` has 2,223 entries with `meaning: string` sorted alphabetically: 土 is "Turkey, earth, ground, soil", 西 is "Spain, west", 休 is "day off, rest, retire, sleep". KANJIDIC2 order puts the core meaning first.
- The atlas has 1,975 jōyō and 248 non-jōyō kanji and lacks 161 jōyō kanji (丈 串 丼 俺 喉 嫉 柿 枕 鍋 鍵 鬱 麓 麺 …). Their KanjiVG files exist. See `research_notes/中文汉字学习者市场调研/data_feasibility.md` §3 and §5 for how they were found.
- Only the 1,235 Kanji alive kanji have example words. About 990 kanji pages have none.
- Every KanjiVG file declares `kvg:phon` in its DTD. Real phonetic marks look like `<g kvg:element="毎" kvg:position="right" kvg:phon="毎">` (in 海, `06d77.svg`).
- Reachable from this machine on 2026-10-31: kanjiapi.dev, `ftp.edrdg.org` (KANJIDIC2), `unicode.org` (Unihan.zip), `commons.wikimedia.org` API, `raw.githubusercontent.com`.
- Commons coverage before the Sears filter (data_feasibility §2): 184 of the 194 radical chars have at least one ancient form (144 oracle bone). Of the 2,136 jōyō kanji, 60% have at least one form and 18% have oracle bone, bronze and seal.
- Existing radical stories (`lib/compiled-stories.json`) are mnemonic in tone. Several origins are doubtful (see the 2026-10-24 plan's final report). They will be labelled "Memory story".
- Theme colours (from the `Today` board): Nature `#34D399`, Body `#60A5FA`, Action `#F87171`, Structures `#D6CFC4`, Animals `#FBBF24`, Tools `#A5B4C8`, Thought `#C084FC`, Plants `#A3E635`, States `#F472B6`, Time `#A5B4FC`. The 墨 accent is vermilion `#B5341E`.

## Target information architecture

| Route | Purpose (board) | Rendering |
|---|---|---|
| `/` | Learn home: search first, then featured theme art with ink ring, radical seals and "Continue with X", then the ten theme gates (`Today`, `M-Home`) | SSG + client islands |
| `/kanji/[char]` | Story-first, reading-first kanji page; `#learn` opens the 会/想/描/書 layer (`Story-Kanji`, `Learn`, `M-Learn`) | SSG, about 2,384 pages |
| `/radical/[key]` | Journey page: staged ancient-form animation, origin, memory story, what it grows into, theme scroll (`Story-Radical`, `M-Story`) | SSG |
| `/category/[slug]` | Theme page: art hero, radical seals in a suggested order, selected radical with its kanji shaded by ink (`Theme`, `M-Theme`) | SSG + client selection |
| `/categories`, `/radicals`, `/browse`, `/search`, `/my-list`, `/study`, `/about`, `/settings` | Kept and restyled with skin tokens. `/study` gains a `chars=` deck | as today |
| `/teach` | Set builder: from theme, radical, JLPT, My list or pasted text (`Teach`) | SSG shell + client, indexable |
| `/teach/print?k=&t=` | A4/Letter worksheet: stroke order, tracing cells, 米字格 cells, readings, optional answer key | client, `noindex` |
| `/teach/present?k=&t=` | Projector: one stroke per key press, → next kanji, Q quiz the room | client, `noindex` |
| `/set?k=&t=` | Shared set for students: no account; open each kanji or study the set | client, `noindex` |
| `/practice/**` | Classic practice, unchanged | as today |

**Bundle rule (unchanged):** the full atlas JSON is server-only. Client code gets props or the slim `public/data/search-index.json`.

---

## Contracts (all workstreams code against these)

**Skin tokens.** `<html data-skin="night|ink">` is set before paint by an inline script that reads `localStorage["kanji-skin"]` and defaults to `night`. CSS variables are defined for both skins in `app/globals.css`, with values from the `Today` board: `--bg --card --ink --ink-2 --ink-3 --line --line-2 --onacc --shade`. Tailwind exposes them as `bg-bg`, `bg-card`, `text-ink`, `text-ink-2`, `text-ink-3`, `border-line`, `border-line-2`. Theme accent: set `--tc` (the theme's hex) on a theme container. `--c` resolves to `var(--tc)` in 夜 and `#B5341E` in 墨. Use `text-[var(--c)]`. Glow utilities (`.glow`, `.halo`) only apply in 夜. Theme art gets class `ink-art`, which applies `grayscale(1) contrast(1.45) brightness(1.18)` and `mix-blend-mode: multiply` in 墨. Fonts: `font-disp`, `font-jp`, `font-ui`. Every animation respects `prefers-reduced-motion`.

**Theme metadata.** `lib/atlas/categories.ts` gains `THEME_COLORS`, `THEME_SHORT` (Nature, Body, …) and `THEME_JP` (自然と元素, …), from the `Today` board.

**Ink store.** `lib/ink.ts` (pure, tested) and `lib/ink-store.ts` (Zustand persist, key `kanji-ink`, plus `useInkHydrated()`).
- `type Shade = 0 | 1 | 2 | 3 | 4`, with names 白 Not met, 淡 Met, 中 Learning, 濃 Familiar, 印 Mastered.
- `getShade(char)`, `setShade(char, shade, source)`.
- `recordStep(char, step: "meet" | "recall" | "trace" | "write", ok)`: meet → at least 1; recall ok + trace → at least 2; write ok on two different days → at least 3; write ok 21+ days after the first ok write → 4. Never lowers a shade.
- `themeProgress(chars)` returns `{ painted: Σshade / (4·N), known: count(shade ≥ 3), met: count(shade ≥ 1) }`.
- One-time migration from `kanji-study-list`: known → 3, learning → 2. My list saving stays in `lib/study-store.ts`.

**Analytics.** `lib/analytics.ts` exports a union `AnalyticsEvent` of names. New events:
- `journey_played` {radical, stages}
- `build_played` {kanji}
- `learn_step_completed` {kanji, step}
- `ink_changed` {kanji, from, to, source}
- `share_card_created` {kanji, action}
- `worksheet_printed` {count, paper, answerKey}
- `projector_opened` {count}
- `share_link_created` {count}
- `share_link_opened` {count}
- `zh_note_opened` {kanji, relation}
- `zh_edition_interest` {kanji}
- `skin_changed` {skin}
- `theme_gate_clicked` {theme, source}

Existing events are kept: `search_performed`, `kanji_viewed`, `radical_viewed`, `kanji_saved`, `kanji_status_changed`, `trace_used`, `study_started`, `study_completed`.

**Teacher URL contract.** `k` is the kanji concatenated, URL-encoded, at most 60. Unknown characters and duplicates are dropped. `t` is the title, at most 80 characters. Helpers live in `lib/teach-set.ts` (pure, tested): `encodeSet`, `decodeSet`, `setPath(kind, set)`.

**Data files and licenses.** Each source keeps its own file and credit. `/about` lists them all.
- Core (language-neutral; the project's own license plus permissive sources):
  - `lib/core/unihan.json` (Unicode License v3; keep `lib/core/UNICODE-LICENSE.txt`)
  - `lib/core/ancient-forms.json`, a per-file manifest with title, URL, author, license and Academia Sinica code
  - `public/ancient/*.svg` (PD/CC0)
  - `lib/core/themes.json`
- Share-alike layers, each credited separately:
  - `lib/core/components.kanjivg.json` (component roles and phonetic marks derived from KanjiVG, CC BY-SA 3.0)
  - `lib/core/etymology.wiktionary.json` (glyph-origin notes from Wiktionary, CC BY-SA 4.0; each entry has its page URL and revision ID)
  - `lib/ja/kanjidic2.json` (meanings in priority order, readings, grade and frequency; EDRDG CC BY-SA 4.0)
  - `lib/ja/words.jmdict.json` (example words with reading alignment from JMdict and JmdictFurigana, CC BY-SA 4.0)
- Already in the repo: Kanji alive examples (CC BY 4.0) and KanjiVG SVGs (CC BY-SA 3.0, `public/kanjivg/COPYING`).
- `scripts/build-kanji-atlas.mjs` merges everything into `lib/atlas/kanji-atlas.json` and `public/data/search-index.json`. Downloaded raw sources go in a git-ignored `data-cache/`. Committed outputs are deterministic.

---

## Tasks

### Phase 0 — Baseline (main session)

- [x] **0.1** Run `pnpm install`, `pnpm lint`, `pnpm test` and `pnpm build` on the untouched branch. Record the results in the Deviations log. Make sure `.claude/worktrees/` and `data-cache/` are git-ignored and excluded from ESLint and TypeScript.

### Phase 1 — Foundations (three parallel subagents, separate worktrees)

- [x] **1A Data: character core plus Japanese layer** (agent "data"; owns `scripts/` except `fetch-sources.mjs`, `lib/core/` except the ancient and etymology files, `lib/ja/`, `lib/atlas/` data, types, core and search, `lib/kanji-db.json`, `public/data/search-index.json`, and their tests)
  - Restructure the build into core and ja layers per the Contracts. The merged `AtlasKanji` keeps every existing field so current pages still compile. New fields:
    - `components[]` (`char`, `role`: meaning, sound, both or form; optional `radicalKey`; KanjiVG stroke index ranges for colouring)
    - `phonetic` (`char`, `series` of chars, shared on'yomi, `regular` flag)
    - `sameOn` (on reading → chars, capped)
    - `lookAlikes` (up to 6, computed from component overlap and stroke-count difference)
    - `wordsByReading` (`reading`, `kind`: on, kun or special, `words[]`)
    - `joyo` and `nameKanji` flags, `jlptEditorial`
    - `zh` (`relation`, `simplified`, `traditional`, `pinyin[]`, `kokuji`)
    - `etymon` (the traditional or etymological code point used for ancient forms)
  - Fix the meaning order from KANJIDIC2 (fetch `kanjidic2.xml.gz` into `data-cache/`) and write it back to `lib/kanji-db.json` so classic practice benefits too.
  - Add the 161 missing jōyō kanji: KANJIDIC2 fields, KanjiVG radical fallback, theme from the radical, JMdict words, N1 + `jlptEditorial` when no level exists. Tag non-jōyō entries with `nameKanji` (Unihan `kJinmeiyoKanji`) or non-jōyō.
  - Example words: Kanji alive first. For every kanji with fewer than 6, add JMdict words with priority tags (`news1`, `ichi1`, `spec1`), shortest and most common first, up to 8. Align each word to the kanji's reading with JmdictFurigana, fall back to a tested heuristic, else `special`.
  - Phonetic series from `kvg:phon` (real attributes only, not the DTD). Same-on'yomi groups from on readings.
  - In Chinese data from Unihan: `kSimplifiedVariant`, `kTraditionalVariant`, `kMandarin`, `kJoyoKanji`, `kJinmeiyoKanji`, `kZVariant`/`kSemanticVariant` for shinjitai to kyūjitai. Relation categories follow the report: same, ja=trad, ja=simp, ja-only form, all differ, kokuji, unknown.
  - Expose new `lib/atlas` getters: `getPhoneticSeries`, `getSameOn`, `getLookAlikes`, plus anything pages need.
  - **Acceptance:**
    - `getKanji("土").meanings[0]` is "soil" or "earth"; 西 starts with "west"; 休 starts with "rest".
    - The atlas has all 2,136 jōyō kanji. `鍋`, `俺` and `麺` pages have meanings, readings, at least 3 words and a radical where KanjiVG gives one.
    - 海's components are 氵 meaning + 毎 sound, and its phonetic series includes 梅 and 悔.
    - 学's `zh` is same-as-simplified with traditional 學 and pinyin xué. 働 is kokuji.
    - At least 95% of kanji have at least 3 example words.
    - `pnpm data:atlas` is deterministic (a second run produces no diff).
    - New pure logic has tests next to the existing `*.test.mjs` files.
    - `.next/static` gains no full atlas data.

- [x] **1B Sourced story layer: ancient forms and etymology** (agent "story-data"; owns `scripts/fetch-ancient-forms.mjs`, `scripts/fetch-etymology.mjs`, `lib/core/ancient-forms.json`, `lib/core/etymology.wiktionary.json`, `public/ancient/`, `lib/story/` pure helpers and tests, `components/Story/Journey*.tsx`)
  - Follow the method in `research_notes/中文汉字学习者市场调研/data_feasibility.md` §2:
    - Query the Commons API (batches of up to 50 titles, a descriptive User-Agent, polite rate) for ACC files such as `木-oracle.svg`, `木-bronze.svg` and `木-seal.svg`, plus the variants the project uses.
    - Read each file's wikitext. Keep a file only if it uses the ACC license template without the Sears parameter, or carries an Academia Sinica code (PD/CC0).
    - Store author, license, source and file page URL for every kept file. Never keep a file whose license can't be confirmed.
  - Scope, in order: all radical display chars (and their etyma), then the top 600 kanji by frequency, then the rest of jōyō if time allows. Ancient forms hang on the etymon (学 → 學). Sanitise each SVG (strip scripts and foreign attributes), normalise the viewBox, keep it small.
  - Etymology: for each radical and the top 600 kanji, fetch the English Wiktionary "Glyph origin" section through the API. Parse the formation type (pictogram, ideogram, ideogrammic compound, phono-semantic compound, other) and the components named. Keep at most two plain sentences, with the page URL and revision ID. Skip an entry when nothing clean can be parsed. Never write etymology from memory.
  - `components/Story/JourneyPlayer.tsx` (client): play/pause, stage tabs (oracle bone, bronze, seal, today), captions, `aria-live`, reduced motion. Today's stage draws KanjiVG strokes with the glowing dash animation. Only stages with data render. Fires `journey_played`. Uses only skin tokens.
  - **Acceptance:**
    - At least 85% of radical chars have at least one form after filtering. No kept file carries the Sears parameter (a test checks the filter on fixture wikitexts).
    - Coverage counts are written to the Deviations log.
    - Every etymology entry has a URL and a revision ID.
    - 木 and 休 have formation types (pictogram; ideogrammic compound of 人 + 木).
    - `JourneyPlayer` renders with zero, one or three ancient stages.

- [x] **1C Skins, design system, ink store, analytics registry and chrome** (agent "skin"; owns `app/globals.css`, `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`, `lib/ink*.ts`, `lib/analytics.ts`, `lib/atlas/categories.ts` theme metadata, `components/Ink/`, and a token sweep of existing components)
  - Load the three fonts with `next/font/google`, define the token contract for both skins, add the no-flash skin script and a `SkinToggle` (夜/墨, `aria-pressed`, fires `skin_changed`).
  - Header per the boards: 解 logo with "Kanji Kaisen" in Cormorant; nav Learn (`/`), Browse, My list, Teach; search; skin toggle. Keep the mobile menu.
  - Sweep existing pages and components from hard-coded `white/…`, `black` and `#2effff` colours to tokens, so both skins are readable everywhere. Classic practice only needs to stay readable in 夜; it may force `data-skin="night"` on its subtree.
  - Ink store and migration per the Contracts. Add `components/Ink/InkDots.tsx` (four dots plus the shade name), `components/Ink/ThemeScroll.tsx` (theme art in grayscale with a colour layer revealed to `painted%`, a glowing edge and a caption) and `components/Ink/InkPicker.tsx` (self-mark any shade).
  - Print stylesheet basics: `@media print` forces 墨 tokens and hides chrome.
  - **Acceptance:**
    - Toggling skins changes every page with no flash on reload. The choice persists.
    - 墨 art renders as ink wash.
    - Contrast of `--ink-2` on `--bg` is at least 4.5:1 in both skins.
    - `ink.test.mjs` covers the step rules, "never lowers", the migration and `themeProgress`.
    - Existing pages look right at 390 px and 1280 px in both skins.

**Merge order:** 1C, then 1A, then 1B. The main session resolves conflicts and runs lint, test, build and a browser smoke test.

### Phase 2 — Pages (five parallel subagents, after Phase 1 is merged)

- [ ] **2A Kanji page, story-first** (agent "kanji"; owns `app/kanji/[char]/`, `components/Atlas/kanji/`, `components/Learn/`)
  - Hero (`Story-Kanji`): big glyph, meaning headline, component chips coloured by theme and labelled by role, a JLPT/strokes/grade line, StudyControls and InkDots.
  - Above the fold on desktop and phone, readings come first. Each reading is a block (kana large, romaji, "on'yomi, in compounds" or "kun'yomi, on its own") with its words. Irregular words sit under "Special readings". Pages with no words for a reading say so.
  - "How it was built": a build animation when a source exists. Stages: components coloured from KanjiVG groups, then the kanji's ancient forms (reusing `JourneyPlayer`), then today. Captions come from the etymology entry, otherwise plain structure ("氵 water + 毎 sound"). Fires `build_played`.
  - Separate labelled blocks: **Etymology** (sourced, with a citation link) and **Memory story** (the radical story, labelled as a mnemonic).
  - Glowing stroke-order animation: SVG dash animation on KanjiVG paths with glow in 夜 and vermilion in 墨, replay and step controls. The static numbered diagram is kept for SEO and print.
  - Links:
    - "Also built on X" for each component
    - the phonetic series with its shared reading and a regular/irregular note
    - same on'yomi
    - look-alikes as a side-by-side compare with the differing part highlighted
  - In Chinese note: collapsed `<details>` with simplified/traditional (`lang="zh-Hans"`/`zh-Hant`), pinyin (all readings, or "most common only" when truncated), kokuji and false-friend notes, the Unihan credit, `zh_note_opened` on open and a "Want a Chinese edition?" fake door (`zh_edition_interest`).
  - Action row: "Learn it · 4 steps" (opens `#learn`), "Make a card" (wired by the main session from 2E), Save, "Print practice sheet" (`/teach/print?k=海`), "Present" (`/teach/present?k=海`).
  - `#learn` layer (`Learn`, `M-Learn`): step tabs 会 Meet, 想 Recall, 描 Trace, 書 Write.
    - Meet: readings, parts, memory story.
    - Recall: meaning multiple choice using `buildMeaningOptions`.
    - Trace: stroke by stroke with hint and back.
    - Write: optional, local kanji-recognizer, no API, off by default with a "Try writing from memory" opt-in.
    - Each step calls `recordStep` and `learn_step_completed`. Any step can be skipped, there are no penalties, and Esc or ✕ closes the layer.
  - SEO: metadata leads with readings ("海 (うみ, カイ) – sea: …"). JSON-LD `DefinedTerm`. Server-rendered readings, words, etymology and links.
  - **Acceptance:**
    - `/kanji/海`, `/kanji/休`, `/kanji/鍋`, `/kanji/々` and `/kanji/働` render with no console errors at 390 and 1280 px in both skins.
    - On a 390×844 phone the first screen shows the glyph, meaning and at least one reading block.
    - The four-step layer works by keyboard and touch.
    - `curl` of `/kanji/海` contains カイ, うみ and 日本海.

- [ ] **2B Radical journey page** (agent "journey"; owns `app/radical/[key]/`, `app/radicals/`, `components/Atlas/radical/`)
  - Layout per `Story-Radical` and `M-Story`:
    - left: `JourneyPlayer` (play the journey) with stage tabs and dates
    - right: big glyph, name and meaning, "Radical in N kanji" with its positions, the **Origin** (sourced etymology) and **Memory story** blocks, and "What 木 grows into" (top kanji with reading and one-line explanation from the story's `exampleKanji`, plus "See how it was built →" where a kanji has a build)
    - `ThemeScroll` for the radical's theme
  - Keep the kanji grid (shaded by ink) and prev/next. `/radicals` is restyled with seals.
  - **Acceptance:**
    - `/radical/ki`, `/radical/sanzui` and `/radical/hi` play their sourced stages. A radical without forms shows today's stage only, with a note.
    - The doubtful claims listed in the 2026-10-24 report sit under "Memory story", not "Origin".
    - Both widths and both skins pass.

- [x] **2C Home and theme pages** (agent "themes"; owns `app/page.tsx`, `components/Home/`, `app/category/[slug]/`, `app/categories/`, `components/Atlas/category/`)
  - Home (`Today`, `M-Home`):
    - a search hero first (the existing SearchBox, larger)
    - the featured theme (the learner's most-progressed theme, else Nature): art, glow title, `painted%` ring, lore, radical seals shaded by ink, "Continue with X" (the next unmet or learning kanji in the suggested order, linking to `/kanji/X#learn`) and "Open the theme"
    - the ten gates (arched cards with art and a progress bar; on phone a swipe row) firing `theme_gate_clicked`
    - kanji of the day and JLPT entry points kept below
    - server-rendered defaults, so client islands only swap the featured theme after hydration
  - Theme page (`Theme`, `M-Theme`): art hero with JP title and lore, counts, radical seals in the suggested order (by kanji count) with ink state, a selected-radical panel (story quote, count, kanji cells darkened by ink, CTA). Every radical's kanji is server-rendered (SEO) and the panel is a progressive enhancement. `ThemeScroll` in the sidebar.
  - **Acceptance:**
    - The home page's first screen at 390 px shows the search box.
    - Gates are keyboard reachable.
    - Ink changes made on a kanji page show up on home and theme pages after navigation.
    - Both widths and both skins pass.

- [x] **2D Teacher kit** (agent "teach"; owns `app/teach/`, `app/set/`, `components/Teach/`, `lib/teach-set.ts` and its test, and `chars=` deck support in `components/Study/`)
  - `/teach` builder (`Teach`):
    - add kanji by theme, radical, JLPT level, My list or pasted text
    - reorder, remove, name the set; saved sets in localStorage
    - a hint when all kanji share a radical
    - preview tabs for Worksheet, Projector and Share
  - Worksheet: A4/Letter, 墨 always. Per kanji:
    - the glyph, meaning and readings
    - a stroke-order strip (cumulative KanjiVG strokes)
    - a row of tracing cells (grey glyph) and empty 米字格 practice cells
    - an optional "Read these words" exercise and an answer key page
    - footer credits ("Stroke order: KanjiVG (CC BY-SA 3.0)")
    Fires `worksheet_printed` on `beforeprint`.
  - Projector (`/teach/present`): full screen, large type. Space draws the next stroke, → next kanji, ← back, Q quiz the room (four meanings, Reveal highlights the radical), Esc exits. Fires `projector_opened`.
  - Share: copy link (`/set?k=…&t=…`) with a QR code (small MIT dependency or a hand-rolled encoder, main session approves the dependency). `/set` shows the set with "Study this set" (`/study?chars=…`) and per-kanji links. No account. Fires `share_link_created` and `share_link_opened`.
  - **Acceptance:**
    - Chrome print preview of an 8-kanji set fits A4 and Letter with no clipped cells.
    - The projector advances one stroke per Space.
    - A share link opened in a fresh profile shows the set.
    - `teach-set.test.mjs` covers encoding, dedupe, unknown characters and caps.

- [ ] **2E Share card** (agent "card"; owns `components/ShareCard/`, `lib/share-card.ts` and its test)
  - `ShareCardButton` plus a dialog that draws a 1080×1350 card per `Share-Card`:
    - the question "Why does 休 mean rest?" (or "What does 海 mean?" when there is no build)
    - the glyph from KanjiVG paths coloured by component theme with glow (夜) or vermilion and ink (墨)
    - the component equation (ancient forms if sourced, else modern parts)
    - the meaning, readings, logo and URL
    - theme art background
  - Fonts load via `document.fonts` before drawing. Download PNG and Web Share where supported. Fires `share_card_created`. The main session wires the button into the kanji page.
  - **Acceptance:** cards for 休, 海 and 鍋 render with correct fonts, no tainted canvas (same-origin images only) and file size under 1.5 MB.

### Phase 3 — Integration and QA (main session)

- [ ] **3.1** Merge the 2A–2E branches, wire `ShareCardButton` into the kanji page and add `/teach` and the new pages to the sitemap (`/teach` only; `/set` and print are `noindex`).
- [ ] **3.2** `/about`: data credits and licenses for KanjiVG (CC BY-SA 3.0), Kanji alive (CC BY 4.0), KANJIDIC2 and JMdict/EDRDG (CC BY-SA 4.0), JmdictFurigana, Unihan (Unicode License v3), Wiktionary glyph origins (CC BY-SA 4.0, per entry), Commons ancient forms (per file, with an attribution list page at `/about/ancient-forms` generated from the manifest). Remove all "AI handwriting" marketing claims from new pages.
- [ ] **3.3** README, CHANGELOG `[2.1.0]` (2.0.0 is unreleased; the owner may fold both into one release) and the version in `package.json` and the footer.
- [ ] **3.4** Browser QA with the built app (`pnpm build && pnpm start`) at 390 and 1280 px in both skins: `/`, `/kanji/海`, `/kanji/休`, `/kanji/鍋`, `/radical/ki`, `/category/nature-elements`, `/teach`, a print preview, `/teach/present`, `/set?k=海泳`, `/study?chars=海泳`, `/browse`, `/search?q=mizu`, `/my-list`, `/practice`. Pass criteria: no console errors, no horizontal scroll, and readings above the fold on kanji pages.
- [ ] **3.5** Independent review subagent on the full diff against `claude/zen-sagan-9123o5`, briefed on goals only. Verify its findings and fix the real ones.
- [ ] **3.6** Final report appended here: what shipped, deferred items with reasons, coverage numbers, owner to-dos. Commit. Do not push, open a PR, merge to `main` or deploy without asking the owner.

### Deferred (with reasons)

- Commissioned "picture" stage art for radicals: needs an illustrator; the data model has a slot for it.
- Per-kanji OG images: build cost; revisit with on-demand ISR when deployed.
- Chinese edition, simplified stroke order (Make Me a Hanzi): waits for the probe thresholds in the Chinese-market report.
- Spaced-review scheduling: conflicts with the no-review-debt decision; revisit only if the analytics ask for it.
- Teacher back-end (classes, student accounts): out of scope by decision.

---

## Working method

- **Branch:** `claude/story-atlas-847c2a` in `/Users/harry/code/kanji-kaisen/.claude/worktrees/story-atlas-847c2a`. Commit as you go. No pushes, PRs, merges to `main` or deploys without the owner's OK.
- **Subagents:** `isolation: "worktree"`, branched from the current tip of this branch. Each brief names the goal, the board(s) to read, the owned files, the contracts, the acceptance criteria and the rule "run `pnpm lint`, `pnpm test` and `pnpm build` before you finish; commit on your branch; report the branch name, what you did, what you skipped and why". Only the main session edits files outside an agent's ownership, plus the shared files `package.json`, `next.config.ts`, `app/sitemap.ts` and `app/about/`. An agent that needs a shared change describes it in its report.
- **Verification per merge:** `pnpm lint`, `pnpm test`, `pnpm build`, then a browser check of the touched pages at 390 and 1280 px.
- **Style:** match the surrounding code (4-space indents in TS, named exports, `lib/atlas` pure-core + server-only binding pattern, `.ts` relative imports in pure modules so the Node test runner can load them).
- **When the plan is wrong:** adapt, log it under Deviations, continue. Stop only for a real blocker that needs the owner.

## Deviations log

_(append entries here as `- YYYY-MM-DD task — what changed and why`)_

- 2026-10-31 0.1 — Baseline clean: `pnpm lint` 0 problems, `pnpm test` 80/80, `pnpm build` prerenders 2489 pages. `/data-cache/` added to `.gitignore`; agent worktrees live outside this checkout (`/Users/harry/code/kanji-kaisen/.claude/worktrees/sa-*`), so no ESLint/tsconfig change was needed.
- 2026-10-31 plan — Owner confirmed: no review queue (ink by steps + self-marking, wrong answers never lower a shade) and all five Phase 2 workstreams.
- 2026-10-31 1C — Merged `claude/sa-skin`. Tokens also include `text-onacc`, `bg-shade/…`, `text-c`/`bg-c`/`border-c`, `ok`/`bad`/`tip`; `--accent` is #3BE0A6 (夜) / #B5341E (墨). Contrast on `--bg`: `--ink-2` 9.22:1 (夜) / 7.47:1 (墨), `--ink-3` 5.64 / 4.68. JLPT colours are darker in 墨 to stay ≥ 4.5:1 on paper. The desktop header shows Learn/Browse/My list/Teach; Themes, Radicals, Study, Practice (classic) and Settings sit in the phone menu and footer. Settings gained an Appearance section. Classic practice forces `data-skin="night"` on its subtree instead of being swept (about 100 hard-coded colours remain there). `ThemeScroll`'s "M of T" counts kanji met (shade ≥ 1). Added a token-styled `app/not-found.tsx` because Next's default 404 overrides the skin. Checked in the browser: both skins on `/kanji/海`, 墨 ink-wash art on `/category/nature-elements` at 375 px with no horizontal scroll.
- 2026-10-31 1A — Merged `claude/sa-data`. Atlas: 2,384 kanji incl. all 2,136 jōyō (161 added, plus the official forms 𠮟 剝 塡 頰, which share word priority with 叱 剥 填 頬 and are found from the popular form via a new `a` search-index field). 97.7% have ≥ 3 example words (10 rare name kanji have none). zh relations for jōyō: same 1,282 · ja-trad 518 · ja-simp 100 · ja-only 50 · all-differ 162 · kokuji 8 · unknown 16 (ids are kebab-case, e.g. `ja-trad`; old forms come mainly from Unihan 18 `kJapaneseOldVariant`). 1,242 kanji have a sound part in 498 series of ≥ 2; 1,723 have look-alikes (stroke-shape comparison added for ≤ 6 strokes so 土/士 and 日/目 pair; some noise remains, e.g. 未 → 休). Search index 277 → 297 KB (87.6 KB gzipped); server-only atlas 1.4 → 3.9 MB.
- 2026-10-31 1A — JMdict comes from EDRDG `JMdict_e.gz` (jmdict-simplified flattens priority tags): priority words first, secondary-tag words fill to 6, untagged only to reach 3; vulgar/archaic senses excluded. Alignment marks 226 more words special (jukujikun such as 今年, 時計, 部屋). `wordsByReading` is stored as indexes into `examples` and rebuilt on load. Components with no role mark are `form` (休 = 亻 meaning + 木 form). Readings and grades now come from KANJIDIC2 in the atlas (11 reading sets and 51 grades differ, 2020 curriculum); `lib/kanji-db.json` only got the meaning order (1,630 entries) and keeps its 2,223 entries, so classic practice is unchanged. 173 kanji are `jlptEditorial` (161 added at N1 + the 12 from the 2026-10-24 plan); the kanjiapi.dev JLPT lists are committed (`lib/ja/jlpt.kanjiapi.json`) so `data:atlas` doesn't need `data-cache/`. Unassigned radicals 28 → 33 (彙 爪 牙 貌 韓). New scripts `data:sources`, `data:layers`; `data:atlas` runs with `--experimental-strip-types`.
- 2026-10-31 2C — Merged `claude/sa-themes`. Home: search hero ("Free, no account, no review queue"), fixed-height featured theme (no shift on swap), ten arched gates (swipe row on phones), then kanji of the day, JLPT levels, stroke bands and a short "How it works"; `FloatingKanji`, `RadicalDemo` and `ThemeCard` were removed as unused. Theme page: art hero, seals, selected-radical panel (first 24 cells, then a link) over a server-rendered "All kanji by radical" list, `ThemeScroll`, theme story last; `/categories` is a gate grid. Helpers in `components/Theme/order.ts` (16 tests). Decisions: a seal is "sealed" when the radical's 8 most common kanji are all ≥ 濃, "familiar" when half are; the CTA reads "Revisit X" once a theme is fully 印; the ring is captioned "painted" (not the board's "known"); the featured theme is the highest painted share; after hydration the panel jumps to the radical holding the next kanji unless one was picked; seals show only radicals with kanji (side forms appear in the list); `theme_gate_clicked` also fires from `/categories`. Theme art uses `next/image` on these pages. HTML: `/category/nature-elements` 1.04 MB → 813 KB (72 KB gzipped). Browser-checked: home at desktop width in 夜, theme page at 375 px in 墨, no horizontal scroll; the only console errors are the local 404 for Vercel's insights script.
- 2026-10-31 1B — Merged `claude/sa-story` (package.json scripts conflict resolved by keeping 1A's `data:*` scripts plus `data:ancient` and `data:etymology`). **Acceptance shortfall: 126 of 194 radical chars (65%) have an ancient form after filtering, not ≥ 85%.** The licence filter (`lib/story/acc-license.ts`, tested) drops every file whose `{{ACClicense}}` carries the Sears parameter (its permission line reads "Courtesy, permission and copyright from Richard Sears website"), including files that also have an Academia Sinica `fontcode`; that removed 1,837 of 3,030 distinct oracle/bronze/seal files. Kept: 1,629 files (905 PD, 724 CC0); 932 SVGs in `public/ancient/` (≈ 2.0 MiB). Coverage (oracle / bronze / seal / any): radical chars 94 / 80 / 22 / 126 of 194 (192 before filtering); top-600 kanji 130 / 121 / 125 / 247; rest of jōyō 91 / 96 / 277 / 381 of 1,477. **木 has no sourced form**, so `/radical/ki` shows today's stage only. Commons redirects are followed (43, e.g. 冫-oracle → 仌-oracle; 学's seal is the redirect to 斆-seal). Radical keys map to Unihan forms (nikuzuki→肉, ouhen→玉, ito→糸, akubi→欠, mushi→虫); 弁 skipped (three old forms). Owner decision: keep the strict rule (recommended by the brief) or accept Sinica-coded files that also name Sears.
- 2026-10-31 1B — Etymology: 983 char entries + 5 radical keys (188/194 radical chars, 594/600 top kanji, plus the radical stories' example kanji so 休 is covered): phono-semantic 543, pictogram 198, ideogrammic 178, ideogram 21, other 5, unknown 38. Every entry has a Wiktionary URL and revision ID; notice in `lib/core/etymology.wiktionary.NOTICE.txt`. `lib/story` API: `getAncientForms`, `getRadicalAncientForms`, `getEtymology`, `getRadicalEtymology`, `getAncientFormCredits`, `getTodayStrokes` (falls back to the unified form; 𦉰 and ⺮ have no KanjiVG file). `JourneyPlayer` renders ancient forms as CSS masks in `var(--c)`; checked with 0/1/3 stages on a temporary dev page (removed). Both fetch scripts rebuild with no diff with `--offline`.
- 2026-10-31 2D — Merged `claude/sa-teach`. `/teach` (indexable; set kept in the URL; reorder by buttons, Alt+arrows or drag; saved sets in `kanji-teach-sets`), `/teach/print` (always 墨; blocks never split; `words=0` hides the words section), `/teach/present` (Space/click = one stroke, ←/→ and PageUp/PageDown for clickers, Q quiz stays on across kanji, Reveal highlights the radical's strokes, F full screen, Esc exit), `/set` (`noindex, follow`), `/study?chars=` (after the existing deck params; optional `t`). QR: hand-rolled `lib/qr.ts` (byte mode, level M, v1–40), matches CoreImage output for v1/8/11/19; a 60-kanji link needs v19. Words for worksheets are 16 statically generated shards at `/data/teach-words/0…15` (9–12 KB each; one file was 173 KB). The agent checked print layout with headless Chrome (8 kanji: A4 4 pages with key, Letter 3; no clipped cells). Main session: worksheet word credit now names JMdict/EDRDG; `/teach` added to the sitemap; browser-checked the builder, the A4 worksheet preview and three projector strokes. The worksheet footer host comes from `SITE_URL`, so `NEXT_PUBLIC_SITE_URL` must be set in production.

## Final report

_(appended at 3.6)_
