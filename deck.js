const T = 13;
let cur = 0;
let busy = false;
let goTimer = null;
let layerStep = 0;
let founderStep = 0;
let _prevCur = 0;

/* ── how it works (s5): 01 underground / 02 cyph / 03 irl. The layer and
   its panel share a data-step; the selected pair gets .active / .on. ── */
function updateHiw(step) {
  busy = true;
  document.querySelectorAll("#s5 [data-step]").forEach(function (node) {
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

/* 01's route draw, all four lines at once so it lands inside the export's
   settle gate */
function drawRoutes() {
  var lines = document.querySelectorAll("#s5 #transitSvg polyline");
  var stops = document.querySelectorAll("#s5 .stop, #s5 .stop-text");
  anime.remove(lines);
  anime.remove(stops);
  if (lockActive) {
    lines.forEach(function (l) {
      l.style.strokeDashoffset = "0";
    });
    stops.forEach(function (el) {
      el.style.opacity = "1";
    });
    return;
  }
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

/* ── founder bio sub-steps (s12, after "ready for a demo?"): 0 = demo
   view, 1 = jalen's dedicated full-slide bio, 2 = bryan's. each advance
   crossfades the previous view out and the next in (CSS opacity
   transitions on .founder-bio / #s12.bio-active). ── */
function updateFounderBio(step) {
  busy = true;
  var s12 = document.getElementById("s12");
  if (s12) s12.classList.toggle("bio-active", step > 0);
  var bioA = document.getElementById("bioA");
  var bioB = document.getElementById("bioB");
  if (bioA) bioA.classList.toggle("active", step === 1);
  if (bioB) bioB.classList.toggle("active", step === 2);
  setTimeout(function () {
    busy = false;
  }, 400);
}

function setStackPositions(ids, activeIdx) {
  var positions = ["pos-front", "pos-mid", "pos-back"];
  ids.forEach(function (id, i) {
    var el = document.getElementById(id);
    el.classList.remove("pos-front", "pos-mid", "pos-back");
    if (i === activeIdx) {
      el.classList.add("pos-front");
    } else {
      /* distribute remaining cards to mid/back */
      var behind =
        i < activeIdx
          ? "pos-back"
          : i === activeIdx + 1
            ? "pos-mid"
            : "pos-back";
      el.classList.add(behind);
    }
  });
}

const ch = {
  0: "cyph",
  1: "founders",
  2: "crisis",
  3: "crisis",
  4: "solution",
  5: "solution",
  6: "underground",
  7: "business",
  8: "business",
  9: "business",
  10: "business",
  11: "business",
  12: "close",
};

const bars = [
  [10, 10, 5, 5],
  [12, 12, 5, 5],
  [15, 15, 5, 8],
  [18, 18, 5, 10],
  [22, 22, 8, 12],
  [25, 25, 10, 15],
  [80, 35, 15, 20],
  [90, 74, 71, 66],
  [90, 75, 72, 68],
  [92, 80, 75, 72],
  [95, 88, 82, 80],
  [97, 92, 88, 85],
  [100, 100, 100, 100],
];

const bgMap = {
  cyph: "shell",
  founders: "shell",
  crisis: "shell",
  solution: "shell",
  underground: "underground",
  arena: "arena",
  irl: "irl",
  business: "nextsteps",
  close: "nextsteps",
};

/* ── update backgrounds, HUD, bars for slide i ── */
function applySlide(i) {
  document.getElementById("s" + cur).classList.remove("active");

  const nc = ch[i];
  const activeBg = bgMap[nc] || "shell";

  ["shell", "underground", "arena", "irl", "nextsteps"].forEach((c) => {
    const el = document.getElementById("bg-" + c);
    if (el)
      el.style.opacity =
        c === activeBg ||
        ((c === "shell" || c === "nextsteps") &&
          (activeBg === "shell" || activeBg === "nextsteps"))
          ? "1"
          : "0";
  });

  document
    .getElementById("citySil")
    .classList[nc === "arena" ? "add" : "remove"]("show");
  document.getElementById("hudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/" + T;
  document.getElementById("bhudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/" + T;

  const p = Math.round((i / (T - 1)) * 100);
  const f = document.getElementById("xpFill");
  f.style.width = p + "%";
  if (nc === "underground") f.style.background = "#EC4E20";
  else if (nc === "arena") f.style.background = "#608FE6";
  else if (nc === "irl") f.style.background = "#6D1A36";
  else if (nc === "crisis") f.style.background = "#EC4E20";
  else f.style.background = "#FBAF00";

  updateNav(nc);

  const b = bars[i];
  ["bar0", "bar1", "bar2", "bar3"].forEach((id, j) => {
    document.getElementById(id).style.width = b[j] + "%";
  });
}

/* ── highlight the active nav button for the current chapter ── */
const btnChapterMap = {
  cyph: "cyph",
  founders: "founders",
  problem: "crisis",
  solution: "solution",
  underground: "underground",
  "the cyph": "arena",
  irl: "irl",
  business: "business",
  close: "close",
};
function updateNav(chapter) {
  document.querySelectorAll(".hud-nav-btn").forEach((btn) => {
    if (btnChapterMap[btn.textContent.trim()] === chapter) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/* ── sequential navigation (arrows / bottom buttons) ── */
const SKIP = []; // hidden slides
function go(i) {
  if (busy || i === cur) return;
  /* sub-step: founder bios on slide 12. checked BEFORE the bounds guard —
     advancing on the last slide calls go(13), which must step through the
     bios instead of returning early. */
  if (cur === 12) {
    if (i > cur && founderStep < 2) {
      founderStep++;
      updateFounderBio(founderStep);
      return;
    }
    if (i < cur && founderStep > 0) {
      founderStep--;
      updateFounderBio(founderStep);
      return;
    }
  }
  if (i < 0 || i >= T) return;
  /* sub-step: how it works layers on slide 5 */
  if (cur === 5) {
    if (i > cur && layerStep < 3) {
      layerStep++;
      updateHiw(layerStep);
      return;
    }
    if (i < cur && layerStep > 1) {
      layerStep--;
      updateHiw(layerStep);
      return;
    }
  }
  if (SKIP.includes(i)) {
    i += i > cur ? 1 : -1;
    if (i < 0 || i >= T) return;
  }
  doGo(i);
}

function doGo(i) {
  busy = true;
  _prevCur = cur;
  applySlide(i);
  goTimer = setTimeout(() => {
    goTimer = null;
    document.getElementById("s" + i).classList.add("active");
    cur = i;
    runA(i);
    setTimeout(() => {
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

  // Remove active from ALL slides
  for (var j = 0; j < T; j++) {
    var sl = document.getElementById("s" + j);
    if (sl) sl.classList.remove("active");
  }

  // Update backgrounds, HUD, bars
  var nc = ch[i];
  var activeBg = bgMap[nc] || "shell";
  ["shell", "underground", "arena", "irl", "nextsteps"].forEach(function (c) {
    var el = document.getElementById("bg-" + c);
    if (el)
      el.style.opacity =
        c === activeBg ||
        ((c === "shell" || c === "nextsteps") &&
          (activeBg === "shell" || activeBg === "nextsteps"))
          ? "1"
          : "0";
  });
  document
    .getElementById("citySil")
    .classList[nc === "arena" ? "add" : "remove"]("show");
  document.getElementById("hudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/" + T;
  document.getElementById("bhudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/" + T;
  var p = Math.round((i / (T - 1)) * 100);
  var f = document.getElementById("xpFill");
  f.style.width = p + "%";
  if (nc === "underground") f.style.background = "#EC4E20";
  else if (nc === "arena") f.style.background = "#608FE6";
  else if (nc === "irl") f.style.background = "#6D1A36";
  else if (nc === "crisis") f.style.background = "#EC4E20";
  else f.style.background = "#FBAF00";
  updateNav(nc);
  var b = bars[i];
  ["bar0", "bar1", "bar2", "bar3"].forEach(function (id, j) {
    document.getElementById(id).style.width = b[j] + "%";
  });

  // Activate target slide
  document.getElementById("s" + i).classList.add("active");
  cur = i;
  runA(i);
}

/* ── fit-to-viewport scaling ──
   visualViewport excludes the iOS Safari address bar / bottom toolbar, so
   it gives us the actually-visible area. innerWidth/Height fall back for
   browsers without visualViewport support. */
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

/* ── init ──
   deck.js is injected by the viewing-path router in index.html rather than
   parsed from a static tag, so DOMContentLoaded may already have fired by the
   time this runs. Dynamically inserted scripts do not hold that event open. */
function onReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}
onReady(() => {
  var shell = document.getElementById("game-shell");
  /* lock button is a dev-only affordance — hide it on the deployed site,
     show only when running locally (localhost / 127.0.0.1 / file://). */
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  if (!isLocal) {
    var dc = document.getElementById("deck-controls");
    if (dc) dc.style.display = "none";
  }
  /* trigger the CSS keyframe entrance via --fit-scale. anime.js can't
     interpolate translate percentages so this is CSS-driven. */
  shell.style.setProperty("--fit-scale", computeFitScale());
  shell.classList.add("entered");
  setTimeout(function () {
    applyFitScale();
    runA(0);
  }, 800);

  /* cover-slide background video: the element has `autoplay`, so the
     browser starts playback on load. For prefers-reduced-motion, pause
     and rewind to the first frame so it acts as a still poster. */
  var coverVideo = document.querySelector("#s0 .cover-bg-video");
  if (coverVideo) {
    var reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
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
  }

  /* layers on how it works (s5) jump straight to their step */
  document.querySelectorAll("#s5 .iso-layer").forEach(function (node) {
    node.addEventListener("click", function () {
      if (cur !== 5) return;
      layerStep = +node.dataset.step;
      updateHiw(layerStep);
    });
  });

  const s = document.getElementById("citySil");
  [
    30, 50, 25, 65, 40, 55, 35, 72, 42, 30, 58, 45, 68, 35, 55, 42, 30, 50, 38,
    60,
  ].forEach((h) => {
    const d = document.createElement("div");
    d.className = "sil-bldg";
    d.style.width = 12 + Math.random() * 14 + "px";
    d.style.height = h + "px";
    s.appendChild(d);
  });
});

/* ── keyboard navigation ── */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
    e.preventDefault();
    go(cur + 1);
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    go(cur - 1);
  }
});

/* ── bottom nav buttons ── */
document.getElementById("navNext").addEventListener("click", () => go(cur + 1));
document.getElementById("navPrev").addEventListener("click", () => go(cur - 1));

/* ── per-slide animations ── */
function runA(i) {
  if (lockActive) return;
  const B = "easeOutBack",
    C = "easeOutCubic";
  switch (i) {
    case 0:
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
    case 1:
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
      // Animate stat bars on the front
      setTimeout(() => {
        document.querySelectorAll("#s1 .badge-stat-fill").forEach((bar, j) => {
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
    case 2:
      anime({
        targets: "#s2 .crisis-item",
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 450,
        delay: anime.stagger(140),
        easing: B,
      });
      setTimeout(() => {
        document.querySelectorAll("#s2 .threat-fill").forEach((b, j) => {
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
    case 3:
      anime({
        targets: "#s3 .tl-item",
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(200),
        easing: B,
      });
      break;
    case 4:
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
    case 5: {
      layerStep = _prevCur > 5 ? 3 : 1;
      anime({
        targets: "#s5 .iso-layer",
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(120, { from: "last" }),
        easing: B,
      });
      anime({
        targets: "#s5 .hiw-anno",
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
    }
    case 6:
      anime({
        targets: "#s6 .transit-map-panel",
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: C,
      });
      anime({
        targets: "#s6 .inv-sub-card",
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 350,
        delay: anime.stagger(60, { start: 300 }),
        easing: B,
      });
      break;
    case 7: {
      var s7Reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (s7Reduce) {
        document.querySelectorAll("#s7 .money-row, #s7 .deck-takeaway").forEach(function (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      } else {
        anime({
          targets: "#s7 .money-row, #s7 .deck-takeaway",
          translateX: [-12, 0],
          opacity: [0, 1],
          duration: 420,
          delay: anime.stagger(80),
          easing: B,
        });
      }
      break;
    }
    case 8:
      anime({
        targets: "#s8 .user-row, #s8 .deck-takeaway",
        translateX: [-15, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(120),
        easing: B,
      });
      break;
    case 9:
      document.querySelectorAll("#questChain .quest-node").forEach((n, j) => {
        anime({
          targets: n,
          translateY: [12, 0],
          opacity: [0, 1],
          duration: 450,
          delay: j * 200,
          easing: B,
          begin: () => {
            n.querySelector(".quest-dot").classList.add("complete");
          },
        });
        const ps = document.querySelectorAll("#questChain .quest-path");
        if (ps[j])
          setTimeout(
            () => {
              ps[j].classList.add("filled");
            },
            200 + j * 200,
          );
      });
      break;
    case 10:
      anime({
        targets: "#s10 .test-bubble",
        scale: [0.85, 1],
        opacity: [0, 1],
        duration: 350,
        delay: anime.stagger(70, { start: 200 }),
        easing: B,
      });
      break;
    case 11:
      anime({
        targets: "#s11 .raise-term",
        translateY: [14, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(90, { start: 100 }),
        easing: C,
      });
      /* pie grows in */
      anime({
        targets: "#s11 .raise-pie",
        scale: [0.55, 1],
        opacity: [0, 1],
        duration: 700,
        delay: 320,
        easing: B,
      });
      anime({
        targets: "#s11 .raise-legend li",
        translateX: [10, 0],
        opacity: [0, 1],
        duration: 420,
        delay: anime.stagger(55, { start: 420 }),
        easing: C,
      });
      /* gantt rows fade in, then each bar draws left→right */
      anime({
        targets: "#s11 .gantt-row",
        opacity: [0, 1],
        duration: 320,
        delay: anime.stagger(55, { start: 460 }),
        easing: C,
      });
      anime({
        targets: "#s11 .gantt-bar",
        scaleX: [0, 1],
        duration: 620,
        delay: anime.stagger(70, { start: 540 }),
        easing: C,
      });
      anime({
        targets: "#s11 .gantt-milestone",
        scale: [0, 1],
        opacity: [0, 1],
        duration: 450,
        delay: 540 + 70 * 6,
        easing: B,
      });
      anime({
        targets: "#s11 .gantt-axis span, #s11 .gantt-axis-title",
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(18, { start: 900 }),
        easing: C,
      });
      break;
    case 12:
      /* arriving always lands on the demo view; the bios only appear by
         advancing (s12 is the last slide, so there is no from-future entry) */
      founderStep = 0;
      updateFounderBio(founderStep);
      anime({
        targets: "#s12 h1",
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 600,
        easing: C,
      });
      anime({
        targets: "#s12 .sub",
        opacity: [0, 1],
        duration: 500,
        delay: 300,
        easing: C,
      });
      break;
  }
}

/* ═══ LOCK MODE ═══ */
var lockActive = false;

function toggleLock() {
  lockActive = !lockActive;
  var btn = document.getElementById("lock-btn");

  if (lockActive) {
    /* finish all running anime.js animations instantly */
    anime.running.forEach(function (a) {
      a.seek(a.duration);
    });

    /* ensure all route lines on s5's underground map are fully drawn */
    ["philosophy", "sports", "theology", "architecture"].forEach(function (r) {
      var line = document.getElementById("route-" + r);
      if (line) line.style.strokeDashoffset = "0";
    });
    /* ensure all stops and stop-text visible */
    document.querySelectorAll(".stop, .stop-text").forEach(function (el) {
      el.style.opacity = "1";
    });

    /* ensure s5's panel is visible at the current step */
    var anno = document.querySelector("#s5 .hiw-anno");
    if (anno) {
      anno.style.opacity = "1";
      anno.style.transform = "none";
    }

    /* ensure quest paths filled */
    document.querySelectorAll(".quest-dot").forEach(function (d) {
      d.classList.add("complete");
    });
    document.querySelectorAll(".quest-path").forEach(function (p) {
      p.classList.add("filled");
    });

    /* force all animated elements to final opacity/transform */
    document
      .querySelectorAll("#s0 h1, #s0 .sub, #s0 .cbadge")
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    document.querySelectorAll("#charA, #charB").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s1 .badge-stat-fill").forEach(function (bar) {
      if (bar.dataset.fill) bar.style.width = bar.dataset.fill + "%";
    });
    document.querySelectorAll("#s2 .crisis-item").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s2 .threat-fill").forEach(function (b) {
      if (b.dataset.fill) b.style.width = b.dataset.fill + "%";
    });
    document.querySelectorAll("#s3 .tl-item").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s4 h1, #s4 .sub").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll(".iso-layer").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document
      .querySelectorAll("#s6 .transit-map-panel, #s6 .inv-sub-card")
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    document.querySelectorAll(".card-stack").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s7 .money-row, #s7 .deck-takeaway").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s8 .user-row, #s8 .deck-takeaway").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#questChain .quest-node").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s10 .test-bubble").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document
      .querySelectorAll(
        "#s11 .raise-term, #s11 .raise-pie, #s11 .raise-legend li, #s11 .gantt-row, #s11 .gantt-bar, #s12 h1, #s12 .sub",
      )
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });

    /* swap inverted images to pre-inverted versions (html2canvas can't do filter:invert) */
    var invertMap = {
      "assets/brands/schomburg.png": "assets/brands/schomburg_inv.png",
      "assets/brands/internet_archive.png":
        "assets/brands/internet_archive_inv.png",
      "assets/brands/fifa.png": "assets/brands/fifa_inv.png",
      "assets/brands/irl/3rdspace.png": "assets/brands/irl/3rdspace_inv.png",
    };
    document.querySelectorAll('img[style*="invert"]').forEach(function (img) {
      var src = img.getAttribute("src");
      if (invertMap[src]) {
        img.dataset.origSrc = src;
        img.setAttribute("src", invertMap[src]);
        img.style.filter = "none";
      }
    });

    document.body.classList.add("locked");
    btn.classList.add("active");
    btn.innerHTML = "&#x1f513;";
  } else {
    /* restore inverted images */
    document.querySelectorAll("img[data-orig-src]").forEach(function (img) {
      img.setAttribute("src", img.dataset.origSrc);
      img.style.filter = "invert(1)";
      img.removeAttribute("data-orig-src");
    });

    document.body.classList.remove("locked");
    btn.classList.remove("active");
    btn.innerHTML = "&#x1f512;";
  }
}
