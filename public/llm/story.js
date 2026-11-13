/* Story controller: paints the visible drawings, swaps a scene into its failure variant,
 * drives the scale lab, and keeps the progress rail and chapter index in step with scrolling. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let paused = reduce.matches;

  /* ---- scenes ---- */
  const scenes = [...document.querySelectorAll('.scene')].map(el => {
    const canvas = el.querySelector('canvas');
    const entry = {
      el, canvas, ctx: canvas.getContext('2d'),
      healthy: el.dataset.art, detour: el.dataset.detour,
      state: { artType: el.dataset.art, paperBg: el.dataset.paper, paperText: el.dataset.ink },
      cues: [...el.querySelectorAll('.cues li')], start: performance.now(), active: false, broken: false
    };
    return entry;
  });
  const byCanvas = new Map(scenes.map(s => [s.canvas, s]));
  const byEl = new Map(scenes.map(s => [s.el, s]));

  function setCues(s, result) {
    s.cues.forEach((li, i) => {
      li.classList.toggle('active', result && i === result.phase);
      li.style.setProperty('--p', result && i === result.phase ? String(Math.min(1, result.progress * 3 - i)) : i < (result?.phase ?? 3) ? '1' : '0');
    });
  }
  function labelCues(s) {
    const cues = window.LLMScenes.cues[s.state.artType] || [];
    s.cues.forEach((li, i) => { li.textContent = cues[i] || ''; });
  }
  function paintStill(s) {
    const result = window.LLMScenes.render(s.ctx, s.canvas.width, s.canvas.height, s.state, 0, true);
    setCues(s, { phase: 2, progress: .72 });
    return result;
  }
  function paintLive(s, now) {
    const result = window.LLMScenes.render(s.ctx, s.canvas.width, s.canvas.height, s.state, (now - s.start) / 1000, false);
    setCues(s, result);
  }

  const sizer = new ResizeObserver(list => {
    for (const { target, contentRect } of list) {
      const w = Math.max(1, Math.round(contentRect.width * DPR)), h = Math.max(1, Math.round(contentRect.height * DPR));
      if (target.width !== w || target.height !== h) {
        target.width = w; target.height = h;
        const s = byCanvas.get(target);
        if (s) paintStill(s);
      }
    }
  });
  scenes.forEach(s => { labelCues(s); sizer.observe(s.canvas); });

  const watcher = new IntersectionObserver(list => {
    for (const x of list) {
      const s = byEl.get(x.target);
      const was = s.active;
      s.active = x.isIntersecting;
      s.el.classList.toggle('active', s.active);
      if (s.active && !was) s.start = performance.now();
    }
  }, { rootMargin: '-8% 0px -8% 0px', threshold: 0.15 });
  scenes.forEach(s => watcher.observe(s.el));

  /* ---- detours ---- */
  function setBroken(s, broken) {
    if (!s.detour || s.broken === broken) return;
    s.broken = broken;
    s.state.artType = broken ? s.detour : s.healthy;
    const button = s.el.querySelector('.break');
    button.setAttribute('aria-pressed', String(broken));
    button.textContent = broken ? button.dataset.repair : button.dataset.action;
    s.el.querySelector('.detour-body').hidden = !broken;
    s.el.classList.toggle('broken', broken);
    labelCues(s);
    s.start = performance.now();
    paintStill(s);
    if (!paused) s.canvas.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  scenes.forEach(s => {
    const button = s.el.querySelector('.break');
    if (!button || !s.detour) return;
    button.hidden = false;
    button.addEventListener('click', () => setBroken(s, !s.broken));
  });
  /* ---- machine ---- */
  const machine = window.LLMMachine && $('machine-canvas') ? window.LLMMachine.mount({
    canvas: $('machine-canvas'), box: $('machine-box'), angle: $('machine-angle'),
    parts: $('machine-parts'), text: $('machine-text'), spin: $('machine-spin'), xray: $('machine-xray'),
    descriptions: JSON.parse($('machine-parts-data').textContent), dpr: DPR
  }) : null;
  let machineActive = false;
  if (machine) {
    new IntersectionObserver(list => { machineActive = list.some(x => x.isIntersecting); if (machineActive && paused) machine.paint(performance.now(), true); }, { threshold: 0.1 }).observe($('machine'));
  }

  /* ---- loop ---- */
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (paused || document.hidden || now - last < 30) return;
    last = now;
    for (const s of scenes) if (s.active) paintLive(s, now);
    if (machine && machineActive) machine.paint(now, false);
  }
  requestAnimationFrame(frame);

  /* ---- motion toggle ---- */
  const motionButton = $('motion');
  motionButton.hidden = false;
  function applyMotion() {
    document.body.classList.toggle('motion-off', paused);
    motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.setAttribute('aria-pressed', String(paused));
    if (paused) {
      stopPlay();
      scenes.forEach(paintStill);
      if (machine) machine.paint(performance.now(), true);
    }
    else scenes.forEach(s => { s.start = performance.now(); });
  }
  motionButton.addEventListener('click', () => { paused = !paused; applyMotion(); });
  reduce.addEventListener('change', e => { paused = e.matches; applyMotion(); });

  /* ---- progress and chapter index ---- */
  const bar = $('progress');
  function progress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 0}%`;
  }
  addEventListener('scroll', progress, { passive: true }); progress();
  const links = new Map([...document.querySelectorAll('.index a')].map(a => [a.dataset.index, a]));
  const chapterWatcher = new IntersectionObserver(list => {
    for (const x of list) if (x.isIntersecting) links.forEach((a, id) => { if (id === x.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('.chapter').forEach(c => chapterWatcher.observe(c));

  /* ---- guided reading ---- */
  const stepper = $('stepper');
  const opener = $('step-open');
  const previous = $('step-back');
  const next = $('step-next');
  const play = $('step-play');
  let current = 0;
  let playing = false;
  let playTimer = 0;
  let guideScroll = 0;

  function renderStepper() {
    if (stepper.hidden) return;
    const scene = scenes[current];
    $('step-count').textContent = `Scene ${current + 1} of ${scenes.length}`;
    $('step-now').textContent = scene.el.querySelector('h3').textContent;
    const atEnd = current === scenes.length - 1;
    previous.setAttribute('aria-disabled', String(current === 0));
    next.setAttribute('aria-disabled', String(atEnd));
    play.setAttribute('aria-disabled', String(atEnd && !playing));
  }

  function go(index) {
    current = index;
    renderStepper();
    cancelAnimationFrame(guideScroll);
    guideScroll = requestAnimationFrame(() => {
      guideScroll = 0;
      const top = scenes[index].el.getBoundingClientRect().top + scrollY;
      const offset = stepper.getBoundingClientRect().bottom + 14;
      scrollTo({ top: top - offset, behavior: 'instant' });
    });
  }

  function stopPlay() {
    playing = false;
    clearTimeout(playTimer);
    play.textContent = 'Play';
    play.setAttribute('aria-pressed', 'false');
    renderStepper();
  }

  function scheduleAdvance() {
    if (current === scenes.length - 1) {
      stopPlay();
      return;
    }
    const duration = window.LLMScenes.durations[scenes[current].state.artType] || 10;
    playTimer = setTimeout(() => {
      go(current + 1);
      scheduleAdvance();
    }, (duration + 1.2) * 1000);
  }

  function step(offset) {
    const target = current + offset;
    if (target < 0 || target >= scenes.length) return;
    stopPlay();
    go(target);
  }

  function closeStepper() {
    if (stepper.hidden) return;
    stopPlay();
    cancelAnimationFrame(guideScroll);
    guideScroll = 0;
    stepper.hidden = true;
    document.body.classList.remove('stepping');
    opener.setAttribute('aria-expanded', 'false');
    const heading = scenes[current].el.querySelector('h3');
    scenes[current].el.scrollIntoView({ block: 'start', behavior: 'instant' });
    heading.focus({ preventScroll: true });
  }

  opener.hidden = false;
  opener.addEventListener('click', () => {
    stepper.hidden = false;
    document.body.classList.add('stepping');
    opener.setAttribute('aria-expanded', 'true');
    go(0);
    next.focus({ preventScroll: true });
  });
  $('step-close').addEventListener('click', closeStepper);
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  play.addEventListener('click', () => {
    if (playing) {
      stopPlay();
      return;
    }
    if (current === scenes.length - 1) return;
    playing = true;
    play.textContent = 'Pause';
    play.setAttribute('aria-pressed', 'true');
    scheduleAdvance();
  });
  stepper.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  });
  document.addEventListener('keydown', e => {
    if (!e.defaultPrevented && e.key === 'Escape') closeStepper();
  });
  let pendingScroll = false;
  addEventListener('scroll', () => {
    if (stepper.hidden || guideScroll || pendingScroll) return;
    pendingScroll = true;
    requestAnimationFrame(() => {
      pendingScroll = false;
      if (stepper.hidden || guideScroll) return;
      const readingLine = stepper.getBoundingClientRect().bottom + 18;
      const active = scenes.findLastIndex(scene => scene.el.getBoundingClientRect().top <= readingLine);
      if (active >= 0 && active !== current) {
        current = active;
        stopPlay();
      }
    });
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlay(); });
  applyMotion();

  Promise.all([document.fonts.load('16px KevinSans'), document.fonts.load('700 13px KevinSans')]).then(() => {
    if (!paused) return;
    scenes.forEach(paintStill);
    machine?.paint(performance.now(), true);
  }).catch(() => {});

  /* ---- scale lab ---- */
  const stops = $('time-stops') ? JSON.parse($('time-stops').textContent) : [];
  const time = $('time');
  if (time) {
    const readout = $('time-readout'), cursor = $('time-cursor'), stopEls = [...document.querySelectorAll('.stop')];
    const update = () => {
      const v = Number(time.value);
      let nearest = stops[0];
      for (const st of stops) if (Math.abs(st.pos - v) < Math.abs(nearest.pos - v)) nearest = st;
      cursor.style.left = `${v}%`;
      stopEls.forEach(el => el.classList.toggle('active', Number(el.dataset.pos) === nearest.pos));
      readout.innerHTML = '';
      const strong = document.createElement('strong'); strong.textContent = nearest.label;
      readout.append(strong, document.createTextNode(` ${nearest.detail}`));
    };
    time.addEventListener('input', update); update();
  }
  const n = $('n'), d = $('d');
  if (n && d) {
    const fmt = x => x.toLocaleString('en-US');
    const update = () => {
      const N = Number(n.value), D = Number(d.value);
      $('n-out').textContent = `${N} B`;
      $('d-out').textContent = `${D.toFixed(1)} T`;
      const flops = 6 * N * 1e9 * D * 1e12;
      $('flops').textContent = `${(flops / 1e24).toFixed(2)} × 10²⁴ FLOPs`;
      const days = flops / (8192 * 445e12 * 86400);
      $('days').textContent = `about ${fmt(Math.max(1, Math.round(days)))} day${Math.round(days) === 1 ? '' : 's'} on 8,192 H100s at 45% utilization`;
      $('mem').textContent = `${fmt(Math.round(N * 16))} GB`;
      const loss = 1.69 + 406.4 / Math.pow(N * 1e9, .34) + 410.7 / Math.pow(D * 1e12, .28);
      $('loss').textContent = `${loss.toFixed(3)} nats`;
      const ratio = Math.round(D * 1000 / N);
      const note = ratio > 40 ? 'above the roughly 20× compute-optimal point' : ratio >= 18 ? 'near the roughly 20× compute-optimal point' : 'below the roughly 20× compute-optimal point';
      $('ratio').textContent = `${fmt(ratio)} tokens per parameter, ${note}`;
    };
    n.addEventListener('input', update); d.addEventListener('input', update); update();
  }
})();
