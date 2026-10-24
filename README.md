# Kanji Kaisen

### A kanji atlas: logic, not magic

**Kanji Kaisen** is a free, browse-first kanji reference. Every one of its 2,200+ kanji has its own page with stroke order, readings, example words and the radical it is built from, and every radical has a short story that links its shape to its meaning. An optional study layer lets you save kanji and review them with flashcards or a quiz — no hearts, streaks or lock-outs.

## Features

- 📖 **A page per kanji** — meanings, on/kun readings with romaji, JLPT level, school grade, stroke count and newspaper frequency; a numbered stroke diagram, an animated stroke order with replay, a "Try writing" canvas, example words (irregular readings marked), its radical and story, same-radical kanji and prev/next links.
- 🧩 **Radicals** — 230 radical pages, grouped by theme, each with origin, story, typical position, how it changes meaning, explained example kanji and every kanji in the atlas that uses it.
- 🌋 **Ten themes** — Nature & Elements, Human Body & People, Tools & Weapons and more, each with its story, radicals and kanji.
- 🔎 **Search** — by kanji, English meaning, kana or romaji (`water`, `みず`, `mizu`, `水`), with instant results in the header.
- 🗂️ **Browse** — filter by JLPT level, stroke range, theme or radical and sort by frequency, strokes or level; filters live in the URL.
- ⭐ **My list & Study** — save kanji, mark them still learning or known, and study a deck (your list, a JLPT level, a radical or a theme) with flashcards or a meaning quiz. Stored in your browser.
- 🥋 **Classic practice** — the original step-by-step path (memorize → quiz → trace → AI handwriting challenge) is still available at `/practice`.

## Routes

| Route | What it is |
|---|---|
| `/` | Search-first home: kanji of the day, JLPT levels, themes, featured radicals, stroke counts |
| `/kanji/[char]` | Kanji page (statically generated for every kanji) |
| `/radicals`, `/radical/[key]` | Radical index and radical pages |
| `/categories`, `/category/[slug]` | Theme index and theme pages |
| `/browse` | Filterable kanji list (`?jlpt=N5&min=1&max=10&sort=strokes&theme=…&radical=…`) |
| `/search?q=` | Full search results |
| `/my-list`, `/study` | Saved kanji and study sessions |
| `/practice`, `/practice/[slug]` | Classic practice path |
| `/about` | About, data sources and licenses |
| `/settings` | Classic-practice options and reset tools |

`/learn` redirects to `/practice` and `/heatmap` to `/browse`.

## Data sources and credits

- **[KanjiVG](https://kanjivg.tagaini.net)** by Ulrich Apel — stroke order SVGs (`public/kanjivg`), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- **[Kanji alive](https://kanjialive.com)** — radical groups and example words, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **[KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project)** by the EDRDG, via [kanjiapi.dev](https://kanjiapi.dev) — meanings, readings, grades, frequency; used under the [EDRDG licence](https://www.edrdg.org/edrdg/licence.html) (CC BY-SA).
- JLPT levels are unofficial community lists. Radical stories are original mnemonics written for this site.

## Development

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm lint
pnpm test           # node --test over lib/** and components/** *.test.mjs
pnpm build && pnpm start
```

Data pipeline (outputs are committed):

```bash
pnpm data:stories   # lib/stories/**/*.md -> lib/compiled-stories.json
pnpm data:atlas     # kanji-db + Kanji alive + stories + KanjiVG -> lib/atlas/kanji-atlas.json, public/data/search-index.json
```

The full atlas dataset is server-only (`lib/atlas/index.ts`); client components get props or the slim search index.

### Environment

Copy `.env.local.example` to `.env.local`. `NEXT_PUBLIC_SITE_URL` sets canonical URLs, the sitemap and robots (it falls back to Vercel's production URL). `GEMINI_API_KEY` is only needed for the classic practice handwriting challenge. Supabase variables enable the (hidden) account sync for existing users.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Zustand, [kanji-recognizer](https://github.com/mxggle/kanji-recognizer), wanakana, KanjiVG; Google Gemini for the classic handwriting challenge only.

## License

The code is licensed under the MIT License — see [LICENSE](LICENSE). Data keeps its own licenses (above).

Copyright (c) 2026 Harry Sui
