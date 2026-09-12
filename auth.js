/* ═══ CYPH — access gate ═══
   Soft email gate. Not protection — anyone with an email can get in.
   This is a chain-of-custody marker: every viewer self-identifies and
   their entry gets logged, so you can see who has opened what and when.

   Validation: input must contain an "@" sign. That's it.

   The same file is served on every surface — the GitHub Pages deck, each
   versioned deck at investors.cyph.city/deck/<version>/, the one-pager,
   and every partner deck and invite at events.cyph.city. The page tells
   it which surface it is through the script tag's data-* attributes
   (window.CYPH_GATE works too):

     data-mode      "gate" (default) | "open"
                    open = no prompt at all, the view is still logged
     data-viewed    surface id for the sheet's `viewed` column
                    (defaults: deck/<version> from the path, or deck/gh-pages)
     data-meta      JSON string logged as-is, e.g. {"guest":"7f2k90ab"}
     data-versions  URL of versions.json; a deck version marked live:false
                    shows the retired screen instead of the gate

   The logger is a Google Apps Script web app; its source is
   apps-script/Code.gs. If LOG_URL is empty the logger is a silent no-op. */

var LOG_URL =
  "https://script.google.com/macros/s/AKfycbzYkyBPNMGYTx2DpLb-vyFENWOGS0DrG12JW8Iud2r9FLG-wHtonujO7rvZqNjLJepi/exec";

(function () {
  var host = location.hostname;
  /* *.localhost is `make dev-lite` (scripts/cyph-sites.mjs): investors.localhost
     is this host, events.localhost is event-decks. Same bypass as localhost so
     a dev session never reaches the access sheet. */
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "" || /\.localhost$/.test(host);

  /* ─── which surface is this ─── */
  var script = document.currentScript;
  var ds = (script && script.dataset) || {};
  var win = window.CYPH_GATE || {};
  function cfg(key) {
    if (ds[key] != null && ds[key] !== "") return ds[key];
    if (win[key] != null && win[key] !== "") return win[key];
    return null;
  }
  var MODE = cfg("mode") === "open" ? "open" : "gate";
  var VERSIONS_URL = cfg("versions");

  /* /deck/<version>/ anywhere → the version is the surface */
  var versionMatch = location.pathname.match(/^\/deck\/([^/]+)\//);
  var VERSION = versionMatch ? versionMatch[1] : null;

  function deriveViewed() {
    if (VERSION) return "deck/" + VERSION;
    var explicit = cfg("viewed");
    if (explicit) return explicit;
    if (/\.github\.io$/.test(host)) return "deck/gh-pages";
    var p = location.pathname
      .replace(/\/index\.html$/, "")
      .replace(/^\/+|\/+$/g, "");
    return p || "deck";
  }
  var VIEWED = deriveViewed();

  function parseMeta(raw) {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      var v = JSON.parse(raw);
      return v && typeof v === "object" ? v : null;
    } catch (e) {
      return null;
    }
  }
  var META = parseMeta(cfg("meta"));

  /* ─── auth state ─── */
  function markAuthed(email) {
    sessionStorage.setItem("cyph-authed", "1");
    sessionStorage.setItem("cyph-email", email || "");
    document.body.classList.add("authed");
  }

  function isAuthed() {
    return sessionStorage.getItem("cyph-authed") === "1";
  }

  /* ─── logger ─── */
  function postLog(payload) {
    if (!LOG_URL) return;
    payload.viewed = VIEWED;
    payload.meta = META;
    var body = JSON.stringify(payload);
    /* sendBeacon survives unload/pagehide where fetch() can be cancelled.
       It only allows simple content types — text/plain matches what the
       Apps Script web app already accepts, so no preflight is required. */
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "text/plain;charset=utf-8" });
        if (navigator.sendBeacon(LOG_URL, blob)) return;
      }
    } catch (e) {}
    try {
      fetch(LOG_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        keepalive: true,
        body: body,
      }).catch(function () {});
    } catch (e) {}
  }

  function logAccess(email) {
    postLog({
      type: "access",
      email: email,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      href: location.href,
    });
  }

  /* One access row per surface per tab session. sessionStorage is per
     origin, so an email entered on /deck/sept26/ also opens /onepager/ in
     the same tab — this is what still puts a row in the sheet for it. */
  function logAccessOnce(email) {
    var key = "cyph-logged:" + VIEWED;
    if (sessionStorage.getItem(key) === "1") return;
    sessionStorage.setItem(key, "1");
    logAccess(email);
  }

  /* ─── per-slide time tracking ───
     deck.js writes the current slide number into #hudCtr ("01/15", "02/15"
     …) on every navigation — both sequential go() and direct goTo(). We
     observe that element as the single source of truth: when its text
     changes, we close out the prior slide's elapsed time and start a new
     interval for the new slide. Times are accumulated locally and flushed
     to LOG_URL periodically + on tab hide / unload. */
  var slideTimings = {}; // { "01": milliseconds, "02": milliseconds, ... }
  var currentSlideKey = null;
  var currentSlideStart = null;
  var sessionStart = null;
  var trackingStarted = false;

  function readSlideKey() {
    var el = document.getElementById("hudCtr");
    if (!el) return null;
    var t = (el.textContent || "").trim();
    if (!t) return null;
    return t.split("/")[0]; // "01"
  }

  /* per-slide cap: 3 minutes. if a viewer leaves a tab open on one slide
     for hours, we don't want that to bloat the sheet — anything past 3min
     of attention is treated the same as 3min for analytics purposes. */
  var SLIDE_CAP_MS = 3 * 60 * 1000;

  function bankCurrentSlide() {
    if (currentSlideKey == null || currentSlideStart == null) return;
    var elapsed = Date.now() - currentSlideStart;
    currentSlideStart = Date.now();
    if (elapsed <= 0) return;
    var prior = slideTimings[currentSlideKey] || 0;
    if (prior >= SLIDE_CAP_MS) return;
    slideTimings[currentSlideKey] = Math.min(prior + elapsed, SLIDE_CAP_MS);
  }

  function onSlidePossiblyChanged() {
    var key = readSlideKey();
    if (key == null || key === currentSlideKey) return;
    bankCurrentSlide();
    currentSlideKey = key;
    currentSlideStart = Date.now();
  }

  function flushTimings(reason) {
    bankCurrentSlide();
    var keys = Object.keys(slideTimings);
    if (keys.length === 0) return;
    postLog({
      type: "timings",
      reason: reason,
      email: sessionStorage.getItem("cyph-email") || "",
      timestamp: new Date().toISOString(),
      sessionStart: sessionStart,
      timings: slideTimings,
      href: location.href,
    });
  }

  function startTracking() {
    if (trackingStarted) return;
    var hudCtr = document.getElementById("hudCtr");
    if (!hudCtr) return;
    trackingStarted = true;
    sessionStart = new Date().toISOString();
    currentSlideKey = readSlideKey();
    currentSlideStart = Date.now();
    try {
      new MutationObserver(onSlidePossiblyChanged).observe(hudCtr, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    } catch (e) {}
    /* periodic safety-net flush in case neither pagehide nor visibilitychange
       fires (rare on desktop, more common on mobile when the OS kills tabs) */
    setInterval(function () {
      flushTimings("interval");
    }, 30000);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) flushTimings("hidden");
    });
    window.addEventListener("pagehide", function () {
      flushTimings("pagehide");
    });
    window.addEventListener("beforeunload", function () {
      flushTimings("beforeunload");
    });
  }

  /* ─── retirement ───
     Only a versioned deck can be retired, and only when the page names a
     versions.json. Anything that goes wrong on the way falls through to
     the normal gate: a live deck must never be bricked by this check. */
  function checkRetired(cb) {
    if (!VERSION || !VERSIONS_URL) return cb(false);
    fetch(VERSIONS_URL, { cache: "no-cache" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      })
      .then(function (v) {
        var list = (v && v.versions) || [];
        var hit = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i] && list[i].id === VERSION) hit = list[i];
        }
        cb(!!hit && hit.live === false);
      });
  }

  /* ─── the gate ─── */
  function handleSubmit(e) {
    e.preventDefault();
    var input = document.getElementById("auth-input");
    var err = document.getElementById("auth-err");
    var email = (input.value || "").trim().toLowerCase();
    if (email.indexOf("@") === -1) {
      err.textContent = "please enter a valid email";
      input.focus();
      return;
    }
    markAuthed(email);
    logAccessOnce(email);
    startTracking();
  }

  function wireForm() {
    var form = document.getElementById("auth-form");
    if (form) form.addEventListener("submit", handleSubmit);
    var input = document.getElementById("auth-input");
    if (input) input.focus();
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* localhost bypass — no prompt when running locally, and skip
       slide-time tracking too so dev sessions don't pollute the sheet */
    if (isLocal) {
      markAuthed("local dev");
      return;
    }
    /* open surfaces (a personal invite) — nothing to type, the view is
       logged, and nothing is written to sessionStorage so an open page
       never unlocks a gated one on the same origin */
    if (MODE === "open") {
      document.body.classList.add("authed");
      logAccessOnce("");
      startTracking();
      return;
    }
    checkRetired(function (retired) {
      if (retired) {
        document.body.classList.add("retired");
        return;
      }
      /* already authed in this session — skip the gate */
      if (isAuthed()) {
        document.body.classList.add("authed");
        logAccessOnce(sessionStorage.getItem("cyph-email") || "");
        startTracking();
        return;
      }
      wireForm();
    });
  });
})();
