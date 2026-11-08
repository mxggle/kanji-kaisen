# Motion (One Atlas, round 7)

Kanji Kaisen moves like ink. Things **soak in**, **unroll**, get **stamped** or get **painted by a brush**. Nothing bounces, spins or slides in from off-screen. Motion explains where something came from and what is live. It is never decoration for its own sake.

Motion obeys the five One Atlas rules (`docs/design/one-atlas.css`):

1. **Colour = theme.** Motion never adds a colour. It moves what is already there.
2. **Line = role.** Brush and draw effects follow existing lines. They never add new rules or borders.
3. **Fill = your ink.** A fill may *grow* (a painted bar sweeping in, a seal pressed). It never changes shade for show.
4. **Italic = story.** Story text may soak in (the `ink` kind). That is the only kind for it.
5. **Glow = live.** Only a stroke being drawn or the current learn step glows (the `live` utility). An entrance never glows.

## Timing

| Token (CSS / `components/Motion/tokens.ts`) | Value | Use |
| --- | --- | --- |
| `--ease-out` / `EASE.out` | `cubic-bezier(.2,.8,.2,1)` | The house curve. Default for entrances and UI. |
| `--ease-ink` / `EASE.ink` | `cubic-bezier(.16,1,.3,1)` | Soaking in, page enter, art. |
| `--ease-in` / `EASE.in` | `cubic-bezier(.5,0,.75,0)` | Leaving (exits are short). |
| `--ease-in-out` / `EASE.inOut` | `cubic-bezier(.65,0,.35,1)` | Lifts, wipes, brush sweeps. |
| `--ease-stamp` / `EASE.stamp` | `cubic-bezier(.34,1.4,.64,1)` | A seal pressed: one small overshoot. |
| `--dur-micro` | 140ms | Press feedback, toggles. |
| `--dur-ui` | 240ms | Menus, popovers, tab indicators, dialog exit. |
| `--dur-enter` | 560ms | Entrances. |
| `--dur-art` | 900ms | Art and big panels (unroll). |
| `--dur-stroke` | 420ms | One kanji stroke. |
| `--stagger` | 55ms | Between items in a sequence (capped at 14 steps). |

Exits are about half as long as entrances. Nothing the learner waits on takes longer than 300ms to respond. Long sequences (stroke order, the site intro) can always be skipped or replayed.

## The four hooks (server-safe data attributes)

All in `app/motion.css`. They work in server components. They need no JS for `data-enter`, and they need MotionRoot for `data-reveal`.

| Attribute | When it plays |
| --- | --- |
| `data-enter="kind"` | When the element mounts: on first paint, and again on every client navigation that mounts it. Pure CSS. |
| `data-enter-group="kind"` | Same, for each **direct child**, staggered in DOM order. |
| `data-reveal="kind"` | When it scrolls into view (once). |
| `data-reveal-group="kind"` | Same, for each **direct child**. What arrives together is staggered top-left first. |

**Kinds:** `rise` (default: fade up 18px), `ink` (from a blur, i.e. soaking in; small things only), `unroll` (clip from the top down, like a hanging scroll), `stamp` (seal pressed: scale down from 1.2 with a slight turn), `fade`, `brush` (clip from left to right, i.e. painted), `drift` (fade in from the left 20px, for rails and side panels).

**Tuning** (inline style on the element; use `enterOrder()` from `components/Motion/tokens.ts`):
- `--i`: its place in a sequence (0, 1, 2…), times `--stagger`.
- `--delay`: an extra delay, e.g. `"120ms"`.
- `--rise`, `--drift`, `--blur`: the distance or blur amount.

```tsx
<KindLabel data-enter="fade" … />
<h1 className="type-title" data-enter="ink" style={enterOrder(1)}>…</h1>
<p data-enter style={enterOrder(2)}>…</p>
<ul data-reveal-group="rise">{tiles}</ul>
<div data-reveal="unroll">{art}</div>
```

**The tuning variables inherit, on purpose.** Set `--delay` or `--rise` on a group or a wrapper and every hook inside follows. A child's own animation can also sync with its hook: the kana inside a reading card uses its card's `--i`/`--ri`/`--delay` (`components/Kanji/kanji.module.css`). The other side of this: a hook nested inside another hook inherits the outer one's order and delay. Give the inner hook its own values (`enterOrder(0)`, or `--delay: 0ms`), or reset them on the wrapper between the two, as the kanji page's tab panels do (`[--delay:0ms]`). They are deliberately not registered with `@property … inherits: false`, because that would break the wrapper and sync uses above.

### Which one

- **Above the fold on first paint, use `data-enter`.** It is CSS-only, so it plays before hydration and does not delay LCP for long. Page heroes, titles, the first row of things.
- **Below the fold, use `data-reveal`.** MotionRoot only starts after hydration. Whatever is already on screen then is marked `data-shown="instant"` and never hidden, so a `data-reveal` that happens to be on screen at load simply doesn't animate. That is fine and intended.
- **One level per element.** Don't put a `data-reveal` section around a `data-reveal-group` of its children, or the children would fade twice. Animate the section's heading and the group, not the wrapper.
- **Big lists** (Browse, 2,000+ tiles): `data-reveal-group` on the grid is fine. Each tile is watched on its own, and rows stagger as they scroll in.
- **Lists that change on the client** (filters, search): children added later animate when they mount (enter group) or come into view (reveal group). That is the intended feedback for a new result set. Don't animate on every keystroke. If a list re-renders per keystroke, keep its items stable (keys) so only new ones animate.

### Gotchas

- All hook animations use fill-mode `backwards`. Once finished, the element returns to its own styles, so hover lifts and transitions keep working. Don't fight this with `forwards`.
- While an animation runs, `transform`/`filter` make the element the containing block for `position: fixed` children. Never put a hook on an ancestor of a modal, a fixed bar or a popover.
- `unroll` and `brush` use `clip-path`. Focus rings and hover shadows are clipped while it runs (≤ 0.9s). That is acceptable.
- `ink` (blur) is expensive on big areas. Use it on headings, glyphs and short story text only.
- Don't put a hook on an element whose own `opacity` or `animation` changes with state (skeletons with `animate-pulse`, disabled states).
- Reduced motion and print turn every hook off (no hidden states, no delays). JS motion must check `prefersReducedMotion()` (or framer-motion's `useReducedMotion`).

## Strokes: `.kk-draw`

For an SVG `<path pathLength="1">`, add `className="kk-draw"` and `style={{ "--i": n }}`. Each path draws in after `n × --stroke-gap` (90ms default). The `live` glow goes on the `<svg>` only while it is drawing.

## Page transitions (done globally)

`components/Motion/PageTransition.tsx` wraps every page in a React `<ViewTransition>` keyed by pathname. The old page fades up and out in 200ms, and the new page rises in over 520ms. Query-only changes don't animate. There is nothing to do per page. Pages should still choreograph their own hero with `data-enter`, which plays inside the new page as it arrives.

## Shared elements: `<Morph>` (`components/Motion/Morph.tsx`)

The same `name` on two pages makes that element **fly** from one to the other on navigation:

- `morphName.kanji(char)`: the glyph. `KanjiTile morph` on list tiles, and the kanji page hero glyph (already wired in `KanjiHero`).
- `morphName.radical(key)`: the seal. `RadicalSeal morph={key}` on lists, and the radical page's big seal.
- `morphName.theme(slug)`: the art. `ThemeGate morph` on gates, and the theme page's art.

**A name may be on at most one mounted element per page.** A duplicate makes the browser skip the whole transition. Opt in only on lists where each item appears once. If the same kanji can show twice on a page (featured and grid), morph only one of them.

**The landing element doesn't enter.** The flight is its entrance. `components/Atlas/MorphLanding.tsx` (mounted on pages with landing ends: home, /categories, theme, radical) stands down any hook on a landing element and its ancestors while a view transition runs. Otherwise the element would jump, or vanish and stamp in again. Never put a hook on a `<Morph>` child or its ancestors in the first place. Back/forward navigation runs no view transition, so nothing flies there and the page simply enters.

### Lists that hold morph tiles: the morph-safe cascade

Hook animations replay whenever an element is styled, so a grid of `KanjiTile morph` tiles that uses `data-enter-group` would start its cascade while a glyph is still flying into one of its tiles. Lists like that use `data-cascade` from `components/Browse/tool-motion.css`. It is a CSS *transition* from `@starting-style`, so each child rises in only when it is first rendered, staggered by an inline `--ci`, and transitions are off under `html:active-view-transition`. The tiles then sit still while the glyph lands, and new children (a new filter result, "Show more") cascade in on their own. Tune it with `--cascade-delay`, `--cascade-step` (14ms) and `--cascade-cap` (24). Browse and Search use it. `<Settle>` (same folder) re-keys a changing value (a count, "Card 3 of 20") so it re-inks softly instead of ticking.

## JS motion (client components)

Prefer CSS. Use the platform first: `transition`, `@starting-style` and `transition-behavior: allow-discrete` for open/close of dialogs and popovers, and the Web Animations API for one-offs.

framer-motion (already a dependency) is for what CSS can't do well: layout animations (`layoutId` sliding indicators, list reordering) and `AnimatePresence` exits. Use the lean import, `LazyMotion` + `m` with `domAnimation`, never a bare `motion.div` in shared components. Take eases, durations and the spring from `components/Motion/tokens.ts`.

### Patterns

- **Dialog / sheet open:** the backdrop fades (`--dur-ui`). The panel rises 12px and fades in over `--dur-enter` with `--ease-ink`. A phone sheet slides up from the bottom edge. Close is half the time, with `--ease-in`.
- **Menu / popover:** scale from 0.96 at its anchor corner, plus fade, over `--dur-ui`.
- **Tabs / segmented:** an ink pill slides to the new tab (240ms) as a CSS `clip-path` on a second copy of the tab row (`components/ui/Tabs.module.css`). It needs no framer-motion: `layoutId` would need `domMax`. Panels cross-fade with `tabPanelMotion` (200ms). The 夜/墨 toggle's pill slides the same way.
- **Skin switch:** the new skin spreads as a circle of ink from the pressed button (a root View Transition scoped by `html[data-skin-shift]`, `components/Skin/spreadSkin.ts`). Colour transitions are paused while it runs. It is instant with reduced motion or without View Transitions.
- **Press:** `active:scale-[.97]` over `--dur-micro` on buttons and chips. Not on links in text.
- **Success / saved:** `stamp` on the mark that changed (the saved seal, a shade dot). Never confetti.
- **Counters and bars:** a painted bar sweeps from 0 (`brush`). Numbers don't tick.

## Site intro

Plays once per browser session when the visit starts on `/` (`components/Motion/SiteIntro.tsx`, `MOTION_SCRIPT`). The logo frame draws, 解 is written stroke by stroke with the live glow, and the wordmark rises. Then the paper lifts and the mark flies into the header logo. It takes about 1.9s, and any key, click or scroll skips it. While it plays, `--intro-wait` (inline on `<html>`) is `1.5s`, and every `data-enter` delay adds it, so the home hero's choreography starts as the paper lifts.

`--intro-wait` must not change while entrances are waiting on it: a shorter delay finishes them at once, under the paper. So it stays set through "leave" and "done", and is removed 2s after the end. A skip sets it to the time already elapsed, so the entrance plays from the moment of the skip.
