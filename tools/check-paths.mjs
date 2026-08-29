/* ═══ CYPH deck — viewing-path check ═══
   Asserts that the router in index.html sends each device down the right path
   and, just as importantly, that the path it did NOT choose was never fetched.

   The failure this guards against is silent: a phone that still pulls
   styles.css and three.js works, it is just slow, and nothing on screen says
   so. Only the request log tells you.

   Run:  npm run check
*/

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, devices } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file, (err, buf) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, {
      "Content-Type":
        MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    });
    res.end(buf);
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${label}${ok ? "" : ` — got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`}`,
  );
}

const browser = await chromium.launch({ channel: "chrome" });

async function visit(label, contextOpts, query = "") {
  const ctx = await browser.newContext(contextOpts);
  const page = await ctx.newPage();
  const reqs = [];
  const errs = [];
  page.on("request", (r) => reqs.push(r.url()));
  page.on("response", (r) => {
    if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`);
  });
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => {
    /* the access-log POST is expected to fail against a local server */
    if (m.type() === "error" && !m.text().includes("script.google.com"))
      errs.push(m.text());
  });
  await page.route("https://script.google.com/**", (r) => r.abort());
  await page.goto(`http://127.0.0.1:${port}/index.html${query}`, {
    waitUntil: "load",
  });
  await page.waitForTimeout(2500);
  /* auth.js takes its localhost bypass against this server, so the gate is
     already dismissed. Put it back on screen before measuring it — the point
     of the gate assertions is that base.css styles it on both paths, and a
     display:none element measures zero no matter how well it is styled. */
  await page.evaluate(() => document.body.classList.remove("authed"));
  const got = (suffix) => reqs.some((u) => u.endsWith(suffix));
  const state = await page.evaluate(() => ({
    cls: document.documentElement.className,
    mobileDeck: !!document.getElementById("mobile-deck"),
    pages: document.querySelectorAll(".mpage").length,
    /* the page view carries no actions at all — no route into the
       interactive deck, and no PDF download either */
    deckLinks: document.querySelectorAll("#mobile-deck a, #mobile-deck button")
      .length,
    /* the gate must render legibly on both paths even though only one of them
       loads the big desktop sheet */
    gateStyled:
      getComputedStyle(document.getElementById("auth-gate")).position ===
      "fixed",
    bulletStyled:
      Math.round(
        document
          .querySelector("#auth-gate .station-bullet")
          .getBoundingClientRect().width,
      ) > 10,
  }));
  await ctx.close();
  return { label, reqs, errs, state, got };
}

/* ── phone ── */
console.log("\niPhone 14 Pro (393x852, coarse pointer)");
{
  const { state, got, errs } = await visit("phone", {
    ...devices["iPhone 14 Pro"],
  });
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "assets/deck-pages/manifest.json")),
  );
  check("routed to the page view", state.cls.includes("phone"), true);
  check("page view mounted", state.mobileDeck, true);
  check("every exported page rendered", state.pages, manifest.pages);
  check("access gate is styled", state.gateStyled, true);
  check("gate bullets are styled", state.bulletStyled, true);
  check("page view offers no links or buttons", state.deckLinks, 0);
  check("mobile.css fetched", got("/mobile.css"), true);
  check("mobile.js fetched", got("/mobile.js"), true);
  check("styles.css NOT fetched", got("/styles.css"), false);
  check("deck.js NOT fetched", got("/deck.js"), false);
  check("iso3d.js NOT fetched", got("/iso3d.js"), false);
  check("three.js NOT fetched", got("three.module.js"), false);
  check("no page errors", errs.length, 0);
  if (errs.length) console.log("   ", errs);
}

/* ── phone, landscape: the case a width-only media query gets wrong ── */
console.log("\niPhone landscape (852x393)");
{
  const { state } = await visit("phone-landscape", {
    ...devices["iPhone 14 Pro landscape"],
  });
  check("still routed to the page view", state.cls.includes("phone"), true);
  check("page view mounted", state.mobileDeck, true);
}

/* ── iPad: keeps the interactive deck ── */
console.log("\niPad Pro 11 (834x1194, coarse pointer)");
{
  const { state, got } = await visit("ipad", { ...devices["iPad Pro 11"] });
  check("routed to the interactive deck", state.cls.includes("desktop"), true);
  check("styles.css fetched", got("/styles.css"), true);
  check("deck.js fetched", got("/deck.js"), true);
}

/* ── desktop ── */
console.log("\nDesktop (1440x900)");
{
  const { state, got, errs } = await visit("desktop", {
    viewport: { width: 1440, height: 900 },
  });
  check("routed to the interactive deck", state.cls.includes("desktop"), true);
  check("page view NOT mounted", state.mobileDeck, false);
  check("access gate is styled", state.gateStyled, true);
  check("styles.css fetched", got("/styles.css"), true);
  check("deck.js fetched", got("/deck.js"), true);
  check("iso3d.js fetched", got("/iso3d.js"), true);
  check("mobile.js NOT fetched", got("/mobile.js"), false);
  check("mobile.css NOT fetched", got("/mobile.css"), false);
  check("no page errors", errs.length, 0);
  if (errs.length) console.log("   ", errs);
}

/* ── escape hatches ── */
console.log("\nEscape hatches");
{
  const forcedDesktop = await visit(
    "?desktop=1",
    { ...devices["iPhone 14 Pro"] },
    "?desktop=1",
  );
  check(
    "?desktop=1 on a phone gives the deck",
    forcedDesktop.state.cls.includes("desktop"),
    true,
  );
  const forcedMobile = await visit(
    "?mobile=1",
    { viewport: { width: 1440, height: 900 } },
    "?mobile=1",
  );
  check(
    "?mobile=1 on a laptop gives the page view",
    forcedMobile.state.mobileDeck,
    true,
  );
}

await browser.close();
server.close();

console.log(
  failures ? `\n${failures} check(s) failed\n` : "\nall checks passed\n",
);
process.exit(failures ? 1 : 0);
