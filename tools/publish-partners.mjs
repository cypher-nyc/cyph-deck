/* ═══ publish → partners.cyph.city ═══
   The partner deck (partners.html, built by tools/build-partners.mjs) served
   as the root of its own bucket:

     node tools/publish-partners.mjs [--dry-run]

   The stage is an allow-list, not "the repo minus some things": the partner
   host must never carry the investor deck (index.html, deck.js,
   cyph-deck.pdf, assets/deck-pages/), so only what partners.html loads is
   copied. partners.html lands as index.html; 404.html + /common/ come from
   site/ exactly as on investors.cyph.city.

   The bucket belongs to this deck alone, so the sync deletes whatever the
   stage no longer carries.

   Credentials: whatever the aws CLI resolves (AWS_PROFILE=cyph locally).
   Bucket + distribution come from tools/partners.json;
   PARTNERS_DISTRIBUTION_ID overrides. */

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "partners.json"), "utf8"));
const HOST = CFG.host;
const BUCKET = CFG.bucket;
const DIST_ID = process.env.PARTNERS_DISTRIBUTION_ID || CFG.distributionId;

/* everything partners.html can request, by path from the repo root */
const FILES = [
  "auth.js", "base.css", "styles.css", "mobile.css", "mobile.js", "iso3d.js", "favicon.png",
  "partners/partners.css", "partners/partners.js",
];
const DIRS = ["assets"];
/* investor-only, never staged */
const SKIP_IN_ASSETS = new Set(["deck-pages", ".DS_Store"]);

const NO_CACHE = "no-cache, no-store, must-revalidate";
const DAY = "public, max-age=86400";

const DRY = process.argv.includes("--dry-run");

function run(cmd, args) {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  if (DRY) return;
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

async function copyTree(from, to, skip) {
  await fsp.mkdir(to, { recursive: true });
  for (const ent of await fsp.readdir(from, { withFileTypes: true })) {
    if (skip(ent.name)) continue;
    const a = path.join(from, ent.name);
    const b = path.join(to, ent.name);
    if (ent.isDirectory()) await copyTree(a, b, (n) => n === ".DS_Store");
    else await fsp.copyFile(a, b);
  }
}

async function listTree(dir, base = dir, out = []) {
  for (const ent of await fsp.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) await listTree(p, base, out);
    else out.push(path.relative(base, p));
  }
  return out;
}

async function stage() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "cyph-partners-"));
  const put = async (from, to) => {
    await fsp.mkdir(path.dirname(path.join(dir, to)), { recursive: true });
    await fsp.copyFile(path.join(ROOT, from), path.join(dir, to));
  };
  await put("partners.html", "index.html");
  for (const f of FILES) await put(f, f);
  for (const d of DIRS) await copyTree(path.join(ROOT, d), path.join(dir, d), (n) => SKIP_IN_ASSETS.has(n));
  await put("site/404.html", "404.html");
  for (const f of ["base.css", "favicon.png"]) await put(f, `common/${f}`);

  /* the guard this allow-list exists for */
  const files = await listTree(dir);
  const leaked = files.filter((f) => /(^|\/)deck\.js$|cyph-deck\.pdf$|^assets\/deck-pages\//.test(f));
  if (leaked.length) throw new Error(`investor files in the partner stage: ${leaked.join(", ")}`);
  const html = await fsp.readFile(path.join(dir, "index.html"), "utf8");
  if (!html.includes('id="hiw"')) throw new Error("staged index.html is not the partner deck");
  return { dir, files };
}

async function publish() {
  const { dir, files } = await stage();
  try {
    console.log(`partners → s3://${BUCKET}/  (${files.length} files)`);
    if (DRY) files.filter((f) => !f.startsWith("assets/")).forEach((f) => console.log(`    ${f}`));
    if (DRY) console.log(`    + ${files.filter((f) => f.startsWith("assets/")).length} files under assets/`);

    const dest = `s3://${BUCKET}/`;
    const text = ["*.html", "*.json", "*.js", "*.css"];
    run("aws", ["s3", "sync", dir, dest, "--delete", "--cache-control", DAY, ...text.flatMap((p) => ["--exclude", p])]);
    run("aws", ["s3", "sync", dir, dest, "--delete", "--cache-control", NO_CACHE, "--exclude", "*", ...text.flatMap((p) => ["--include", p])]);
    if (!DIST_ID && DRY) console.log("  $ aws cloudfront create-invalidation --distribution-id <unset> --paths /*");
    else if (!DIST_ID) throw new Error("no distribution id: set tools/partners.json distributionId or PARTNERS_DISTRIBUTION_ID");
    else run("aws", ["cloudfront", "create-invalidation", "--distribution-id", DIST_ID, "--paths", "/*"]);
    console.log(`\n  https://${HOST}/`);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

publish().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
