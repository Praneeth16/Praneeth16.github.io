/** A self-contained ribbed sculpture. No images, WebGL, libraries, or network calls. */
export function initIdentityLoop() {
  const root = document.querySelector<HTMLElement>('.identity-hero');
  const canvas = root?.querySelector<HTMLCanvasElement>('.loop-canvas');
  const button = root?.querySelector<HTMLButtonElement>('.motion-toggle');
  if (!root || !canvas || !button) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // The inline SVG remains visible without canvas or JavaScript.
  const art = canvas.parentElement!;
  const label = button.querySelector<HTMLElement>('.motion-label')!;
  const icon = button.querySelector<HTMLElement>('.motion-icon')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  let paused = reduced.matches;
  let visible = false;
  let frame = 0;
  let last = 0;
  let angle = .45;
  let targetX = 0, targetY = 0, tiltX = 0, tiltY = 0;
  let width = 440, height = 520;
  type Point = [number, number, number];
  const rings = 128, sides = 24;
  const vertices: Point[][] = [];
  // An elliptical loop whose flattened cross section twists once around its spine.
  for (let i = 0; i <= rings; i++) {
    const u = i / rings * Math.PI * 2;
    const row: Point[] = [];
    const twist = u + .3;
    for (let j = 0; j <= sides; j++) {
      const v = j / sides * Math.PI * 2;
      const a = 41 * Math.cos(v), b = 25 * Math.sin(v);
      const outward = a * Math.cos(twist) - b * Math.sin(twist);
      const depth = a * Math.sin(twist) + b * Math.cos(twist);
      row.push([(92 + outward) * Math.cos(u), (148 + outward) * Math.sin(u), depth + 16 * Math.sin(2 * u)]);
    }
    vertices.push(row);
  }
  function transform(p: Point): Point {
    const yaw = .38 + Math.sin(angle) * .66 + tiltX;
    const pitch = -.15 + Math.cos(angle * .7) * .12 + tiltY;
    const roll = -.24 + Math.sin(angle * .55) * .12;
    const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
    const z = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
    const y = p[1] * Math.cos(pitch) - z * Math.sin(pitch);
    return [x * Math.cos(roll) - y * Math.sin(roll), x * Math.sin(roll) + y * Math.cos(roll), p[1] * Math.sin(pitch) + z * Math.cos(pitch)];
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / 360, height / 435);
    const shadow = ctx.createRadialGradient(width / 2, height * .91, 0, width / 2, height * .91, width * .27);
    shadow.addColorStop(0, 'rgba(30,55,48,.11)'); shadow.addColorStop(1, 'rgba(30,55,48,0)');
    ctx.save(); ctx.translate(0, height * .91); ctx.scale(1, .16); ctx.translate(0, -height * .91);
    ctx.fillStyle = shadow; ctx.fillRect(0, 0, width, height * 2); ctx.restore();
    const transformed = vertices.map(row => row.map(transform));
    const project = (p: Point): [number, number] => {
      const perspective = 760 / (760 - p[2]);
      return [width / 2 + p[0] * scale * perspective, height * .46 + p[1] * scale * perspective];
    };
    const faces: { points: Point[]; depth: number; light: number; band: boolean; ridge: boolean }[] = [];
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
      const a = transformed[i][j], b = transformed[i + 1][j], c = transformed[i + 1][j + 1], d = transformed[i][j + 1];
      const ab = b.map((v, k) => v - a[k]), ad = d.map((v, k) => v - a[k]);
      const normal = [ab[1] * ad[2] - ab[2] * ad[1], ab[2] * ad[0] - ab[0] * ad[2], ab[0] * ad[1] - ab[1] * ad[0]];
      const length = Math.hypot(...normal) || 1;
      const light = Math.max(0, (normal[0] * -.4 + normal[1] * -.65 + normal[2] * .7) / length);
      faces.push({ points: [a, b, c, d], depth: (a[2] + b[2] + c[2] + d[2]) / 4, light, band: i >= 87 && i < 92, ridge: i % 2 === 0 });
    }
    faces.sort((a, b) => a.depth - b.depth);
    for (const face of faces) {
      const shade = 24 + face.light * 112 + (face.ridge ? 9 : 0);
      ctx.fillStyle = face.band ? `rgb(${90 + face.light * 65},${129 + face.light * 62},${108 + face.light * 60})` : `rgb(${shade * .84},${shade + 9},${shade + 8})`;
      ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .65;
      ctx.beginPath();
      face.points.forEach((p, k) => { const [x, y] = project(p); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    art.classList.add('is-ready');
  }
  function animate(now: number) {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    if (now - last >= 1000 / 30) {
      const elapsed = last ? Math.min(now - last, 64) : 33;
      angle += elapsed * .00022;
      tiltX += (targetX - tiltX) * .06;
      tiltY += (targetY - tiltY) * .06;
      draw(); last = now;
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    button!.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Play motion' : 'Pause motion';
    icon.textContent = paused ? '▷' : 'Ⅱ';
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const rect = art.getBoundingClientRect(); width = rect.width; height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = Math.round(width * dpr); canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  new ResizeObserver(resize).observe(art);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .05 }).observe(art);
  button.hidden = false;
  button.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; tiltX = tiltY = targetX = targetY = 0; draw(); sync(); });
  document.addEventListener('visibilitychange', sync);
  art.addEventListener('pointermove', (event) => {
    if (!pointer.matches || reduced.matches || paused) return;
    const rect = art.getBoundingClientRect();
    targetX = ((event.clientX - rect.left) / rect.width - .5) * .3;
    targetY = ((event.clientY - rect.top) / rect.height - .5) * .2;
  });
  art.addEventListener('pointerleave', () => { targetX = targetY = 0; });
  resize(); sync();
}
