const T = 15;
let cur = 0;
let busy = false;
let goTimer = null;
let layerStep = 0;
let arenaStep = 0;
let _prevCur = 0;

/* ── isometric layer stack data (s5) ── */
const layerInfo = [
  null,
  {
    ids: ["isoL1"],
    num: "01",
    title: "underground",
    sub: "where you become dangerous.",
    desc: "a living world of buried artifacts, suppressed ideas, and unexplored intellectual territory — that maps your thinking over time.",
    color: "#EC4E20",
  },
  {
    ids: ["isoL2"],
    num: "02",
    title: "cyph",
    sub: "where ideas get tested in real time.",
    desc: "a live intellectual \u2018cyph\u2019 that resists the echo chamber and places you into productive tension with minds you'd never otherwise meet.",
    color: "#608FE6",
  },
  {
    ids: ["isoL3"],
    num: "03",
    title: "irl",
    sub: "touch grass.",
    desc: "everything found underground and tested in the cyph finds its fullest expression here — the tangible world, the human face, the experience that changes you.",
    color: "#6D1A36",
  },
  {
    ids: ["isoL1", "isoL2", "isoL3"],
    num: "∞",
    title: "the loop",
    sub: "",
    desc: "underground deepens. cyph challenges.\u00A0irl\u00A0embodies.",
    color: "gradient",
  },
];

function updateLayerStack(step) {
  busy = true;
  ["isoL1", "isoL2", "isoL3"].forEach(function (id) {
    document.getElementById(id).classList.remove("active");
  });
  ["ldot1", "ldot2", "ldot3", "ldot4"].forEach(function (id) {
    document.getElementById(id).classList.remove("active");
  });
  if (step >= 1 && step <= 4) {
    var d = layerInfo[step];
    d.ids.forEach(function (id) {
      document.getElementById(id).classList.add("active");
    });
    document.getElementById("ldot" + step).classList.add("active");
    var numEl = document.getElementById("layerNum");
    var titleEl = document.getElementById("layerTitle");
    var subEl = document.getElementById("layerSub");
    numEl.textContent = d.num;
    titleEl.textContent = d.title;
    subEl.textContent = d.sub;
    if (d.color === "gradient") {
      var grad = "linear-gradient(90deg, #13293D, #FBAF00, #608FE6, #6D1A36)";
      numEl.style.background = grad;
      numEl.style.webkitBackgroundClip = "text";
      numEl.style.webkitTextFillColor = "transparent";
      titleEl.style.color = "var(--charcoal)";
      subEl.style.color = "var(--charcoal)";
    } else {
      numEl.style.background = "none";
      numEl.style.webkitBackgroundClip = "unset";
      numEl.style.webkitTextFillColor = "unset";
      numEl.style.color = d.color;
      titleEl.style.color = d.color;
      subEl.style.color = d.color;
    }
    document.getElementById("layerDesc").textContent = d.desc;
    document.getElementById("layerAnno").style.opacity = "1";
  }
  setTimeout(function () {
    busy = false;
  }, 400);
}

/* ── arena card stack (s9): steps 1-3 = live, 4-6 = conceptual ── */
function updateArenaCards(step) {
  busy = true;
  var live = document.getElementById("arenaLive");
  var concept = document.getElementById("arenaConcept");
  var liveCards = ["lc1", "lc2", "lc3"];
  var conceptCards = ["cc1", "cc2", "cc3"];

  if (step <= 3) {
    live.classList.remove("muted");
    concept.classList.add("muted");
    setStackPositions(liveCards, step - 1);
    setStackPositions(conceptCards, 0);
  } else {
    concept.classList.remove("muted");
    live.classList.add("muted");
    setStackPositions(conceptCards, step - 4);
    setStackPositions(liveCards, 2);
  }
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
  7: "underground",
  8: "arena",
  9: "irl",
  10: "business",
  11: "business",
  12: "business",
  13: "business",
  14: "close",
};

const bars = [
  [10, 10, 5, 5],
  [12, 12, 5, 5],
  [15, 15, 5, 8],
  [18, 18, 5, 10],
  [22, 22, 8, 12],
  [25, 25, 10, 15],
  [60, 30, 12, 18],
  [80, 35, 15, 20],
  [82, 55, 18, 25],
  [88, 70, 22, 60],
  [90, 72, 70, 65],
  [90, 75, 72, 68],
  [92, 80, 75, 72],
  [95, 88, 82, 80],
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
    String(i + 1).padStart(2, "0") + "/15";
  document.getElementById("bhudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/15";

  const p = Math.round((i / 14) * 100);
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
  if (busy || i < 0 || i >= T || i === cur) return;
  /* sub-step: layer stack on slide 5 */
  if (cur === 5) {
    if (i > cur && layerStep < 4) {
      layerStep++;
      updateLayerStack(layerStep);
      return;
    }
    if (i < cur && layerStep > 1) {
      layerStep--;
      updateLayerStack(layerStep);
      return;
    }
  }
  /* sub-step: arena cards on slide 8 */
  if (cur === 8) {
    if (i > cur && arenaStep < 6) {
      arenaStep++;
      updateArenaCards(arenaStep);
      return;
    }
    if (i < cur && arenaStep > 1) {
      arenaStep--;
      updateArenaCards(arenaStep);
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
    String(i + 1).padStart(2, "0") + "/15";
  document.getElementById("bhudCtr").textContent =
    String(i + 1).padStart(2, "0") + "/15";
  var p = Math.round((i / 14) * 100);
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

/* ── fit-to-viewport scaling ── */
function computeFitScale() {
  return Math.min(window.innerWidth / 1440, window.innerHeight / 900);
}
function applyFitScale() {
  var shell = document.getElementById("game-shell");
  if (!shell) return;
  shell.style.transform = "scale(" + computeFitScale() + ")";
}
window.addEventListener("resize", applyFitScale);

/* ── init ── */
document.addEventListener("DOMContentLoaded", () => {
  var fitScale = computeFitScale();
  anime({
    targets: "#game-shell",
    scale: [0, fitScale],
    duration: 800,
    easing: "easeOutBack",
    complete: () => runA(0),
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
        targets: "#s0 .sub",
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 500,
        delay: 150,
        easing: C,
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
      var fromFuture = _prevCur > 5;
      layerStep = fromFuture ? 4 : 1;
      if (lockActive) {
        document.querySelectorAll(".iso-layer").forEach(function (el) {
          el.style.opacity = "1";
          el.style.transform = "none";
        });
        document.getElementById("layerAnno").style.opacity = "1";
        updateLayerStack(layerStep);
        break;
      }
      anime({
        targets: ".iso-layer",
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 500,
        delay: anime.stagger(120, { from: "last" }),
        easing: B,
      });
      anime({
        targets: "#layerAnno",
        opacity: [0, 1],
        translateX: [20, 0],
        duration: 500,
        delay: 500,
        easing: C,
      });
      setTimeout(function () {
        updateLayerStack(layerStep);
      }, 100);
      break;
    }
    case 6: {
      const rts = ["philosophy", "sports", "theology", "architecture"];
      const clrs = {
        philosophy: "#FBAF00",
        sports: "#EC4E20",
        theology: "#6D1A36",
        architecture: "#608FE6",
      };
      if (lockActive) {
        /* locked: skip animation, show final state immediately */
        rts.forEach(function (r) {
          var line = document.getElementById("route-" + r);
          if (line) line.style.strokeDashoffset = "0";
        });
        document.querySelectorAll(".stop, .stop-text").forEach(function (el) {
          el.style.opacity = "1";
        });
        break;
      }
      document.querySelectorAll(".stop, .stop-text").forEach((el) => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.5s";
      });
      rts.forEach((r, idx) => {
        const delay = idx * 1800;
        setTimeout(() => {
          const rl = document.getElementById("rl-" + r);
          if (rl) {
            rl.style.background = "rgba(255,255,255,0.06)";
            rl.style.borderColor = clrs[r];
            const t = rl.querySelector("div > div:first-child");
            if (t) t.style.color = "#fff";
          }
          if (idx > 0) {
            const prev = document.getElementById("rl-" + rts[idx - 1]);
            if (prev) {
              prev.style.background = "transparent";
              prev.style.borderColor = "rgba(255,255,255,0.06)";
              const pt = prev.querySelector("div > div:first-child");
              if (pt) pt.style.color = "rgba(255,255,255,0.4)";
            }
          }
          const line = document.getElementById("route-" + r);
          if (line)
            anime({
              targets: line,
              strokeDashoffset: [900, 0],
              duration: 1500,
              easing: "easeInOutQuad",
            });
          document
            .querySelectorAll('.stop[data-route="' + r + '"]')
            .forEach((s, si) => {
              setTimeout(
                () => {
                  s.style.opacity = "1";
                },
                si * 350 + 250,
              );
            });
          document
            .querySelectorAll('.stop-text[data-route="' + r + '"]')
            .forEach((t, ti) => {
              setTimeout(
                () => {
                  t.style.opacity = "1";
                },
                ti * 350 + 400,
              );
            });
        }, delay);
      });
      setTimeout(
        () => {
          const last = document.getElementById("rl-architecture");
          if (last) {
            last.style.background = "transparent";
            last.style.borderColor = "rgba(255,255,255,0.06)";
            const lt = last.querySelector("div > div:first-child");
            if (lt) lt.style.color = "rgba(255,255,255,0.4)";
          }
        },
        rts.length * 1800 + 1000,
      );
      break;
    }
    case 7:
      anime({
        targets: "#s7 .transit-map-panel",
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: C,
      });
      anime({
        targets: "#s7 .inv-sub-card",
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 350,
        delay: anime.stagger(60, { start: 300 }),
        easing: B,
      });
      break;
    case 8:
      anime({
        targets: "#s8 .game-panel",
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 500,
        easing: B,
      });
      anime({
        targets: ".arena-col.live .arena-card",
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(80),
        easing: B,
      });
      anime({
        targets: ".arena-col.conceptual .arena-card",
        translateX: [20, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(80),
        easing: B,
      });
      break;
    case 9: {
      var fromFutureA = _prevCur > 8;
      arenaStep = fromFutureA ? 6 : 1;
      updateArenaCards(arenaStep);
      anime({
        targets: ".card-stack",
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        easing: B,
      });
      break;
    }
    case 10:
      anime({
        targets: "#s10 .game-panel",
        opacity: [0, 1],
        scale: [0.95, 1],
        duration: 500,
        easing: B,
      });
      anime({
        targets: "#s10 .biz-main",
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 550,
        delay: 200,
        easing: B,
      });
      anime({
        targets: "#s10 .biz-card",
        translateX: [20, 0],
        opacity: [0, 1],
        duration: 450,
        delay: anime.stagger(140, { start: 350 }),
        easing: B,
      });
      break;
    case 11:
      anime({
        targets: "#s11 .user-row",
        translateX: [-15, 0],
        opacity: [0, 1],
        duration: 400,
        delay: anime.stagger(120),
        easing: B,
      });
      break;
    case 12:
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
    case 13:
      anime({
        targets: "#s13 .test-bubble",
        scale: [0.85, 1],
        opacity: [0, 1],
        duration: 350,
        delay: anime.stagger(70, { start: 200 }),
        easing: B,
      });
      break;
    case 14:
      anime({
        targets: "#s14 h1",
        translateY: [12, 0],
        opacity: [0, 1],
        duration: 600,
        easing: C,
      });
      anime({
        targets: "#s14 .sub",
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

    /* ensure all route lines on s6 are fully drawn */
    ["philosophy", "sports", "theology", "architecture"].forEach(function (r) {
      var line = document.getElementById("route-" + r);
      if (line) line.style.strokeDashoffset = "0";
    });
    /* ensure all stops and stop-text visible */
    document.querySelectorAll(".stop, .stop-text").forEach(function (el) {
      el.style.opacity = "1";
    });

    /* ensure iso layers on s5 are visible at current step */
    var anno = document.getElementById("layerAnno");
    if (anno) anno.style.opacity = "1";

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
      .querySelectorAll("#s7 .transit-map-panel, #s7 .inv-sub-card")
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    document
      .querySelectorAll("#s8 .game-panel, .arena-col .arena-card")
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    document.querySelectorAll(".card-stack").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document
      .querySelectorAll("#s10 .game-panel, #s10 .biz-main, #s10 .biz-card")
      .forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    document.querySelectorAll("#s11 .user-row").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#questChain .quest-node").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s13 .test-bubble").forEach(function (el) {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("#s14 h1, #s14 .sub").forEach(function (el) {
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

    /* fix infinity gradient — use solid color fallback */
    var numEl = document.getElementById("layerNum");
    if (numEl) numEl.style.color = "#608FE6";

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

