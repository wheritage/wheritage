/* ==========================================================================
   W HÉRITAGE · Text Effects
   React Bits text components (BlurText, TrueFocus, RotatingText, StrokeText,
   ShinyText) rebuilt as tweens on ONE paused GSAP timeline. Nothing runs on
   its own clock: the original components loop with setInterval / rAF, here
   every state is a function of tl.time(), so scrubbing, screen recording and
   headless export (tools/render-reel.mjs) all give the same frame.

   Direction (motion-design skill)
     Emotion: calm authority.  Personality: Premium (no overshoot, no spring).
     Primary   = the effect itself (expo.out, 0.9–1.4 s)
     Secondary = gold brackets, rule, outline (power3.inOut, UI range)
     Exits accelerate (power2.in) and run ~40% shorter than entrances.
   ========================================================================== */
(async () => {
  gsap.registerPlugin(SplitText);

  const FPS = 30;
  const DURATION = 24;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const stage = $('#stage');
  const scenes = Object.fromEntries($$('.te-scene').map(el => [el.dataset.scene, el]));
  const LABELS = { blur: 0, focus: 4.3, rotate: 10.0, stroke: 15.1, end: 19.6 };

  let tl, ctx;

  const lines = el => SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'te-line' }).lines;
  const words = el => SplitText.create(el, { type: 'words', wordsClass: 'te-word' }).words;

  function rise(t, targets, at, { d = 1.2, s = 0.09 } = {}) {
    if (reduce) return t.from(targets, { autoAlpha: 0, duration: 0.5, stagger: 0.1, ease: 'none' }, at);
    return t.from(targets, { yPercent: 112, duration: d, stagger: s, ease: 'expo.out' }, at);
  }

  function exit(t, sceneEl, at, targets = $$('.te-line, .te-word, .te-fw, .te-label, svg, .te-sub, .te-slot > *', sceneEl)) {
    if (reduce) t.to(sceneEl, { autoAlpha: 0, duration: 0.4, ease: 'none' }, at);
    else t.to(targets, { yPercent: -60, autoAlpha: 0, duration: 0.6, stagger: 0.03, ease: 'power2.in' }, at);
    return t.set(sceneEl, { autoAlpha: 0 }, at + (reduce ? 0.4 : 0.8));
  }

  /* BlurText, "focus" variant: soft, slightly large, faint -> sharp. React Bits settles it
     with a spring; here it is a single expo.out so nothing overshoots. */
  function blurIn(t, targets, at) {
    if (reduce) return t.from(targets, { autoAlpha: 0, duration: 0.5, stagger: 0.08, ease: 'none' }, at);
    return t.fromTo(targets,
      { filter: 'blur(14px)', autoAlpha: 0, scale: 1.12, y: '0.12em' },
      { filter: 'blur(0px)', autoAlpha: 1, scale: 1, y: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out',
        transformOrigin: '50% 70%', clearProps: 'filter' }, at);
  }

  /* TrueFocus: measure each word inside the stack, in % of the stack, so the frame
     survives resizes; then the frame tweens box to box while blur follows it. */
  function focusRects(host, ws) {
    const h = host.getBoundingClientRect();
    return ws.map(w => {
      const r = w.getBoundingClientRect();
      const padX = r.height * 0.18, padY = r.height * 0.1;
      return {
        left: `${((r.left - h.left - padX) / h.width) * 100}%`,
        top: `${((r.top - h.top - padY) / h.height) * 100}%`,
        width: `${((r.width + padX * 2) / h.width) * 100}%`,
        height: `${((r.height + padY * 2) / h.height) * 100}%`,
      };
    });
  }

  function build() {
    ctx?.revert();
    ctx = gsap.context(() => {
      gsap.set(Object.values(scenes), { autoAlpha: 0 });
      tl = gsap.timeline({ paused: true, onUpdate: syncUI, onComplete: () => setPlaying(false) });
      Object.entries(LABELS).forEach(([k, v]) => tl.addLabel(k, v));

      /* BlurText ─────────────────────────── */
      const s1 = scenes.blur;
      const [w1, w2] = $$('[data-words]', s1).map(words);
      tl.set(s1, { autoAlpha: 1 }, 0.3);
      blurIn(tl, w1, 0.4);
      blurIn(tl, w2, 1.15);
      exit(tl, s1, 3.6);

      /* TrueFocus ────────────────────────── */
      const s2 = scenes.focus, stack = $('.te-words', s2), fws = $$('.te-fw', s2), frame = $('.te-frame', s2);
      const rects = focusRects(stack, fws);
      const SOFT = reduce ? { opacity: 0.35 } : { filter: 'blur(5px)', opacity: 0.4 };
      const SHARP = reduce ? { opacity: 1 } : { filter: 'blur(0px)', opacity: 1 };
      tl.set(s2, { autoAlpha: 1 }, 4.3);
      tl.from($('.te-label', s2), reduce ? { autoAlpha: 0, duration: 0.5 } :
        { autoAlpha: 0, y: 14, duration: 0.9, ease: 'expo.out' }, 4.4);
      tl.fromTo(fws, { ...SOFT, autoAlpha: 0, y: reduce ? 0 : 18 },
        { ...SOFT, autoAlpha: 0.4, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, 4.6);
      tl.set(frame, rects[0], 5.3);
      tl.fromTo(frame, { autoAlpha: 0, scale: reduce ? 1 : 1.12 },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 5.3);
      tl.to(fws[0], { ...SHARP, duration: 0.5, ease: 'power2.out' }, 5.3);
      [1, 2].forEach(i => {
        const at = 5.3 + i * 1.35;
        tl.to(frame, { ...rects[i], duration: reduce ? 0 : 0.55, ease: 'power3.inOut' }, at);
        tl.to(fws[i - 1], { ...SOFT, duration: 0.45, ease: 'power2.inOut' }, at);
        tl.to(fws[i], { ...SHARP, duration: 0.5, ease: 'power2.inOut' }, at + 0.05);
      });
      // Release: the three ideas read together, the frame steps away.
      tl.to(frame, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, 8.6);
      tl.to(fws, { ...SHARP, duration: 0.6, stagger: 0.06, ease: 'power2.out' }, 8.6);
      exit(tl, s2, 9.4, [...fws, $('.te-label', s2)]);

      /* RotatingText ─────────────────────── */
      const s3 = scenes.rotate, items = $$('.te-slot > *', s3);
      tl.set(s3, { autoAlpha: 1 }, 10.0);
      gsap.set(items, reduce ? { autoAlpha: 0 } : { yPercent: 115 });
      rise(tl, lines($('[data-split]', s3)), 10.1);
      items.forEach((el, i) => {
        const at = 10.75 + i * 1.3;
        if (reduce) tl.set(items, { autoAlpha: 0 }, at).set(el, { autoAlpha: 1 }, at);
        else {
          if (i) tl.to(items[i - 1], { yPercent: -115, duration: 0.55, ease: 'power2.in' }, at - 0.1);
          tl.to(el, { yPercent: 0, duration: 1.1, ease: 'expo.out' }, at + 0.25);
        }
      });
      exit(tl, s3, 14.4, [$('.te-line', s3), items.at(-1)]);

      /* StrokeText ───────────────────────── */
      const s4 = scenes.stroke, outline = $('.te-outline', s4), wipe = $('#te-wipe rect', s4);
      tl.set(s4, { autoAlpha: 1 }, 15.1);
      if (reduce) {
        tl.from(s4, { autoAlpha: 0, duration: 0.5 }, 15.1).set(wipe, { attr: { width: 1000 } }, 15.1);
      } else {
        // Uniform viewBox scale, so a dash draw on the glyph outlines stays clean.
        tl.fromTo(outline, { strokeDasharray: 2200, strokeDashoffset: 2200 },
          { strokeDashoffset: 0, duration: 2.1, ease: 'power2.inOut' }, 15.2);
        tl.to(wipe, { attr: { width: 1000 }, duration: 1.3, ease: 'power3.inOut' }, 16.6);
        tl.to(outline, { opacity: 0.3, duration: 0.8, ease: 'power2.out' }, 17.5);
      }
      tl.from($('.te-sub', s4), reduce ? { autoAlpha: 0, duration: 0.5 } :
        { autoAlpha: 0, y: 12, duration: 1, ease: 'expo.out' }, 17.4);
      exit(tl, s4, 19.0, [$('svg', s4), $('.te-sub', s4)]);

      /* ShinyText end card ───────────────── */
      const s5 = scenes.end, shine = $('.te-shine', s5);
      tl.set(s5, { autoAlpha: 1 }, 19.6);
      rise(tl, shine, 19.7, { d: 1.2 });
      draw(tl, $('.te-rule', s5), 20.3, 0.8);
      rise(tl, lines($('[data-split]', s5)), 20.5, { d: 1.3 });
      // One sheen pass, after the word has landed; it starts and ends off the word,
      // so the hold frame is flat gold again.
      if (!reduce) tl.fromTo(shine, { backgroundPosition: '100% 0' },
        { backgroundPosition: '0% 0', duration: 1.6, ease: 'power2.inOut' }, 21.4);

      tl.set({}, {}, DURATION);           // hold the last frame for the edit
    }, stage);
  }

  // Rule draws as a clip wipe: it is a stretched SVG, where dash drawing fragments.
  function draw(t, svg, at, dur) {
    return reduce ? t.from(svg, { autoAlpha: 0, duration: 0.4 }, at)
      : t.fromTo(svg, { clipPath: 'inset(-50% 100% -50% 0%)' },
          { clipPath: 'inset(-50% 0% -50% 0%)', duration: dur, ease: 'power3.inOut' }, at);
  }

  /* ── Playback UI ──────────────────────────────────────────────────── */
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
  }
  function setFormat(f) {
    const t = tl ? tl.time() : 0, was = playing;
    setPlaying(false);
    stage.dataset.format = f;
    $$('#formats [data-format]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.format === f)));
    build();                            // line breaks and focus boxes change with the frame
    seek(t);
    if (was) setPlaying(true);
  }
  const toggleRecording = force => document.body.classList.toggle('is-recording', force);

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

  /* ── Boot ─────────────────────────────────────────────────────────── */
  const params = new URLSearchParams(location.search);
  if (params.get('render') === '1') document.body.classList.add('is-render');

  await Promise.all([
    document.fonts.load('400 100px "Cormorant Garamond"'),
    document.fonts.load('italic 400 100px "Cormorant Garamond"'),
    document.fonts.load('500 16px "Montserrat"'),
  ]).catch(() => {});
  await document.fonts.ready;

  const startFormat = ['9:16', '1:1', '16:9'].includes(params.get('format')) ? params.get('format') : '9:16';
  stage.dataset.format = startFormat;
  $$('#formats [data-format]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.format === startFormat)));
  build();

  let resizeT;
  new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(() => setFormat(stage.dataset.format), 150); })
    .observe(stage);

  const t0 = parseFloat(params.get('t'));
  seek(Number.isFinite(t0) ? t0 : 0);
  if (params.get('record') === '1') toggleRecording(true);
  if (params.get('autoplay') === '1') setPlaying(true);

  // Same export hook shape as the Motion Lab: seek(t), then screenshot the stage.
  window.reel = window.textEffects = {
    duration: DURATION, fps: FPS, labels: LABELS, ready: true,
    seek, play: () => setPlaying(true), pause: () => setPlaying(false),
    get timeline() { return tl; },
  };
})();
