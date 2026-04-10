/* ═══ CYPH — access gate ═══
   Soft email gate. Not protection — anyone with an email can get in.
   This is a chain-of-custody marker: every viewer self-identifies and
   their entry gets logged (if LOG_URL is set), so you can see who has
   opened the deck and when.

   Validation: input must contain an "@" sign. That's it.

   To enable access logging: create a Google Apps Script web app that
   appends rows to a Sheet, then paste its /exec URL into LOG_URL below.
   If LOG_URL is empty the logger is a silent no-op. Instructions at the
   bottom of this file. */

var LOG_URL =
  "https://script.google.com/macros/s/AKfycbzYkyBPNMGYTx2DpLb-vyFENWOGS0DrG12JW8Iud2r9FLG-wHtonujO7rvZqNjLJepi/exec";

(function () {
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";

  function markAuthed(email) {
    sessionStorage.setItem("cyph-authed", "1");
    sessionStorage.setItem("cyph-email", email || "");
    document.body.classList.add("authed");
  }

  function isAuthed() {
    return sessionStorage.getItem("cyph-authed") === "1";
  }

  function postLog(payload) {
    if (!LOG_URL) return;
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

  function bankCurrentSlide() {
    if (currentSlideKey == null || currentSlideStart == null) return;
    var elapsed = Date.now() - currentSlideStart;
    if (elapsed <= 0) return;
    slideTimings[currentSlideKey] =
      (slideTimings[currentSlideKey] || 0) + elapsed;
    currentSlideStart = Date.now();
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
    logAccess(email);
    startTracking();
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* localhost bypass — no prompt when running locally */
    if (isLocal) {
      markAuthed("local dev");
      startTracking();
      return;
    }
    /* already authed in this session — skip the gate */
    if (isAuthed()) {
      document.body.classList.add("authed");
      startTracking();
      return;
    }
    var form = document.getElementById("auth-form");
    if (form) form.addEventListener("submit", handleSubmit);
    var input = document.getElementById("auth-input");
    if (input) input.focus();
  });
})();

/* ─── Google Apps Script setup (optional, for access + slide-time logging) ───

1. Create a new Google Sheet with two tabs:
      "access"  — headers: timestamp | email | userAgent | referrer | href
      "timings" — headers: timestamp | email | reason | totalSec | timings | href
2. Extensions → Apps Script. Replace the file contents with:

      function doPost(e) {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var d = JSON.parse(e.postData.contents);
        if (d.type === "timings") {
          var sheet = ss.getSheetByName("timings") || ss.insertSheet("timings");
          var totalMs = 0;
          Object.keys(d.timings).forEach(function (k) {
            totalMs += d.timings[k];
          });
          sheet.appendRow([
            d.timestamp, d.email, d.reason,
            Math.round(totalMs / 1000),
            JSON.stringify(d.timings),
            d.href
          ]);
        } else {
          var sheet = ss.getSheetByName("access") || ss.getActiveSheet();
          sheet.appendRow([
            d.timestamp, d.email,
            d.userAgent, d.referrer, d.href
          ]);
        }
        return ContentService.createTextOutput("ok");
      }

3. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone.
4. Copy the /exec URL and paste it into LOG_URL at the top of this file.
5. Commit and push. Every email submission appends an "access" row;
   every 30s (and on tab hide / unload) appends a "timings" row containing
   accumulated milliseconds-per-slide for the current viewing session.

If you already have an older deployment that only handles access logging,
update the script as above and re-deploy: Deploy → Manage deployments →
pencil → New version → Deploy. The /exec URL stays the same. */
