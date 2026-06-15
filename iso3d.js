/**
 * iso3d.js — "how it works" (s5) layer visuals, ported 1:1 from the app's
 * live nav icons (cyph-design-system-3d-fe/src/theme/*Icon3D.tsx) so the deck
 * matches exactly what users see after opening the cyph card:
 *
 *   underground → UndergroundLinesIcon3D  (eight trunk tubes on a dark slab,
 *                                          white streak traveling each line)
 *   cyph        → CyphDoorsIcon3D          (subway car doors opening/closing,
 *                                          brushed-aluminum + studio HDRI)
 *   irl         → polaroid <img>           (CSS pendulum sway — done in markup)
 *
 * The deck is a static page (no React / R3F), so the two WebGL icons are
 * re-implemented in vanilla three.js. Constants, geometry, lighting, camera,
 * materials and shader hooks are copied verbatim from the source components;
 * R3F's defaults (ACES tone mapping, sRGB output, dpr clamp, shadowMap on but
 * no light casts) are reproduced on the bare WebGLRenderer.
 */

import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { ExtrudeGeometry, Shape } from "three";

// ─────────────────────────────────────────────────────────────────────
// Shared renderer factory — reproduces the <Canvas> defaults R3F applies.
// ─────────────────────────────────────────────────────────────────────
function makeRenderer(canvas, { localClipping = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true; // `shadows` on <Canvas>; no light casts
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = localClipping;
  return renderer;
}

function fitRenderer(renderer, camera, canvas) {
  const w = canvas.clientWidth || 1;
  const h = canvas.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ═════════════════════════════════════════════════════════════════════
// UNDERGROUND — eight trunk lines on a dark slab.
// Port of UndergroundLinesIcon3D.tsx.
// ═════════════════════════════════════════════════════════════════════

const UG_TEX = "assets/layers/textures/underground_base/";

// Domain colors — canonical taxonomy hues (domainRegistry.ts).
const DOMAIN_COLOR = {
  civics: "#D93B2B",
  culture: "#E8622A",
  arts: "#E8B400",
  stem: "#3DBD4A",
  spirituality: "#00B5CC",
  sports: "#003FA5",
  humanities: "#8B6230",
  business: "#808080",
};

const SLAB_WIDTH = 16;
const SLAB_DEPTH = 20;
const SLAB_THICKNESS = 0.18;
const SLAB_DARK = "#1a1a1f";
const FRAME_RING_DARK = "#0a0c0f";
const FRAME_BORDER_WORLD = 0.4;
const FRAME_DEPTH_EXTRA = 0.16;
const TUBE_LIFT = SLAB_THICKNESS + 0.005;

const HALF_W = SLAB_WIDTH / 2;
const HALF_D = SLAB_DEPTH / 2;
const TRUNK_PATHS = [
  { domain: "civics", points: [[-HALF_W * 0.95, -HALF_D * 0.32], [HALF_W * 0.95, -HALF_D * 0.32]] },
  { domain: "spirituality", points: [[-HALF_W * 0.95, 0], [HALF_W * 0.95, 0]] },
  { domain: "business", points: [[-HALF_W * 0.95, HALF_D * 0.32], [HALF_W * 0.95, HALF_D * 0.32]] },
  { domain: "arts", points: [[-HALF_W * 0.45, -HALF_D * 0.92], [-HALF_W * 0.45, HALF_D * 0.92]] },
  { domain: "sports", points: [[HALF_W * 0.45, -HALF_D * 0.92], [HALF_W * 0.45, HALF_D * 0.92]] },
  {
    domain: "stem",
    points: [
      [-HALF_W * 0.25, -HALF_D * 0.92],
      [-HALF_W * 0.25, -HALF_D * 0.08],
      [HALF_W * 0.2, -HALF_D * 0.08],
      [HALF_W * 0.75, HALF_D * 0.4],
      [HALF_W * 0.95, HALF_D * 0.92],
    ],
  },
  { domain: "culture", points: [[HALF_W * 0.95, -HALF_D * 0.95], [-HALF_W * 0.85, HALF_D * 0.48]] },
  { domain: "humanities", points: [[-HALF_W * 0.95, -HALF_D * 0.6], [HALF_W * 0.95, HALF_D * 0.92]] },
];

const UG_TUBE_RADIUS = 0.18;
const UG_LINE_EMISSIVE = 0.6;
const UG_CAMERA_POSITION = [0, 22, 14];
const UG_CAMERA_FOV = 40;

function buildUnderground(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(UG_CAMERA_FOV, 1, 0.1, 100);
  camera.position.set(...UG_CAMERA_POSITION);
  camera.lookAt(0, 0, 0);

  // Three-light rig (warm key + cool fill), dialed down for the dark slab.
  scene.add(new THREE.AmbientLight(0xfff5dc, 0.42));
  const key = new THREE.DirectionalLight(0xffd9a8, 0.65);
  key.position.set(6, 10, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe2ff, 0.32);
  fill.position.set(-5, 6, -4);
  scene.add(fill);

  // Dark substrate slab with molded-plastic PBR grain.
  const texLoader = new THREE.TextureLoader();
  const baseColor = texLoader.load(UG_TEX + "underground-base-basecolor.jpg");
  baseColor.colorSpace = THREE.SRGBColorSpace;
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(SLAB_WIDTH, SLAB_THICKNESS, SLAB_DEPTH),
    new THREE.MeshStandardMaterial({
      color: SLAB_DARK,
      map: baseColor,
      normalMap: texLoader.load(UG_TEX + "underground-base-normal.jpg"),
      roughnessMap: texLoader.load(UG_TEX + "underground-base-roughness.jpg"),
      roughness: 1,
      metalness: 0.05,
    }),
  );
  slab.position.set(0, SLAB_THICKNESS / 2, 0);
  scene.add(slab);

  // Frame ring around the slab edge.
  const ring = new THREE.Mesh(
    new THREE.BoxGeometry(
      SLAB_WIDTH + FRAME_BORDER_WORLD * 2,
      FRAME_DEPTH_EXTRA,
      SLAB_DEPTH + FRAME_BORDER_WORLD * 2,
    ),
    new THREE.MeshStandardMaterial({ color: FRAME_RING_DARK, roughness: 0.78, metalness: 0.18 }),
  );
  ring.position.set(0, SLAB_THICKNESS / 2 + FRAME_DEPTH_EXTRA / 2, 0);
  scene.add(ring);

  // Shared streak time uniform — driven once per frame.
  const uTime = { value: 0 };
  const onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
float streakPos = mod(uTime * 0.08, 1.0);
float streakDist = abs(vUv.x - streakPos);
streakDist = min(streakDist, 1.0 - streakDist);
float streakIntensity = smoothstep(0.045, 0.0, streakDist);
totalEmissiveRadiance += vec3(1.0) * streakIntensity * 0.9;`,
      );
  };

  // Eight trunk tubes.
  for (const { domain, points } of TRUNK_PATHS) {
    const v3 = points.map(([x, z]) => new THREE.Vector3(x, TUBE_LIFT, z));
    const curve = new THREE.CatmullRomCurve3(v3, false, "catmullrom", 0.4);
    const segments = Math.max(48, points.length * 16);
    const geometry = new THREE.TubeGeometry(curve, segments, UG_TUBE_RADIUS, 12, false);
    const color = DOMAIN_COLOR[domain] || "#888";
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.42,
      metalness: 0.18,
      emissive: UG_LINE_EMISSIVE > 0 ? color : "#000000",
      emissiveIntensity: UG_LINE_EMISSIVE,
    });
    material.defines = { USE_UV: "" };
    material.onBeforeCompile = onBeforeCompile;
    scene.add(new THREE.Mesh(geometry, material));
  }

  return { renderer, scene, camera, tick: (dt) => (uTime.value += dt) };
}

// ═════════════════════════════════════════════════════════════════════
// CYPH — subway car doors opening and closing on a loop.
// Port of CyphDoorsIcon3D.tsx.
// ═════════════════════════════════════════════════════════════════════

const DOORS_TEX = "assets/layers/textures/doors/";
// Vendored copy of the exact HDRI drei's "studio" preset resolves to
// (studio_small_03_1k.hdr), so the doors' metallic reflection matches the
// app without a runtime CDN dependency.
const STUDIO_HDR = "assets/layers/textures/studio_small_03_1k.hdr";

const DOORWAY_WIDTH = 3.6;
const DOORWAY_HEIGHT = 2.6;
const WALL_DEPTH = 0.42;
const FRAME_PAD = 0.45;
const WALL_WIDTH = DOORWAY_WIDTH + FRAME_PAD * 2;
const WALL_HEIGHT = DOORWAY_HEIGHT + FRAME_PAD * 2;

const DOOR_SEAM = 0.01;
const DOOR_WIDTH = DOORWAY_WIDTH / 2 - DOOR_SEAM;
const DOOR_HEIGHT = DOORWAY_HEIGHT;
const DOOR_DEPTH = 0.06;
const DOOR_FRONT_Z = WALL_DEPTH / 2 + DOOR_DEPTH / 2 + 0.001;

const WINDOW_TOP_FRACTION = 0.22;
const WINDOW_HEIGHT_FRACTION = 0.32;
const WINDOW_INSET_FRACTION = 0.15;
const WINDOW_WIDTH = DOOR_WIDTH * (1 - WINDOW_INSET_FRACTION * 2);
const WINDOW_HEIGHT = DOOR_HEIGHT * WINDOW_HEIGHT_FRACTION;
const WINDOW_CENTER_Y =
  DOOR_HEIGHT * (0.5 - (WINDOW_TOP_FRACTION + WINDOW_HEIGHT_FRACTION / 2));

const PARALLAX_REF_DEPTH = 2.4;

const DOOR_COLOR = "#6a6d72";
const SILL_COLOR = "#000000";
const DOOR_ROUGHNESS = 0.65;
const DOOR_METALNESS = 1.0;
const DOOR_NORMAL_SCALE = 0.6;

const CAMERA_DIST = 8;
const YAW_RAD = (14 * Math.PI) / 180;
const TILT_RAD = (18 * Math.PI) / 180;
const HORIZONTAL_DIST = CAMERA_DIST * Math.cos(TILT_RAD);
const CAMERA_X = HORIZONTAL_DIST * Math.sin(YAW_RAD);
const CAMERA_Y = CAMERA_DIST * Math.sin(TILT_RAD);
const CAMERA_Z = HORIZONTAL_DIST * Math.cos(YAW_RAD);

const CLOSED_HOLD_FRACTION = 1.0 / 6.0;
const OPENING_FRACTION = 1.5 / 6.0;
const OPEN_HOLD_FRACTION = 2.0 / 6.0;
const CLOSED_HOLD_END = CLOSED_HOLD_FRACTION;
const OPENING_END = CLOSED_HOLD_END + OPENING_FRACTION;
const OPEN_HOLD_END = OPENING_END + OPEN_HOLD_FRACTION;
const DOOR_OPEN_DISTANCE = DOORWAY_WIDTH / 2;

const PARALLAX_TARGET_Z = -WALL_DEPTH / 2 - PARALLAX_REF_DEPTH / 2;
const PARALLAX_T = (DOOR_FRONT_Z - CAMERA_Z) / (PARALLAX_TARGET_Z - CAMERA_Z);
const PARALLAX_FACTOR = 1 - PARALLAX_T;
const DOOR_HORIZONTAL_LIFT = CAMERA_X * PARALLAX_FACTOR;
const DOOR_VERTICAL_LIFT = CAMERA_Y * PARALLAX_FACTOR;

const DOORS_CYCLE_SEC = 6;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function computeOpenFactor(elapsed, period) {
  if (period <= 0) return 0;
  const phase = (elapsed % period) / period;
  if (phase < CLOSED_HOLD_END) return 0;
  if (phase < OPENING_END) return smoothstep((phase - CLOSED_HOLD_END) / OPENING_FRACTION);
  if (phase < OPEN_HOLD_END) return 1;
  const closingFraction = 1 - OPEN_HOLD_END;
  return 1 - smoothstep((phase - OPEN_HOLD_END) / closingFraction);
}

// Door slab as four strips around the window aperture (a true hole).
function buildDoorPanel(material) {
  const group = new THREE.Group();
  const winLeft = -WINDOW_WIDTH / 2;
  const winRight = WINDOW_WIDTH / 2;
  const winTop = WINDOW_CENTER_Y + WINDOW_HEIGHT / 2;
  const winBottom = WINDOW_CENTER_Y - WINDOW_HEIGHT / 2;
  const halfDoorW = DOOR_WIDTH / 2;
  const halfDoorH = DOOR_HEIGHT / 2;

  const topStripHeight = halfDoorH - winTop;
  const topStripY = winTop + topStripHeight / 2;
  const bottomStripHeight = winBottom - -halfDoorH;
  const bottomStripY = -halfDoorH + bottomStripHeight / 2;
  const leftStripWidth = winLeft - -halfDoorW;
  const leftStripX = -halfDoorW + leftStripWidth / 2;
  const rightStripWidth = halfDoorW - winRight;
  const rightStripX = winRight + rightStripWidth / 2;

  const strip = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, DOOR_DEPTH), material);
    m.position.set(x, y, 0);
    group.add(m);
  };
  strip(DOOR_WIDTH, topStripHeight, 0, topStripY);
  strip(DOOR_WIDTH, bottomStripHeight, 0, bottomStripY);
  strip(leftStripWidth, WINDOW_HEIGHT, leftStripX, WINDOW_CENTER_Y);
  strip(rightStripWidth, WINDOW_HEIGHT, rightStripX, WINDOW_CENTER_Y);
  return group;
}

function buildCyphDoors(canvas) {
  const renderer = makeRenderer(canvas, { localClipping: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z);
  camera.lookAt(0, 0, 0);

  // Cool-balanced three-light rig (keeps the brushed steel gray).
  scene.add(new THREE.AmbientLight(0xf5f7fa, 0.55));
  const key = new THREE.DirectionalLight(0xeef2f7, 0.85);
  key.position.set(-3, 4, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc9d6e6, 0.35);
  fill.position.set(2.5, 1, -1.5);
  scene.add(fill);

  // Studio HDRI — environment only (reflection for the metallic doors).
  new RGBELoader().load(STUDIO_HDR, (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
    pmrem.dispose();
  });

  // World-space clipping planes pinned at the doorway edges → doors
  // recess into the wall pocket rather than sliding into open space.
  const clippingPlanes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), DOORWAY_WIDTH / 2 - DOOR_HORIZONTAL_LIFT),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), DOORWAY_WIDTH / 2 + DOOR_HORIZONTAL_LIFT),
  ];

  const doorMat = new THREE.MeshStandardMaterial({
    color: DOOR_COLOR,
    roughness: DOOR_ROUGHNESS,
    metalness: DOOR_METALNESS,
    clippingPlanes,
  });

  // Brushed-aluminum maps: one grayscale source drives albedo (sRGB) +
  // roughness (linear clone); separate normal map for micro-relief.
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const texLoader = new THREE.TextureLoader();
  texLoader.load(DOORS_TEX + "702-brushed-aluminum.jpg", (albedo) => {
    albedo.colorSpace = THREE.SRGBColorSpace;
    const roughness = albedo.clone();
    roughness.colorSpace = THREE.NoColorSpace;
    roughness.needsUpdate = true;
    texLoader.load(DOORS_TEX + "brushed-aluminum-normal-2k.png", (normal) => {
      for (const t of [albedo, roughness, normal]) {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
        t.anisotropy = maxAniso;
        t.needsUpdate = true;
      }
      doorMat.map = albedo;
      doorMat.roughnessMap = roughness;
      doorMat.normalMap = normal;
      doorMat.normalScale.set(DOOR_NORMAL_SCALE, DOOR_NORMAL_SCALE);
      doorMat.needsUpdate = true;
    });
  });

  // Bottom sill — the only car-wall chrome that stays visible.
  const halfDoorwayH = DOORWAY_HEIGHT / 2;
  const sillHeight = (WALL_HEIGHT - DOORWAY_HEIGHT) / 2;
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_WIDTH, sillHeight, WALL_DEPTH),
    new THREE.MeshStandardMaterial({ color: SILL_COLOR, roughness: 1.0, metalness: 0 }),
  );
  sill.position.set(DOOR_HORIZONTAL_LIFT, -halfDoorwayH - sillHeight / 2 + DOOR_VERTICAL_LIFT, 0);
  scene.add(sill);

  // Doors: wrapper (parallax lift) → animated left/right groups → panels.
  const wrapper = new THREE.Group();
  wrapper.position.set(DOOR_HORIZONTAL_LIFT, DOOR_VERTICAL_LIFT, 0);

  const leftGroup = new THREE.Group();
  const leftPanel = buildDoorPanel(doorMat);
  leftPanel.position.set(-(DOOR_WIDTH / 2 + DOOR_SEAM / 2), 0, DOOR_FRONT_Z);
  leftGroup.add(leftPanel);

  const rightGroup = new THREE.Group();
  const rightPanel = buildDoorPanel(doorMat);
  rightPanel.position.set(DOOR_WIDTH / 2 + DOOR_SEAM / 2, 0, DOOR_FRONT_Z);
  rightGroup.add(rightPanel);

  wrapper.add(leftGroup, rightGroup);
  scene.add(wrapper);

  // The doors open/close on a loop ONLY while the cyph layer is the
  // selected step; otherwise they hold closed (mirrors the app's
  // `cyclePeriodSec={0}` freeze). `setActive` is wired from deck.js's
  // layer navigation. Activating resets the cycle so it always begins
  // from the closed-hold and opens cleanly.
  let elapsed = 0;
  let active = false;
  const tick = (dt) => {
    if (active) elapsed += dt;
    const factor = active ? computeOpenFactor(elapsed, DOORS_CYCLE_SEC) : 0;
    leftGroup.position.x = -DOOR_OPEN_DISTANCE * factor;
    rightGroup.position.x = DOOR_OPEN_DISTANCE * factor;
  };

  const setActive = (next) => {
    if (next === active) return;
    active = next;
    if (active) elapsed = 0; // restart from closed → open
  };

  return { renderer, scene, camera, tick, setActive };
}

// ═════════════════════════════════════════════════════════════════════
// CYPHCARD — the membership plate, extruded to a real card with a gentle
// pendulum sway. Port of CyphCard3D.tsx (size="hero", sway).
//
// The app projects the 2D <Cyphcard> SVG onto the slab's front face via
// drei <Html transform>. The deck has no React, so the SAME card art is
// reproduced as a standalone SVG (cyphcard-metrocard.svg — the exact
// metrocard Cyphcard from the waitlist "you're in" page: yellow field,
// four-stripe signature, magstripe, "cyphcard" wordmark, EST 05 2026
// stamp, member id 00000000) and rides a front-facing plane just ahead of
// the slab — exactly as the Html overlay sits in front of the slab in the
// app. The slab carries the worn-plastic PBR body, depth, and bevel.
// ═════════════════════════════════════════════════════════════════════

const CARD_TEX = "assets/layers/textures/cyphcard/";
const CARD_ART = "assets/reference/ip/cyphcard-metrocard.svg";

// ID-1 credit-card proportions (1.586:1) — same as the app's hero/metrocard
// Cyphcard. World scale anchored to the hero 384px spec (matches CyphCard3D).
const CARD_PX_WIDTH = 384;
const CARD_PX_HEIGHT = Math.round((384 * 303) / 480); // = 242, ID-1 aspect
const PIXELS_PER_WORLD_UNIT = 40;

const CARD_FIELD = "#fccc0a";
const CARD_EDGE_FILL = "#cca308";
const CARD_DEPTH_RATIO = 0.075;
const BEVEL_THICKNESS_RATIO = 0.012;
const BEVEL_SIZE_RATIO = 0.012;
const CORNER_RADIUS_RATIO = 24 / 384;

const CARD_SWAY_PERIOD_SEC = 6;
const CARD_SWAY_AMPLITUDE_DEG = 30;
const CARD_FOV = 32;

function buildCyphcard(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();

  const worldWidth = CARD_PX_WIDTH / PIXELS_PER_WORLD_UNIT;
  const worldHeight = CARD_PX_HEIGHT / PIXELS_PER_WORLD_UNIT;
  const worldDepth = worldHeight * CARD_DEPTH_RATIO;
  const longerAxis = Math.max(worldWidth, worldHeight);

  const camera = new THREE.PerspectiveCamera(CARD_FOV, 1, 0.1, 100);
  camera.position.set(0, 0, longerAxis * 2.0);
  camera.lookAt(0, 0, 0);

  // Hemisphere ambient gradient + three-point product rig (verbatim).
  scene.add(new THREE.HemisphereLight(0xfff5e2, 0x1a1a1a, 0.55));
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));
  const key = new THREE.DirectionalLight(0xffe8c8, 1.1);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe2ff, 0.32);
  fill.position.set(3, -1.5, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.65);
  rim.position.set(3, 4, -3.5);
  scene.add(rim);

  const swayGroup = new THREE.Group();
  scene.add(swayGroup);

  // Rounded-rect extruded slab — worn-plastic enamel body.
  const cornerRadius = worldWidth * CORNER_RADIUS_RATIO;
  const bevelThickness = worldDepth * BEVEL_THICKNESS_RATIO;
  const bevelSize = worldDepth * BEVEL_SIZE_RATIO;
  const shape = new Shape();
  const w = worldWidth / 2;
  const h = worldHeight / 2;
  const r = Math.min(cornerRadius, w, h);
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  const geometry = new ExtrudeGeometry(shape, {
    depth: worldDepth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments: 18,
  });

  const texLoader = new THREE.TextureLoader();
  const baseColor = texLoader.load(CARD_TEX + "cyphcard-basecolor.jpg");
  baseColor.colorSpace = THREE.SRGBColorSpace;
  const faceMat = new THREE.MeshStandardMaterial({
    color: CARD_FIELD,
    map: baseColor,
    normalMap: texLoader.load(CARD_TEX + "cyphcard-normal.png"),
    roughnessMap: texLoader.load(CARD_TEX + "cyphcard-roughness.jpg"),
    roughness: 1,
    metalness: 0.08,
  });
  const edgeMat = new THREE.MeshStandardMaterial({
    color: CARD_EDGE_FILL,
    roughness: 0.78,
    metalness: 0.05,
  });
  const slab = new THREE.Mesh(geometry, [faceMat, edgeMat]);
  slab.position.set(0, 0, -worldDepth / 2);
  swayGroup.add(slab);

  // Printed face — the canonical card art on a plane just ahead of the
  // slab's front (mirrors the app's <Html> overlay). Alpha-mapped rounded
  // corners reveal the slab edge behind, so the silhouette reads as one
  // rounded card. Inset a hair so the slab body fills behind the corners.
  const artTex = texLoader.load(CARD_ART);
  artTex.colorSpace = THREE.SRGBColorSpace;
  artTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(worldWidth * 0.998, worldHeight * 0.998),
    // `toneMapped: false` — the printed face is the canonical card art, not
    // a lit surface. In the app it's a DOM <Html> overlay that never passes
    // through the WebGL tone mapper; matching that here keeps the MTA yellow
    // (#fccc0a) at true saturation instead of ACES desaturating it to a
    // faded wash.
    new THREE.MeshBasicMaterial({ map: artTex, transparent: true, toneMapped: false }),
  );
  art.position.set(0, 0, worldDepth / 2 + bevelThickness + 0.002);
  swayGroup.add(art);

  // Pendulum sway around Y — sin drive, ±30°, 6s period (app defaults).
  const amplitudeRad = (CARD_SWAY_AMPLITUDE_DEG * Math.PI) / 180;
  const angularFrequency = (Math.PI * 2) / CARD_SWAY_PERIOD_SEC;
  let phase = 0;
  const tick = (dt) => {
    phase += dt;
    swayGroup.rotation.y = Math.sin(phase * angularFrequency) * amplitudeRad;
  };

  return { renderer, scene, camera, tick };
}

// ═════════════════════════════════════════════════════════════════════
// SYLLABUS PAPER — a sheet of paper swaying as if hung in the air, the
// route↔syllabus toggle affordance. Port of SwayingPaper3D.tsx.
//
// Unlit meshBasicMaterial sheet (paper-grain basecolor) with 18 thin
// ruled lines, and a top-left CYPH wordmark crest. In the app the crest
// is a DOM <Html> overlay (CyphWordmark size=9); the deck bakes the same
// four-disc wordmark onto a small front-facing plane so it sways with the
// sheet. Sway: Y pendulum + a small Z lean, 5s period, ±16°.
// ═════════════════════════════════════════════════════════════════════

const PAPER_TEX = "assets/layers/textures/paper-basecolor.jpg";
const WORDMARK_ART = "assets/reference/ip/cyph-wordmark.svg";

const PAPER_ASPECT = 1.3;
const PAPER_W = 2;
const PAPER_H = PAPER_W * PAPER_ASPECT;
const RULE_COUNT = 18;
const RULE_THICKNESS = 0.012;
const RULE_WIDTH_RATIO = 0.78;
const RULE_AREA_TOP_INSET_WORLD = 0.75;
const MASTHEAD_LEFT_PAD_WORLD = 0.1;
const MASTHEAD_TOP_PAD_WORLD = 0.22;
const PAPER_SWAY_PERIOD_SEC = 5;
const PAPER_SWAY_AMPLITUDE_DEG = 16;

function buildSyllabusPaper(canvas) {
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  // No lights — the sheet is unlit meshBasicMaterial (matches the app).
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 5.4);
  camera.lookAt(0, 0, 0);

  const swayGroup = new THREE.Group();
  scene.add(swayGroup);

  const texLoader = new THREE.TextureLoader();
  const paperMap = texLoader.load(PAPER_TEX);
  paperMap.colorSpace = THREE.SRGBColorSpace;

  // The sheet.
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(PAPER_W, PAPER_H),
    new THREE.MeshBasicMaterial({ color: "#ffffff", map: paperMap }),
  );
  swayGroup.add(sheet);

  // 18 ruled lines spanning the lower body, pure black on white.
  const ruleTopY = PAPER_H / 2 - RULE_AREA_TOP_INSET_WORLD;
  const ruleBottomY = -PAPER_H / 2 + MASTHEAD_LEFT_PAD_WORLD;
  const ruleSpan = ruleTopY - ruleBottomY;
  const ruleGeo = new THREE.PlaneGeometry(PAPER_W * RULE_WIDTH_RATIO, RULE_THICKNESS);
  const ruleMat = new THREE.MeshBasicMaterial({ color: "#0a0a0a" });
  for (let i = 0; i < RULE_COUNT; i++) {
    const y = ruleTopY - ruleSpan * (i / (RULE_COUNT - 1));
    const m = new THREE.Mesh(ruleGeo, ruleMat);
    m.position.set(0, y, 0.012);
    swayGroup.add(m);
  }

  // Top-left CYPH wordmark crest. `toneMapped: false` so the disc colors
  // match the app's DOM <Html> overlay (which never passes through the
  // WebGL tone mapper). Sized + anchored to mirror CyphWordmark size=9.
  const markTex = texLoader.load(WORDMARK_ART);
  markTex.colorSpace = THREE.SRGBColorSpace;
  markTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const markW = 0.67;
  const markH = markW * (100 / 469); // wordmark art aspect (469×100)
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(markW, markH),
    new THREE.MeshBasicMaterial({ map: markTex, transparent: true, toneMapped: false }),
  );
  mark.position.set(
    -PAPER_W / 2 + MASTHEAD_LEFT_PAD_WORLD + markW / 2,
    PAPER_H / 2 - MASTHEAD_TOP_PAD_WORLD - markH / 2,
    0.014,
  );
  swayGroup.add(mark);

  const amp = (PAPER_SWAY_AMPLITUDE_DEG * Math.PI) / 180;
  const angularFrequency = (Math.PI * 2) / PAPER_SWAY_PERIOD_SEC;
  let phase = 0;
  const tick = (dt) => {
    phase += dt;
    const s = Math.sin(phase * angularFrequency);
    swayGroup.rotation.y = s * amp;
    swayGroup.rotation.z = s * amp * 0.12; // tips into the swing like a hung page
  };

  return { renderer, scene, camera, tick };
}

// ═════════════════════════════════════════════════════════════════════
// Boot — one rAF loop drives both scenes; ResizeObserver keeps them framed.
// ═════════════════════════════════════════════════════════════════════

function init() {
  const ugCanvas = document.getElementById("ugCanvas");
  const doorsCanvas = document.getElementById("doorsCanvas");
  if (!ugCanvas || !doorsCanvas) return;

  const ug = buildUnderground(ugCanvas);
  const doors = buildCyphDoors(doorsCanvas);
  const scenes = [ug, doors];

  // Driven by deck.js's updateLayerStack — doors loop only while the
  // cyph layer is selected, otherwise they hold closed.
  window.setCyphDoorsActive = (on) => doors.setActive(!!on);

  // Swaying membership plate on the underground slide (s6), if present.
  const cyphcardCanvas = document.getElementById("cyphcardCanvas");
  if (cyphcardCanvas) scenes.push(buildCyphcard(cyphcardCanvas));

  // "how we make money" (s10) showcase tiles: reach → doors looping
  // open/close continuously; belong → the swaying advanced cyphcard.
  const reachDoorsCanvas = document.getElementById("reachDoorsCanvas");
  if (reachDoorsCanvas) {
    const reachDoors = buildCyphDoors(reachDoorsCanvas);
    reachDoors.setActive(true); // loop continuously (no layer gating here)
    scenes.push(reachDoors);
  }
  const belongCardCanvas = document.getElementById("belongCardCanvas");
  if (belongCardCanvas) scenes.push(buildCyphcard(belongCardCanvas));

  // build → swaying syllabus paper (route↔syllabus toggle affordance).
  const syllabusPaperCanvas = document.getElementById("syllabusPaperCanvas");
  if (syllabusPaperCanvas) scenes.push(buildSyllabusPaper(syllabusPaperCanvas));

  const ro = new ResizeObserver(() => {
    for (const s of scenes) fitRenderer(s.renderer, s.camera, s.renderer.domElement);
  });
  for (const s of scenes) {
    ro.observe(s.renderer.domElement);
    fitRenderer(s.renderer, s.camera, s.renderer.domElement);
  }

  let last = null;
  function frame(now) {
    const dt = last == null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    for (const s of scenes) {
      s.tick(dt);
      s.renderer.render(s.scene, s.camera);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
