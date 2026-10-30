# seeded sources

The institutions behind the deck's "500+ seeded partners" (s8, traction), kept here as the full list. Not part
of any deck, PDF, phone page or published host: nothing reads this folder.

`dpla-institutions.csv`: the 566 contributing institutions seeded into the Underground through DPLA (the
Digital Public Library of America), one row each. Each holds at least one openly reusable item (No Copyright -
United States, CC0 or Public Domain Mark) with a cover and a link back to the holder, ingested as its own
`Source` in underground-be. Columns: institution, kind, region (NYC / LA / US when the institution is on the
inventory list), items seeded, rights, domains, source slug.

Seeded into the dev rig 2026-10-30: 566 Sources with 1,525 public items. A 567th institution (Center for
Asian Pacific Studies) was selected but none of its items passed the backend's quality gates, so it is left
out.

How it was made: `cyph-de/underground/pipelines/dpla/` (`--report` writes this file); run 2026-10-30 against
DPLA's 2026-09 export. The wider plan (Wikipedia, the 500-source list, NYC/LA partners, the in-person tour) is
in the umbrella repo's `docs/inventory/`.

Wording note: these are *sources* we seeded from DPLA's open export, not partners who signed an agreement.
