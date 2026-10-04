/* ═══ resource cosmos — how it works (s5), 01 underground ═══
   A vanilla port of the design system's ResourceCosmos
   (cyph-web/packages/design-system/src/theme/ResourceCosmos): a tunnel of
   rings in CSS 3D, each ring a set of clusters — a person at the center,
   their works either side, joined by tendrils. The geometry is
   cosmosMath.ts's placeDays at panel scale; every card breathes and
   drifts on its own phase and pulsed covers carry the streak.
   A deck has no scroll, so the camera glides through the tunnel at a
   steady speed instead of stepping ring to ring: a ring fades in from the
   back, holds, and fades out before it reaches the camera, then goes
   round to the back of the tunnel — one unbroken flow, no jumps and no
   zooming in on a card (Cash, 2026-10-02). Runs only while 01 is showing
   (setCosmosActive). */
(function () {
  "use strict";

  var IMG = "assets/cosmos/";
  /* four rings, each a domain the underground runs through — music, the
     built world, sport, thought — curated wide on purpose (Cash,
     2026-10-02: country music, chinese architecture, sports, not one
     culture). The domains steer the curation only; nothing names them on
     the slide. A ring's people sit at the center of their clusters
     (transparent cutouts, drawn bare) with their works either side
     (covers, posters, photographs, framed by a hairline). Everything is
     public domain (Wikimedia Commons) or from the app's own library. */
  var RINGS = [
    /* music: country, the blues */
    { clusters: [
      { thinker: { name: "jimmie rodgers", img: "rodgers" }, works: [
        { title: "blue yodel, 1927", img: "blue_yodel", cut: true, pulse: "for_you" },
      ] },
      { thinker: { name: "the carter family", img: "carter_family" }, works: [] },
      { thinker: { name: "hank williams", img: "hank" }, works: [] },
      { thinker: { name: "patsy cline", img: "patsy" }, works: [] },
      { thinker: { name: "bessie smith", img: "bessie" }, works: [
        { title: "st. louis blues, 1929", img: "st_louis_blues", pulse: "challenges_you" },
      ] },
    ] },
    /* the built world: chinese architecture, the modern city */
    { clusters: [
      { thinker: { name: "lin huiyin", img: "lin_huiyin" }, works: [
        { title: "yingzao fashi", img: "yingzao", pulse: "challenges_you" },
        { title: "liang sicheng and lin huiyin at the temple of heaven", img: "liang_lin_temple" },
      ] },
      { thinker: { name: "frank lloyd wright", img: "wright" }, works: [] },
      { works: [
        { title: "temple of heaven, beijing", img: "temple_heaven", pulse: "for_you" },
        { title: "metropolis, 1927", img: "metropolis" },
      ] },
    ] },
    /* sport */
    { clusters: [
      { thinker: { name: "jim thorpe", img: "thorpe" }, works: [
        { title: "decathlon, stockholm 1912", img: "thorpe_decathlon", pulse: "for_you" },
      ] },
      { thinker: { name: "babe ruth", img: "ruth" }, works: [
        { title: "t206 honus wagner", img: "wagner_card" },
      ] },
      { thinker: { name: "jack johnson", img: "jack_johnson" }, works: [
        { title: "johnson in training", img: "johnson_fight", pulse: "challenges_you" },
      ] },
      { works: [
        { title: "babe didrikson, los angeles 1932", img: "didrikson" },
      ] },
    ] },
    /* thought: philosophy and theology, east and west */
    { clusters: [
      { thinker: { name: "confucius", img: "confucius" }, works: [
        { title: "tao te ching, mawangdui silk", img: "mawangdui", pulse: "challenges_you" },
      ] },
      { thinker: { name: "plato", img: "plato" }, works: [] },
      { thinker: { name: "hildegard of bingen", img: "hildegard" }, works: [
        { title: "scivias", img: "scivias" },
      ] },
      { thinker: { name: "baruch spinoza", img: "spinoza" }, works: [] },
      { thinker: { name: "w. e. b. du bois", img: "dubois" }, works: [
        { title: "the souls of black folk", img: "souls", pulse: "for_you" },
      ] },
    ] },
  ];

  /* cosmosMath.ts at panel scale (the DS's ring is sized for a full
     viewport; this one sits in an 800px panel) */
  var K = 0.82;
  var SPACING = 700;
  var PERSPECTIVE = 900;
  var WORK_W = Math.round(138 * K);
  /* the people are cutouts: drawn larger than the DS portrait card */
  var PORTRAIT_W = Math.round(94 * K * 1.5);
  var RING = {
    rx: 300,
    ry: 108,
    zSpread: 170,
    workGap: Math.round(146 * K),
    angle: 25,
    angleJitter: 15,
    zJitter: 60,
  };
  var SIZES = [
    { scale: 0.72, weight: 3 },
    { scale: 1, weight: 4 },
    { scale: 1.32, weight: 2 },
    { scale: 1.7, weight: 1 },
  ];
  var SIZE_DEPTH = 70;
  /* the glide: px of depth per second (one ring every ~10s) */
  var SPEED = 70;

  function hash01(n) {
    var h = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function seeded(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function workScale(d, c, w) {
    var r = hash01(d * 7919 + c * 131 + w * 17 + 1);
    var total = 0;
    SIZES.forEach(function (s) {
      total += s.weight;
    });
    var pick = r * total;
    var scale = SIZES[SIZES.length - 1].scale;
    for (var i = 0; i < SIZES.length; i++) {
      if (pick < SIZES[i].weight) {
        scale = SIZES[i].scale;
        break;
      }
      pick -= SIZES[i].weight;
    }
    return scale;
  }
  function hashKey(key) {
    var h = 0;
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function build(root) {
    var scene = el("div", "cosmos-scene", root);
    scene.style.perspective = PERSPECTIVE + "px";
    var world = el("div", "cosmos-world", scene);

    var rings = RINGS.map(function (ring, d) {
      var node = el("div", "cosmos-ring", world);
      var rand = seeded(d * 1337 + 7);
      var n = Math.max(ring.clusters.length, 1);
      var a0 = (RING.angle * Math.PI) / 180;
      var cards = [];
      ring.clusters.forEach(function (cl, ci) {
        var ang =
          (ci / n) * Math.PI * 2 +
          a0 +
          (rand() - 0.5) * (RING.angleJitter * 0.01);
        var cx = Math.cos(ang) * RING.rx;
        var cy = Math.sin(ang) * RING.ry;
        var cz = Math.cos(ang) * RING.zSpread + (rand() - 0.5) * RING.zJitter;
        var placed = [];
        if (cl.thinker) {
          placed.push({
            kind: "portrait",
            item: cl.thinker,
            x: cx - PORTRAIT_W / 2,
            y: cy - Math.round(60 * K),
            z: cz,
            w: PORTRAIT_W,
          });
        }
        cl.works.slice(0, cl.thinker ? 2 : 3).forEach(function (wk, wi) {
          var s = workScale(d, ci, wi);
          var w = Math.round(WORK_W * s);
          var grow = w - WORK_W;
          var side = wi === 0 ? -1 : wi === 1 ? 1 : 0;
          var dx = cl.thinker || wi < 2 ? side * (RING.workGap + grow / 2) : 0;
          var dy =
            wi === 2 ? -RING.workGap * 0.8 - grow : side * -8 - grow * 0.4;
          placed.push({
            kind: "work",
            item: wk,
            x: cx + dx - w / 2,
            y: cy - Math.round(60 * K) + dy,
            z: cz + 12 + (s - 1) * SIZE_DEPTH,
            w: w,
          });
        });
        /* tendrils: the person to each work, under the cards */
        if (cl.thinker && placed.length > 1) {
          var p = placed[0];
          placed.slice(1).forEach(function (c) {
            var x1 = p.x + p.w / 2,
              y1 = p.y + p.w * 0.6;
            var x2 = c.x + c.w / 2,
              y2 = c.y + c.w * 0.6;
            var len = Math.hypot(x2 - x1, y2 - y1);
            var t = el("span", "cosmos-tendril", node);
            t.style.width = len + "px";
            t.style.transform =
              "translate3d(" +
              x1 +
              "px," +
              y1 +
              "px," +
              (cz - 4) +
              "px) rotate(" +
              Math.atan2(y2 - y1, x2 - x1) +
              "rad)";
          });
        }
        placed.forEach(function (c, k) {
          var key = d + ":" + ci + ":" + k;
          var card = el("div", "cosmos-card", node);
          card.dataset.kind = c.kind;
          card.style.width = c.w + "px";
          var inner = el("div", "cosmos-breathe", card);
          var ph = hash01(hashKey(key));
          inner.style.animationDelay =
            -Math.round(ph * 4500) + "ms, " + -Math.round(ph * 6000) + "ms";
          var frame = el("span", "cosmos-cover", inner);
          if (c.kind === "portrait" || c.item.cut) frame.classList.add("cut");
          if (c.item.pulse) frame.dataset.pulse = c.item.pulse;
          var img = el("img", "", frame);
          img.src = IMG + c.item.img + ".webp";
          img.alt = "";
          img.draggable = false;
          c.key = key;
          c.el = card;
          c.ring = d;
          cards.push(c);
        });
      });
      return { node: node, cards: cards, slot: d };
    });

    /* ── the flow ── */
    /* start with the first ring full */
    var camZ = -0.95 * SPACING;
    var active = false, raf = 0, last = 0;

    /* a ring's opacity by its depth in front of the camera (e < 0 is
       ahead): a ghost far back, full in the middle distance, gone before
       it reaches the camera */
    function opacityAt(e) {
      var S = SPACING;
      /* a long, slow crossfade: the ring ahead is full by the time this
         one starts to leave, and this one takes ~6s to go */
      if (e < -2.2 * S) return 0;
      if (e < -1.55 * S) return (e + 2.2 * S) / (0.65 * S);
      if (e < -0.55 * S) return 1;
      if (e < -0.1 * S) return 1 - (e + 0.55 * S) / (0.45 * S);
      return 0;
    }

    function frame() {
      world.style.transform = "translateZ(" + camZ + "px)";
      rings.forEach(function (r) {
        var e = camZ - r.slot * SPACING;
        /* past the camera: round to the back, unseen (opacity is 0 here) */
        if (e > -0.1 * SPACING) {
          r.slot += rings.length;
          r.node.style.transform = "translateZ(" + -r.slot * SPACING + "px)";
          e = camZ - r.slot * SPACING;
        }
        /* the fade rides a custom property down to the cards: opacity
           below 1 on the ring itself would flatten its 3D and pop */
        r.node.style.setProperty("--o", opacityAt(e).toFixed(3));
      });
    }

    function tick(now) {
      var dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      camZ += (SPEED * dt) / 1000;
      frame();
      if (active) raf = requestAnimationFrame(tick);
    }

    rings.forEach(function (r) {
      r.node.style.transform = "translateZ(" + -r.slot * SPACING + "px)";
      r.cards.forEach(function (c) {
        c.el.style.transform =
          "translate3d(" + c.x + "px," + c.y + "px," + c.z + "px)";
      });
    });
    frame();

    return {
      setActive: function (on) {
        if (on === active) return;
        active = on;
        if (on) {
          last = 0;
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
        }
      },
    };
  }

  var root = document.getElementById("hiwCosmos");
  if (!root) return;
  var cosmos = build(root);
  /* driven by deck.js's updateHiw: the camera only runs while 01 shows */
  window.setCosmosActive = function (on) {
    cosmos.setActive(
      !!on && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  };
  var s5 = document.getElementById("s5");
  if (s5 && s5.classList.contains("active") && typeof layerStep !== "undefined" && layerStep === 1) {
    window.setCosmosActive(true);
  }
})();
