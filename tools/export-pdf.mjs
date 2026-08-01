/* ═══ CYPH deck → PDF ═══
   Walks the deck exactly the way a viewer does (advance, advance, advance),
   waits for every animation on each state to land, screenshots it, and packs
   the frames into cyph-deck.pdf.

   Sub-steps count as their own page — the layer stack on s5 (01/02/03/∞), the
   two cyph flyers on s8, and the two founder bios after "ready for a demo?" —
   because that is what the viewer actually sees.

   Run:  npm run pdf
   Notes:
   - Uses the system Google Chrome (`channel: "chrome"`), NOT Playwright's
     bundled Chromium: the cover + close slides play H.264 video and the
     bundled build ships without proprietary codecs, so those frames would
     export black.
   - Serves the deck over 127.0.0.1 so auth.js takes its localhost bypass
     (`markAuthed("local dev")`) and the gate never shows.
*/

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "cyph-deck.pdf");

/* deck design size — #game-shell is exactly this, and computeFitScale()
   resolves to 1 at this viewport, so no scaling is involved. */
const W = 1440;
const H = 900;
const DPR = 2; // 2880×1800 JPEGs, same as the previous export
const JPEG_QUALITY = 85;
const MAX_STATES = 60; // runaway guard; the deck is ~22

/* ── static server ── */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function serve() {
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (rel === "/") rel = "/index.html";
    const file = path.join(ROOT, rel);
    /* keep the server inside the deck directory */
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Content-Length": buf.length,
        "Accept-Ranges": "none",
      });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

/* ── in-page settle: every animation on this state has landed ──
   Three things can still be moving after a navigation:
     1. anime.js tweens (deck.js `runA`) — drain `anime.running`
     2. CSS transitions + finite keyframes — await `getAnimations()`, skipping
        the 26 infinite drift/float loops which never finish by design
     3. deck.js's own `busy` latch, which gates the next advance
   We re-check until the set of running animations is stable, so a tween that
   starts a follow-up tween doesn't slip through. */
const SETTLE = () =>
  new Promise((resolve) => {
    const deadline = Date.now() + 15000;
    const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const pending = () => {
      const tweens = typeof anime !== "undefined" ? anime.running.length : 0;
      const css = document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .filter((a) => {
          const t = a.effect && a.effect.getTiming();
          return !t || t.iterations !== Infinity;
        });
      /* `busy` is a top-level `let` in deck.js — a global lexical binding,
         reachable from here even though it is not on `window`. */
      const latched = typeof busy !== "undefined" && busy === true;
      return { tweens, css, latched };
    };

    (async () => {
      let quiet = 0;
      while (Date.now() < deadline) {
        const { tweens, css, latched } = pending();
        if (tweens === 0 && css.length === 0 && !latched) {
          quiet++;
          if (quiet >= 3) break; // stable across 3 consecutive frames
        } else {
          quiet = 0;
          if (css.length) {
            await Promise.race([
              Promise.all(css.map((a) => a.finished.catch(() => {}))),
              new Promise((r) => setTimeout(r, 2000)),
            ]);
          }
        }
        await raf2();
      }
      /* paint buffer — lets the compositor flush the final frame */
      await new Promise((r) => setTimeout(r, 250));
      resolve();
    })();
  });

/* ── PDF writer ──
   One JPEG per page, embedded byte-for-byte as a DCTDecode XObject scaled to
   the 1440×900pt page box. No re-encoding, no dependencies. */
function buildPdf(frames, title) {
  const chunks = [];
  let len = 0;
  const push = (b) => {
    const buf = Buffer.isBuffer(b) ? b : Buffer.from(b, "latin1");
    chunks.push(buf);
    len += buf.length;
  };

  const n = frames.length;
  const offsets = [];
  const obj = (num, body, stream) => {
    offsets[num] = len;
    push(`${num} 0 obj\n${body}\n`);
    if (stream) {
      push("stream\n");
      push(stream);
      push("\nendstream\n");
    }
    push("endobj\n");
  };

  push("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n");

  const kids = frames.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);

  frames.forEach((f, i) => {
    const p = 3 + i * 3;
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    obj(
      p,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] ` +
        `/Resources << /XObject << /Im0 ${p + 2} 0 R >> /ProcSet [/PDF /ImageC] >> ` +
        `/Contents ${p + 1} 0 R >>`,
    );
    obj(p + 1, `<< /Length ${content.length} >>`, Buffer.from(content, "latin1"));
    obj(
      p + 2,
      `<< /Type /XObject /Subtype /Image /Width ${W * DPR} /Height ${H * DPR} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${f.length} >>`,
      f,
    );
  });

  const d = new Date();
  const z = (v) => String(v).padStart(2, "0");
  const stamp =
    `D:${d.getUTCFullYear()}${z(d.getUTCMonth() + 1)}${z(d.getUTCDate())}` +
    `${z(d.getUTCHours())}${z(d.getUTCMinutes())}${z(d.getUTCSeconds())}Z`;
  const info = 3 + n * 3;
  obj(info, `<< /Title (${title}) /Producer (cyph-deck tools/export-pdf.mjs) /CreationDate (${stamp}) /ModDate (${stamp}) >>`);

  const size = info + 1;
  const startxref = len;
  push(`xref\n0 ${size}\n0000000000 65535 f \n`);
  for (let i = 1; i < size; i++) {
    push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${size} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`);

  return Buffer.concat(chunks);
}

/* ── main ── */
const { server, port } = await serve();
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--autoplay-policy=no-user-gesture-required", "--force-color-profile=srgb"],
});
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: DPR,
  reducedMotion: "no-preference",
});

/* auth.js posts every view to a Google Apps Script sheet — an export is not
   a viewing, so don't pollute the access log. */
await page.route("https://script.google.com/**", (r) => r.abort());

console.log(`serving ${ROOT} on 127.0.0.1:${port}`);
/* "load", not "networkidle": the two <video> elements stream on a loop, so
   the network never actually goes idle. The explicit asset wait below is the
   real readiness gate. */
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load" });

/* every asset decoded and both videos showing a real frame before we start —
   otherwise the cover exports as a black rectangle */
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((img) =>
      img.complete ? Promise.resolve() : img.decode().catch(() => {}),
    ),
  );
  await Promise.all(
    [...document.querySelectorAll("video")].map(
      (v) =>
        new Promise((res) => {
          if (v.readyState >= 2) return res();
          v.addEventListener("loadeddata", res, { once: true });
          setTimeout(res, 8000);
        }),
    ),
  );
});

/* the shell's 0.8s entrance + deck.js's 800ms init timer before runA(0) */
await page.waitForTimeout(2000);
await page.evaluate(SETTLE);

const frames = [];
let prevSig = null;

for (let i = 0; i < MAX_STATES; i++) {
  const sig = await page.evaluate(() => {
    const ctr = document.getElementById("hudCtr");
    return [
      ctr ? ctr.textContent.trim() : "?",
      typeof layerStep !== "undefined" ? layerStep : 0,
      typeof arenaStep !== "undefined" ? arenaStep : 0,
      typeof founderStep !== "undefined" ? founderStep : 0,
    ].join("|");
  });

  if (sig === prevSig) {
    console.log("end of deck");
    break;
  }
  prevSig = sig;

  /* s8's flyer carries its cyph title + headcount pill in a :hover reveal
     (.cyph-flyer-drift:hover .cyph-flyer-hover). Without the pointer parked
     on it the exported page shows a captionless image, so hover it, hold for
     the scrim/pill fade, and release afterwards. Everywhere else the mouse
     stays at 0,0, which touches nothing. */
  const onFlyer = sig.startsWith("09/16");
  if (onFlyer) {
    /* mouse.move over the box centre rather than locator.hover(): the flyer
       runs an infinite drift keyframe, so Playwright's actionability check
       never sees it "stable" and would time out. */
    const box = await page.locator("#s8 .cyph-flyer-drift").boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(500);
  }

  frames.push(await page.screenshot({ type: "jpeg", quality: JPEG_QUALITY }));
  console.log(`captured page ${frames.length}  (${sig})`);

  if (onFlyer) await page.mouse.move(0, 0);

  await page.evaluate(() => document.getElementById("navNext").click());
  await page.waitForTimeout(300); // let doGo's 180ms handoff start
  await page.evaluate(SETTLE);
}

await browser.close();
server.close();

const pdf = buildPdf(frames, "cyph-deck");
fs.writeFileSync(OUT, pdf);
console.log(`\nwrote ${path.relative(process.cwd(), OUT)} — ${frames.length} pages, ${(pdf.length / 1e6).toFixed(1)} MB`);
