/* ==========================================================================
   W HÉRITAGE · Motion Lab
   One GSAP master timeline drives everything, including the Three.js layer:
   the dust field reads tl.time(), never the wall clock. Same time in, same
   frame out, so scrubbing, screen recording and headless frame export all
   match exactly.

   Direction (motion-design skill)
     Emotion: calm authority.  Personality: Premium (no overshoot).
     Primary   = masked line reveals (expo.out, 1.1–1.3 s, 90 ms stagger)
     Secondary = gold SVG strokes drawn after the words land (power3)
     Ambient   = gold dust, ~1/3 of the primary's speed, resolves into the W
     Exits accelerate (power2.in) and run ~45% shorter than entrances.
   ========================================================================== */
import * as THREE from 'three';

gsap.registerPlugin(SplitText);

const FPS = 30;
const DURATION = 19;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const stage = $('#stage');
const canvas = $('#dust');
const layer = $('.ml-layer');
const scenes = Object.fromEntries($$('.ml-scene').map(el => [el.dataset.scene, el]));

/* ── Three.js: dust field ───────────────────────────────────────────── */
const COUNT = matchMedia('(max-width: 640px)').matches ? 2400 : 3600;

const renderer = new THREE.WebGLRenderer({
  canvas, antialias: false, alpha: false, powerPreference: 'high-performance',
  preserveDrawingBuffer: true, // lets canvas.toDataURL() grab exact frames
});
renderer.setClearColor(0x080808, 1);

const scene3 = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 9 / 16, 0.1, 100);
const cam = { x: 0, y: 0, z: 11.5 };   // tweened by the timeline

const uniforms = {
  uTime:   { value: 0 },
  uMorph:  { value: 0 },
  uOpacity:{ value: 0 },
  uDrift:  { value: reduce ? 0 : 1 },
  uSize:   { value: 2.4 },
  uPx:     { value: 1 },
  uFocus:  { value: 11.5 },
  uTargetScale:  { value: 1 },
  uTargetOffset: { value: new THREE.Vector2() },
  // #C9A84C written straight into the output (ShaderMaterial skips colour management)
  uColor:  { value: new THREE.Vector3(0xC9 / 255, 0xA8 / 255, 0x4C / 255) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */`
    attribute vec3 aStart;
    attribute vec3 aTarget;
    attribute vec4 aSeed;   // x phase, y speed, z arrival delay, w size / join flag
    uniform float uTime, uMorph, uDrift, uSize, uPx, uFocus, uTargetScale;
    uniform vec2 uTargetOffset;
    varying float vAlpha;

    void main() {
      float ph = aSeed.x * 6.28318;
      float sp = 0.35 + aSeed.y * 0.65;
      vec3 drift = vec3(
        sin(uTime * 0.11 * sp + ph),
        cos(uTime * 0.09 * sp + ph * 1.3),
        sin(uTime * 0.07 * sp + ph * 0.7)
      ) * vec3(0.35, 0.45, 0.30) * uDrift;
      // dust rises slowly, like particles caught in a light beam
      vec3 free = aStart + drift + vec3(0.0, uTime * 0.03 * sp * uDrift, 0.0);

      vec3 target = vec3(aTarget.xy * uTargetScale + uTargetOffset, aTarget.z);
      target += drift * 0.035;

      // ~18% of the dust never joins the mark, so the field stays alive around it
      float joins = step(0.18, aSeed.w);
      float d = aSeed.z * 0.45;
      float m = smoothstep(d, d + 0.55, uMorph) * joins;

      vec3 p = mix(free, target, m);
      p.z += sin(m * 3.14159) * 1.4 * (aSeed.y - 0.5);   // arc through depth on the way in

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;

      float depth = -mv.z;
      float size = uSize * (0.55 + aSeed.w * 0.9) * mix(1.0, 0.85, m);
      gl_PointSize = size * uPx * (10.0 / depth);

      // shallow depth of field: sharp and bright near the focal plane, dim away from it
      float focus = 1.0 - smoothstep(1.2, 6.5, abs(depth - uFocus));
      vAlpha = mix(0.18, 0.9, focus) * mix(0.55 + 0.45 * aSeed.y, 0.85, m);
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    void main() {
      float r = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, r);
      gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
    }`,
});

const geometry = new THREE.BufferGeometry();
const points = new THREE.Points(geometry, material);
points.frustumCulled = false;
scene3.add(points);

// Seeded random so every load, and every exported frame, is identical.
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Sample the W from the brand serif, normalised to roughly [-1, 1].
function sampleMark(count, rand) {
  const S = 400;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `600 ${S * 0.82}px "Cormorant Garamond", Georgia, serif`;
  g.fillText('W', S / 2, S / 2 + S * 0.04);
  const data = g.getImageData(0, 0, S, S).data;
  const pts = [];
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 140) pts.push([x, y]);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y] = pts[Math.floor(rand() * pts.length)];
    out[i * 3]     = (x + rand() * 2 - S / 2) / (S / 2);
    out[i * 3 + 1] = -(y + rand() * 2 - S / 2) / (S / 2);
    out[i * 3 + 2] = (rand() - 0.5) * 0.12;
  }
  return out;
}

function buildDust() {
  const rand = mulberry32(1948);
  const start = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    start[i * 3]     = (rand() - 0.5) * 13;
    start[i * 3 + 1] = (rand() - 0.5) * 16;
    start[i * 3 + 2] = -7 + rand() * 10;
    seed.set([rand(), rand(), rand(), rand()], i * 4);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(start.slice(), 3)); // required by three, unused
  geometry.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  geometry.setAttribute('aTarget', new THREE.BufferAttribute(sampleMark(COUNT, rand), 3));
}

// Frame the W for the current format: above the CTA in 9:16 and 1:1, left of it in 16:9.
const CTA_CAM_Z = 9;
function layoutMark() {
  const aspect = camera.aspect;
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * CTA_CAM_Z;
  const halfW = halfH * aspect;
  const f = stage.dataset.format;
  if (f === '16:9') {
    uniforms.uTargetScale.value = Math.min(halfW * 0.3, halfH * 0.55);
    uniforms.uTargetOffset.value.set(-halfW * 0.4, 0);
  } else if (f === '1:1') {
    uniforms.uTargetScale.value = halfH * 0.36;
    uniforms.uTargetOffset.value.set(0, halfH * 0.24);
  } else {
    uniforms.uTargetScale.value = Math.min(halfW * 0.62, halfH * 0.3);
    uniforms.uTargetOffset.value.set(0, halfH * 0.3);
  }
}

function resize() {
  const { width, height } = stage.getBoundingClientRect();
  if (!width || !height) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  uniforms.uPx.value = dpr;
  uniforms.uSize.value = 2.6 * (height / 820);   // dust keeps its scale relative to the frame
  layoutMark();
  render(true);
}

let lastT = -1;
function render(force = false) {
  const t = tl ? tl.time() : 0;
  if (!force && t === lastT) return;   // paused = static frame, nothing loops on its own
  lastT = t;
  uniforms.uTime.value = t;
  uniforms.uFocus.value = cam.z;
  camera.position.set(cam.x, cam.y, cam.z);
  camera.lookAt(cam.x * 0.35, cam.y, 0);
  renderer.render(scene3, camera);
}

/* ── Strokes placed under their keyword (outside the split masks) ───── */
// Called from build() right after splitting, before any tween moves a line.
// Positions are stored as % of the scene, so they survive resizes untouched.
function placeStrokes() {
  $$('.ml-stroke[data-for]').forEach(svg => {
    const host = svg.parentElement;
    // SplitText clones inline elements into its line wrappers: take the copy that has the text.
    const word = $$(`[data-kw="${svg.dataset.for}"]`, host).find(el => el.getBoundingClientRect().width > 0);
    if (!word) return;
    const w = word.getBoundingClientRect(), h = host.getBoundingClientRect();
    if (!h.width) return;
    svg.style.left = `${((w.left - h.left) / h.width) * 100 - 1}%`;
    svg.style.width = `${(w.width / h.width) * 102}%`;
    svg.style.top = `${((w.bottom - h.top) / h.height) * 100 - 2}%`;
  });
}

/* ── Timeline ───────────────────────────────────────────────────────── */
let tl, ctx;
const LABELS = { hook: 0, probleme: 4.6, solution: 8.9, appel: 13.7 };

function lines(el) {
  return SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ml-line' }).lines;
}

// Primary layer: lines rise out of their mask.
function reveal(t, targets, at, { d = 1.25, s = 0.09 } = {}) {
  if (reduce) return t.from(targets, { autoAlpha: 0, duration: 0.5, stagger: 0.1, ease: 'none' }, at);
  return t.from(targets, { yPercent: 112, duration: d, stagger: s, ease: 'expo.out' }, at);
}

// Exit: accelerate away, shorter than the entrance, then hide the scene.
function exit(t, sceneEl, at) {
  const targets = $$('.ml-line, .ml-stroke, svg, .ml-label, .ml-sign', sceneEl);
  if (reduce) t.to(sceneEl, { autoAlpha: 0, duration: 0.4, ease: 'none' }, at);
  else t.to(targets, { yPercent: -110, autoAlpha: 0, duration: 0.65, stagger: 0.035, ease: 'power2.in' }, at)
        .set(sceneEl, { autoAlpha: 0 });
  return t;
}

// Slow camera push on the text plane: linear, barely perceptible, like a dolly.
function push(t, sceneEl, at, dur) {
  if (!reduce) t.fromTo(sceneEl, { scale: 1 }, { scale: 1.035, duration: dur, ease: 'none', transformOrigin: '0% 100%' }, at);
}

// Secondary layer: the gold stroke draws left to right. The strokes are stretched SVGs with
// non-scaling strokes, where dash-based drawing (DrawSVG) can break into fragments mid-draw,
// so the draw is a clip wipe on the <svg> itself: same read, pixel-stable at every frame.
function draw(t, el, at, dur = 0.9) {
  const svg = el.ownerSVGElement || el;
  return reduce ? t.from(svg, { autoAlpha: 0, duration: 0.4 }, at)
                : t.fromTo(svg, { clipPath: 'inset(-50% 100% -50% 0%)' },
                    { clipPath: 'inset(-50% 0% -50% 0%)', duration: dur, ease: 'power3.inOut' }, at);
}

function moveCam(t, to, at, dur) {
  if (!reduce) t.to(cam, { ...to, duration: dur, ease: 'sine.inOut' }, at);
}

function build() {
  ctx?.revert();
  ctx = gsap.context(() => {
    gsap.set(Object.values(scenes), { autoAlpha: 0 });
    tl = gsap.timeline({ paused: true, onUpdate: syncUI, onComplete: () => setPlaying(false) });
    Object.entries(LABELS).forEach(([k, v]) => tl.addLabel(k, v));

    // Ambient: dust fades up, camera starts a long push.
    tl.fromTo(uniforms.uOpacity, { value: 0 }, { value: 1, duration: 1.6, ease: 'power1.out' }, 0);
    tl.set(cam, { x: 0, y: 0, z: reduce ? 10 : 11.5 }, 0);
    moveCam(tl, { z: 10.3 }, 0, 4.6);

    /* Hook ─────────────────────────────── */
    const s1 = scenes.hook, [h1a, h1b] = $$('[data-split]', s1).map(lines);
    placeStrokes();
    tl.set(s1, { autoAlpha: 1 }, 0.4);
    push(tl, s1, 0.4, 4);
    reveal(tl, h1a, 0.5);
    reveal(tl, h1b, 1.3);
    draw(tl, $('.ml-stroke path', s1), 2.3, 1);
    exit(tl, s1, 3.95);

    /* Problème ─────────────────────────── */
    const s2 = scenes.probleme, [h2a, h2b] = $$('[data-split]', s2).map(lines);
    tl.set(s2, { autoAlpha: 1 }, 4.7);
    push(tl, s2, 4.7, 4);
    moveCam(tl, { z: 12, x: 0.6 }, 4.6, 4.3);
    reveal(tl, h2a, 4.8);
    reveal(tl, h2b, 6.1);                // a beat of silence before the turn
    exit(tl, s2, 8.15);

    /* Solution ─────────────────────────── */
    const s3 = scenes.solution;
    tl.set(s3, { autoAlpha: 1 }, 8.95);
    push(tl, s3, 8.95, 4.6);
    moveCam(tl, { z: 10.2, x: 0 }, 8.9, 4.4);
    tl.from($('.ml-label', s3), reduce ? { autoAlpha: 0, duration: 0.5 } :
      { autoAlpha: 0, y: 14, duration: 0.9, ease: 'expo.out' }, 9.05);
    $$('li', s3).forEach((li, i) => {
      const at = 9.5 + i * 0.8;
      draw(tl, $('line', li), at, 0.6);
      reveal(tl, lines($('[data-split]', li)), at + 0.15, { d: 1.1 });
    });
    exit(tl, s3, 13.0);

    /* Appel ────────────────────────────── */
    const s4 = scenes.appel;
    tl.to(uniforms.uMorph, { value: 1, duration: reduce ? 0.8 : 3.3, ease: 'power2.inOut' }, 12.7);
    moveCam(tl, { z: CTA_CAM_Z }, 12.7, 4.6);
    tl.set(s4, { autoAlpha: 1 }, 15.2);
    reveal(tl, lines($('[data-split]', s4)), 15.3, { d: 1.3 });
    draw(tl, $('.ml-rule line', s4), 16.05, 0.8);
    tl.from($('.ml-sign', s4), reduce ? { autoAlpha: 0, duration: 0.5 } :
      { autoAlpha: 0, y: 10, duration: 1, ease: 'expo.out' }, 16.4);

    tl.set({}, {}, DURATION);           // hold the last frame: silence is part of the cut
  }, stage);
}

/* ── Playback UI ────────────────────────────────────────────────────── */
const playBtn = $('#play'), tc = $('#tc'), scrub = $('#scrub');
let playing = false;

function timecode(t) {
  const f = Math.floor(t * FPS + 1e-6);
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(f / (FPS * 60)))}:${p(Math.floor(f / FPS) % 60)}:${p(f % FPS)}`;
}

function syncUI() {
  tc.textContent = timecode(tl.time());
  scrub.value = Math.round(tl.progress() * 1000);
}

function setPlaying(on) {
  playing = on;
  if (on) { if (tl.progress() >= 1) tl.time(0); tl.play(); } else tl.pause();
  playBtn.textContent = on ? 'Pause' : tl.progress() >= 1 ? 'Rejouer' : 'Lecture';
}

function seek(t) {
  setPlaying(false);
  tl.time(Math.max(0, Math.min(DURATION, t)));
  syncUI();
  render(true);
}

function setFormat(f) {
  const t = tl ? tl.time() : 0, was = playing;
  setPlaying(false);
  stage.dataset.format = f;
  $$('#formats [data-format]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.format === f)));
  build();                              // line breaks change with the frame, so re-split
  resize();
  seek(t);
  if (was) setPlaying(true);
}

function toggleRecording(force) {
  document.body.classList.toggle('is-recording', force);
}

playBtn.addEventListener('click', () => setPlaying(!playing));
scrub.addEventListener('input', () => seek((scrub.value / 1000) * DURATION));
$$('#scenes [data-seek]').forEach(b => b.addEventListener('click', () => seek(LABELS[b.dataset.seek])));
$$('#formats [data-format]').forEach(b => b.addEventListener('click', () => setFormat(b.dataset.format)));
$('#record').addEventListener('click', () => toggleRecording(true));

addEventListener('keydown', e => {
  if (e.target.closest('input') && e.key !== ' ') return;
  if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); seek(tl.time() + 1 / FPS); }
  else if (e.key === 'ArrowLeft')  { e.preventDefault(); seek(tl.time() - 1 / FPS); }
  else if (e.key === 'r' || e.key === 'R') seek(0);
  else if (e.key === 'h' || e.key === 'H') toggleRecording();
  else if (e.key === 'Escape') toggleRecording(false);
});

/* ── Boot ───────────────────────────────────────────────────────────── */
await Promise.all([
  document.fonts.load('600 100px "Cormorant Garamond"'),
  document.fonts.load('400 100px "Cormorant Garamond"'),
  document.fonts.load('italic 400 100px "Cormorant Garamond"'),
  document.fonts.load('400 16px "Montserrat"'),
]).catch(() => {});
await document.fonts.ready;

buildDust();
const params = new URLSearchParams(location.search);
const startFormat = ['9:16', '1:1', '16:9'].includes(params.get('format')) ? params.get('format') : '9:16';
stage.dataset.format = startFormat;
$$('#formats [data-format]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.format === startFormat)));
build();
resize();

$('.ml-marks').innerHTML = Object.values(LABELS).slice(1)
  .map(v => `<span style="left:${(v / DURATION) * 100}%"></span>`).join('');

new ResizeObserver(() => resize()).observe(stage);
gsap.ticker.add(() => render());

const t0 = parseFloat(params.get('t'));
seek(Number.isFinite(t0) ? t0 : 0);
if (params.get('record') === '1') toggleRecording(true);
if (params.get('autoplay') === '1') setPlaying(true);

// Hook for frame-exact export (e.g. Playwright: seek, then screenshot the stage).
window.motionLab = {
  duration: DURATION, fps: FPS, labels: LABELS,
  seek, play: () => setPlaying(true), pause: () => setPlaying(false),
  frame: t => { seek(t); return canvas.toDataURL('image/png'); },
  get timeline() { return tl; },
};
