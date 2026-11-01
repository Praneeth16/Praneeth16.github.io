/* A see-through isometric transformer drawn in a hand-sketched line. Logical sheet 920 × 575. */
(() => {
  'use strict';
  const W = 920, H = 575, INK = '#221f1b', GOLD = '#f0c86a', RED = '#d9383a';
  function rng32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function line(ctx, x1, y1, x2, y2, color, width, seed, amp = 1.2) {
    const r = rng32(seed), n = Math.max(3, Math.min(18, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 14)));
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      ctx.globalAlpha = pass ? .42 : .92; ctx.beginPath();
      for (let i = 0; i <= n; i++) { const t = i / n, e = Math.sin(Math.PI * t); const x = x1 + (x2 - x1) * t + (r() - .5) * 2 * amp * e, y = y1 + (y2 - y1) * t + (r() - .5) * 2 * amp * e; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function circle(ctx, cx, cy, rad, stroke, fill, width, seed, amp = 1.1) {
    const r = rng32(seed); ctx.save(); ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, d = rad + (r() - .5) * 2 * amp; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } ctx.restore();
  }
  function paper(ctx, frame) {
    ctx.fillStyle = '#efe5ce'; ctx.fillRect(0, 0, W, H);
    const r = rng32(900 + frame * 17); ctx.save(); ctx.lineWidth = 1;
    for (let i = 0; i < 65; i++) { const x = r() * W, y = r() * H, len = 6 + r() * 18; ctx.strokeStyle = i % 2 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + (r() - .5) * 4); ctx.stroke(); }
    ctx.restore();
  }
  function project(x, y, z, yaw, pitch) {
    const c = Math.cos(yaw), s = Math.sin(yaw), rx = x * c - z * s, rz = x * s + z * c;
    return { x: W * .5 + rx * 1.18, y: H * .52 + (y + rz * Math.sin(pitch)) * 1.18 };
  }
  function wireBox(ctx, bx, by, bz, bw, bh, bd, yaw, pitch, stroke, fill, seed, amp) {
    const p = [[-bw, -bh, -bd], [bw, -bh, -bd], [bw, bh, -bd], [-bw, bh, -bd], [-bw, -bh, bd], [bw, -bh, bd], [bw, bh, bd], [-bw, bh, bd]].map(([x, y, z]) => project(bx + x, by + y, bz + z, yaw, pitch));
    if (fill) { ctx.save(); ctx.fillStyle = fill; for (const face of [[0, 1, 5, 4], [1, 2, 6, 5]]) { ctx.beginPath(); face.forEach((i, k) => k ? ctx.lineTo(p[i].x, p[i].y) : ctx.moveTo(p[i].x, p[i].y)); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b], i) => line(ctx, p[a].x, p[a].y, p[b].x, p[b].y, stroke, 1.8, seed + i, amp));
    return p[0];
  }
  const BOIL = [0, 1, 2, 1];

  function mount(o) {
    const ctx = o.canvas.getContext('2d');
    const state = { yaw: .6, pitch: .45, dragging: false, lastX: 0, spin: false, xray: true, part: 1 };
    const fit = () => { const w = Math.round(o.box.clientWidth * o.dpr), h = Math.round(o.box.clientHeight * o.dpr); if (o.canvas.width !== w || o.canvas.height !== h) { o.canvas.width = w; o.canvas.height = h; paint(performance.now(), true); } };
    new ResizeObserver(fit).observe(o.box);
    const angle = () => { o.angle.textContent = `${Math.round(((state.yaw * 180 / Math.PI) % 360 + 360) % 360)}°`; };
    o.box.addEventListener('pointerdown', e => { state.dragging = true; state.lastX = e.clientX; o.box.setPointerCapture(e.pointerId); });
    o.box.addEventListener('pointermove', e => { if (!state.dragging) return; state.yaw += (e.clientX - state.lastX) * .011; state.lastX = e.clientX; angle(); paint(performance.now(), false); });
    for (const type of ['pointerup', 'pointercancel']) o.box.addEventListener(type, () => { state.dragging = false; });
    o.spin.addEventListener('click', () => { state.spin = !state.spin; o.spin.setAttribute('aria-pressed', String(state.spin)); });
    o.xray.addEventListener('click', () => { state.xray = !state.xray; o.xray.setAttribute('aria-pressed', String(state.xray)); paint(performance.now(), false); });
    o.parts.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.part = Number(b.dataset.part);
      o.parts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      o.text.textContent = o.descriptions[state.part - 1];
      paint(performance.now(), false);
    }));

    function paint(now, still) {
      const sec = now / 1000, frame = still ? 0 : BOIL[Math.floor(now / 125) % 4], seed = 700 + frame * 29, yaw = state.yaw, pitch = state.pitch, amp = 1.3;
      if (state.spin && !state.dragging && !still) { state.yaw += .008; angle(); }
      ctx.save(); ctx.setTransform(o.canvas.width / W, 0, 0, o.canvas.height / H, 0, 0);
      paper(ctx, frame);
      for (let g = -220; g <= 220; g += 55) {
        const a = project(g, 135, -220, yaw, pitch), b = project(g, 135, 220, yaw, pitch), c = project(-220, 135, g, yaw, pitch), d = project(220, 135, g, yaw, pitch);
        line(ctx, a.x, a.y, b.x, b.y, 'rgba(34,31,27,.14)', 1, seed + g, .5); line(ctx, c.x, c.y, d.x, d.y, 'rgba(34,31,27,.14)', 1, seed + g + 500, .5);
      }
      wireBox(ctx, 0, 0, 0, 185, 125, 135, yaw, pitch, INK, state.xray ? 'rgba(200,90,66,.14)' : '#c85a42', seed + 10, amp);
      const anchors = {};
      const col = k => state.part === k ? RED : INK;
      anchors[1] = wireBox(ctx, -115, 65, 0, 46, 38, 82, yaw, pitch, col(1), state.xray ? 'rgba(240,200,106,.65)' : null, seed + 100, amp);
      const gear = project(-45, 45, 0, yaw, pitch);
      circle(ctx, gear.x, gear.y, 32, col(2), 'rgba(126,224,198,.72)', 2, seed + 200, amp);
      const ga = still ? 1.1 : sec * 2.4; line(ctx, gear.x, gear.y, gear.x + Math.cos(ga) * 28, gear.y + Math.sin(ga) * 28, RED, 2.4, seed + 210, amp);
      anchors[2] = gear;
      anchors[3] = wireBox(ctx, 10, -10, 0, 56, 48, 76, yaw, pitch, col(3), state.xray ? 'rgba(46,94,170,.55)' : null, seed + 300, amp);
      for (let e = -1; e <= 1; e++) { const a = wireBox(ctx, 108, -32 + e * 38, 0, 42, 14, 65, yaw, pitch, col(4), e ? 'rgba(60,141,109,.58)' : 'rgba(240,200,106,.85)', seed + 400 + e * 20, amp); if (e === -1) anchors[4] = a; }
      const ring = project(0, -105, 0, yaw, pitch);
      circle(ctx, ring.x, ring.y, 44, col(5), 'rgba(240,200,106,.45)', 2.2, seed + 500, amp); anchors[5] = ring;
      anchors[6] = wireBox(ctx, 105, 76, 0, 48, 30, 78, yaw, pitch, col(6), state.xray ? 'rgba(122,73,114,.62)' : null, seed + 600, amp);
      for (let p = 0; p < 6; p++) { const u = ((still ? .3 : sec * .55) + p / 6) % 1; const pt = project(-140 + u * 280, Math.sin(u * Math.PI * 2) * 35, 0, yaw, pitch); circle(ctx, pt.x, pt.y, 7, INK, GOLD, 1.6, seed + 700 + p, .6); }
      ctx.save(); ctx.font = '700 13px "KevinSans", "Fraunces", serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let k = 1; k <= 6; k++) { const pt = anchors[k]; const sel = state.part === k; circle(ctx, pt.x, pt.y - 12, sel ? 14 : 11, INK, sel ? GOLD : '#fffdf7', 2, seed + 800 + k, .5); ctx.fillStyle = INK; ctx.fillText(String(k), pt.x, pt.y - 11); }
      ctx.restore(); ctx.restore();
    }
    angle(); fit();
    return { paint };
  }
  window.LLMMachine = Object.freeze({ mount });
})();
