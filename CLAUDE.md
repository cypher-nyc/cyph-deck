# CYPH (formerly SMACK) — Pitch Deck

## What this is

The investor pitch deck for Cyph (smack.live) — the underground arena to wrestle with ideas. Built as a single-page HTML/CSS/JS presentation.

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
- **Deep Space Blue** — `#13293D` (charcoal text, `var(--charcoal)`)
- **Dark Amaranth** — `#6D1A36` (theology route, maroon accents)
- **Amber Flame** — `#FBAF00` (philosophy route, yellow accents)

Supporting colors:

- **Cream** — `#ede8de` (`var(--cream)`, slide backgrounds)
- **Cream dark** — `#e5dfd4` (body background)

## Slide structure

Slides are `div.slide` with IDs `s0`–`s15` (16 total). Navigation is in `deck.js` with chapter mapping. Slide counter shows `XX/16`.

## Design conventions

- **Left-header-positioning**: h2 headers use `position:absolute;top:24px;left:24px` aligned with "cyph." in the nav bar. Applied via CSS selector list on specific slide IDs.
- **No grey boxes**: content sits directly on cream background (newspaper-inspired layout). Vertical column dividers for multi-column layouts.
- **Colored pills**: collaborator/category tags use the 4 route colors as backgrounds with white text, `border-radius:20px`.
- **Crisis-style cards**: dark translucent cards (`rgba(0,0,0,0.7)`) with colored left borders for emphasis.
- **Floating images**: use `drift1`–`drift6` keyframe animations (8–12s, ease-in-out infinite) for organic movement.
- **Typography**: Helvetica Neue throughout. Bold 700 for headers, 400 for body. `var(--charcoal)` for primary text, `var(--charcoal-muted)` (#888) for secondary.

## Key files

- `index.html` — all slide content
- `styles.css` — all styles
- `deck.js` — navigation, animations, chapter mapping
- `assets/brands/` — resource partner logos
- `assets/moments/` — arena flyer images (l1-l8 for live, c1-c10 for conceptual)
- `assets/people/` — headshots (jalen, bryan, bakari, caitlin, sade)
- `assets/reference/crisis/` — crisis slide floating images
- `assets/images/` — counter-culture images (agora, salon, harlem_renaissance)
