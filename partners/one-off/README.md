# partners/one-off/

Documents made for a single partner: one folder per partner, each holding the `deck.json` source
and the PDF built from it. They live here, with the partner deck, because they are partner
material; they are rendered by the sibling `event-decks` repo, whose one-pager layout engine
reads the `deck.json` format.

## Files

| Folder | What it is |
| --- | --- |
| `jons-dojo-partnership/` | Jon's Dojo partnership brief (8pp letter): `deck.json` + `Cyph_JonsDojo_Partnership.pdf` |

## Build

From the monorepo root, with `event-decks` checked out as a sibling:

```
cd event-decks && node tools/build.mjs ../cyph-deck/partners/one-off/<folder>
```

The PDF is written next to that folder's `deck.json`. The deck format and page types are
documented in `event-decks/README.md`.

## Do not

- Do not hand-edit a PDF here; rebuild it from `deck.json`.
- Do not add anything here to `tools/publish-partners.mjs`: one-offs are sent to the partner
  directly, never published on partners.cyph.city. Changes here do not trigger
  `deploy-partners.yml` (`!partners/one-off/**`).
