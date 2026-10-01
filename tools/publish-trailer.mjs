/* ═══ publish → trailer.cyph.city ═══
   The trailer page (trailer.html) served as the root of its own bucket:

     node tools/publish-trailer.mjs [--dry-run]

   The stage is an allow-list: trailer.html lands as index.html, beside
   the gate (auth.js, base.css, favicon.png), the video (trailer/) and
   404.html + /common/ from site/ exactly as on partners.cyph.city. No deck
   file is ever staged.

   The bucket belongs to this page alone, so the sync deletes whatever the
   stage no longer carries.

   Credentials: --profile cyph, unless keys come in through the environment
   (CI: deploy-trailer.yml sets AWS_ACCESS_KEY_ID and has no profiles).
   Bucket + distribution come from tools/trailer.json;
   TRAILER_DISTRIBUTION_ID overrides. */

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "trailer.json"), "utf8"));
const HOST = CFG.host;
const BUCKET = CFG.bucket;
const DIST_ID = process.env.TRAILER_DISTRIBUTION_ID || CFG.distributionId;

/* everything trailer.html can request, by path from the repo root */
const FILES = ["auth.js", "base.css", "favicon.png", "trailer/trailer.mp4"];

const NO_CACHE = "no-cache, no-store, must-revalidate";
const DAY = "public, max-age=86400";

const DRY = process.argv.includes("--dry-run");
const PROFILE = process.env.AWS_ACCESS_KEY_ID ? [] : ["--profile", "cyph"];

function run(cmd, args) {
  console.log(`  $ ${cmd} ${args.join(" ")}`);
  if (DRY) return;
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

async function stage() {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "cyph-trailer-"));
  const files = [];
  const put = async (from, to) => {
    await fsp.mkdir(path.dirname(path.join(dir, to)), { recursive: true });
    await fsp.copyFile(path.join(ROOT, from), path.join(dir, to));
    files.push(to);
  };
  await put("trailer.html", "index.html");
  for (const f of FILES) await put(f, f);
  await put("site/404.html", "404.html");
  for (const f of ["base.css", "favicon.png"]) await put(f, `common/${f}`);

  const html = await fsp.readFile(path.join(dir, "index.html"), "utf8");
  if (!html.includes('data-viewed="trailer"')) throw new Error("staged index.html is not the trailer page");
  return { dir, files };
}

async function publish() {
  const { dir, files } = await stage();
  try {
    console.log(`trailer → s3://${BUCKET}/  (${files.length} files)`);
    if (DRY) files.forEach((f) => console.log(`    ${f}`));

    const dest = `s3://${BUCKET}/`;
    const text = ["*.html", "*.json", "*.js", "*.css"];
    run("aws", [...PROFILE, "s3", "sync", dir, dest, "--delete", "--cache-control", DAY, ...text.flatMap((p) => ["--exclude", p])]);
    run("aws", [...PROFILE, "s3", "sync", dir, dest, "--delete", "--cache-control", NO_CACHE, "--exclude", "*", ...text.flatMap((p) => ["--include", p])]);
    if (!DIST_ID && DRY) console.log("  $ aws cloudfront create-invalidation --distribution-id <unset> --paths /*");
    else if (!DIST_ID) throw new Error("no distribution id: set tools/trailer.json distributionId or TRAILER_DISTRIBUTION_ID");
    else run("aws", [...PROFILE, "cloudfront", "create-invalidation", "--distribution-id", DIST_ID, "--paths", "/*"]);
    console.log(`\n  https://${HOST}/`);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

publish().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
