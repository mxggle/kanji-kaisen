# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Ancient-form stages that Wikimedia Commons can't fill are now taken directly from Academia Sinica 小學堂 (CC0 1.0), starting with the radicals; 木 now has oracle bone, bronze and seal forms. `pnpm data:xiaoxue` fetches them, and `/about/ancient-forms` credits each glyph with its Sinica code and a link to its 小學堂 page.

## [2.1.0] - 2026-10-31

Story-first redesign on top of the unreleased 2.0.0 atlas. See `docs/superpowers/plans/2026-10-31-story-atlas-redesign.md`.

### Added
- Kanji pages are reading-first. They group words by reading and show each part's role (meaning or sound). They add a "How it was built" animation with sourced ancient forms, a Wiktionary origin kept apart from the labelled memory story, a glowing stroke-order animation, links to kanji built on the same parts, the sound family, same on'yomi and a look-alike compare, an "In Chinese" note and a share card.
- Four-step study layer (会 Meet, 想 Recall, 描 Trace, 書 Write) at `/kanji/[char]#learn`, with five shades of ink per kanji. Ink is set by the steps or by hand, wrong answers never lower it, and there is no review queue.
- Radical journey pages that play the oracle bone, bronze, seal and today stages, using only public-domain or CC0 Commons files.
- Learn home with search first, a featured theme with an ink ring, and ten theme gates. Theme pages show radical seals in a suggested order and a theme scroll that regains colour.
- 夜 Night and 墨 Ink skins with a persisted toggle; new fonts (Shippori Mincho B1, Cormorant Garamond, Zen Kaku Gothic New).
- Teacher kit: `/teach` set builder, A4/Letter worksheets with 米字格 cells, projector mode, `/set` share links with a QR code, and `/study?chars=`.
- The 161 missing jōyō kanji (2,384 kanji in all). JMdict example words for kanji without Kanji alive words. Phonetic series, same-on'yomi groups, look-alikes and Unihan simplified/traditional/pinyin data.
- Analytics events for journeys, builds, learn steps, ink changes, share cards, worksheets, the projector, share links, the In Chinese note, skin changes and theme gates.
- `/about/ancient-forms` with per-file credits; `/about` lists every data source and licence.

### Changed
- The data is split into a language-neutral core (`lib/core/`) and a Japanese layer (`lib/ja/`), and each share-alike source keeps its own file.
- Meanings follow KANJIDIC2 order, so 土 is "soil", not "Turkey", and 西 is "west", not "Spain".
- The header nav is Learn / Browse / My list / Teach, with the skin toggle.

### Removed
- The floating-kanji and radical-demo home widgets, the old same-radical grid on kanji pages, and the unused `StrokeOrderPanel`, `ReadingList`, `ExampleList` and `ThemeCard` components.

---

## [2.0.0] - 2026-10-24

### Added
- Kanji atlas: a statically generated page for every kanji (2,223) with readings and romaji, a numbered KanjiVG stroke diagram, animated stroke order, a "Try writing" canvas, Kanji alive example words, radical story summary, same-radical kanji and prev/next links.
- Radical pages (`/radicals`, `/radical/[key]`) and theme pages (`/categories`, `/category/[slug]`), server-rendered.
- Browse page with URL-synced filters (JLPT, strokes, theme, radical, sort) and kanji search by meaning, kana, romaji or character, with instant results in the header and on the home page.
- My list (save kanji, still learning / known) and a Study page with flashcards and a meaning quiz over your list, a JLPT level, a radical or a theme.
- About page with data credits and licenses; sitemap, robots, canonical URLs and Open Graph metadata.
- Unified atlas dataset (`pnpm data:atlas`) and `lib/atlas` data API.

### Changed
- The home page is now search-first, and its copy only makes claims the site delivers.
- The practice path moved to `/practice` (`/learn` redirects there) and is linked as "Practice (classic)".
- Header navigation replaces the hearts/streak/account cluster; Settings now only holds classic-practice options and reset tools (the account panel is hidden; existing signed-in users keep syncing).
- Classic practice no longer costs hearts: wrong answers and failed or errored AI checks are free, and there is no "Out of Hearts" lock.
- 15 radical stories corrected (e.g. 言 and 戈 stories, stroke counts, positions, component glosses).

### Fixed
- 12 checkpoints could never be finished because 分, 誰, 的 and nine other kanji were missing from the kanji data; they were added, and the learning modal now offers Skip/Close instead of freezing the page when data is missing.
- The Textiles, Plants & Food theme story was never compiled.

### Removed
- `/heatmap` (now `/browse`), the unused `app/page-new.tsx` and the duplicate `public/kanjivg_backup`.

---

## [1.1.0] - 2026-04-24

### Added
- Supabase email magic-link login with account and sync controls in Settings.
- Automatic local-to-cloud migration for existing browser progress and settings.
- Debounced progress/settings sync after login, backed by a Supabase `user_app_state` table with RLS policies.
- Account status entry point in the header.

### Fixed
- Wrong quiz answers now deduct hearts on the first incorrect selection.
- Radical cards no longer render nested buttons, resolving hydration warnings.
- Header account icon now links to the account sync panel.

### Changed
- Added a project test script covering learning state helpers and Supabase sync merge behavior.
- Footer version display updated to 1.1.0.

---

## [1.0.0] - 2026-01-16

### Added
- **Core Experience**:
    - Optimized learning phase UI to maximize vertical space, ensuring primary action buttons are accessible without scrolling.
    - Redesigned the Landing Page with a premium, high-fidelity dark-mode aesthetic.
- **Learning System**:
    - Three-phase learning flow for every Kanji: **Introduction**, **Practice**, and **Challenge**.
    - Dynamic navigation between learning phases.
- **Content**:
    - **214 Radical Stories**: Comprehensive mnemonic database for every radical, including origin, meaning transformations, and example kanji.
    - Integrated detailed radical data into the learning path.
- **UI/UX**:
    - Performance-optimized animations: Floating Kanji background auto-disables on mobile devices.
    - Refined Kanji Header: Multi-meaning support with labels and readings popover.
    - Drawing Guide: Visual instructions integrated directly into the canvas for better spacing.
- **Technical**:
    - Integration with Vercel Web Analytics.

### Fixed
- Fixed layout issues on mobile screens where buttons were obscured.
- Resolved "undefined" example kanji in radical story metadata.
- Improved text selection behavior in the canvas-heavy interfaces.
- Corrected various z-index stacking issues in popovers and navigation.

---

## [0.1.0] - 2026-01-09
- Initial project setup with Next.js, React 19, and Tailwind CSS.
- Basic kanji display and category structure.
- Initial game loop implementation.
