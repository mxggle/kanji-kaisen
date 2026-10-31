# Kanji Kaisen

### A kanji atlas: logic, not magic

**Kanji Kaisen** is a free kanji atlas built on radicals. Every one of its 2,384 kanji (all 2,136 jōyō kanji, plus name kanji) has its own page. Each page shows how the kanji is read in real words, which part gives its meaning and which gives its sound, and how it was built where a source says so. Radicals show their sourced journey from oracle bone to today. Study is optional: each kanji darkens through five shades of ink as you learn it, and there are no hearts, streaks, lock-outs or review queues.

The site has two skins: 夜 Night, the dark default, and 墨 Ink, light paper that is also used for printing. Teachers can print worksheets, present on a projector and share sets without student accounts.

Every page follows one small system with five rules: **colour = theme**, **line = role** (solid for the part that carries meaning, dashed for the part that carries sound), **fill = your ink**, **italic = story** (only memory stories) and **glow = live** (only a stroke being drawn and the current learn step). A kanji is always a tile, a radical a round seal and a theme an arched gate.

## Features

- 📖 **A page per kanji, readings first.** One block per reading (on'yomi in compounds, kun'yomi on its own) with the words that use it, and irregular readings marked. The page also has:
  - the parts with their role (meaning or sound)
  - "How it was built": the parts assemble, then the sourced ancient forms
  - a sourced **Origin** kept apart from the labelled **Memory story**
  - Parts · Strokes · Ancient tabs: the parts drawn by role, numbered stroke order with "Try writing it", and the sourced ancient forms
  - links to kanji built on the same parts, the sound family, kanji with the same on'yomi, and look-alikes compared side by side
  - an "In Chinese" note (simplified, traditional and pinyin)
  - a share card
- 🪶 **Learn it in four steps.** 会 Meet, 想 Recall, 描 Trace and 書 Write open as a layer on any kanji page (`/kanji/海#learn`). Every step is optional, and writing is off by default.
- 🖋️ **Five shades of ink.** 白 Not met, 淡 Met, 中 Learning, 濃 Familiar, 印 Mastered. Shades rise as you work and you can set them yourself. Wrong answers never lower them, and there is no review queue. A tile's fill is its shade; a radical seal takes the mean of its common kanji; a theme, radical or deck shows one painted bar.
- 🧭 **Radical journeys.** 230 radical pages play the sourced oracle bone → bronze → seal → today stages. Each page shows the origin, the memory story and what the radical grows into.
- 🌋 **Ten themes.** Nature & Elements, Human Body & People, Tools & Weapons and more. Each theme has illustrated art and its radicals in a suggested order, which you are free to ignore.
- 🔎 **Search and browse.** Search by kanji, English meaning, kana or romaji (`water`, `みず`, `mizu`, `水`). Browse with filters for JLPT level, theme (several at once), your ink, strokes, radical or reading.
- ⭐ **My list and Study.** Your ink in five shades and by theme, saved kanji, a "worth a revisit" shelf that never counts anything as due, and decks (your list, a JLPT level, radical, theme or `?chars=` set) to study with flashcards, a meaning quiz or the four steps.
- 🍎 **Teach.** Build a set from a theme, radical, JLPT level, My list or pasted text. Then print A4 or Letter worksheets (stroke order, tracing cells and 米字格 practice cells), present it one stroke per key press, or share a link students open without an account.
- 🥋 **Classic practice.** The original step-by-step path is still at `/practice`.

## Routes

| Route | What it is |
|---|---|
| `/` | Learn home: search, where you left off, ten theme gates, reading a kanji by its parts, other ways in |
| `/kanji/[char]` | Kanji page (statically generated for every kanji); `#learn` opens the four-step layer |
| `/radicals`, `/radical/[key]` | Radical index and radical journey pages |
| `/categories`, `/category/[slug]` | Theme index and theme pages |
| `/browse` | Filterable kanji list (`?jlpt=N5&min=1&max=10&sort=strokes&theme=a,b&radical=…&ink=0,1&reading=…`) |
| `/search?q=` | Full search results |
| `/my-list`, `/study` | Saved kanji and study sessions (`/study?chars=海泳`) |
| `/teach` | Teacher set builder |
| `/teach/print?k=&t=`, `/teach/present?k=&t=`, `/set?k=&t=` | Worksheet, projector and shared set (the set lives in the URL) |
| `/practice`, `/practice/[slug]` | Classic practice path |
| `/about`, `/about/ancient-forms` | About, data sources and licences; per-file credits for ancient forms |
| `/settings` | Skin, classic-practice options and reset tools |
| `/system` | The design system's components in both skins (not indexed) |

`/learn` redirects to `/practice` and `/heatmap` to `/browse`.

## Design

The approved boards are in `docs/design/boards/` (`node scripts/design-preview/server.mjs 3301` serves them) and the exact token and component values are in `docs/design/one-atlas.css`. In the app, tokens live in `app/globals.css`, shared components in `components/ui/` and page templates in `components/Layout/`; `/system` renders them all. `node scripts/check-ink-contrast.mjs` checks every ink fill against the text it carries in both skins.

## Data sources and credits

Each source keeps its own file and licence. Share-alike data is never mixed into the language-neutral core.

- **[KanjiVG](https://kanjivg.tagaini.net)** by Ulrich Apel: stroke order SVGs (`public/kanjivg`), part roles and sound marks (`lib/core/components.kanjivg.json`). [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- **[Kanji alive](https://kanjialive.com)**: radical groups and hand-picked example words. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **[KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project)** and **[JMdict](https://www.edrdg.org/jmdict/j_jmdict.html)** by the EDRDG: meanings in dictionary order, readings, grades, frequency, and extra example words (`lib/ja/`). [EDRDG licence](https://www.edrdg.org/edrdg/licence.html), CC BY-SA 4.0.
- **[JmdictFurigana](https://github.com/Doublevil/JmdictFurigana)**: which reading each word uses. CC BY-SA 4.0.
- **[Unihan](https://www.unicode.org/charts/unihan.html)**: simplified and traditional forms, pinyin, old forms, jōyō and name-kanji flags (`lib/core/unihan.json`). [Unicode License v3](https://www.unicode.org/license.txt).
- **[Wiktionary](https://en.wiktionary.org)**: glyph origins, each with its page revision (`lib/core/etymology.wiktionary.json`). CC BY-SA 4.0.
- **[Wikimedia Commons, Ancient Chinese characters project](https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project)**: oracle bone, bronze and seal forms (`public/ancient`). Only public-domain files and CC0 tracings from Academia Sinica are used; Richard Sears–sourced files are excluded. Per-file credits are in `lib/core/ancient-forms.json` and at `/about/ancient-forms`.
- **[Academia Sinica 小學堂 字形演變](https://xiaoxue.iis.sinica.edu.tw/yanbian)**: oracle bone, bronze and seal glyphs for stages Commons can't fill (`public/ancient/*.png`). Glyph images and glyph data from its query interface are [CC0 1.0](https://xiaoxue.iis.sinica.edu.tw/License/License); they are cropped, made transparent and recoloured, never redrawn.
- JLPT levels are unofficial community lists (via [kanjiapi.dev](https://kanjiapi.dev)); jōyō kanji missing from them are shown as N1. Memory stories are original mnemonics written for this site, kept apart from sourced origins.

## Development

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm lint
pnpm test           # node --test over lib/** and components/** *.test.mjs
pnpm build && pnpm start
```

Data pipeline (outputs are committed; raw downloads go to the git-ignored `data-cache/`):

```bash
pnpm data:sources    # download KANJIDIC2, Unihan, JMdict and JmdictFurigana into data-cache/
pnpm data:layers     # data-cache/ + KanjiVG -> lib/core/*.json, lib/ja/*.json
pnpm data:ancient    # Commons ancient forms (licence-filtered) -> lib/core/ancient-forms.json, public/ancient/
pnpm data:xiaoxue    # fill missing radical stages from Academia Sinica 小學堂 -> same files (run after data:ancient)
pnpm data:etymology  # Wiktionary glyph origins -> lib/core/etymology.wiktionary.json
pnpm data:stories    # lib/stories/**/*.md -> lib/compiled-stories.json
pnpm data:atlas      # all layers -> lib/atlas/kanji-atlas.json, public/data/search-index.json
```

The full atlas dataset and the story layer are server-only (`lib/atlas/index.ts`, `lib/story/index.ts`). Client components get props or the slim search index.

### Environment

Copy `.env.local.example` to `.env.local`. `NEXT_PUBLIC_SITE_URL` sets canonical URLs, the sitemap, robots and the worksheet footer (it falls back to Vercel's production URL). `GEMINI_API_KEY` is only needed for the classic practice handwriting challenge. Supabase variables enable the (hidden) account sync for existing users.

## Tech stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Zustand, [kanji-recognizer](https://github.com/mxggle/kanji-recognizer), wanakana, KanjiVG; Google Gemini for the classic handwriting challenge only.

## License

The code is licensed under the MIT License — see [LICENSE](LICENSE). Data keeps its own licenses (above).

Copyright (c) 2026 Harry Sui
