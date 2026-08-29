/* ═══ CYPH deck — the page view (phones) ═══
   Builds a swipeable column of the exported deck pages. Runs only when the
   router in index.html's <head> has flagged this as a phone, in which case
   deck.js, iso3d.js and three.js are never loaded at all.

   The pages come from assets/deck-pages/, written by tools/export-pdf.mjs in
   the same run that writes cyph-deck.pdf — so the phone view and the PDF are
   always the same deck as the desktop one, with no second thing to maintain.

   Page count comes from the manifest rather than a constant here, so adding
   or removing a slide needs no change to this file. */

(function () {
  var DIR = "assets/deck-pages/";
  var FALLBACK_PAGES = 22; /* only if the manifest is unreachable */

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* auth.js tracks per-slide dwell time by observing #hudCtr's text. Writing
     the current page into it means phone sessions land in the same sheet as
     desktop ones, with no change to auth.js. */
  function reportPage(n, total) {
    var hud = document.getElementById("hudCtr");
    if (hud) hud.textContent = pad(n) + "/" + pad(total);
  }

  function build(total) {
    var root = document.createElement("div");
    root.id = "mobile-deck";

    var hud = document.createElement("div");
    hud.className = "mdeck-hud";
    hud.innerHTML =
      '<span class="station-bullets">' +
      '<span class="station-bullet paprika">C</span>' +
      '<span class="station-bullet cornflower">Y</span>' +
      '<span class="station-bullet amber">P</span>' +
      '<span class="station-bullet amaranth">H</span>' +
      "</span>" +
      '<span class="mdeck-counter" id="mdeckCounter">01/' +
      pad(total) +
      "</span>";

    var pages = document.createElement("div");
    pages.className = "mdeck-pages";

    for (var i = 1; i <= total; i++) {
      var sec = document.createElement("div");
      sec.className = "mpage";
      var img = document.createElement("img");
      img.src = DIR + pad(i) + ".webp";
      img.alt = "cyph deck — page " + i + " of " + total;
      /* the first two are eager so the cover paints immediately; the rest
         stream in as they are approached */
      img.loading = i <= 2 ? "eager" : "lazy";
      img.decoding = "async";
      img.width = 1440;
      img.height = 900;
      sec.appendChild(img);
      pages.appendChild(sec);
    }

    /* No footer: the page view carries no actions at all. The interactive
       deck is never offered (a 1440x900 stage scales to ~0.27 on a phone, so
       any route to it from here leads somewhere unreadable), and neither is a
       PDF download — the pages on screen already are the deck. */
    root.appendChild(hud);
    root.appendChild(pages);
    document.body.appendChild(root);

    track(pages, total);
  }

  /* counter follows whichever page is nearest the middle of the viewport */
  function track(scroller, total) {
    var counter = document.getElementById("mdeckCounter");
    var imgs = scroller.querySelectorAll(".mpage");
    var current = 0;

    function set(n) {
      if (n === current) return;
      current = n;
      if (counter) counter.textContent = pad(n) + "/" + pad(total);
      reportPage(n, total);
    }

    if (!("IntersectionObserver" in window)) {
      set(1);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        var best = null;
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        });
        if (!best) return;
        var idx = Array.prototype.indexOf.call(imgs, best.target);
        if (idx >= 0) set(idx + 1);
      },
      { root: scroller, threshold: [0.25, 0.5, 0.75] },
    );
    imgs.forEach(function (el) {
      io.observe(el);
    });
    set(1);
  }

  function start() {
    fetch(DIR + "manifest.json", { cache: "no-cache" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      })
      .then(function (m) {
        build(m && m.pages ? m.pages : FALLBACK_PAGES);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
