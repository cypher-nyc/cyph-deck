const T = 15;
let cur = 0;
let busy = false;
let goTimer = null;

const ch = {
  0:'cyph', 1:'founders', 2:'crisis', 3:'crisis', 4:'solution', 5:'solution',
  6:'underground', 7:'underground', 8:'arena', 9:'touchgrass',
  10:'business', 11:'business', 12:'business', 13:'business', 14:'close'
};

const bars = [
  [10,10,5,5],[12,12,5,5],[15,15,5,8],[18,18,5,10],[22,22,8,12],
  [25,25,10,15],[60,30,12,18],[80,35,15,20],[82,55,18,25],
  [88,70,22,60],[90,72,70,65],[90,75,72,68],[92,80,75,72],[95,88,82,80],
  [100,100,100,100]
];

const bgMap = {
  cyph:'shell', founders:'shell', crisis:'shell', solution:'shell',
  underground:'underground', arena:'arena',
  touchgrass:'touchgrass', business:'nextsteps', close:'nextsteps'
};

/* ── update backgrounds, HUD, bars for slide i ── */
function applySlide(i) {
  document.getElementById('s' + cur).classList.remove('active');

  const nc = ch[i];
  const activeBg = bgMap[nc] || 'shell';

  ['shell','underground','arena','touchgrass','nextsteps'].forEach(c => {
    const el = document.getElementById('bg-' + c);
    if (el) el.style.opacity =
      (c === activeBg || ((c === 'shell' || c === 'nextsteps') && (activeBg === 'shell' || activeBg === 'nextsteps')))
        ? '1' : '0';
  });

  document.getElementById('citySil').classList[nc === 'arena' ? 'add' : 'remove']('show');
  document.getElementById('hudCtr').textContent = String(i + 1).padStart(2, '0') + '/15';
  document.getElementById('bhudCtr').textContent = String(i + 1).padStart(2, '0') + '/15';

  const p = Math.round((i / 14) * 100);
  const f = document.getElementById('xpFill');
  f.style.width = p + '%';
  if (nc === 'underground') f.style.background = '#EC4E20';
  else if (nc === 'arena') f.style.background = '#608FE6';
  else if (nc === 'touchgrass') f.style.background = '#6D1A36';
  else if (nc === 'crisis') f.style.background = '#EC4E20';
  else f.style.background = '#FBAF00';

  updateNav(nc);

  const b = bars[i];
  ['bar0','bar1','bar2','bar3'].forEach((id, j) => {
    document.getElementById(id).style.width = b[j] + '%';
  });
}

/* ── highlight the active nav button for the current chapter ── */
const btnChapterMap = {'cyph':'cyph','founders':'founders','problem':'crisis','solution':'solution','underground':'underground','arena':'arena','touch grass':'touchgrass','business':'business','close':'close'};
function updateNav(chapter) {
  document.querySelectorAll('.hud-nav-btn').forEach(btn => {
    if (btnChapterMap[btn.textContent.trim()] === chapter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/* ── sequential navigation (arrows / bottom buttons) ── */
const SKIP = []; // hidden slides
function go(i) {
  if (busy || i < 0 || i >= T || i === cur) return;
  if (SKIP.includes(i)) { i += (i > cur ? 1 : -1); if (i < 0 || i >= T) return; }
  doGo(i);
}

function doGo(i) {
  busy = true;
  applySlide(i);
  goTimer = setTimeout(() => {
    goTimer = null;
    document.getElementById('s' + i).classList.add('active');
    cur = i;
    runA(i);
    setTimeout(() => { busy = false; }, 500);
  }, 180);
}

/* ── direct jump from nav (always works, ignores busy) ── */
function goTo(i) {
  if (i < 0 || i >= T || i === cur) return;
  if (goTimer) { clearTimeout(goTimer); goTimer = null; }
  busy = false;

  // Remove active from ALL slides
  for (var j = 0; j < T; j++) {
    var sl = document.getElementById('s' + j);
    if (sl) sl.classList.remove('active');
  }

  // Update backgrounds, HUD, bars
  var nc = ch[i];
  var activeBg = bgMap[nc] || 'shell';
  ['shell','underground','arena','touchgrass','nextsteps'].forEach(function(c) {
    var el = document.getElementById('bg-' + c);
    if (el) el.style.opacity =
      (c === activeBg || ((c === 'shell' || c === 'nextsteps') && (activeBg === 'shell' || activeBg === 'nextsteps')))
        ? '1' : '0';
  });
  document.getElementById('citySil').classList[nc === 'arena' ? 'add' : 'remove']('show');
  document.getElementById('hudCtr').textContent = String(i + 1).padStart(2, '0') + '/15';
  document.getElementById('bhudCtr').textContent = String(i + 1).padStart(2, '0') + '/15';
  var p = Math.round((i / 14) * 100);
  var f = document.getElementById('xpFill');
  f.style.width = p + '%';
  if (nc === 'underground') f.style.background = '#EC4E20';
  else if (nc === 'arena') f.style.background = '#608FE6';
  else if (nc === 'touchgrass') f.style.background = '#6D1A36';
  else if (nc === 'crisis') f.style.background = '#EC4E20';
  else f.style.background = '#FBAF00';
  updateNav(nc);
  var b = bars[i];
  ['bar0','bar1','bar2','bar3'].forEach(function(id, j) {
    document.getElementById(id).style.width = b[j] + '%';
  });

  // Activate target slide
  document.getElementById('s' + i).classList.add('active');
  cur = i;
  runA(i);
}

/* ── init ── */
document.addEventListener('DOMContentLoaded', () => {
  anime({ targets: '#game-shell', scale: [0, 1], duration: 800, easing: 'easeOutBack', complete: () => runA(0) });

  const s = document.getElementById('citySil');
  [30,50,25,65,40,55,35,72,42,30,58,45,68,35,55,42,30,50,38,60].forEach(h => {
    const d = document.createElement('div');
    d.className = 'sil-bldg';
    d.style.width = (12 + Math.random() * 14) + 'px';
    d.style.height = h + 'px';
    s.appendChild(d);
  });

});

/* ── keyboard navigation ── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault();
    go(cur + 1);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    go(cur - 1);
  }
});

/* ── bottom nav buttons ── */
document.getElementById('navNext').addEventListener('click', () => go(cur + 1));
document.getElementById('navPrev').addEventListener('click', () => go(cur - 1));

/* ── per-slide animations ── */
function runA(i) {
  const B = 'easeOutBack', C = 'easeOutCubic';
  switch (i) {
    case 0:
      anime({ targets: '#s0 h1', translateY: [-20, 0], opacity: [0, 1], duration: 600, easing: B });
      anime({ targets: '#s0 .sub', translateY: [12, 0], opacity: [0, 1], duration: 500, delay: 150, easing: C });
      anime({ targets: '#s0 .cbadge', scale: [0.8, 1], opacity: [0, 1], duration: 450, delay: anime.stagger(100, { start: 300 }), easing: B });
      break;
    case 1:
      anime({ targets: '#charA', translateX: [-30, 0], opacity: [0, 1], duration: 600, easing: B });
      anime({ targets: '#charB', translateX: [30, 0], opacity: [0, 1], duration: 600, delay: 120, easing: B });
      // Animate stat bars on the front
      setTimeout(() => {
        document.querySelectorAll('#s1 .badge-stat-fill').forEach((bar, j) => {
          anime({ targets: bar, width: bar.dataset.fill + '%', duration: 700, delay: 100 + j * 80, easing: C });
        });
      }, 400);
      break;
    case 2:
      anime({ targets: '#s2 .crisis-item', translateX: [-20, 0], opacity: [0, 1], duration: 450, delay: anime.stagger(140), easing: B });
      setTimeout(() => {
        document.querySelectorAll('#s2 .threat-fill').forEach((b, j) => {
          anime({ targets: b, width: b.dataset.fill + '%', duration: 700, delay: j * 140, easing: C });
        });
      }, 350);
      break;
    case 3:
      anime({ targets: '#s3 .tl-item', translateY: [15, 0], opacity: [0, 1], duration: 400, delay: anime.stagger(200), easing: B });
      break;
    case 4:
      anime({ targets: '#s4 h1', translateY: [-20, 0], opacity: [0, 1], duration: 600, easing: B });
      anime({ targets: '#s4 .sub', translateY: [12, 0], opacity: [0, 1], duration: 500, delay: 150, easing: C });
      break;
    case 5:
      anime({ targets: '#s5 .step-card', translateY: [20, 0], opacity: [0, 1], duration: 500, delay: anime.stagger(120), easing: B });
      break;
    case 6: {
      const rts = ['philosophy', 'sports', 'theology', 'architecture'];
      const clrs = { philosophy: '#FBAF00', sports: '#EC4E20', theology: '#6D1A36', architecture: '#608FE6' };
      document.querySelectorAll('.stop, .stop-text').forEach(el => { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; });
      rts.forEach((r, idx) => {
        const delay = idx * 1800;
        setTimeout(() => {
          const rl = document.getElementById('rl-' + r);
          if (rl) {
            rl.style.background = 'rgba(255,255,255,0.06)';
            rl.style.borderColor = clrs[r];
            const t = rl.querySelector('div > div:first-child');
            if (t) t.style.color = '#fff';
          }
          if (idx > 0) {
            const prev = document.getElementById('rl-' + rts[idx - 1]);
            if (prev) {
              prev.style.background = 'transparent';
              prev.style.borderColor = 'rgba(255,255,255,0.06)';
              const pt = prev.querySelector('div > div:first-child');
              if (pt) pt.style.color = 'rgba(255,255,255,0.4)';
            }
          }
          const line = document.getElementById('route-' + r);
          if (line) anime({ targets: line, strokeDashoffset: [900, 0], duration: 1500, easing: 'easeInOutQuad' });
          document.querySelectorAll('.stop[data-route="' + r + '"]').forEach((s, si) => { setTimeout(() => { s.style.opacity = '1'; }, si * 350 + 250); });
          document.querySelectorAll('.stop-text[data-route="' + r + '"]').forEach((t, ti) => { setTimeout(() => { t.style.opacity = '1'; }, ti * 350 + 400); });
        }, delay);
      });
      setTimeout(() => {
        const last = document.getElementById('rl-architecture');
        if (last) {
          last.style.background = 'transparent';
          last.style.borderColor = 'rgba(255,255,255,0.06)';
          const lt = last.querySelector('div > div:first-child');
          if (lt) lt.style.color = 'rgba(255,255,255,0.4)';
        }
      }, rts.length * 1800 + 1000);
      break;
    }
    case 7:
      anime({ targets: '#s7 .transit-map-panel', opacity: [0, 1], translateY: [10, 0], duration: 500, easing: C });
      anime({ targets: '#s7 .inv-sub-card', scale: [0.8, 1], opacity: [0, 1], duration: 350, delay: anime.stagger(60, { start: 300 }), easing: B });
      break;
    case 8:
      anime({ targets: '#s8 .game-panel', opacity: [0, 1], scale: [0.95, 1], duration: 500, easing: B });
      anime({ targets: '.arena-col.live .arena-card', translateX: [-20, 0], opacity: [0, 1], duration: 400, delay: anime.stagger(80), easing: B });
      anime({ targets: '.arena-col.conceptual .arena-card', translateX: [20, 0], opacity: [0, 1], duration: 400, delay: anime.stagger(80), easing: B });
      break;
    case 9:
      anime({ targets: '#s9 .park-card', translateY: [-25, 0], opacity: [0, 1], duration: 600, delay: anime.stagger(140, { start: 100 }), easing: B });
      break;
    case 10:
      anime({ targets: '#s10 .game-panel', opacity: [0, 1], scale: [0.95, 1], duration: 500, easing: B });
      anime({ targets: '#s10 .biz-main', scale: [0.9, 1], opacity: [0, 1], duration: 550, delay: 200, easing: B });
      anime({ targets: '#s10 .biz-card', translateX: [20, 0], opacity: [0, 1], duration: 450, delay: anime.stagger(140, { start: 350 }), easing: B });
      break;
    case 11:
      anime({ targets: '#s11 .user-row', translateX: [-15, 0], opacity: [0, 1], duration: 400, delay: anime.stagger(120), easing: B });
      break;
    case 12:
      document.querySelectorAll('#questChain .quest-node').forEach((n, j) => {
        anime({
          targets: n, translateY: [12, 0], opacity: [0, 1], duration: 450, delay: j * 200, easing: B,
          begin: () => { n.querySelector('.quest-dot').classList.add('complete'); }
        });
        const ps = document.querySelectorAll('#questChain .quest-path');
        if (ps[j]) setTimeout(() => { ps[j].classList.add('filled'); }, 200 + j * 200);
      });
      break;
    case 13:
      anime({ targets: '#s13 .test-bubble', scale: [0.85, 1], opacity: [0, 1], duration: 350, delay: anime.stagger(70, { start: 200 }), easing: B });
      break;
    case 14:
      anime({ targets: '#s14 h1', translateY: [12, 0], opacity: [0, 1], duration: 600, easing: C });
      anime({ targets: '#s14 .sub', opacity: [0, 1], duration: 500, delay: 300, easing: C });
      break;
  }
}
