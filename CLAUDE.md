# CYPH (formerly SMACK) — Pitch Deck

> Read `README.md` first - it is the canonical map of this repo (purpose, layout, who it talks to, run/test). This file holds only Claude-specific rules and incident history.

> **Scope rule (Cash, 2026-09-14): no frontend changes and no copy you were not asked for.** A backend task is backend only. Do not add a surface, a row, a pill, a section, a playground entry, a fixture, a DS component, a type field, or a `include=` param in any frontend (`*-fe`, the design systems, `cyph-internal`, `cyph-appendix`, the decks) to "show" backend work. Do not write, add, or reword user-facing copy (labels, section titles, hover text, empty states, error text) unless Cash dictated the words. If a frontend change looks necessary to make the work useful, say so in one line and stop; Cash decides. This applies to sibling repos too: working in `underground-be` gives no licence to touch `underground-fe` or the DS.

## Scope Discipline
Implement ONLY what was explicitly requested. Do not add unrequested UI sections, intro summaries, visualizations, fonts, or styling. If you believe an addition would help, list it as a suggestion at the end of your response instead of building it.

## Domain Vocabulary & Design Tokens
- Always use design-system tokens for color, spacing, and typography. Never hardcode hex values or font families.

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

Slides are `div.slide` with IDs `s0`–`s12` (13 total). IDs **must stay contiguous** — navigation indexes them via `getElementById("s" + i)`. Navigation is in `deck.js` with chapter mapping. Slide counter shows `XX/13`. Every corner title (the absolute top-left `h2`) is 26px; a title too long for one line wraps (`text-wrap: balance`), it never shrinks (Cash, 2026-10-06). The one exception is s5's centred hero line.

- **`s4` — who we are** (`solution` chapter): one grid (`.now-grid`): the persona table (type of person · size benchmark · digital tools used; seekers yellow / sparrers orange / authorities blue, each row ruled in its colour) beside the key insights (four bold headlines, each article's claim a link to its source with the source's logo or symbol after it). Under both, on one row, the two takeaways (`.now-closer`, 22px): the cyph claim under the table (`.now-lead`, persona words in their colours) and "as AI fills the internet…" under the insights (`.now-tail`). Source logos and symbols are in `assets/brands/`. Styles under `/* ── s4: …` in `styles.css`.
- **`s5` — welcome to cyph city** (`solution` chapter): the city street render (`assets/reference/ip/cyph_city_street.jpg`) full-bleed under a 40% black shade (`.city-hub-shade`), "welcome to cyph city." centred on it and set low on the street as a 44px white hero line, and "see trailer here" (trailer.cyph.city) as the slide's footnote. Styles under `/* s5: cyph city …`.
- **`s6` — user journey / how it works** (`solution` chapter): the isometric layer stack (`#isoL1`–`#isoL4`, live `iso3d.js` canvases) beside `.hiw-anno`, one `.hiw-step` panel per layer. 01 underground (orange): three equal lanes — the resource cosmos (`#hiwCosmos`, built by `cosmos.js` at 800×420 and scaled into its lane) / the design system's route cards / its syllabus schedule page (`assets/reference/ip/routes_three.webp`, three underground `RouteCard`s from the playground's route-card section, retitled with the app's routes (the nietzsche route · the athlete as activist · silence as composition, from `routesUniverseFixture`, each with its primary-domain bullet), no border, one height, captured stacked at their native 240px width at 2x so they read at ~1:1, and `syllabus_document.jpg`; both shown whole) — with "all human made.*" footnoted bottom right (shown only on 01). 02 cyph (blue): the live + conceptual flyers with their office-hours hosts. 03 irl (amaranth, the wordmark's H): "our last cyph" press + "in the room" logos, 10+ residential libraries underneath. 04 how it all maps together (yellow): route map `#transitSvg` beside the DNA card, one height. A layer and its panel share `data-step`; `updateHiw` in `deck.js` sets `.active` / `.on`, runs the cosmos only on 01 (`setCosmosActive`) and turns the DNA orbit band by band only on 04 (`setDnaActive`). The stack is built from the ground up: `#isoL1` underground at the bottom (step 1), `#isoL4` the cyphcard on top, which sways only while step 04 is selected (`setIsoCardActive`, iso3d.js) and eases to rest otherwise. `#isoL1` and `#isoL2` are the underground and cyph dashboards as flat images (`assets/layers/ug_dashboard.webp`, `assets/cards/cyph_dashboard.webp`; Cash 2026-10-06: no slab, no train doors); iso3d.js builds the slab and the doors only where a deck still has `#ugCanvas` / `#doorsCanvas`. Like every tile, both are grayscale until their step is selected. Styles under `/* ═══ HOW IT WORKS (s6) ═══ */` in `styles.css`. The partner deck lifts it unchanged.

- **The resource cosmos (`cosmos.js`)** is a vanilla port of the design system's `ResourceCosmos` (`cyph-web/packages/design-system/src/theme/ResourceCosmos`): `cosmosMath.ts`'s ring layout at panel scale, the DS Breathe float and pulse streak. A deck has no scroll, so the camera glides through the tunnel at a steady speed (`SPEED`): each ring fades in from the back, holds, crossfades slowly out (~6s) as the next comes up, and goes round to the back. No topic text and no quotes, no ring-to-ring jumps, no zooming in on a card (Cash, 2026-10-02: "just have it flowing"). The fade rides a `--o` custom property down to the cards: `opacity` < 1 on the ring itself would flatten its 3D and pop. Its images live in `assets/cosmos/`: people are transparent cutouts (rembg); works are covers, posters and photographs. Almost all come from public-domain Wikimedia Commons files, the rest from the app's own `apps/web/public/demo/me` library. The curation is deliberately wide: four rings, one each for music (country, the blues), the built world (Chinese architecture, the modern city), sport, and thought (philosophy and theology, East and West). Cash, 2026-10-02: "needs to be more diverse… we are two black founders and this slide might give it as a revolution app". Keep any recuration that wide. The domains steer the curation only; the slide never names them. The DNA card is the DS `theme/dna/DnaCard` rebuilt as static markup + CSS, one card (*blue yodel*, jimmie rodgers, 1927), the same height as the route map beside it (`--maps-h`). Its orbit faces follow the DS: a person is a circle, a work a square cover, either its image or a typographic cover (`.typo`: the title, or a quote with its attribution, set in type).

- **`s7` — traction** (`underground` chapter): one three-column grid; each column (office hour leads / seeded partners / artifacts from personal collections) is a subgrid of its eight rows (count, name, e.g. line, visual, then "what cyph unlocks for them" and "what they unlock for cyph", each a muted label in column 1 over a value in the column's colour), so every row lines up across the three. No rules. Styles under `/* ── s7: traction …`.
- **`s8` — how we make money** (`business` chapter): the only revenue slide. Three `.money-row`s in a `.money-table` (cyphcard+ · cyph.edu · ads + commerce), each a 3-column grid (label · body · `.money-graphic`), vertically centered, with a 7px accent rule set per row via the `--money-accent` custom property — one distinct hue per row. Graphics are capped to the same 94px band (`.money-reach-img`, the ads row's cyph city stills, is the exception at 124px); the cyphcard+ row carries a live `iso3d.js` canvas (`moneyCardCanvas`). Each row's body carries a "think :" pairing in italic text (`.money-analog`, no logo chips). Under the rows, `.money-trajectory`: an SVG line chart of revenue 2026–2030, one line per stream in its row's colour, commerce dashed in the ads row's blue, and the total in green, thicker and filled; 2030 ends: $58.9M total · $36.0M cyph.edu · $16.2M cyphcard+ · $6.4M ads · $0.3M commerce (Cash, 2026-10-06; the 2026–2029 points are the Revenue Model 0926 sheet's, commerce $0 before 2030). Every line is named at its 2030 end (no title or legend). Re-key the chart and the takeaway (~$59M, ~73.4% gross margins) together when the model changes. Styles under `/* ── s8: how we make money ── */`.
- **`s9` — gtm** (`business` chapter): one `.gtm-stage` (1296×640) on one grid of x positions: four equal 190px quarters (q3 '26 – q2 '27) from x 250, the white `.gtm-today` "we are here" hairline at the start of q4 '26 (x 440), the green `.gtm-gate` launch line at the end of q2 '27 (x 1010) with the CYPH chips on top of it and "exclusive public launch" above them in green. Three `.gtm-lane`s (irl `--yellow` · marketing `--orange` · software `--blue`): the name in the left column centred on its 3px line, the lane's work above the line in its colour; irl and software run from x 250, marketing from today, all ending at launch. Under the lanes, the trigger points in three equal columns from today to launch (header "pilot must hit these to launch →" in software blue); right of launch, "after launch" (nomination-only*); the clubhouse footnote bottom right. Every animated piece is placed by its **top-left corner** in inline style, never a CSS translate, because anime.js overwrites `transform` on entry (`runA` case 9). Styles under `/* ═══ GTM (s9) …`.
- **`s11` — the raise** (`business` chapter): headline terms ($1.25M raising · $11.25M pre-money cap · 15 mo runway), a CSS `conic-gradient` use-of-funds pie + legend, centered. Styles under `/* ── s11: the raise ── */` in `styles.css`.
- **`s12` — the demo close** (`close` chapter): "ready for a demo?" + emails over a full-bleed backdrop, then the two founder bios as sub-steps (`founderStep`, `updateFounderBio`). On phones/touch the video is hidden — text-on-black only.

Footnotes sit bottom right on every slide (11px italic paprika).

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

**The phone view carries no actions at all** — no links, no buttons, just the
bar and the pages. It never routes into the interactive deck (any route from a
phone into the 1440x900 stage leads somewhere unreadable) and offers no PDF
download either; the pages on screen already are the deck. `npm run check`
asserts `#mobile-deck` contains zero anchors and zero buttons, so neither can
creep back in.

**Escape hatches** (URL-only, never surfaced to a viewer): `?desktop=1` forces
the interactive deck, `?mobile=1` forces the page view — useful for checking
the page view from a laptop.

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

## Partner deck (partners.cyph.city)

The non-VC deck: 9 slides, built from this one so the two never drift.
`tools/build-partners.mjs` writes `partners.html` (generated, never
hand-edited): `s0`–`s6` and `s10` are lifted verbatim from `index.html`
**and keep their ids**, so every `#sN` rule in `styles.css` applies
unchanged. Slide 9 is `partners/close.html` (`s12` with Cash's partner copy,
no founder bios). On `s4` partners see only the cyph claim (the `.now-lead`
takeaway), centred at title size in one colour (`partners/partners.css`). `partners/partners.js` is its deck.js
(slides addressed by id, same `go`/`goTo`/`busy`/`layerStep` contract, so
export-pdf drives it unchanged); `partners/partners.css` loads on top of
`styles.css`, desktop only. No revenue HUD bar. The gate logs it as
`viewed = partners`.

`npm run partners` = build + `export-pdf.mjs --deck partners` →
`cyph-partners.pdf` + `assets/partner-pages/` (mobile.js reads the directory
from `<html data-pages>`). Re-run it after touching any reused slide.

**Deploy is on push.** `.github/workflows/deploy-partners.yml` publishes
partners.cyph.city (S3 `cyph-partners-prod` + CloudFront) whenever a push to
`main` touches the partner deck or anything it is built from. It rebuilds
`partners.html` first and fails if that differs from the commit (a reused slide
changed without `npm run partners`), because a stale build also means stale
phone pages. A push to GitHub Pages alone never updates this host.

## Trailer (trailer.cyph.city)

`trailer.html` is one `<video data-cyph-track>` behind the partner deck's gate
(same placard and wording), logged as `viewed = trailer`. auth.js sees the
`data-cyph-track` video and logs watch time instead of slide time on the same
`timings` rows: keys are 5s segments of the video (`"0:00"`, `"0:05"` ...)
holding ms actually played forward, so `totalSec` is time watched and the
last key is how far they got. Seeks, pauses and loop restarts bank nothing;
a paused tab sends no interval rows. The deck path through auth.js is
unchanged. No Apps Script redeploy was needed.

`trailer/trailer.mp4` is a web encode (H.264 yuv420p, `-movflags +faststart`,
alpha flattened onto black); never commit the master. Replacing the trailer =
follow `trailer/README.md` step by step (encode, size check < 100 MB, push to
main); `deploy-trailer.yml` publishes it. Keep that README the one source for
the procedure.

## PDF export

`npm run pdf` (→ `tools/export-pdf.mjs`) regenerates **both** `cyph-deck.pdf`
and the phone view's pages in `assets/deck-pages/` from the live deck. It serves the directory on `127.0.0.1` (so auth.js takes its
localhost bypass), drives Chrome with `navNext.click()` exactly the way a
viewer advances, waits for every animation on each state to land, and packs
the frames into an 18-page 1440×900pt PDF.

- **Sub-steps get their own page.** The walk is state-driven, not slide-driven:
  s6's how-it-works layers (01/02/03/04) and s12's two founder bios each export
  separately, so 13 slides → 18 pages (the partner deck: 9 → 12). The loop stops when
  advancing no longer changes state, so adding a slide needs no change here.
- **System Chrome, not bundled Chromium** (`channel: "chrome"`). The cover and
  close slides play H.264 video; Playwright's Chromium ships without
  proprietary codecs and those pages would export black.
- **Settle gate** = `anime.running` drained + `document.getAnimations()`
  finished + deck.js's `busy` latch clear, held stable for 3 frames. The 26
  infinite drift/float keyframes are skipped — they never finish by design, so
  drifting elements land wherever their phase puts them and pages will differ
  slightly run to run.
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

The file map lives in `README.md` (Layout). Rules that go with it:

- `assets/deck-pages/` — generated; the phone view's WebP pages + manifest.
  Never hand-edit, never hand-add — `npm run pdf` owns this directory.
- `assets/videos/` — `s12` demo-montage clips, web `.mp4` only (H.264, **no audio**). Source `.mov` masters are **not** kept in-repo: transcode with `ffmpeg -i in.mov -an -vf "scale=960:-2" -c:v libx264 -pix_fmt yuv420p -crf 28 -preset fast -movflags +faststart out.mp4`, wire the `.mp4` into the grid, then delete the master. (VHS/grain-heavy clips compress poorly — bump `-crf` if a file is disproportionately large.)

## investors.cyph.city (S3 + CloudFront), beside GitHub Pages

GitHub Pages keeps serving `main:/` untouched. The same deck is also published
as frozen, hand-named versions at `investors.cyph.city/deck/<version>/`, next
to the one-pager at `/onepager/`. Everything under `site/` is that host:

- `site/deck/versions.json`: the version list. A version must be listed and
  `live` to publish; flipping `live:false` and republishing `site` retires it
  (auth.js shows the retired placard instead of the gate). `/deck/latest/` is
  the link we hand out: it resolves to `current`, so the sheet still records
  the exact version each viewer saw. The root does the same.
- `site/onepager/`: `cyph-onepager.pdf` (a copied export of the InDesign
  one-pager, compressed with Ghostscript) + `pages/` from
  `node tools/onepager-pages.mjs [new.pdf]`. Committed like `assets/deck-pages`.
- `site/common/viewer.js` + `viewer.css`: mobile.js generalized, for any
  page-image column. The published `/common/` bundle is these plus `auth.js`,
  `base.css`, `favicon.png` from the repo root; event-decks builds its site
  from the same files.
- `tools/publish-investors.mjs deck --version <id>` / `site` (`--dry-run`
  prints the staged tree). The deck sync deletes only inside its own version
  prefix; the site sync never deletes. `tools/investors.json` holds the bucket
  and distribution id (not secrets). `.github/workflows/deploy-investors.yml`
  republishes `site` on push and publishes a deck version on manual dispatch.

**auth.js is shared** by every surface. It reads `data-mode`, `data-viewed`,
`data-meta`, `data-versions` off its script tag and sends `viewed` + `meta` in
every logger payload; the logger's real source is `apps-script/Code.gs` (one
sheet, `viewed` column with a dropdown). One access row per surface per tab
session. Open mode (invites) logs without prompting and writes nothing to
sessionStorage, so an open page never unlocks a gated one.

## Local Dev Ports
Before starting any server, check the port is free and record every background process you start. At the end of the session, kill ONLY the processes you started — never blanket-kill by port or name, since the user has pre-existing dev servers running. Ports in active use: 8000 (backend), 8002, 8200 (API), 5373 (portal).

## Verification
After a UI fix, hard-reload with cache disabled before claiming success. If the user reports still seeing the bug, assume it is real and reproduce it rather than attributing it to a stale module cache.
