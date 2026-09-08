/* ═══ publish → investors.cyph.city ═══
   Two things live on the investors bucket and they are published
   separately, on purpose:

     node tools/publish-investors.mjs deck --version sept26 [--dry-run]
       A frozen copy of the deck at /deck/<version>/. The version must be
       listed in site/deck/versions.json and be live. The sync deletes only
       inside that one prefix, never anywhere else.

     node tools/publish-investors.mjs site [--dry-run]
       Everything in site/ (root redirect, 404, versions.json, the
       one-pager) plus common/ (auth.js, base.css, favicon.png from the
       repo root, and site/common/*). Never deletes: a site publish can
       not touch a deck version.

   GitHub Pages is untouched by all of this; it keeps serving main:/.

   Credentials: whatever the aws CLI resolves (AWS_PROFILE=cyph locally,
   the configured keys in CI). Bucket + distribution come from
   tools/investors.json; INVESTORS_DISTRIBUTION_ID overrides. */

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = path.join(ROOT, "site");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "investors.json"), "utf8"));
const HOST = CFG.host;
const BUCKET = CFG.bucket;
const DIST_ID = process.env.INVESTORS_DISTRIBUTION_ID || CFG.distributionId;

/* the deck is the repo root minus everything that is not the deck */
const DECK_EXCLUDE = new Set([
  "node_modules", "tools", "site", "apps-script", ".github", ".git", ".gitignore",
  ".claude", ".DS_Store", "package.json", "package-lock.json", "CLAUDE.md",
]);
/* the shared bundle every surface loads from /common/ */
const COMMON_FROM_ROOT = ["auth.js", "base.css", "favicon.png"];

const NO_CACHE = "no-cache, no-store, must-revalidate";
const IMMUTABLE = "public, max-age=31536000, immutable";
const DAY = "public, max-age=86400";

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const flag = (n) => { const i = argv.indexOf(`--${n}`); return i === -1 ? null : argv[i + 1]; };

function run(cmd, args) {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  if (DRY) return;
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

/* every filter as a flat argv for `aws s3 sync` */
function sync(from, to, { del = false, cacheControl, only = null, except = [] }) {
  const args = ["s3", "sync", from, to, "--cache-control", cacheControl];
  if (del) args.push("--delete");
  if (only) {
    args.push("--exclude", "*");
    only.forEach((p) => args.push("--include", p));
  }
  except.forEach((p) => args.push("--exclude", p));
  run("aws", args);
}

function invalidate(paths) {
  if (!DIST_ID && DRY) return console.log(`  $ aws cloudfront create-invalidation --distribution-id <unset> --paths ${paths.join(" ")}`);
  if (!DIST_ID) throw new Error("no distribution id: set tools/investors.json distributionId or INVESTORS_DISTRIBUTION_ID");
  run("aws", ["cloudfront", "create-invalidation", "--distribution-id", DIST_ID, "--paths", ...paths]);
}

async function copyTree(from, to, skip = () => false) {
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

async function versions() {
  return JSON.parse(await fsp.readFile(path.join(SITE, "deck", "versions.json"), "utf8"));
}

async function publishDeck() {
  const v = flag("version");
  if (!v) throw new Error("deck needs --version <id>");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(v)) throw new Error(`version "${v}" must be lowercase letters, digits, dashes`);
  const entry = (await versions()).versions.find((x) => x.id === v);
  if (!entry) throw new Error(`version "${v}" is not in site/deck/versions.json — add it first`);
  if (entry.live === false) throw new Error(`version "${v}" is retired; flip live:true to publish it`);

  const stage = await fsp.mkdtemp(path.join(os.tmpdir(), "cyph-deck-"));
  try {
    await copyTree(ROOT, stage, (n) => DECK_EXCLUDE.has(n));
    /* the one absolute URL in the deck, made version-aware */
    const idx = path.join(stage, "index.html");
    const html = await fsp.readFile(idx, "utf8");
    const og = `https://${HOST}/deck/${v}/`;
    const next = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${og}$2`);
    if (next === html) throw new Error("og:url meta not found in index.html");
    await fsp.writeFile(idx, next);

    const files = await listTree(stage);
    console.log(`deck ${v} → s3://${BUCKET}/deck/${v}/  (${files.length} files)`);
    if (DRY) files.slice(0, 40).forEach((f) => console.log(`    ${f}`)), files.length > 40 && console.log(`    … ${files.length - 40} more`);

    const dest = `s3://${BUCKET}/deck/${v}/`;
    /* frozen version: assets immutable, the two files that change no-cache.
       --delete is scoped by the prefix in `dest` and by these filters. */
    sync(stage, dest, { del: true, cacheControl: IMMUTABLE, except: ["*.html", "*.json"] });
    sync(stage, dest, { del: true, cacheControl: NO_CACHE, only: ["*.html", "*.json"] });
    invalidate([`/deck/${v}/*`]);
    console.log(`\n  https://${HOST}/deck/${v}/`);
  } finally {
    await fsp.rm(stage, { recursive: true, force: true });
  }
}

async function publishSite() {
  const stage = await fsp.mkdtemp(path.join(os.tmpdir(), "cyph-site-"));
  try {
    await copyTree(SITE, stage, (n) => n === ".DS_Store");
    const common = path.join(stage, "common");
    await fsp.mkdir(common, { recursive: true });
    for (const f of COMMON_FROM_ROOT) await fsp.copyFile(path.join(ROOT, f), path.join(common, f));

    const files = await listTree(stage);
    console.log(`site → s3://${BUCKET}/  (${files.length} files)`);
    if (DRY) files.forEach((f) => console.log(`    ${f}`));

    const dest = `s3://${BUCKET}/`;
    /* no --delete, ever: the site publish shares the bucket with /deck/* */
    sync(stage, dest, { cacheControl: DAY, except: ["*.html", "*.json", "*.js", "*.css"] });
    sync(stage, dest, { cacheControl: NO_CACHE, only: ["*.html", "*.json", "*.js", "*.css"] });
    invalidate(["/", "/index.html", "/404.html", "/deck/versions.json", "/onepager/*", "/common/*"]);
    console.log(`\n  https://${HOST}/onepager/`);
  } finally {
    await fsp.rm(stage, { recursive: true, force: true });
  }
}

const target = argv.find((a) => !a.startsWith("--") && argv[argv.indexOf(a) - 1] !== "--version");
const jobs = { deck: publishDeck, site: publishSite };
if (!jobs[target]) {
  console.error("usage: node tools/publish-investors.mjs deck --version <id> [--dry-run] | site [--dry-run]");
  process.exit(2);
}
jobs[target]().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
