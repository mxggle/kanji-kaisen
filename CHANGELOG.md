# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- The ten theme colours are now one family of mineral pigments (青磁 celadon, 縹 blue, 茜 red, 砥粉 clay, 山吹 gold, 鉛 grey, 菫 violet, 鶸 green, 撫子 pink, 藤 wisteria) in place of stock bright UI colours, so they sit with the warm ink and paper of the rest of the site. They share one lightness and a lower chroma, the hues are spread so Body, Tools, Time and Thought no longer crowd together, and Home is a clay tan, not a near-white. The success, error and hint colours follow the same family. Every theme × shade × text pair still passes 4.5:1.
- Scrollbars are a thin line on no track. The Browse and Teach rails show theirs only while the pointer is over them, so the rail no longer grows a grey bar that reads as a divider.
- The Sort menu on Browse and the card range on Study are pill fields with an ink chevron, not the browser's own control (new `components/ui/Select.tsx`).
- A disabled primary button is an empty outline, not a half-faded grey fill. Teach's print buttons now use the shared button style.
- On phones the kanji page's Readings tab carries its 読 mark, like 筆 Strokes and 古 Ancient. Teach's "Three tools, one set" cards use the same kanji-in-a-ring mark as My list's study modes (刷 · 映 · 送), not stock line icons.
- Study: checkboxes are drawn in line and ink (an empty box, ink-filled with a tick when on) instead of the browser's grey native box, and the meaning quiz's four answers are the same pill as the learn layer's Recall options.

## [2.2.0] - 2026-11-01

"One Atlas": the story atlas redrawn as one product. See `docs/superpowers/plans/2026-10-31-one-atlas.md` and the boards in `docs/design/boards/`.

### Added
- One design system, with five rules: colour = theme, line = role, fill = your ink, italic = story, glow = live. Its tokens live in `app/globals.css`, its shared components in `components/ui/` and its layouts in `components/Layout/`. `/system` (not indexed) shows every piece in both skins.
- One form each for a kanji (tile), a radical (round seal) and a theme (arched gate). A seal's fill is the mean ink of its eight most common kanji. A group (theme, radical, deck) shows one painted bar.
- Two page templates. Theme, radical and kanji pages use the Plate (a specimen beside the reading column, with an atlas path above it: Learn › theme › radical › kanji). Browse, My list and Teach use the Tool (a title row, a filter or source rail, then the result).
- Phone tab bar (学 Learn · 探 Browse · 墨 My list · 教 Teach). On atlas pages the atlas path moves into the phone header, and kanji, theme and radical pages get a sticky action bar.
- Home: a "Where you left off" card (the next learn step for your last kanji), ten theme gates, "Read a kanji by its parts" and "Other ways in".
- Browse: several themes at once, a "Your ink" filter (`ink=`), a reading filter (`reading=`), counts that follow the other filters, and a folded filter panel on phones.
- My list: your ink in five shades, ten theme bars, "Worth a revisit" (the oldest 淡/中 kanji, never counted as due) and study decks, including a revisit deck.
- The learn layer opens at your first unfinished step. Its tabs are 会 Meet · 想 Recall · 描 Trace · 書 Write, with the current step lit.
- `/about` explains the five rules in learner terms.
- Ancient-form stages that Wikimedia Commons can't fill are now taken directly from Academia Sinica 小學堂 (CC0 1.0), starting with the radicals; 木 now has oracle bone, bronze and seal forms. `pnpm data:xiaoxue` fetches them, and `/about/ancient-forms` credits each glyph with its Sinica code and a link to its 小學堂 page.

### Changed
- The nav labels and URLs stay the same, but kanji pages now belong to Learn, not Browse. The footer is one row; the personal site and email moved to `/about`.
- Kanji page: a specimen with Parts · Strokes · Ancient tabs (stroke order now appears only once), then reading blocks. Origin and memory story sit side by side, and connections are all shown as tiles.
- Theme page: a radical seal grid drives a preview card, JLPT chips open Browse filtered to the theme, and the other nine themes are shown as gates.
- Radical page: the journey player has stage tabs, a sourced origin, "Where it sits in a kanji" and "What it grows into" (sourced examples only).
- Teach: the set builder sits on the Tool template, with Worksheet · Projector · Share link tabs. The worksheet still prints in 墨, with vermilion stroke highlights.
- The 濃 fill in 夜 mixes 45% theme colour (was 60%), and small readings on 淡/中 use ink-2. Every theme × shade × text combination is now at least 4.5:1 (`node scripts/check-ink-contrast.mjs`).
- The share card colours each part by its role, using the kanji's own theme colour: meaning and sound in the accent (sound dashed), form in grey, with no glow.

### Removed
- The mint accent and every JLPT colour (JLPT is a plain tag). Classic practice keeps its own colours.
- The ink ring, theme scroll, ink dots and "you know N" counts; the featured-theme deck and the kanji of the day on home; the long "All kanji by radical" list on theme pages; the static numbered stroke diagram; and every glow apart from the live stroke and the current learn step.
- The hamburger menu, the 12-link footer and the feedback card (now a "Send feedback" link).

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
