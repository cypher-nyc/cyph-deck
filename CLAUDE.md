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

- **`s10` — how we make money** (`business` chapter): the only revenue slide. Five `.money-row`s in a `.money-table` (inventory · reach · cyphcard+ · commissions · institutional seats), each a 3-column grid (label · body · `.money-graphic`) with a 7px accent rule set per row via the `--money-accent` custom property — one distinct hue per row. Graphics use the floating-artifact language (drift keyframes inline) and are capped to the same 62px band so no row outgrows the others (`.money-reach-img` is the one exception at 90px — it is a wide screenshot and unreadable at 62); the cyphcard+ and commissions rows carry live `iso3d.js` canvases (`moneyCardCanvas`, `moneyPaperCanvas`). Closes on a shared `.deck-takeaway` line (also used by `s11`). Styles under `/* s10: how we make money */` in `styles.css`.
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

## Viewing paths (desktop deck vs. phone page view)

The deck ships **two** ways of reading it, chosen by a router in `index.html`'s
`<head>` before any stylesheet or script loads.

- **Desktop** gets the interactive deck: `styles.css` + `deck.js` + `iso3d.js`.
- **Phones** get the exported pages: `mobile.css` + `mobile.js`. `deck.js`,
  `iso3d.js` and three.js are **never fetched** — the WebGL/animation stack is
  skipped, not hidden.

**Why.** `#game-shell` is a fixed 1440x900 stage that `computeFitScale()`
(`deck.js`) scales with `min(vw/1440, vh/900)`. On a 393pt phone that is
**0.27**: nav buttons render ~4px (the iOS touch minimum is 44px), body copy
~4.6px, and none of the eleven `:hover` reveals can fire on touch. There is
also no swipe handler — navigation is keyboard plus two buttons. Reflowing
sixteen absolutely-positioned, px-tuned slides to 393px would be a redesign of
every slide *and* would need redoing on every slide edit, so the phone reads
the exported pages instead. They come out of the same export run as the PDF,
so the two can never drift from the deck.

**The phone test** is `(hover: none) and (pointer: coarse)` **and**
`min(screen.width, screen.height) <= 500`. The `min()` is what makes it
orientation-proof — a phone held sideways is 852x393, which a width-only media
query reads as a laptop. iPads (768 across the short edge) keep the
interactive deck, where the fit-scale is a legible 0.53.

**Escape hatches:** `?desktop=1` forces the interactive deck (also the target
of the page view's own "open the interactive deck" button), `?mobile=1` forces
the page view — useful for checking it from a laptop.

**Stylesheet split.** `base.css` (reset, `:root` tokens, station-sign placard,
access gate) loads on **both** paths; `styles.css` and `mobile.css` load on top
of it, never together. This exists so a phone does not download the ~870KB
gzipped desktop sheet just to render the email prompt. All three blocks in
`base.css` were a **pure move** out of `styles.css` and use no `var()` beyond
the tokens they define, so either path is self-contained.

`auth.js` is unchanged and runs on both paths — a phone viewer still passes the
email gate and still lands in the access sheet. `mobile.js` writes the current
page into `#hudCtr`, which is the element auth.js already observes for
per-slide dwell time, so phone sessions log to the same `timings` tab as
desktop ones with no change to auth.js.

## PDF export

`npm run pdf` (→ `tools/export-pdf.mjs`) regenerates **both** `cyph-deck.pdf`
and the phone view's pages in `assets/deck-pages/` from the live deck. It serves the directory on `127.0.0.1` (so auth.js takes its
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
- **It also writes `assets/deck-pages/`** — the same frames downscaled to
  1440px wide and re-encoded as WebP (`NN.webp`), plus a `manifest.json`
  carrying the page count. `mobile.js` reads the count from that manifest, so
  adding or removing a slide needs no code change on the phone path. Chrome's
  own WebP encoder does the conversion in a blank tab, so the script stays
  dependency-free. The directory is rewritten (not overwritten) each run, so a
  deck that loses a slide leaves no orphaned page behind.

## Key files

- `index.html` — all slide content, plus the viewing-path router in `<head>`
- `base.css` — reset, `:root` tokens, station-sign placard, access gate. Loads
  on **every** device, under whichever of the two sheets below applies.
- `styles.css` — the interactive deck (desktop only)
- `mobile.css` / `mobile.js` — the phone page view (see *Viewing paths*)
- `deck.js` — navigation, animations, chapter mapping (desktop only)
- `auth.js` — email gate + access/dwell logging; runs on both paths
- `tools/export-pdf.mjs` — the PDF **and** phone-page export (see above)
- `assets/deck-pages/` — generated; the phone view's WebP pages + manifest.
  Never hand-edit, never hand-add — `npm run pdf` owns this directory.
- `assets/brands/` — resource partner logos
- `assets/moments/` — arena flyer images (l1-l8 for live, c1-c10 for conceptual)
- `assets/people/` — headshots (jalen, bryan, bakari, caitlin, calvary)
- `assets/reference/crisis/` — crisis slide floating images
- `assets/images/` — counter-culture images (agora, salon, harlem_renaissance)
- `assets/videos/` — `s15` demo-montage clips, web `.mp4` only (H.264, **no audio**). Source `.mov` masters are **not** kept in-repo: transcode with `ffmpeg -i in.mov -an -vf "scale=960:-2" -c:v libx264 -pix_fmt yuv420p -crf 28 -preset fast -movflags +faststart out.mp4`, wire the `.mp4` into the grid, then delete the master. (VHS/grain-heavy clips compress poorly — bump `-crf` if a file is disproportionately large.)
