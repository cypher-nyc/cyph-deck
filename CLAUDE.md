# CYPH (formerly SMACK) — Pitch Deck

## What this is

The investor pitch deck for Cyph (smack.live) — the underground arena for ideas. Built as a single-page HTML/CSS/JS presentation.

## Platform overview

Three pillars, one platform:

- **Underground** — where users become dangerous. A living world of buried artifacts, suppressed ideas, and unexplored intellectual territory. Human-produced content only, never AI. Includes portraits (intellectual maps), taste engine, auto-generated syllabi, and a real-time citation engine.
- **The Cyph** — live intellectual war cars. Two kinds: LIVE (real-time cultural topics) and CONCEPTUAL (deep research). Matched by productive tension. Car types: open mics, office hours, supper clubs, debates.
- **Touch Grass** — monthly residencies with venue partners, weekly drops. The cyph closes daily so users bring the underground into real life. Partnered with Unschooled (IRL intellectual salon).

The cycle: underground deepens / the cyph sharpens / touch grass grounds.

See `PLATFORM_ARCHITECTURE.md` for full technical architecture.

## Color scheme

Five brand colors used throughout:

- **Cornflower Blue** — `#608FE6` (architecture route, blue accents)
- **Spicy Paprika** — `#EC4E20` (sports route, orange accents, primary CTA)
- **Deep Space Blue** — `#13293D` (deep accents, e.g. testimonial card backgrounds)
- **Dark Amaranth** — `#6D1A36` (theology route, maroon accents)
- **Amber Flame** — `#FBAF00` (philosophy route, yellow accents)

**The deck runs a dark register.** Background layers (`.bg-layer.shell` / `.nextsteps`) are black `#000` for most chapters; `underground`/`arena`/`irl` use textured image backgrounds. Despite the legacy names, the text vars resolve light:

- `--charcoal` = `#ede8de` (cream) — primary text on the dark background
- `--charcoal-muted` = `#a8a8a8` — secondary text
- `--cream` = `#ede8de`, `--cream-light` = `#f5f0e6`, `--cream-dark` = `#e5dfd4` (body background)

## Slide structure

Slides are `div.slide` with IDs `s0`–`s15` (16 total; plus a hidden `s8-hidden` variant). IDs **must stay contiguous** — navigation indexes them via `getElementById("s" + i)`. Navigation is in `deck.js` with chapter mapping. Slide counter shows `XX/16`.

- **`s14` — the raise** (`business` chapter): headline terms ($1M raising · $9M pre-money cap · 14 mo runway), a CSS `conic-gradient` use-of-funds pie + legend, and a milestone `timeline` column. Styles under `/* s14: the raise */` in `styles.css`.
- **`s15` — the demo montage / close** (`close` chapter): a 3×3 grid (`.demo-grid`) of looping, muted, autoplay product videos under a single consistent dark gloss (`.demo-scrim`), with the "ready for a demo?" headline + emails overlaid (`.demo-overlay`). Videos use `object-fit: contain` (full frame, letterboxed). On phones/touch (`@media (max-width: 820px), (hover: none) and (pointer: coarse)`) the grid + scrim are hidden — text-on-black only (multi-video autoplay is unreliable/heavy on mobile, esp. iOS Low Power Mode).

**Adding/removing a slide** must be done in lockstep across: the `id` numbering in `index.html`; the initial `XX/NN` counter hardcoded in **both** HUD counters (`#hudCtr`, `#bhudCtr`); and in `deck.js` — `T` (total), the `ch` chapter map, the `bars` HUD-bar array, the progress denominator (`i / (T-1)`), the `runA` per-index animation `case`s, and the lock-mode reveal selectors.

## Design conventions

- **Left-header-positioning**: h2 headers use `position:absolute;top:24px;left:24px` aligned with "cyph." in the nav bar. Applied via CSS selector list on specific slide IDs.
- **No grey boxes**: content sits directly on the dark background (newspaper-inspired layout). Vertical column dividers for multi-column layouts.
- **Colored pills**: collaborator/category tags use the 4 route colors as backgrounds with white text, `border-radius:20px`.
- **Crisis-style cards**: dark translucent cards (`rgba(0,0,0,0.7)`) with colored left borders for emphasis.
- **Floating images**: use `drift1`–`drift6` keyframe animations (8–12s, ease-in-out infinite) for organic movement.
- **Typography**: Helvetica Neue throughout. Bold 700 for headers, 400 for body. `var(--charcoal)` (#ede8de, light) for primary text, `var(--charcoal-muted)` (#a8a8a8) for secondary.

## PDF export

`npm run pdf` (→ `tools/export-pdf.mjs`) regenerates `cyph-deck.pdf` from the
live deck. It serves the directory on `127.0.0.1` (so auth.js takes its
localhost bypass), drives Chrome with `navNext.click()` exactly the way a
viewer advances, waits for every animation on each state to land, and packs
the frames into a 22-page 1440×900pt PDF.

- **Sub-steps get their own page.** The walk is state-driven, not slide-driven:
  s5's layer stack (01/02/03/∞), s8's two cyph flyers, and s15's two founder
  bios each export separately, so 16 slides → 22 pages. The loop stops when
  advancing no longer changes state, so adding a slide needs no change here.
- **System Chrome, not bundled Chromium** (`channel: "chrome"`). The cover and
  close slides play H.264 video; Playwright's Chromium ships without
  proprietary codecs and those pages would export black.
- **Settle gate** = `anime.running` drained + `document.getAnimations()`
  finished + deck.js's `busy` latch clear, held stable for 3 frames. The 26
  infinite drift/float keyframes are skipped — they never finish by design, so
  drifting elements land wherever their phase puts them and pages will differ
  slightly run to run.
- **s8 is hovered on purpose.** The flyer's cyph title + headcount pill live in
  a `:hover` reveal (`.cyph-flyer-drift:hover .cyph-flyer-hover`); without the
  pointer parked on it the page exports captionless.
- Requests to `script.google.com` are aborted so an export doesn't land in the
  auth.js access log.

## Key files

- `index.html` — all slide content
- `styles.css` — all styles
- `deck.js` — navigation, animations, chapter mapping
- `tools/export-pdf.mjs` — the PDF export (see above)
- `assets/brands/` — resource partner logos
- `assets/moments/` — arena flyer images (l1-l8 for live, c1-c10 for conceptual)
- `assets/people/` — headshots (jalen, bryan, bakari, caitlin, sade)
- `assets/reference/crisis/` — crisis slide floating images
- `assets/images/` — counter-culture images (agora, salon, harlem_renaissance)
- `assets/videos/` — `s15` demo-montage clips, web `.mp4` only (H.264, **no audio**). Source `.mov` masters are **not** kept in-repo: transcode with `ffmpeg -i in.mov -an -vf "scale=960:-2" -c:v libx264 -pix_fmt yuv420p -crf 28 -preset fast -movflags +faststart out.mp4`, wire the `.mp4` into the grid, then delete the master. (VHS/grain-heavy clips compress poorly — bump `-crf` if a file is disproportionately large.)
