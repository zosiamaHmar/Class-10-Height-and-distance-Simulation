/* Maths by Zosiama · Surface Areas & Volumes explainers — 3D solids engine.
 *
 * Built on video-kit/core.js. This file adds a tiny flat-shaded 3D renderer for the
 * solids of the chapter (cube/cuboid, cylinder, cone, hemisphere, capsule ends, half
 * cylinder), cavities cut into them (bowls, cones), dimension labels, the exploded
 * view, the scene card and the hook illustrations. Every frame is a pure function of t.
 *
 * Projection: orthographic, camera yaw/elevation per scene; world y is up, units are
 * the problem's units and P.scene.scale converts them to pixels (drawn to scale).
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, BX, BY, BW, font, clamp, lerp, win, ease, rgba, rnd,
    rrect, pill, text, shadowBlob, createCore,
  } = root.VideoCore;

  // ------------------------------------------------------------------------------
  // colour + vector helpers
  // ------------------------------------------------------------------------------
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const cmix = (a, b, k) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * k);
  const css = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
  const INK = hex(PAL.ink), PAPER = hex(PAL.paper);
  const BASE = {
    coral: hex(PAL.coral), teal: hex(PAL.teal), sun: hex(PAL.sun), plum: hex(PAL.plum),
    wood: cmix(hex(PAL.sun), hex(PAL.coral), 0.32),
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const LIGHT = norm([-0.55, 0.78, 0.55]);
  const TAU = Math.PI * 2;

  function camera(yawDeg, elevDeg, scale, ox, oy) {
    const y = yawDeg * Math.PI / 180, a = elevDeg * Math.PI / 180;
    const right = [Math.cos(y), 0, -Math.sin(y)];
    const up = [-Math.sin(y) * Math.sin(a), Math.cos(a), -Math.cos(y) * Math.sin(a)];
    const view = [Math.sin(y) * Math.cos(a), Math.sin(a), Math.cos(y) * Math.cos(a)];
    return {
      view, scale, ox, oy,
      p: (v) => [ox + scale * dot(v, right), oy - scale * dot(v, up)],
      d: (v) => dot(v, view),
    };
  }
  function hull(pts) { // monotone chain
    const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (P.length < 3) return P;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    lo.pop(); hi.pop();
    return lo.concat(hi);
  }
  const polyPath = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };

  // ------------------------------------------------------------------------------
  // meshes (world units): faces {p:[v…], n, cap?} + feature edges {a, b, n1, n2}
  // ------------------------------------------------------------------------------
  const ring = (n, f) => Array.from({ length: n }, (_, i) => f((i / n) * TAU, i));
  function meshCyl(r, h, N = 56) {                // vertical axis, base at y = 0
    const faces = [], edges = [];
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * TAU, t1 = ((i + 1) / N) * TAU, tm = (t0 + t1) / 2;
      const a = [r * Math.cos(t0), 0, r * Math.sin(t0)], b = [r * Math.cos(t1), 0, r * Math.sin(t1)];
      const c = [b[0], h, b[2]], d = [a[0], h, a[2]], n = [Math.cos(tm), 0, Math.sin(tm)];
      faces.push({ p: [a, b, c, d], n, role: 'side' });
      edges.push({ a: d, b: c, n1: n, n2: [0, 1, 0] }, { a, b, n1: n, n2: [0, -1, 0] });
    }
    faces.push({ p: ring(N, (t) => [r * Math.cos(t), h, r * Math.sin(t)]), n: [0, 1, 0], role: 'top' });
    faces.push({ p: ring(N, (t) => [r * Math.cos(t), 0, r * Math.sin(t)]), n: [0, -1, 0], role: 'bottom' });
    return { faces, edges };
  }
  function meshCone(r, h, N = 56) {               // base at y = 0; h > 0 apex up, h < 0 apex down
    const faces = [], edges = [], s = Math.sign(h), Hh = Math.abs(h), apex = [0, h, 0];
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * TAU, t1 = ((i + 1) / N) * TAU, tm = (t0 + t1) / 2;
      const a = [r * Math.cos(t0), 0, r * Math.sin(t0)], b = [r * Math.cos(t1), 0, r * Math.sin(t1)];
      const n = norm([Math.cos(tm) * Hh, s * r, Math.sin(tm) * Hh]);
      faces.push({ p: [a, b, apex], n, role: 'side' });
      edges.push({ a, b, n1: n, n2: [0, -s, 0] });
    }
    faces.push({ p: ring(N, (t) => [r * Math.cos(t), 0, r * Math.sin(t)]), n: [0, -s, 0], role: 'base' });
    return { faces, edges };
  }
  function meshHemi(r, dir, N = 48, M = 12) {     // flat face at y = 0; dir +1 dome up, -1 bowl down
    const faces = [], edges = [];
    const pt = (f, t) => [r * Math.cos(f) * Math.cos(t), dir * r * Math.sin(f), r * Math.cos(f) * Math.sin(t)];
    for (let j = 0; j < M; j++) {
      const f0 = (j / M) * Math.PI / 2, f1 = ((j + 1) / M) * Math.PI / 2, fm = (f0 + f1) / 2;
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * TAU, t1 = ((i + 1) / N) * TAU, tm = (t0 + t1) / 2;
        faces.push({ p: [pt(f0, t0), pt(f0, t1), pt(f1, t1), pt(f1, t0)], n: norm(pt(fm, tm)), role: 'side' });
        if (j === 0) edges.push({ a: pt(0, t0), b: pt(0, t1), n1: norm(pt(0.05, tm)), n2: [0, -dir, 0] });
      }
    }
    faces.push({ p: ring(N, (t) => [r * Math.cos(t), 0, r * Math.sin(t)]), n: [0, -dir, 0], role: 'flat' });
    return { faces, edges };
  }
  function meshBox(w, h, d) {                     // centred on x/z, base at y = 0
    const x = w / 2, z = d / 2;
    const V = (i, j, k) => [i ? x : -x, j ? h : 0, k ? z : -z];
    const F = [
      { p: [V(0, 1, 0), V(1, 1, 0), V(1, 1, 1), V(0, 1, 1)], n: [0, 1, 0], role: 'top' },
      { p: [V(0, 0, 0), V(0, 0, 1), V(1, 0, 1), V(1, 0, 0)], n: [0, -1, 0], role: 'bottom' },
      { p: [V(0, 0, 1), V(1, 0, 1), V(1, 1, 1), V(0, 1, 1)], n: [0, 0, 1], role: 'front' },
      { p: [V(0, 0, 0), V(1, 0, 0), V(1, 1, 0), V(0, 1, 0)], n: [0, 0, -1], role: 'back' },
      { p: [V(1, 0, 0), V(1, 0, 1), V(1, 1, 1), V(1, 1, 0)], n: [1, 0, 0], role: 'right' },
      { p: [V(0, 0, 0), V(0, 0, 1), V(0, 1, 1), V(0, 1, 0)], n: [-1, 0, 0], role: 'left' },
    ];
    const E = [];
    const e = (a, b, n1, n2) => E.push({ a, b, n1, n2 });
    const nx = [1, 0, 0], mx = [-1, 0, 0], ny = [0, 1, 0], my = [0, -1, 0], nz = [0, 0, 1], mz = [0, 0, -1];
    e(V(0, 1, 0), V(1, 1, 0), ny, mz); e(V(0, 1, 1), V(1, 1, 1), ny, nz); e(V(0, 1, 0), V(0, 1, 1), ny, mx); e(V(1, 1, 0), V(1, 1, 1), ny, nx);
    e(V(0, 0, 0), V(1, 0, 0), my, mz); e(V(0, 0, 1), V(1, 0, 1), my, nz); e(V(0, 0, 0), V(0, 0, 1), my, mx); e(V(1, 0, 0), V(1, 0, 1), my, nx);
    e(V(0, 0, 0), V(0, 1, 0), mx, mz); e(V(1, 0, 0), V(1, 1, 0), nx, mz); e(V(0, 0, 1), V(0, 1, 1), mx, nz); e(V(1, 0, 1), V(1, 1, 1), nx, nz);
    return { faces: F, edges: E };
  }
  function meshHCyl(r, len, N = 56) {             // axis along x, centred, axis at y = 0
    const faces = [], edges = [], x = len / 2;
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * TAU, t1 = ((i + 1) / N) * TAU, tm = (t0 + t1) / 2;
      const P = (xx, t) => [xx, r * Math.cos(t), r * Math.sin(t)];
      faces.push({ p: [P(-x, t0), P(x, t0), P(x, t1), P(-x, t1)], n: [0, Math.cos(tm), Math.sin(tm)], role: 'side' });
    }
    return { faces, edges };
  }
  function meshHCap(r, dir, N = 48, M = 12) {     // hemisphere with axis along x, flat face at x = 0
    const faces = [], edges = [];
    const pt = (f, t) => [dir * r * Math.sin(f), r * Math.cos(f) * Math.cos(t), r * Math.cos(f) * Math.sin(t)];
    for (let j = 0; j < M; j++) {
      const f0 = (j / M) * Math.PI / 2, f1 = ((j + 1) / M) * Math.PI / 2, fm = (f0 + f1) / 2;
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * TAU, t1 = ((i + 1) / N) * TAU, tm = (t0 + t1) / 2;
        faces.push({ p: [pt(f0, t0), pt(f0, t1), pt(f1, t1), pt(f1, t0)], n: norm(pt(fm, tm)), role: 'side' });
      }
    }
    faces.push({ p: ring(N, (t) => [0, r * Math.cos(t), r * Math.sin(t)]), n: [-dir, 0, 0], role: 'flat' });
    return { faces, edges };
  }
  function meshRoof(r, len, N = 40) {             // half cylinder, axis along z, flat side down at y = 0
    const faces = [], edges = [], z = len / 2;
    const P = (t, zz) => [r * Math.cos(t), r * Math.sin(t), zz];
    for (let i = 0; i < N; i++) {
      const t0 = (i / N) * Math.PI, t1 = ((i + 1) / N) * Math.PI, tm = (t0 + t1) / 2, n = [Math.cos(tm), Math.sin(tm), 0];
      faces.push({ p: [P(t0, -z), P(t1, -z), P(t1, z), P(t0, z)], n, role: 'side' });
      edges.push({ a: P(t0, z), b: P(t1, z), n1: n, n2: [0, 0, 1] }, { a: P(t0, -z), b: P(t1, -z), n1: n, n2: [0, 0, -1] });
    }
    const arc = (zz) => Array.from({ length: N + 1 }, (_, i) => P((i / N) * Math.PI, zz));
    faces.push({ p: arc(z), n: [0, 0, 1], role: 'end' }, { p: arc(-z), n: [0, 0, -1], role: 'end' });
    faces.push({ p: [P(0, -z), P(0, z), P(Math.PI, z), P(Math.PI, -z)], n: [0, -1, 0], role: 'bottom' });
    edges.push({ a: P(0, -z), b: P(0, z), n1: [1, 0, 0], n2: [0, -1, 0] }, { a: P(Math.PI, -z), b: P(Math.PI, z), n1: [-1, 0, 0], n2: [0, -1, 0] });
    return { faces, edges };
  }
  function buildMesh(s) {
    switch (s.type) {
      case 'cyl': return meshCyl(s.r, s.h);
      case 'cone': return meshCone(s.r, s.h);
      case 'hemi': return meshHemi(s.r, s.dir === 'up' ? 1 : -1);
      case 'box': return meshBox(s.w, s.h, s.d);
      case 'hcyl': return meshHCyl(s.r, s.len);
      case 'hcap': return meshHCap(s.r, s.dir);
      case 'roof': return meshRoof(s.r, s.len);
      case 'bowl': return meshHemi(s.r, -1);      // cavity: removed lower hemisphere
      case 'bowlUp': return meshHemi(s.r, 1);     // cavity: removed upper hemisphere (bottom scoop)
      case 'conehole': return meshCone(s.r, -s.h); // cavity: removed cone, apex down
    }
    throw new Error(`unknown solid ${s.type}`);
  }
  const anchor = (s) => (s.type === 'hcap' ? [s.x || 0, s.y || 0, s.z || 0] : s.at ? s.at : [s.x || 0, s.y || 0, s.z || 0]);

  // ------------------------------------------------------------------------------
  // drawing
  // ------------------------------------------------------------------------------
  function tone(base, n, inside) {
    const k = dot(n, LIGHT) * (inside ? -1 : 1);
    if (inside) return k > 0.35 ? cmix(base, INK, 0.2) : k > -0.1 ? cmix(base, INK, 0.33) : cmix(base, INK, 0.45);
    return k > 0.55 ? cmix(base, PAPER, 0.4) : k > 0.08 ? base : cmix(base, INK, 0.24);
  }
  /** convex solid: front faces, silhouette, visible feature edges (hidden ones dashed on request) */
  function drawSolid(ctx, cam, mesh, pos, base, o = {}) {
    const P = (v) => cam.p(add(v, pos));
    const all = [];
    if (o.glass) {
      for (const f of mesh.faces) all.push(...f.p.map(P));
      polyPath(ctx, hull(all)); ctx.fillStyle = css(base, 0.3); ctx.fill();
      const top = mesh.faces.find((f) => f.role === 'top');
      if (top) { polyPath(ctx, top.p.map(P)); ctx.fillStyle = css(cmix(base, PAPER, 0.35), 0.6); ctx.fill(); }
    }
    for (const f of (o.glass ? [] : mesh.faces)) {
      const pts = f.p.map(P);
      all.push(...pts);
      if (dot(f.n, cam.view) <= 1e-4 || (o.skip && o.skip.includes(f.role))) continue;
      const c = css(tone(base, f.n, false), o.alpha || 1);
      polyPath(ctx, pts); ctx.fillStyle = c; ctx.fill();
      ctx.lineWidth = 1.3; ctx.strokeStyle = c; ctx.stroke();
    }
    const hl = hull(all);
    if (!o.noOutline) { polyPath(ctx, hl); ctx.lineWidth = o.lw || 4.5; ctx.strokeStyle = css(INK, o.alpha || 1); ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.save(); ctx.lineCap = 'round';
    for (const e of mesh.edges) {
      const vis = dot(e.n1, cam.view) > 0 || dot(e.n2, cam.view) > 0;
      if (!vis && !o.hidden) continue;
      const a = P(e.a), b = P(e.b);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      if (vis) { ctx.setLineDash([]); ctx.lineWidth = o.elw || 3; ctx.strokeStyle = css(INK, o.alpha || 1); }
      else { ctx.setLineDash([9, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = css(INK, 0.5 * (o.alpha || 1)); }
      ctx.stroke();
    }
    ctx.restore();
    return hl;
  }
  /** the inside of a cavity, seen through its opening (clipped), plus its dashed hidden outline */
  function drawCavity(ctx, cam, cav, pos, base, k = 1) {
    const mesh = cav.mesh;
    const P = (v) => cam.p(add(v, pos));
    const hl = hull(mesh.faces.flatMap((f) => f.p.map(P)));
    ctx.save(); polyPath(ctx, hl); ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.strokeStyle = css(INK, 0.5 * k); ctx.stroke(); ctx.restore();
    if (cav.hiddenOnly) return;
    const open = ring(64, (t) => P([cav.r * Math.cos(t), 0, cav.r * Math.sin(t)]));
    ctx.save(); polyPath(ctx, open); ctx.clip();
    ctx.globalAlpha *= k;
    for (const f of mesh.faces) {
      if (dot(f.n, cam.view) >= -1e-4 || f.role !== 'side') continue;
      const pts = f.p.map(P), c = css(tone(base, f.n, true));
      polyPath(ctx, pts); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = c; ctx.stroke();
    }
    ctx.restore();
    polyPath(ctx, open); ctx.lineWidth = 3.5; ctx.strokeStyle = css(INK, k); ctx.stroke();
  }

  // ------------------------------------------------------------------------------
  // the video
  // ------------------------------------------------------------------------------
  function createVideo(P, TL) {
    const C = createCore(P, TL, {
      tokens: {
        r: { s: 'r', c: PAL.coral }, h: { s: 'h', c: PAL.teal }, l: { s: 'l', c: PAL.plum }, a: { s: 'a', c: PAL.teal },
      },
      chapter: `SOLIDS · Q${P.num}`,
      label: `QUESTION ${P.num}`,
    });
    const { D, beats, beat, math, parseMath, mathWidth } = C;
    const S = P.scene;

    const showAt = {};
    for (const b of beats) for (const l of b.lines) if (l.show) String(l.show).split('+').forEach((k) => { if (showAt[k] === undefined) showAt[k] = l.start; });
    const at = (k) => (showAt[k] === undefined ? Infinity : showAt[k]);

    // parts, cavities and their meshes (built once)
    const parts = S.parts.map((s) => Object.assign({}, s, { mesh: buildMesh(s), base: BASE[s.color || 'teal'] }));
    const cavs = (S.cavities || []).map((s) => Object.assign({}, s, { mesh: buildMesh(s) }));
    const partOf = (id) => parts.find((p) => p.id === id);

    // camera: to scale, centred in the stage using the resting shape
    const G = { bx: 90, by: 280, bw: 900, bh: 538, br: 28 };
    const cam0 = camera(S.yaw || 0, S.elev || 20, S.scale, 0, 0);
    const pts0 = parts.flatMap((p) => p.mesh.faces.flatMap((f) => f.p.map((v) => cam0.p(add(v, anchor(p))))));
    const bx = [Math.min(...pts0.map((q) => q[0])), Math.max(...pts0.map((q) => q[0]))];
    const by = [Math.min(...pts0.map((q) => q[1])), Math.max(...pts0.map((q) => q[1]))];
    const cx = (S.cx || 540) - (bx[0] + bx[1]) / 2, cy = (S.cy || 565) - (by[0] + by[1]) / 2;
    const cam = camera(S.yaw || 0, S.elev || 20, S.scale, cx, cy);

    // exploded view: parts slide apart at show 'explode', back together at 'join' (or 3.4 s later)
    function explodeK(t) {
      const a = at('explode');
      if (!isFinite(a)) return 0;
      const j = isFinite(at('join')) ? at('join') : a + 3.4;
      return ease.inOut(win(t, a + 0.2, 0.7)) * (1 - ease.inOut(win(t, j, 0.7)));
    }
    const posOf = (p, t) => { const e = (S.explode || {})[p.id], k = explodeK(t); return e ? add(anchor(p), e.map((v) => v * k)) : anchor(p); };

    // ---- highlight: which parts glow for the current line --------------------------
    function glow(t, cur) {
      if (!cur || !cur.l || !cur.l.hl || cur.l.hl === 'none') return { k: 0, ids: [] };
      const L = cur.l, endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25)) * (0.8 + 0.2 * Math.sin((t - L.start) * 6));
      return { k, ids: L.hl === 'all' ? parts.map((p) => p.id).concat(cavs.map((c) => c.id)) : L.hl.split('+') };
    }

    // ---- the solid(s) ------------------------------------------------------------------
    function drawScene(ctx, t, camX, o = {}) {
      const g = o.glow || { k: 0, ids: [] };
      // ground shadow
      const ground = camX.p([0, 0, 0]);
      const wpx = (bx[1] - bx[0]) * 0.55;
      shadowBlob(ctx, ground[0], ground[1] + 6, wpx, Math.max(14, wpx * 0.12));
      for (const p of parts) {
        let pos = posOf(p, t);
        if (p.show) {
          if (o.hook) pos = add(pos, [0, (p.hookLift || 0) + Math.sin(t * 2.2) * 0.25, 0]);
          else {
            const k = win(t, at(p.show), 1.0);
            if (k <= 0) continue;
            pos = add(pos, [0, (1 - ease.inOut(k)) * (p.drop || 0), 0]);
          }
        }
        const hlp = drawSolid(ctx, camX, p.mesh, pos, p.base, { hidden: S.hidden && explodeK(t) < 0.05, glass: p.glass });
        for (const c of cavs.filter((c) => c.in === p.id)) {
          const k = win(t, at(c.show || 'cavity'), 0.4);
          if (k > 0) drawCavity(ctx, camX, c, add(pos, c.at.map((v, i) => v - anchor(p)[i])), BASE[c.color || p.color || 'teal'], k);
        }
        if (g.k > 0 && g.ids.includes(p.id)) {
          polyPath(ctx, hlp); ctx.fillStyle = rgba(PAL.sun, 0.42 * g.k); ctx.fill();
          ctx.lineWidth = 7; ctx.strokeStyle = rgba(PAL.sun, 0.9 * g.k); ctx.stroke();
        }
        if (g.k > 0 && g.ids.includes(`${p.id}.ends`)) {
          for (const f of p.mesh.faces.filter((f) => f.role === 'end' && dot(f.n, camX.view) > 0)) {
            polyPath(ctx, f.p.map((v) => camX.p(add(v, pos)))); ctx.fillStyle = rgba(PAL.sun, 0.55 * g.k); ctx.fill();
          }
        }
      }
      for (const c of cavs) {
        if (g.k > 0 && g.ids.includes(c.id) && t >= at(c.show || 'cavity')) {
          const p = partOf(c.in), pos = add(posOf(p, t), c.at.map((v, i) => v - anchor(p)[i]));
          const open = ring(64, (tt) => camX.p(add(pos, [c.r * Math.cos(tt), 0, c.r * Math.sin(tt)])));
          const hh = hull(c.mesh.faces.flatMap((f) => f.p.map((v) => camX.p(add(v, pos)))));
          polyPath(ctx, hh); ctx.fillStyle = rgba(PAL.sun, 0.22 * g.k); ctx.fill();
          polyPath(ctx, open); ctx.fillStyle = rgba(PAL.sun, 0.35 * g.k); ctx.fill();
          ctx.lineWidth = 6; ctx.strokeStyle = rgba(PAL.sun, 0.9 * g.k); ctx.stroke();
        }
      }
    }
    // the removed piece lifts out and fades when a cavity appears
    function drawLift(ctx, t) {
      for (const c of cavs) {
        if (c.hiddenOnly) continue;
        const t0 = at(c.show || 'cavity');
        const k = win(t, t0, 1.3);
        if (k <= 0 || k >= 1) continue;
        const p = partOf(c.in);
        const pos = add(posOf(p, t), c.at.map((v, i) => v - anchor(p)[i]));
        const lift = ease.inOut(k) * (c.r * 2.4 + (c.h || 0) * 0.6);
        ctx.save(); ctx.globalAlpha *= 1 - win(k, 0.55, 0.45);
        drawSolid(ctx, cam, c.mesh, add(pos, [0, lift, 0]), BASE.plum, { lw: 3.5 });
        ctx.restore();
      }
    }
    // water pushed out over the rim runs down the outside
    function drawSpill(ctx, t, camX, forever) {
      if (!S.spill) return;
      const t0 = forever ? 0 : at('spill');
      if (!forever && (t < t0 || t > t0 + 4.5)) return;
      const { r, h } = S.spill;
      for (let i = 0; i < 9; i++) {
        const side = i % 2 ? 1 : -1, ph = ((t - t0) * 0.9 + rnd(i + 4)) % 1;
        const z = r * (0.2 + 0.6 * rnd(i + 11)) * (i % 3 ? 1 : -0.2);
        const x = side * Math.sqrt(Math.max(0, r * r - z * z)) * 1.02;
        const p = camX.p([x, h - ph * h * 0.9, Math.abs(z)]);
        ctx.fillStyle = rgba(PAL.teal, 0.85 * (1 - ph * 0.6));
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 7, 11, 0, 0, TAU); ctx.fill();
      }
      const top = camX.p([0, h, r]);
      ctx.fillStyle = rgba(PAL.teal, 0.7);
      for (let i = 0; i < 5; i++) { const a = (i / 4) * Math.PI; const q = camX.p([r * 1.05 * Math.cos(a) * 0.9, h + 0.15, r * 0.3]); ctx.beginPath(); ctx.arc(q[0], q[1] - 6 - 6 * Math.sin(t * 6 + i), 6, 0, TAU); ctx.fill(); }
    }
    // hidden joints (where parts meet): dashed plum circles / lines
    function drawJoints(ctx, t) {
      const k = win(t, at('joint'), 0.4) * (1 - win(t, at('joint') + 3.2, 0.4));
      if (k <= 0 || !S.joints) return;
      ctx.save(); ctx.globalAlpha *= k;
      for (const j of S.joints) {
        const pts = ring(72, (tt) => cam.p(j.axis === 'x' ? [j.c[0], j.c[1] + j.r * Math.cos(tt), j.c[2] + j.r * Math.sin(tt)] : [j.c[0] + j.r * Math.cos(tt), j.c[1], j.c[2] + j.r * Math.sin(tt)]));
        polyPath(ctx, pts); ctx.fillStyle = rgba(PAL.plum, 0.35); ctx.fill();
        ctx.setLineDash([10, 7]); ctx.lineWidth = 4; ctx.strokeStyle = PAL.plum; ctx.stroke(); ctx.setLineDash([]);
      }
      const j = S.joints[S.joints.length - 1];
      const q = j.axis === 'x' ? cam.p([0, j.c[1], 0]) : cam.p(j.c);
      tag(ctx, 'hidden inside: not counted', q[0], q[1] - (j.axis === 'x' ? 0 : 64), PAL.plum, PAL.paper, ease.back(win(t, at('joint'), 0.45)), 'center', 26);
      ctx.restore();
    }

    // ---- dimension labels --------------------------------------------------------------
    const DIMC = { r: PAL.coral, h: PAL.teal, l: PAL.plum, ink: PAL.ink, a: PAL.teal };
    function tag(ctx, s, x, y, bg, fg, k, align, size = 28) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(size, 700); const w = mathWidth(ctx, parseMath(s, fg), size, 700) + 26, hh = size + 16;
      const x0 = align === 'left' ? 0 : align === 'right' ? -w : -w / 2;
      pill(ctx, x0, -hh / 2, w, hh, bg, PAL.ink, 3);
      math(ctx, s, x0 + w / 2, 1, size, { align: 'center', color: fg, sym: fg, weight: 700 });
      ctx.restore();
    }
    function arrowHead(ctx, x, y, ang, col) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -7); ctx.lineTo(-14, 7); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function dimLine(ctx, a, b, col, arrows) {
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      if (arrows) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]); arrowHead(ctx, b[0], b[1], ang, col); arrowHead(ctx, a[0], a[1], ang + Math.PI, col); }
    }
    function drawDims(ctx, t) {
      for (const d of S.dims || []) {
        const k0 = ease.back(win(t, at(d.id), 0.45));
        if (k0 <= 0) continue;
        const jk = S.joints ? win(t, at('joint'), 0.3) * (1 - win(t, at('joint') + 3.2, 0.4)) : 0;
        const fade = (1 - win(t, beat.outro.start - 0.3, 0.3)) * (1 - 0.85 * jk);
        const col = DIMC[d.color || 'ink'] || PAL.ink;
        const txt = d.solved && t >= at(d.solved) ? d.solvedText : d.text;
        const bg = txt.includes('?') ? PAL.plum : col, fg = PAL.paper;
        ctx.save(); ctx.globalAlpha *= clamp(k0) * fade;
        const draw = clamp(ease.out(win(t, at(d.id), 0.6)));
        if (d.type === 'vert' || d.type === 'horiz' || d.type === 'edge' || d.type === 'line') {
          let A = cam.p(d.from), B = cam.p(d.to);
          if (d.off) { const o = d.off; A = [A[0] + o[0], A[1] + o[1]]; B = [B[0] + o[0], B[1] + o[1]]; }
          const Bd = [lerp(A[0], B[0], draw), lerp(A[1], B[1], draw)];
          if (d.ext) { // thin extension lines back to the solid
            ctx.save(); ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeStyle = rgba(PAL.ink, 0.45);
            const a0 = cam.p(d.from), b0 = cam.p(d.to);
            ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(A[0], A[1]); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.restore();
          }
          dimLine(ctx, A, Bd, col, d.type !== 'line');
          const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
          const lp = d.label || [0, 0];
          tag(ctx, txt, m[0] + lp[0], m[1] + lp[1], bg, fg, k0, d.align || 'center');
        } else if (d.type === 'radius') {
          const c = cam.p(d.c), e = cam.p(add(d.c, d.dir ? d.dir.map((v) => v * d.r) : [d.r, 0, 0]));
          const E = [lerp(c[0], e[0], draw), lerp(c[1], e[1], draw)];
          ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c[0], c[1], 7, 0, TAU); ctx.fill();
          dimLine(ctx, c, E, col, false);
          const lp = d.label || [0, -30];
          tag(ctx, txt, (c[0] + e[0]) / 2 + lp[0], (c[1] + e[1]) / 2 + lp[1], bg, fg, k0, d.align || 'center');
        }
        ctx.restore();
      }
    }

    // ---- stage ------------------------------------------------------------------------
    function drawStage(ctx, t, cur) {
      const sc = beat.scene;
      const draw = ease.inOut(win(t, sc.lines[0].start - 0.1, 0.9));
      if (draw <= 0) return;
      const outroFade = 1 - win(t, beat.outro.start - 0.3, 0.3);
      if (outroFade <= 0) return;
      ctx.save(); ctx.globalAlpha = outroFade;
      ctx.save();
      ctx.beginPath(); rrect(ctx, G.bx, G.by, G.bw, G.bh, G.br); ctx.fillStyle = PAL.paper; ctx.fill();
      ctx.setLineDash([3400 * draw, 4000]); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
      // table line
      ctx.save(); ctx.beginPath(); rrect(ctx, G.bx, G.by, G.bw, G.bh, G.br); ctx.clip();
      ctx.fillStyle = rgba(PAL.teal, 0.08); ctx.fillRect(G.bx, G.by, G.bw, G.bh);
      ctx.restore();
      const sk = ease.back(win(t, at('solid'), 0.55));
      if (sk > 0) {
        const piv = cam.p([0, 0, 0]);
        ctx.save(); ctx.translate(piv[0], piv[1]); ctx.scale(sk, sk); ctx.translate(-piv[0], -piv[1]);
        drawScene(ctx, t, cam, { glow: glow(t, cur) });
        ctx.restore();
        drawLift(ctx, t);
        drawSpill(ctx, t, cam, false);
        drawJoints(ctx, t);
        drawDims(ctx, t);
      }
      // scale chip (bottom-right, straddling the frame)
      const ck = ease.back(win(t, at('solid'), 0.45));
      if (ck > 0) {
        ctx.font = font(28, 700);
        if (S.notToScale) {
          const s = S.notToScale, w = ctx.measureText(s).width + 40;
          ctx.save(); ctx.translate(G.bx + G.bw - 24 - w, G.by + G.bh); ctx.scale(ck, ck);
          pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3); text(ctx, s, 20, 1, 28, PAL.ink, { weight: 700 });
          ctx.restore();
        } else {
          const s = `Scale: 1 ${S.unit} = ${S.scale} px`, tw = ctx.measureText(s).width;
          const nice = [1, 2, 4, 5, 10, 20, 50].filter((n) => n * S.scale <= 110).pop() || 1, len = nice * S.scale;
          const w = tw + len + 60;
          ctx.save(); ctx.translate(G.bx + G.bw - 24 - w, G.by + G.bh); ctx.scale(ck, ck);
          pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3);
          text(ctx, s, 20, 1, 28, PAL.ink, { weight: 700 });
          const rx = 36 + tw;
          ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(rx, 6); ctx.lineTo(rx + len, 6); ctx.moveTo(rx, -2); ctx.lineTo(rx, 10); ctx.moveTo(rx + len, -2); ctx.lineTo(rx + len, 10); ctx.stroke();
          text(ctx, `${nice} ${S.unit}`, rx + len / 2, -8, 16, PAL.ink, { align: 'center', weight: 700 });
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // ---- scene card ---------------------------------------------------------------------
    function boardScene(ctx, t, b) {
      C.boardFrame(ctx, b, t, 'THE PICTURE', PAL.teal);
      const rows = b.lines.filter((l) => l.legend).map((l) => ({ at: l.start, icon: l.legend.icon, s: l.legend.s }));
      const rh = rows.length > 5 ? 54 : 62;
      rows.forEach((r, i) => {
        const k = C.rowIn(t, r.at);
        if (k <= 0) return;
        const y = BY + 56 + rh * (i + 0.5);
        ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
        icon(ctx, r.icon, BX + 58, y);
        math(ctx, r.s, BX + 104, y, rows.length > 5 ? 38 : 42, { maxW: BW - 140 });
        ctx.restore();
      });
    }
    const ICONS = {
      cube: [{ type: 'box', w: 1, h: 1, d: 1, color: 'wood' }],
      cyl: [{ type: 'cyl', r: 0.5, h: 1, color: 'teal' }],
      cone: [{ type: 'cone', r: 0.55, h: 1.1, color: 'coral' }],
      bowl: [{ type: 'hemi', r: 0.6, dir: 'down', at: [0, 0.6, 0], color: 'plum' }],
      toy: [{ type: 'hemi', r: 0.45, dir: 'down', at: [0, 0.45, 0], color: 'teal' }, { type: 'cone', r: 0.45, h: 0.8, at: [0, 0.45, 0], color: 'coral' }],
      icecream: [{ type: 'cone', r: 0.42, h: -0.9, at: [0, 0.9, 0], color: 'wood' }, { type: 'hemi', r: 0.42, dir: 'up', at: [0, 0.9, 0], color: 'coral' }],
      capsule: [{ type: 'hcap', r: 0.3, dir: -1, x: -0.4, y: 0.3, color: 'coral' }, { type: 'hcyl', r: 0.3, len: 0.8, at: [0, 0.3, 0], color: 'teal' }, { type: 'hcap', r: 0.3, dir: 1, x: 0.4, y: 0.3, color: 'coral' }],
      shed: [{ type: 'box', w: 0.7, h: 0.6, d: 1.2, color: 'coral' }, { type: 'roof', r: 0.35, len: 1.2, at: [0, 0.6, 0], color: 'teal' }],
    };
    const iconMeshes = {};
    function icon(ctx, kind, x, y) {
      if (kind === 'ruler') {
        ctx.beginPath(); rrect(ctx, x - 26, y - 11, 52, 22, 5); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 26 + i * 8.7, y - 11); ctx.lineTo(x - 26 + i * 8.7, y - (i % 2 ? 3 : 0)); ctx.stroke(); }
        return;
      }
      if (kind === 'dim') {
        ctx.strokeStyle = PAL.coral; ctx.fillStyle = PAL.coral; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.stroke();
        arrowHead(ctx, x + 24, y, 0, PAL.coral); arrowHead(ctx, x - 24, y, Math.PI, PAL.coral);
        return;
      }
      const spec = ICONS[kind];
      if (!spec) return;
      if (!iconMeshes[kind]) iconMeshes[kind] = spec.map((s) => ({ s, mesh: buildMesh(s) }));
      const c = camera(kind === 'cube' || kind === 'shed' ? 35 : 0, 22, kind === 'shed' ? 26 : 34, x, y + 18);
      for (const { s, mesh } of iconMeshes[kind]) drawSolid(ctx, c, mesh, anchor(s), BASE[s.color], { lw: 2.5, elw: 1.6 });
    }

    // ---- hook art: the question's own subject ---------------------------------------------
    function art(ctx, t, R) {
      const A = P.hook.art || {};
      // big version of the solid, fitted into the art box
      const tall = by[1] - by[0], wide = bx[1] - bx[0];
      const fit = Math.min(430 / (tall * (A.fitH || 1)), 700 / wide) * S.scale;
      const yaw = (S.yaw || 0) + (A.spin ? Math.sin(t * 0.9) * 10 : 0);
      const camH0 = camera(yaw, S.elev || 20, fit, 0, 0);
      const hp = parts.flatMap((p) => p.mesh.faces.flatMap((f) => f.p.map((v) => camH0.p(add(v, anchor(p))))));
      const hx = [Math.min(...hp.map((q) => q[0])), Math.max(...hp.map((q) => q[0]))], hy = [Math.min(...hp.map((q) => q[1])), Math.max(...hp.map((q) => q[1]))];
      const ox = R.x + R.w / 2 - (hx[0] + hx[1]) / 2, oy = R.y + 300 - (hy[0] + hy[1]) / 2 + (A.dy || 0);
      const camH = camera(yaw, S.elev || 20, fit, ox, oy);
      const base = camH.p([0, 0, 0]);
      backdrop(ctx, t, R, A, camH, base);
      ctx.save();
      if (A.wobble) { ctx.translate(base[0], base[1]); ctx.rotate(Math.sin(t * 2.6) * 0.09); ctx.translate(-base[0], -base[1]); }
      const g = { k: 0, ids: [] };
      // cavities are shown in the hook (that is what makes the object)
      const saved = showAt.cavity; showAt.cavity = -1;
      drawScene(ctx, t, camH, { glow: g, hook: true });
      showAt.cavity = saved;
      decorate(ctx, t, R, A, camH);
      if (A.kind === 'water') drawSpill(ctx, t, camH, true);
      ctx.restore();
      if (A.lift) { // the removed cone floats above, with an arrow
        const c = cavs[0], p = partOf(c.in);
        const bob = Math.sin(t * 2.2) * 8 / fit;
        const pos = add(c.at, [0, (c.h || 0) + 1.5 + bob, 0]);
        drawSolid(ctx, camH, c.mesh, pos, BASE.coral, {});
        const q = camH.p(add(c.at, [c.r + 1.6, (c.h || 0) * 0.55, 0]));
        ctx.strokeStyle = PAL.plum; ctx.fillStyle = PAL.plum; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(q[0], q[1] + 40); ctx.lineTo(q[0], q[1] - 30); ctx.stroke(); arrowHead(ctx, q[0], q[1] - 34, -Math.PI / 2, PAL.plum);
      }
    }
    function backdrop(ctx, t, R, A, camH, base) {
      ctx.save();
      ctx.beginPath(); rrect(ctx, R.x, R.y + 10, R.w, R.h - 30, 30); ctx.fillStyle = rgba(PAL.teal, 0.1); ctx.fill();
      ctx.clip();
      if (A.kind === 'shed') {
        ctx.fillStyle = rgba(PAL.teal, 0.35); ctx.fillRect(R.x, base[1] - 10, R.w, R.h);
        sunDisc(ctx, R.x + R.w - 110, R.y + 110, t);
      } else {
        // table top
        ctx.fillStyle = rgba(PAL.sun, 0.28); ctx.fillRect(R.x, base[1] + 4, R.w, R.h);
        ctx.fillStyle = rgba(PAL.ink, 0.12); ctx.fillRect(R.x, base[1] + 4, R.w, 6);
      }
      ctx.restore();
    }
    function sunDisc(ctx, x, y, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3);
      ctx.strokeStyle = PAL.sun; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(0, 64); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.restore();
    }
    function sparkle(ctx, x, y, s, t, i) {
      const k = 0.6 + 0.4 * Math.sin(t * 5 + i * 1.7);
      ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k); ctx.fillStyle = PAL.sun; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2;
      ctx.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, rr = j % 2 ? 7 : 22; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function decorate(ctx, t, R, A, camH) {
      const q = (v) => camH.p(v);
      if (A.kind === 'block') { // wood grain + shavings
        const box = parts[0], w = box.w / 2, h = box.h, d = box.d / 2;
        ctx.save(); ctx.strokeStyle = rgba(PAL.ink, 0.22); ctx.lineWidth = 3;
        for (let i = 1; i < 6; i++) {
          const y = (h * i) / 6;
          const a = q([-w, y, d]), b = q([w * 0.2, y + h * 0.04, d]), c = q([w, y, d]);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); ctx.stroke();
          const e = q([w, y, d]), f = q([w, y - h * 0.03, 0]), g = q([w, y, -d]);
          ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.quadraticCurveTo(f[0], f[1], g[0], g[1]); ctx.stroke();
        }
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const p = q([w * (1.3 + 0.25 * i), 0, d * (0.9 - 0.4 * i)]);
          ctx.save(); ctx.translate(p[0], p[1] - 6); ctx.rotate(i + t * 0.2); ctx.strokeStyle = css(BASE.wood); ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(0, 0, 12 + i * 2, 0, 4.2); ctx.stroke(); ctx.restore();
        }
      }
      if (A.kind === 'scoop') {
        const cyl = parts[0];
        ctx.save(); ctx.strokeStyle = rgba(PAL.ink, 0.22); ctx.lineWidth = 3;
        [-0.55, -0.15, 0.3, 0.7].forEach((k, i) => {
          const x = cyl.r * k, z = Math.sqrt(cyl.r * cyl.r - x * x);
          ctx.beginPath();
          for (let j = 0; j <= 20; j++) { const y = cyl.h * (0.06 + 0.88 * j / 20); const p = q([x + Math.sin(j * 0.7 + i) * cyl.r * 0.05, y, z]); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
          ctx.stroke();
        });
        ctx.restore();
      }
      if (A.kind === 'polish' || A.kind === 'capsule') {
        const pts = A.kind === 'polish' ? [[-40, 16, 0], [10, 17, 0], [48, 12, 0]] : [[-4, 5.5, 0], [2, 5.8, 0], [6, 4.8, 0]];
        pts.forEach((v, i) => { const p = q(v); sparkle(ctx, p[0], p[1] - 20, 1.3, t, i); });
      }
      if (A.kind === 'polish') { // price tag
        const p = q([22, 14, 0]);
        ctx.save(); ctx.translate(p[0], p[1] - 110); ctx.rotate(0.1 + Math.sin(t * 2) * 0.05);
        ctx.beginPath(); rrect(ctx, -10, -30, 190, 60, 14); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
        text(ctx, '₹10 / dm²', 85, 2, 34, PAL.ink, { align: 'center', weight: 700 });
        ctx.restore();
      }
      if (A.kind === 'capsule') { // little pills around
        [[R.x + 120, R.y + 470, 0.4], [R.x + 760, R.y + 490, -0.3], [R.x + 690, R.y + 120, 0.7]].forEach(([x, y, rot], i) => {
          ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
          ctx.beginPath(); rrect(ctx, -46, -18, 92, 36, 18); ctx.fillStyle = i % 2 ? PAL.coral : PAL.teal; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke(); ctx.restore();
        });
      }
      if (A.kind === 'icecream') { // waffle lines on the cone + sprinkles on the scoop
        const cone = parts.find((p) => p.type === 'cone'), top = anchor(cone), r = cone.r, h = cone.h;
        ctx.save(); ctx.strokeStyle = rgba(PAL.ink, 0.3); ctx.lineWidth = 3;
        for (let i = -3; i <= 3; i++) {
          const a = q([top[0] + r * 0.28 * i, top[1] - 0.3, r]), b = q([0, top[1] + h, 0]);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], 0.85), lerp(a[1], b[1], 0.85)); ctx.stroke();
        }
        for (let i = 1; i < 5; i++) {
          const y = top[1] + (h * i) / 5, rr = r * (1 - i / 5);
          const pts = ring(24, (tt) => q([rr * Math.cos(tt), y, rr * Math.sin(tt)])).filter((_, k) => k > 0 && k < 12);
          ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
        }
        ctx.restore();
        const scoop = parts.find((p) => p.type === 'hemi');
        for (let i = 0; i < 16; i++) {
          const a = rnd(i + 3) * Math.PI, rr = scoop.r * (0.35 + 0.55 * rnd(i + 9));
          const p = q(add(anchor(scoop), [rr * Math.cos(a), Math.sqrt(Math.max(0, scoop.r ** 2 - rr ** 2)) * 0.95, rr * Math.sin(a) * 0.3 + scoop.r * 0.5]));
          ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rnd(i) * 3); ctx.fillStyle = [PAL.teal, PAL.sun, PAL.plum, PAL.paper][i % 4];
          ctx.beginPath(); rrect(ctx, -9, -3.5, 18, 7, 3.5); ctx.fill(); ctx.restore();
        }
      }
      if (A.kind === 'wobble' || A.kind === 'toyface') { // face on the hemisphere, swirl lines
        const hemi = parts.find((p) => p.type === 'hemi'), c = anchor(hemi);
        const e1 = q(add(c, [-hemi.r * 0.35, -hemi.r * 0.32, hemi.r * 0.86])), e2 = q(add(c, [hemi.r * 0.35, -hemi.r * 0.32, hemi.r * 0.86]));
        const m = q(add(c, [0, -hemi.r * 0.58, hemi.r * 0.78]));
        ctx.fillStyle = PAL.ink; [e1, e2].forEach((e) => { ctx.beginPath(); ctx.arc(e[0], e[1], 9, 0, TAU); ctx.fill(); });
        ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(m[0], m[1] - 14, 22, 0.25 * Math.PI, 0.75 * Math.PI); ctx.stroke();
        if (A.kind === 'wobble') {
          const b = q([0, 0, 0]);
          ctx.strokeStyle = rgba(PAL.plum, 0.6); ctx.lineWidth = 6;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(b[0], b[1] - 40, 140 + i * 26, Math.PI * 1.05 + Math.sin(t * 2.6) * 0.1, Math.PI * 1.3 + Math.sin(t * 2.6) * 0.1); ctx.stroke(); }
        } else {
          const cone = parts.find((p) => p.type === 'cone'), ct = anchor(cone);
          for (let i = 1; i < 4; i++) { // stripes on the party-hat cone
            const y = ct[1] + (cone.h * i) / 4, rr = cone.r * (1 - i / 4);
            const pts = ring(40, (tt) => q([rr * Math.cos(tt), y, rr * Math.sin(tt)])).filter((_, k) => k > 0 && k < 20);
            ctx.strokeStyle = PAL.sun; ctx.lineWidth = 9; ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
          }
          const tip = q(add(ct, [0, cone.h, 0]));
          ctx.beginPath(); ctx.arc(tip[0], tip[1] - 8, 16, 0, TAU); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        }
      }
      if (A.kind === 'ornament') { // ruler beside the solid
        const top = q([0, 9.5, 0]), bot = q([0, 0, 0]), x = bot[0] + 190;
        ctx.save(); ctx.beginPath(); rrect(ctx, x - 22, top[1], 44, bot[1] - top[1], 8); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        for (let i = 0; i <= 9; i++) { const y = lerp(bot[1], top[1], i / 9.5); ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x - (i % 5 ? 8 : 0), y); ctx.stroke(); }
        text(ctx, '9.5 cm', x + 36, (top[1] + bot[1]) / 2, 30, PAL.ink, { weight: 700 });
        ctx.restore();
      }
      if (A.kind === 'shed') { // door and window on the end wall
        const box = parts.find((p) => p.type === 'box'), z = box.d / 2 + 0.01, w = box.w;
        const face = (pts) => { const pp = pts.map(q); polyPath(ctx, pp); };
        face([[-w * 0.18, 0, z], [w * 0.18, 0, z], [w * 0.18, box.h * 0.55, z], [-w * 0.18, box.h * 0.55, z]]);
        ctx.fillStyle = css(cmix(BASE.plum, INK, 0.2)); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        const x0 = box.w / 2 + 0.01;
        [[-4.5, 3.5], [1.5, 3.5]].forEach(([zc]) => {
          const pp = [[x0, 4, zc - 1], [x0, 4, zc + 1], [x0, 6, zc + 1], [x0, 6, zc - 1]].map(q);
          polyPath(ctx, pp); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        });
      }
    }

    const draw = C.compose({ art, stage: drawStage, scene: boardScene });
    return { W, H, FPS, duration: D, draw, beats, P, TL };
  }

  root.VideoEngine = { createVideo, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
