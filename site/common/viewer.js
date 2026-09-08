/* ═══ CYPH — page viewer ═══
   A column of page images: the one-pager, a partner deck, anything that
   exists as a PDF first. Generalizes the deck's phone view (mobile.js): the
   pages come from a folder written by the same run that made the PDF, so
   the screen and the download cannot drift.

     <div id="hudCtr" hidden></div>            auth.js reads dwell time from here
     <script src="/common/auth.js" data-viewed="onepager"></script>
     <script src="/common/viewer.js"
             data-dir="pages/"                  folder with NN.webp + manifest.json
             data-pdf="cyph-onepager.pdf"       the download, shown once authed
             data-pdf-label="download the pdf"
             data-alt="cyph one-pager"></script>
     <script type="application/json" id="cta">[{"label":"...","href":"..."}]</script>

   The footer (PDF + CTA row) is only added once body.authed is set, so a
   gated page never has the links in its markup before the gate. */

(function () {
  var script = document.currentScript;
  var ds = (script && script.dataset) || {};
  var DIR = ds.dir || "pages/";
  var PDF = ds.pdf || null;
  var PDF_LABEL = ds.pdfLabel || "download the pdf";
  var ALT = ds.alt || "page";
  var FALLBACK = { pages: 1, width: 1440, height: 900 };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* auth.js tracks per-page dwell time by observing #hudCtr's text. */
  function reportPage(n, total) {
    var hud = document.getElementById("hudCtr");
    if (hud) hud.textContent = pad(n) + "/" + pad(total);
  }

  function readCta() {
    var el = document.getElementById("cta");
    if (!el) return [];
    try {
      var v = JSON.parse(el.textContent || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function build(m) {
    var total = m.pages;
    var root = document.createElement("div");
    root.id = "viewer";

    var hud = document.createElement("div");
    hud.className = "viewer-hud";
    hud.innerHTML =
      '<span class="station-bullets">' +
      '<span class="station-bullet paprika">C</span>' +
      '<span class="station-bullet cornflower">Y</span>' +
      '<span class="station-bullet amber">P</span>' +
      '<span class="station-bullet amaranth">H</span>' +
      "</span>" +
      '<span class="viewer-counter" id="viewerCounter">01/' +
      pad(total) +
      "</span>";

    var pages = document.createElement("div");
    pages.className = "viewer-pages";
    if (total === 1) pages.classList.add("single");

    for (var i = 1; i <= total; i++) {
      var sec = document.createElement("div");
      sec.className = "vpage";
      var img = document.createElement("img");
      img.src = DIR + pad(i) + ".webp";
      img.alt = ALT + " — page " + i + " of " + total;
      img.loading = i <= 2 ? "eager" : "lazy";
      img.decoding = "async";
      img.width = m.width;
      img.height = m.height;
      img.style.aspectRatio = m.width + " / " + m.height;
      sec.appendChild(img);
      pages.appendChild(sec);
    }

    root.appendChild(hud);
    root.appendChild(pages);
    document.body.appendChild(root);

    track(pages, total);
    whenAuthed(function () {
      foot(root);
    });
  }

  /* PDF + CTA row. Built only after the gate has opened. */
  function foot(root) {
    var links = [];
    if (PDF) links.push({ label: PDF_LABEL, href: PDF, download: true });
    readCta().forEach(function (c) {
      if (c && c.href && c.label) links.push(c);
    });
    if (!links.length) return;
    var f = document.createElement("div");
    f.className = "viewer-foot";
    links.forEach(function (l) {
      var a = document.createElement("a");
      a.href = l.href;
      a.textContent = l.label;
      if (l.download) a.setAttribute("download", "");
      else if (/^https?:/.test(l.href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }
      f.appendChild(a);
    });
    root.appendChild(f);
  }

  function whenAuthed(cb) {
    if (document.body.classList.contains("authed")) return cb();
    var mo = new MutationObserver(function () {
      if (!document.body.classList.contains("authed")) return;
      mo.disconnect();
      cb();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  /* counter follows whichever page is nearest the middle of the viewport */
  function track(scroller, total) {
    var counter = document.getElementById("viewerCounter");
    var els = scroller.querySelectorAll(".vpage");
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
        var idx = Array.prototype.indexOf.call(els, best.target);
        if (idx >= 0) set(idx + 1);
      },
      { root: scroller, threshold: [0.25, 0.5, 0.75] },
    );
    els.forEach(function (el) {
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
        build(m && m.pages ? m : FALLBACK);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
