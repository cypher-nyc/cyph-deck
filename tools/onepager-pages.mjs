/* ═══ one-pager → page images ═══
   Rasterizes site/onepager/cyph-onepager.pdf into site/onepager/pages/
   (NN.webp + manifest.json) for the viewer at investors.cyph.city/onepager/.
   Same idea as assets/deck-pages/: the pages on screen come from the PDF
   that gets downloaded, so the two cannot drift.

   The PDF is a copied export of the InDesign one-pager
   (../Cyph_OnePagers_Package). When a new one ships, drop it in and re-run:

     node tools/onepager-pages.mjs [path/to/new.pdf]

   Needs poppler (pdftoppm) and ImageMagick (magick) on PATH. */

import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "site", "onepager");
const PDF = path.join(DIR, "cyph-onepager.pdf");
const PAGES = path.join(DIR, "pages");
const WIDTH = 1440;

async function main() {
  const src = process.argv[2] ? path.resolve(process.argv[2]) : null;
  if (src && src !== PDF) await fsp.copyFile(src, PDF);
  await fsp.access(PDF).catch(() => {
    throw new Error(`no PDF at ${path.relative(ROOT, PDF)} — pass one as the first argument`);
  });

  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), "cyph-onepager-"));
  try {
    execFileSync("pdftoppm", ["-png", "-r", "200", "-scale-to-x", String(WIDTH), "-scale-to-y", "-1", PDF, path.join(tmp, "p")]);
    const pngs = (await fsp.readdir(tmp)).filter((f) => f.endsWith(".png")).sort();
    if (!pngs.length) throw new Error("pdftoppm produced no pages");

    await fsp.rm(PAGES, { recursive: true, force: true });
    await fsp.mkdir(PAGES, { recursive: true });
    let height = 0;
    for (let i = 0; i < pngs.length; i++) {
      const out = path.join(PAGES, String(i + 1).padStart(2, "0") + ".webp");
      execFileSync("magick", [path.join(tmp, pngs[i]), "-quality", "82", out]);
      if (!height) {
        const dims = execFileSync("magick", ["identify", "-format", "%w %h", out]).toString().trim().split(" ");
        height = Number(dims[1]);
      }
      const { size } = await fsp.stat(out);
      console.log(`  ${path.relative(ROOT, out)}  ${(size / 1024).toFixed(0)}KB`);
    }
    const manifest = { pages: pngs.length, width: WIDTH, height, generated: new Date().toISOString() };
    await fsp.writeFile(path.join(PAGES, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(`  ${path.relative(ROOT, path.join(PAGES, "manifest.json"))}  ${JSON.stringify(manifest)}`);
  } finally {
    await fsp.rm(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
