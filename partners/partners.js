/* ═══ CYPH partner deck — navigation + animations (desktop) ═══
   The partner deck's deck.js. Same contract as deck.js — `go` / `goTo`,
   `cur`, `busy`, `layerStep`, #hudCtr — so tools/export-pdf.mjs and auth.js
   drive it exactly the way they drive the investor deck.

   Slides are addressed by id, not by `s` + index: the reused investor slides
   keep their own ids (s0..s4, s13, s15) so styles.css applies unchanged.
   The entrance animations for those slides are deck.js's, copied as-is. */

const SLIDES = ["s0", "s1", "s2", "s3", "s4", "hiw", "s13", "s15"];
const T = SLIDES.length;
const HIW = SLIDES.indexOf("hiw");
let cur = 0;
let busy = false;
let goTimer = null;
let layerStep = 0;
let _prevCur = 0;

const ch = [
  "cyph",
  "founders",
  "crisis",
  "crisis",
  "solution",
  "solution",
  "solution",
  "close",
];

/* deck.js's bar values for the same slides, revenue column dropped */
const bars = [
  [10, 10, 5],
  [12, 12, 5],
  [15, 15, 8],
  [18, 18, 10],
  [22, 22, 12],
  [25, 25, 15],
  [95, 88, 80],
  [100, 100, 100],
];
const barIds = ["bar0", "bar1", "bar3"];

const btnChapterMap = {
  cyph: "cyph",
  founders: "founders",
  problem: "crisis",
  solution: "solution",
  close: "close",
};

function el(i) {
  return document.getElementById(SLIDES[i]);
}
function pad(n) {
  return String(n).padStart(2, "0");
}

/* ── how it works: 01 underground / 02 cyph / 03 irl ── */
function updateHiw(step) {
  busy = true;
  document.querySelectorAll("#hiw [data-step]").forEach(function (node) {
    var on = +node.dataset.step === step;
    node.classList.toggle(
      node.classList.contains("hiw-step") ? "on" : "active",
      on,
    );
  });
  /* the cyph doorway loops only while its layer is selected (iso3d.js) */
  if (typeof window.setCyphDoorsActive === "function") {
    window.setCyphDoorsActive(step === 2);
  }
  if (step === 1) drawRoutes();
  setTimeout(function () {
    busy = false;
  }, 400);
}

/* s6's route draw, all four lines at once so it lands inside the settle gate */
function drawRoutes() {
  var lines = document.querySelectorAll("#hiw #transitSvg polyline");
  var stops = document.querySelectorAll("#hiw .stop, #hiw .stop-text");
  anime.remove(lines);
  anime.remove(stops);
  anime({
    targets: lines,
    strokeDashoffset: [900, 0],
    duration: 1500,
    delay: anime.stagger(200),
    easing: "easeInOutQuad",
  });
  anime({
    targets: stops,
    opacity: [0, 1],
    duration: 400,
    delay: anime.stagger(40, { start: 400 }),
    easing: "linear",
  });
}

/* ── backgrounds, HUD, bars for slide i ── */
function paint(i) {
  var nc = ch[i];
  ["shell", "nextsteps"].forEach(function (c) {
    var bg = document.getElementById("bg-" + c);
    if (bg) bg.style.opacity = "1";
  });
  document.getElementById("hudCtr").textContent = pad(i + 1) + "/" + pad(T);
  document.getElementById("bhudCtr").textContent = pad(i + 1) + "/" + pad(T);
  var f = document.getElementById("xpFill");
  f.style.width = Math.round((i / (T - 1)) * 100) + "%";
  f.style.background = nc === "crisis" ? "var(--orange)" : "var(--yellow)";
  document.querySelectorAll(".hud-nav-btn").forEach(function (btn) {
    btn.classList.toggle(
      "active",
      btnChapterMap[btn.textContent.trim()] === nc,
    );
  });
  bars[i].forEach(function (w, j) {
    document.getElementById(barIds[j]).style.width = w + "%";
  });
}

/* ── sequential navigation (arrows / bottom buttons) ── */
function go(i) {
  if (busy || i === cur) return;
  if (cur === HIW) {
    if (i > cur && layerStep < 3) {
      updateHiw(++layerStep);
      return;
    }
    if (i < cur && layerStep > 1) {
      updateHiw(--layerStep);
      return;
    }
  }
  if (i < 0 || i >= T) return;
  busy = true;
  _prevCur = cur;
  el(cur).classList.remove("active");
  paint(i);
  goTimer = setTimeout(function () {
    goTimer = null;
    el(i).classList.add("active");
    cur = i;
    runA(i);
    setTimeout(function () {
      busy = false;
    }, 500);
  }, 180);
}

/* ── direct jump from nav (always works, ignores busy) ── */
function goTo(i) {
  if (i < 0 || i >= T || i === cur) return;
  if (goTimer) {
    clearTimeout(goTimer);
    goTimer = null;
  }
  _prevCur = cur;
  busy = false;
  SLIDES.forEach(function (_, j) {
    el(j).classList.remove("active");
  });
  paint(i);
  el(i).classList.add("active");
  cur = i;
  runA(i);
}

/* ── fit-to-viewport scaling (deck.js) ── */
function vpWidth() {
  return (
    (window.visualViewport && window.visualViewport.width) || window.innerWidth
  );
}
function vpHeight() {
  return (
    (window.visualViewport && window.visualViewport.height) ||
    window.innerHeight
  );
}
function computeFitScale() {
  return Math.min(vpWidth() / 1440, vpHeight() / 900);
}
function applyFitScale() {
  var shell = document.getElementById("game-shell");
  if (!shell) return;
  shell.style.transform =
    "translate(-50%, -50%) scale(" + computeFitScale() + ")";
}
window.addEventListener("resize", applyFitScale);
window.addEventListener("orientationchange", applyFitScale);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", applyFitScale);
}

/* ── init (injected by the router, so DOMContentLoaded may have passed) ── */
function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}
onReady(function () {
  var shell = document.getElementById("game-shell");
  shell.style.setProperty("--fit-scale", computeFitScale());
  shell.classList.add("entered");
  setTimeout(function () {
    applyFitScale();
    runA(0);
  }, 800);

  var coverVideo = document.querySelector("#s0 .cover-bg-video");
  if (
    coverVideo &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    var pauseToFirstFrame = function () {
      coverVideo.pause();
      try {
        coverVideo.currentTime = 0;
      } catch (e) {}
    };
    pauseToFirstFrame();
    coverVideo.addEventListener("loadedmetadata", pauseToFirstFrame, {
      once: true,
    });
  }

  /* layers and dots on how it works jump straight to their step */
  document
    .querySelectorAll("#hiw .iso-layer, #hiw .layer-dot")
    .forEach(function (node) {
      node.addEventListener("click", function () {
        if (cur !== HIW) return;
        layerStep = +node.dataset.step;
        updateHiw(layerStep);
      });
    });
});

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
    e.preventDefault();
    go(cur + 1);
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    go(cur - 1);
  }
});
document.getElementById("navNext").addEventListener("click", function () {
  go(cur + 1);
});
document.getElementById("navPrev").addEventListener("click", function () {
  go(cur - 1);
});

/* ── per-slide entrance animations (deck.js's, by slide id) ── */
function runA(i) {
  const B = "easeOutBack",
    C = "easeOutCubic";
  switch (SLIDES[i]) {
    case "s0":
      anime({
        targets: "#s0 h1",
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: B,
      });
      anime({
        targets: "#s0 .cover-def",
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        delay: anime.stagger(120, { start: 150 }),
        easing: B,
      });
      anime({
        targets: "#s0 .cbadge",
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 450,
        delay: anime.stagger(100, { start: 300 }),
        easing: B,
      });
      break;
    case "s1":
      anime({
        targets: "#charA",
        translateX: [-30, 0],
        opacity: [0, 1],
        duration: 600,
        easing: B,
      });
      anime({
        targets: "#charB",
        translateX: [30, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 120,
        easing: B,
      });
      anime({
        targets: "#advisory",
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 600,
        delay: 260,
        easing: B,
      });
      setTimeout(function () {
        document
          .querySelectorAll("#s1 .badge-stat-fill")
          .forEach(function (bar, j) {
            anime({
              targets: bar,
              width: bar.dataset.fill + "%",
              duration: 700,
              delay: 100 + j * 80,
              easing: C,
            });
          });
      }, 400);
      break;
    case "s2":
      anime({
        targets: "#s2 .crisis-item",
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 450,
        delay: anime.stagger(140),
        easing: B,
      });
      setTimeout(function () {
        document.querySelectorAll("#s2 .threat-fill").forEach(function (b, j) {
          anime({
            targets: b,
            width: b.dataset.fill + "%",
            duration: 700,
            delay: j * 140,
            easing: C,
          });
        });
      }, 350);
      break;
    case "s3":
      anime({
        targets: "#s3 .tl-item",
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(200),
        easing: B,
      });
      break;
    case "s4":
      anime({
        targets: "#s4 h1",
        translateY: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: B,
      });
      anime({
        targets: "#s4 .sub",
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 500,
        delay: 150,
        easing: C,
      });
      break;
    case "hiw":
      layerStep = _prevCur > HIW ? 3 : 1;
      anime({
        targets: "#hiw .iso-layer",
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(120, { from: "last" }),
        easing: B,
      });
      anime({
        targets: "#hiw .hiw-anno",
        opacity: [0, 1],
        translateX: [20, 0],
        duration: 500,
        delay: 300,
        easing: C,
      });
      setTimeout(function () {
        updateHiw(layerStep);
      }, 100);
      break;
    case "s13":
      anime({
        targets: "#s13 .test-bubble",
        scale: [0.85, 1],
        opacity: [0, 1],
        duration: 350,
        delay: anime.stagger(70, { start: 200 }),
        easing: B,
      });
      break;
    case "s15":
      anime({
        targets: "#s15 h1",
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 600,
        easing: C,
      });
      anime({
        targets: "#s15 .sub",
        opacity: [0, 1],
        duration: 500,
        delay: 300,
        easing: C,
      });
      break;
  }
}
