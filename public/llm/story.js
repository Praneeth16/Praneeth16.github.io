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
    el.querySelector('.sheet').style.background = el.dataset.paper;
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
    syncThreads();
    current = nearestScene();
    renderStepper();
  }, { rootMargin: '-8% 0px -8% 0px', threshold: 0.15 });
  scenes.forEach(s => watcher.observe(s.el));

  /* ---- detours, threads ---- */
  const threads = [...document.querySelectorAll('.thread')];
  const threadFrom = new Map(threads.filter(t => t.dataset.from).map(t => [t.dataset.from, t]));
  const byId = new Map(scenes.map(s => [s.el.id, s]));
  function setBroken(s, broken) {
    if (!s.detour || s.broken === broken) return;
    s.broken = broken;
    s.state.artType = broken ? s.detour : s.healthy;
    const button = s.el.querySelector('.break');
    if (button) { button.setAttribute('aria-pressed', String(broken)); button.textContent = broken ? button.dataset.repair : button.dataset.action; }
    s.el.classList.toggle('broken', broken);
    const thread = threadFrom.get(s.el.id);
    if (thread) {
      thread.classList.toggle('broken', broken);
      const tag = thread.querySelector('.red-tag');
      if (tag) { if (!tag.dataset.trigger) tag.dataset.trigger = tag.textContent; tag.textContent = broken ? thread.dataset.brokenLabel : tag.dataset.trigger; }
    }
    labelCues(s);
    s.start = performance.now();
    if (paused) paintStill(s);
    if (!reduce.matches) s.canvas.animate([{ opacity: .15 }, { opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
    renderStepper();
  }
  scenes.forEach(s => {
    const button = s.el.querySelector('.break');
    if (button && s.detour) button.addEventListener('click', () => setBroken(s, !s.broken));
  });
  document.querySelectorAll('.red-tag').forEach(tag => tag.addEventListener('click', () => {
    const s = byId.get(tag.dataset.breakFor); if (!s) return;
    setBroken(s, !s.broken);
    if (!s.broken) return;
    s.el.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'instant' : 'smooth' });
  }));
  function syncThreads() {
    for (const t of threads) {
      const a = byId.get(t.dataset.from), b = byId.get(t.dataset.to);
      t.classList.toggle('active', !!(a?.active || b?.active));
    }
  }

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
  function applyMotion() {
    document.body.classList.toggle('motion-off', paused);
    motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
    motionButton.setAttribute('aria-pressed', String(paused));
    if (paused) { scenes.forEach(paintStill); if (machine) machine.paint(performance.now(), true); }
    else scenes.forEach(s => { s.start = performance.now(); });
  }
  motionButton.addEventListener('click', () => { paused = !paused; applyMotion(); });
  reduce.addEventListener('change', e => { paused = e.matches; applyMotion(); });
  applyMotion();

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

  /* ---- stepper ---- */
  const chart = JSON.parse($('chart-data').textContent);
  const chartById = new Map(chart.map(c => [c.id, c]));
  const stepper = $('stepper'), openers = [...document.querySelectorAll('#step-open, #step-open-mast')];
  let current = scenes[0], stepping = false, playing = false, playTimer = 0;
  function nearestScene() {
    const mid = innerHeight / 2;
    let best = current, dist = Infinity;
    for (const s of scenes) { const r = s.el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < dist) { dist = d; best = s; } }
    return best;
  }
  function go(s) {
    if (!s) return;
    current = s;
    s.el.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'instant' : 'smooth' });
    renderStepper();
  }
  const indexOf = s => scenes.indexOf(s);
  function moves(s) {
    const c = chartById.get(s.el.id), list = [];
    const next = scenes[indexOf(s) + 1];
    if (s.broken) list.push({ kind: 'red', what: c.detour.mend, to: `back to ${c.title}`, run: () => setBroken(s, false) });
    else {
      if (next) list.push({ kind: 'gold', what: c.next, to: `to ${chartById.get(next.el.id).title}`, run: () => go(next) });
      else list.push({ kind: 'gold', what: c.next, to: 'to Raw web crawl', run: () => go(scenes[0]) });
      if (c.detour) list.push({ kind: 'red', what: c.detour.trigger, to: `to ${c.detour.title}`, run: () => setBroken(s, true) });
      if (c.loop) list.push({ kind: 'pale', what: c.loop, to: 'to Causal self-attention', run: () => go(byId.get('attention')) });
    }
    return list;
  }
  function renderStepper() {
    if (!stepping) return;
    const s = current, c = chartById.get(s.el.id);
    $('step-chapter').textContent = c.chapter;
    $('step-now').textContent = s.broken ? `What breaks: ${c.detour.title}` : c.title;
    const list = moves(s);
    $('step-ask').textContent = s.broken ? 'The checked invariant is violated here. One step repairs it.' : 'What can happen next?';
    $('step-moves').replaceChildren(...list.map(m => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = `move ${m.kind}`;
      const sw = document.createElement('i'); sw.className = `swatch ${m.kind}`;
      const what = document.createElement('span'); what.className = 'what'; what.textContent = m.what;
      const to = document.createElement('span'); to.className = 'to'; to.textContent = m.to;
      what.append(to); b.append(sw, what);
      b.addEventListener('click', () => { stopPlay(); m.run(); });
      li.append(b); return li;
    }));
    $('step-back').disabled = indexOf(s) === 0 && !s.broken;
    $('step-live').textContent = `${$('step-now').textContent}. ${list.length} step${list.length === 1 ? '' : 's'} can happen next.`;
  }
  function openStepper(from) {
    stepping = true; stepper.hidden = false; document.body.classList.add('stepping');
    openers.forEach(b => b.setAttribute('aria-expanded', 'true'));
    current = from === 'cover' ? scenes[0] : nearestScene();
    if (from === 'cover') go(scenes[0]); else renderStepper();
    $('step-now').focus({ preventScroll: true });
  }
  function closeStepper() {
    stopPlay(); stepping = false; stepper.hidden = true; document.body.classList.remove('stepping');
    openers.forEach(b => b.setAttribute('aria-expanded', 'false'));
  }
  function stopPlay() { playing = false; clearTimeout(playTimer); $('step-play').textContent = 'Play'; $('step-play').setAttribute('aria-pressed', 'false'); }
  function playStep() {
    if (!playing) return;
    const s = current;
    if (s.broken) { setBroken(s, false); }
    const next = scenes[indexOf(s) + 1];
    if (!next) { stopPlay(); return; }
    go(next);
    const d = (window.LLMScenes.durations[next.state.artType] || 10) * 1000;
    playTimer = setTimeout(playStep, Math.min(12000, d + 1200));
  }
  openers.forEach(b => b.addEventListener('click', () => stepping ? closeStepper() : openStepper(b.id === 'step-open' ? 'cover' : 'here')));
  $('step-close').addEventListener('click', closeStepper);
  $('step-back').addEventListener('click', () => { stopPlay(); if (current.broken) setBroken(current, false); else go(scenes[indexOf(current) - 1]); });
  $('step-play').addEventListener('click', () => {
    if (playing) { stopPlay(); return; }
    playing = true; $('step-play').textContent = 'Pause'; $('step-play').setAttribute('aria-pressed', 'true');
    const d = (window.LLMScenes.durations[current.state.artType] || 10) * 1000;
    playTimer = setTimeout(playStep, Math.min(12000, d + 600));
  });
  document.addEventListener('keydown', e => {
    if (!stepping || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'Escape') closeStepper();
    if (e.key === 'ArrowRight') { stopPlay(); const m = moves(current)[0]; m && m.run(); }
    if (e.key === 'ArrowLeft') { stopPlay(); $('step-back').click(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlay(); });

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
      readout.append(strong, document.createTextNode(nearest.detail));
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
