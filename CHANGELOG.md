# Changelog

All notable changes to this project will be documented in this file.

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
