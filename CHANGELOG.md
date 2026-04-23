# Changelog

All notable changes to this project will be documented in this file.

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
