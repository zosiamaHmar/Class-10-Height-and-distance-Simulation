/* Maths by Zosiama · Coordinate Geometry explainers — the coordinate-plane engine.
 *
 * Built on video-kit/core.js. This file draws a coordinate plane to scale (grid, axes,
 * numbered ticks, "Scale: 1 unit = N px") and everything the section-formula chapter
 * needs on it: points with their coordinates and dashed feet on the axes, segments, lines
 * from their equations, a segment cut into equal pieces, "?" pins for unknown points,
 * step arrows (so many right, so many up), polygons, circles, equal-length ticks and
 * sliding points. It also draws the "Know first" idea pictures, the scene card and the
 * hook illustrations.
 *
 * Every drawing step ("op") belongs to a narration line and starts when the line starts
 * (problems.js prep() gives each line enough time for its ops). Every frame is a pure
 * function of t. Plane coordinates are in units with y up.
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, BX, BY, BW, font, clamp, lerp, win, ease, rgba, rrect, pill, text, createCore,
  } = root.VideoCore;
  const TAU = Math.PI * 2;
  const COL = { teal: PAL.teal, coral: PAL.coral, plum: PAL.plum, ink: PAL.ink, sun: PAL.sun, paper: PAL.paper };
  const colOf = (c) => COL[c] || PAL.ink;
  const STY = {
    main: { lw: 6, a: 1 },
    help: { lw: 4, a: 0.95 },
    guide: { lw: 3.2, a: 0.85, dash: [12, 9] },
    thin: { lw: 2.6, a: 0.7 },
  };
  const STAGE = { x: 90, y: 280, w: 900, h: 538, r: 28 };
  const CONTENT = { x: STAGE.x + 46, y: STAGE.y + 40, w: STAGE.w - 92, h: STAGE.h - 40 - 62 };
  const MINUS = '−';
  const num = (v) => { const r = Math.round(v * 100) / 100; return (r < 0 ? MINUS : '') + String(Math.abs(r)); };

  // ---- 2D helpers ----------------------------------------------------------------------
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const vmul = (a, k) => [a[0] * k, a[1] * k];
  const vlerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const vdist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const vunit = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
  function line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
  function arrowHead(ctx, p, ang, col, s = 14) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s / 2); ctx.lineTo(-s, s / 2); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function haloText(ctx, s, x, y, size, color, a = 1, align = 'center') {
    if (!s || a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.font = font(size, 700); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(6, size * 0.26); ctx.strokeStyle = PAL.paper; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    ctx.restore();
  }

  // ---- views ---------------------------------------------------------------------------------
  function planeView(winXY, s, box) {
    const [x0, x1] = winXY.x, [y0, y1] = winXY.y;
    const ox = box.x + box.w / 2 - ((x0 + x1) / 2) * s;
    const oy = box.y + box.h / 2 + ((y0 + y1) / 2) * s;
    return { s, ox, oy, win: winXY, p: (q) => [ox + q[0] * s, oy - q[1] * s] };
  }
  function geomPts(o, out) {
    switch (o.k) {
      case 'seg': case 'pieces': case 'walk': case 'slide': out.push(o.a, o.b); break;
      case 'pt': case 'pin': case 'label': out.push(o.p); break;
      case 'poly': case 'fill': out.push(...o.pts); break;
      case 'circle': out.push([o.c[0] - o.r, o.c[1] - o.r], [o.c[0] + o.r, o.c[1] + o.r]); break;
      case 'plane': out.push([o.win.x[0], o.win.y[0]], [o.win.x[1], o.win.y[1]]); break;
      case 'line': if (o.win) out.push([o.win.x[0], o.win.y[0]], [o.win.x[1], o.win.y[1]]); break;
      default: break;
    }
  }
  function fitView(ops, s, box) {
    const pts = [];
    ops.forEach((o) => geomPts(o, pts));
    if (!pts.length) pts.push([0, 0]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return planeView({ x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] }, s, box);
  }
  // a line ax + by + c = 0 clipped to a window
  function clipLine(eq, wv) {
    const [a, b, c] = eq, [x0, x1] = wv.x, [y0, y1] = wv.y, pts = [];
    const push = (x, y) => { if (x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9 && !pts.some((q) => Math.hypot(q[0] - x, q[1] - y) < 1e-6)) pts.push([x, y]); };
    if (Math.abs(b) > 1e-12) { push(x0, (-c - a * x0) / b); push(x1, (-c - a * x1) / b); }
    if (Math.abs(a) > 1e-12) { push((-c - b * y0) / a, y0); push((-c - b * y1) / a, y1); }
    pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    return pts.length >= 2 ? [pts[0], pts[pts.length - 1]] : null;
  }
  function tickStep(s) { return s >= 34 ? 1 : s >= 18 ? 2 : 5; }

  // =================================================================================
  function createVideo(P, TL) {
    const C = createCore(P, TL, { tokens: P.tokens || {}, chapter: P.chapter, label: P.label });
    const { D, beats, beat, math, parseMath, mathWidth } = C;

    // ---- schedule the drawing ops from the narration timeline (same rules as prep()) ----
    const OPS = [];
    const lineStart = {};
    beats.forEach((b) => b.lines.forEach((l) => { lineStart[l.id] = l.start; }));
    beats.forEach((b) => b.lines.forEach((l) => {
      if (!l.draw) return;
      let cur = l.start + (l.lead === undefined ? 0.15 : l.lead), prev = cur;
      l.draw.forEach((op) => {
        const s0 = op.with ? prev : cur + (op.gap || 0);
        const o = Object.assign({}, op, { t0: s0, t1: s0 + op.dur, layer: b.type === 'know' ? 'know' : 'main', beat: b, line: l });
        if (o.life === 'beat') o.tEnd = b.end - 0.35;
        if (o.lifeLines) { const nx = b.lines[b.lines.indexOf(l) + o.lifeLines]; o.tEnd = nx ? nx.start - 0.35 : b.end - 0.35; }
        if (o.hideFrom && lineStart[o.hideFrom] !== undefined) o.tEnd = lineStart[o.hideFrom] - 0.4;
        OPS.push(o);
        prev = s0; cur = Math.max(cur, s0 + op.dur);
      });
    }));
    const LAYER = { main: OPS.filter((o) => o.layer === 'main'), know: OPS.filter((o) => o.layer === 'know') };
    const VIEW = {
      main: planeView(P.plane.win, P.plane.s, CONTENT),
      know: P.knowView && P.knowView.win ? planeView(P.knowView.win, P.knowView.s, CONTENT) : fitView(LAYER.know, (P.knowView || { s: 60 }).s, CONTENT),
    };
    const prog = (o, t) => clamp((t - o.t0) / Math.max(1e-3, o.t1 - o.t0));
    const lifeA = (o, t) => (o.tEnd === undefined ? 1 : 1 - win(t, o.tEnd, 0.35));

    function glowFor(t, cur) {
      if (!cur || !cur.l || !cur.l.hl || cur.l.hl === 'none') return { k: 0, ids: new Set() };
      const L = cur.l, endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25)) * (0.72 + 0.28 * Math.sin((t - L.start) * 6));
      return { k, ids: new Set(L.hl.split('+')) };
    }
    function tag(ctx, s, x, y, bg, fg, k, size = 26, border = PAL.ink) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(size, 700);
      const w = mathWidth(ctx, parseMath(s, fg), size, 700) + 24, hh = size + (/\(\(/.test(s) ? 30 : 16);
      pill(ctx, -w / 2, -hh / 2, w, hh, bg, border, 3);
      math(ctx, s, 0, 1, size, { align: 'center', color: fg, sym: fg, weight: 700 });
      ctx.restore();
    }
    function style(ctx, o, a) {
      const st = STY[o.st || 'main'];
      ctx.globalAlpha *= a * st.a; ctx.lineWidth = st.lw; ctx.strokeStyle = colOf(o.col); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash(st.dash || []);
    }
    function glowStroke(ctx, o, a, gk, path) {
      if (gk <= 0) return;
      ctx.save(); ctx.globalAlpha *= a * gk * 0.6; ctx.strokeStyle = PAL.sun; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = STY[o.st || 'main'].lw + 14; path(); ctx.stroke(); ctx.restore();
    }

    // ---- the plane ----------------------------------------------------------------------------
    function drawPlane(ctx, V, wv, k, a) {
      const [x0, x1] = wv.x, [y0, y1] = wv.y;
      ctx.save(); ctx.globalAlpha *= a;
      const g = ease.out(clamp(k * 1.8));
      ctx.save(); ctx.globalAlpha *= g; ctx.strokeStyle = rgba(PAL.teal, 0.2); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = Math.ceil(x0); x <= x1 + 1e-9; x++) { const p0 = V.p([x, y0]), p1 = V.p([x, y1]); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
      for (let y = Math.ceil(y0); y <= y1 + 1e-9; y++) { const p0 = V.p([x0, y]), p1 = V.p([x1, y]); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); }
      ctx.stroke(); ctx.restore();
      const e = ease.inOut(clamp(k * 1.45 - 0.2));
      if (e > 0) {
        const O = V.p([0, 0]), xa = V.p([x0, 0]), xb = V.p([x1 + 0.4, 0]), ya = V.p([0, y0]), yb = V.p([0, y1 + 0.4]);
        ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        line(ctx, O, vlerp(O, xb, e)); line(ctx, O, vlerp(O, xa, e)); line(ctx, O, vlerp(O, yb, e)); line(ctx, O, vlerp(O, ya, e));
        ctx.restore();
        if (e > 0.97) { arrowHead(ctx, xb, 0, PAL.ink, 16); arrowHead(ctx, yb, -Math.PI / 2, PAL.ink, 16); }
        const la = win(k, 0.62, 0.3);
        if (la > 0) {
          haloText(ctx, 'x', xb[0] - 6, xb[1] + 26, 30, PAL.ink, la);
          haloText(ctx, 'y', yb[0] - 24, yb[1] + 10, 30, PAL.ink, la);
          haloText(ctx, 'O', O[0] - 15, O[1] + 17, 21, rgba(PAL.ink, 0.75), la);
          const st = tickStep(V.s);
          ctx.save(); ctx.globalAlpha *= la; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2.5;
          for (let x = Math.ceil(x0 / st) * st; x <= x1 + 1e-9; x += st) {
            if (Math.abs(x) < 1e-9) continue;
            const q = V.p([x, 0]); line(ctx, [q[0], q[1] - 6], [q[0], q[1] + 6]);
            haloText(ctx, num(x), q[0], q[1] + 19, 19, rgba(PAL.ink, 0.75));
          }
          for (let y = Math.ceil(y0 / st) * st; y <= y1 + 1e-9; y += st) {
            if (Math.abs(y) < 1e-9) continue;
            const q = V.p([0, y]); line(ctx, [q[0] - 6, q[1]], [q[0] + 6, q[1]]);
            haloText(ctx, num(y), q[0] - 11, q[1] + 1, 19, rgba(PAL.ink, 0.75), 1, 'right');
          }
          ctx.restore();
        }
      }
      ctx.restore();
    }

    // ---- ops ----------------------------------------------------------------------------------
    function planeOp(ctx, V, o, t, a) { drawPlane(ctx, V, o.win, prog(o, t), a); }
    function seg(ctx, V, o, t, a, gk) {
      const p = ease.inOut(prog(o, t));
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(vlerp(o.a, o.b, p));
      glowStroke(ctx, o, a, gk, () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); });
      ctx.save(); style(ctx, o, a); line(ctx, A, B); ctx.restore();
      if (o.arrow && p >= 1) arrowHead(ctx, B, Math.atan2(B[1] - A[1], B[0] - A[0]), colOf(o.col), 18);
    }
    function lineOp(ctx, V, o, t, a, gk) {
      const p = ease.inOut(prog(o, t));
      if (p <= 0) return;
      const ends = clipLine(o.eq, o.win || { x: [V.win.x[0] - 0.3, V.win.x[1] + 0.3], y: [V.win.y[0] - 0.3, V.win.y[1] + 0.3] });
      if (!ends) return;
      const [e0, e1] = o.rev ? [ends[1], ends[0]] : ends;
      const A = V.p(e0), B = V.p(vlerp(e0, e1, p));
      glowStroke(ctx, o, a, gk, () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); });
      ctx.save(); style(ctx, o, a); line(ctx, A, B); ctx.restore();
    }
    function lineLabel(ctx, V, o, t, a) {
      if (!o.lab) return;
      const p = prog(o, t);
      if (p < 0.7) return;
      const ends = clipLine(o.eq, o.win || { x: [V.win.x[0] - 0.3, V.win.x[1] + 0.3], y: [V.win.y[0] - 0.3, V.win.y[1] + 0.3] });
      if (!ends) return;
      const q = V.p(vlerp(ends[0], ends[1], o.lt === undefined ? 0.8 : o.lt)), lo = o.lo || [0, -30];
      tag(ctx, o.lab, q[0] + lo[0], q[1] + lo[1], colOf(o.col || 'plum'), PAL.paper, ease.back(win(p, 0.7, 0.3)) * a, 24);
    }
    function ptDot(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p), k = ease.back(p);
      ctx.save(); ctx.globalAlpha *= a;
      if (gk > 0) { ctx.beginPath(); ctx.arc(q[0], q[1], 22, 0, TAU); ctx.fillStyle = rgba(PAL.sun, 0.75 * gk); ctx.fill(); }
      ctx.beginPath(); ctx.arc(q[0], q[1], 9 * k, 0, TAU); ctx.fillStyle = colOf(o.col || 'ink'); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.paper; ctx.stroke();
      ctx.restore();
    }
    function ptLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p);
      if (o.name) { const lp = o.lp || [0, -30]; haloText(ctx, o.name, q[0] + lp[0], q[1] + lp[1], o.size || 32, colOf(o.lcol || o.col || 'ink'), a * clamp(p * 2)); }
      if (o.tag) { const tp = o.tp || [0, -36]; tag(ctx, o.tag, q[0] + tp[0], q[1] + tp[1], colOf(o.col || 'ink'), PAL.paper, ease.back(p) * a, o.tsize || 25); }
    }
    function projOp(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p), fx = V.p([o.p[0], 0]), fy = V.p([0, o.p[1]]);
      const k1 = ease.inOut(win(p, 0, 0.5)), k2 = ease.inOut(win(p, 0.4, 0.5));
      ctx.save(); ctx.globalAlpha *= a * 0.85; ctx.setLineDash([7, 7]); ctx.lineWidth = 2.6; ctx.strokeStyle = colOf(o.col || 'ink');
      if (Math.abs(o.p[1]) > 1e-9 && !o.noX) line(ctx, q, vlerp(q, fx, k1));
      if (Math.abs(o.p[0]) > 1e-9 && !o.noY) line(ctx, q, vlerp(q, fy, k2));
      ctx.restore();
    }
    function projLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p < 0.5) return;
      const fx = V.p([o.p[0], 0]), fy = V.p([0, o.p[1]]);
      const kx = ease.back(win(p, 0.45, 0.3)), ky = ease.back(win(p, 0.75, 0.25));
      const col = colOf(o.col || 'ink');
      if (Math.abs(o.p[0]) > 1e-9 && !o.noX) tag(ctx, num(o.p[0]), fx[0], fx[1] + (o.p[1] >= 0 ? 22 : -22), col, PAL.paper, kx * a, 20, col);
      if (Math.abs(o.p[1]) > 1e-9 && !o.noY) tag(ctx, num(o.p[1]), fy[0] + (o.p[0] >= 0 ? -24 : 24), fy[1], col, PAL.paper, ky * a, 20, col);
    }
    function pieces(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), cuts = o.cuts || Array.from({ length: o.n + 1 }, (_, i) => i / o.n);
      const n = cuts.length - 1, u = vunit(vsub(B, A)), nr = [u[1], -u[0]];
      ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'butt';
      for (let i = 0; i < n; i++) {
        const q = clamp(p * n - i);
        if (q <= 0) break;
        const s0 = vlerp(A, B, cuts[i]), s1 = vlerp(A, B, lerp(cuts[i], cuts[i + 1], ease.out(q)));
        ctx.strokeStyle = rgba(i < o.m ? PAL.coral : PAL.teal, 0.55 + 0.3 * gk); ctx.lineWidth = 16; line(ctx, s0, s1);
      }
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
      for (let i = 0; i <= n; i++) {
        if (p * n < i - 0.001 && i > 0) break;
        const c = vlerp(A, B, cuts[i]);
        line(ctx, vadd(c, vmul(nr, 13)), vadd(c, vmul(nr, -13)));
      }
      ctx.restore();
    }
    function piecesLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0 || o.nums === false) return;
      const A = V.p(o.a), B = V.p(o.b), cuts = o.cuts || Array.from({ length: o.n + 1 }, (_, i) => i / o.n);
      const n = cuts.length - 1, u = vunit(vsub(B, A)), nr = vmul([u[1], -u[0]], o.side || 1);
      for (let i = 0; i < n; i++) {
        if (clamp(p * n - i) < 1) break;
        const c = vlerp(A, B, (cuts[i] + cuts[i + 1]) / 2);
        const s = o.texts ? o.texts[i] : String(i < o.m ? i + 1 : i - o.m + 1);
        haloText(ctx, s, c[0] + nr[0] * 30, c[1] + nr[1] * 30, 26, i < o.m ? PAL.coral : PAL.teal, a);
      }
    }
    function pin(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p), k = ease.back(p), bob = Math.abs(Math.sin((t - o.t0) * 3.2)) * 5;
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(q[0], q[1] - bob * (o.still ? 0 : 1)); ctx.scale(k, k);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -34); ctx.arc(0, -46, 21, Math.PI * 0.8, Math.PI * 0.2); ctx.closePath();
      ctx.fillStyle = colOf(o.col || 'coral'); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.lineJoin = 'round'; ctx.stroke();
      text(ctx, o.s || '?', 0, -45, 27, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function walk(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A = V.p(o.a), Cc = V.p([o.b[0], o.a[1]]), B = V.p(o.b);
      const k1 = ease.inOut(win(p, 0, 0.5)), k2 = ease.inOut(win(p, 0.5, 0.5)), col = colOf(o.col || 'sun');
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
      if (Math.abs(o.b[0] - o.a[0]) > 1e-9 && k1 > 0) {
        const E = vlerp(A, Cc, k1); line(ctx, A, E);
        if (k1 >= 1) arrowHead(ctx, Cc, Cc[0] > A[0] ? 0 : Math.PI, col, 16);
      }
      if (Math.abs(o.b[1] - o.a[1]) > 1e-9 && k2 > 0) {
        const E = vlerp(Cc, B, k2); line(ctx, Cc, E);
        if (k2 >= 1) arrowHead(ctx, B, B[1] < Cc[1] ? -Math.PI / 2 : Math.PI / 2, col, 16);
      }
      ctx.restore();
    }
    function walkLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      const A = V.p(o.a), Cc = V.p([o.b[0], o.a[1]]), B = V.p(o.b), lo = o.lo || [0, 0];
      const kx = ease.back(win(p, 0.45, 0.25)), ky = ease.back(win(p, 0.9, 0.2));
      const bg = o.col === 'plum' ? PAL.plum : o.col === 'coral' ? PAL.coral : PAL.sun, fg = bg === PAL.sun ? PAL.ink : PAL.paper;
      if (o.lx) { const m = vlerp(A, Cc, 0.5); tag(ctx, o.lx, m[0] + lo[0], m[1] + (o.ly0 || (o.b[1] >= o.a[1] ? 26 : -26)), bg, fg, kx * a, 22); }
      if (o.ly) { const m = vlerp(Cc, B, 0.5); tag(ctx, o.ly, m[0] + (o.lx0 || (o.b[0] >= o.a[0] ? 52 : -52)), m[1] + lo[1], bg, fg, ky * a, 22); }
    }
    function polyOp(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      const pts = o.pts.map(V.p), n = pts.length, closed = o.open ? 0 : 1;
      const segs = n - 1 + closed;
      const fk = ease.out(win(p, 0.8, 0.2));
      if (o.fill && fk > 0) { ctx.save(); ctx.globalAlpha *= a * o.fill * fk * (1 + gk); poly(ctx, pts); ctx.fillStyle = colOf(o.fcol || o.col); ctx.fill(); ctx.restore(); }
      ctx.save(); style(ctx, o, a);
      const q = ease.inOut(win(p, 0, 0.85)) * segs;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 0; i < segs; i++) {
        const s0 = pts[i], s1 = pts[(i + 1) % n], k = clamp(q - i);
        if (k <= 0) break;
        const e = vlerp(s0, s1, k); ctx.lineTo(e[0], e[1]);
      }
      ctx.stroke(); ctx.restore();
    }
    function circleOp(ctx, V, o, t, a, gk) {
      const p = ease.inOut(prog(o, t));
      if (p <= 0) return;
      const c = V.p(o.c), r = o.r * V.s, a0 = -(o.a0 || 90) * Math.PI / 180;
      if (o.fill) { ctx.save(); ctx.globalAlpha *= a * o.fill * p; ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, TAU); ctx.fillStyle = colOf(o.col); ctx.fill(); ctx.restore(); }
      const path = () => { ctx.beginPath(); ctx.arc(c[0], c[1], r, a0, a0 - TAU * p, true); };
      glowStroke(ctx, o, a, gk, path);
      ctx.save(); style(ctx, o, a); path(); ctx.stroke(); ctx.restore();
    }
    function ticks(ctx, V, o, t, a) {
      const p = ease.back(prog(o, t));
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), u = vunit(vsub(B, A)), nr = [u[1], -u[0]], m = vlerp(A, B, 0.5);
      ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = colOf(o.col || 'ink'); ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let i = 0; i < (o.n || 1); i++) {
        const c = vadd(m, vmul(u, (i - ((o.n || 1) - 1) / 2) * 9));
        line(ctx, vadd(c, vmul(nr, 11 * p)), vadd(c, vmul(nr, -11 * p)));
      }
      ctx.restore();
    }
    function slide(ctx, V, o, t, a) {
      if (t < o.t0) return;
      const k = win(t, o.t0, 0.35);
      if (k <= 0) return;
      const u = 0.5 + 0.44 * Math.sin((t - o.t0) * (o.w || 1.3) + (o.ph || 0));
      const q = vlerp(o.a, o.b, u);
      pin(ctx, V, { p: q, s: o.s || '?', col: o.col || 'coral', t0: o.t0 - 1, t1: o.t0 - 0.5, still: true }, t, a * k);
      if (o.readout) {
        const Q = V.p(q), s = o.readout === 'x' ? `x = ${num(q[0])}` : `y = ${num(q[1])}`;
        tag(ctx, s, Q[0] + (o.ro || [0, 0])[0], Q[1] - 96 + (o.ro || [0, 0])[1], colOf(o.col || 'coral'), PAL.paper, a * k, 22);
      }
    }
    function fillOp(ctx, V, o, t, a, gk) {
      const p = ease.out(prog(o, t));
      if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= a * Math.min(0.85, (o.alpha || 0.2) * p * (1 + gk * 1.6));
      poly(ctx, o.pts.map(V.p)); ctx.fillStyle = colOf(o.col); ctx.fill(); ctx.restore();
    }
    function labelOp(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p), off = o.off || [0, 0];
      tag(ctx, o.s, q[0] + off[0], q[1] + off[1], colOf(o.bg || 'sun'), o.bg && o.bg !== 'sun' ? PAL.paper : PAL.ink, ease.back(p) * a, o.size || 24);
    }

    // ---- one layer: fills → plane → lines → marks → points → labels -----------------------------
    const LINES = { seg, line: lineOp, pieces, poly: polyOp, circle: circleOp, walk, proj: projOp };
    function drawLayer(ctx, t, layer, alpha, cur) {
      const V = VIEW[layer];
      const g = glowFor(t, cur);
      const list = LAYER[layer].filter((o) => t >= o.t0 - 0.001);
      const aOf = (o) => alpha * lifeA(o, t);
      const gOf = (o) => (g.ids.has(o.id) ? g.k : 0);
      for (const o of list) if (o.k === 'plane') planeOp(ctx, V, o, t, aOf(o));
      for (const o of list) if (o.k === 'fill') fillOp(ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) if (LINES[o.k]) LINES[o.k](ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) if (o.k === 'ticks') ticks(ctx, V, o, t, aOf(o));
      for (const o of list) if (o.k === 'pt') ptDot(ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) {
        const a = aOf(o);
        if (a <= 0) continue;
        if (o.k === 'pt') ptLabel(ctx, V, o, t, a);
        else if (o.k === 'line') lineLabel(ctx, V, o, t, a);
        else if (o.k === 'pieces') piecesLabel(ctx, V, o, t, a);
        else if (o.k === 'proj') projLabel(ctx, V, o, t, a);
        else if (o.k === 'walk') walkLabel(ctx, V, o, t, a);
        else if (o.k === 'label') labelOp(ctx, V, o, t, a);
      }
      for (const o of list) if (o.k === 'pin') pin(ctx, V, o, t, aOf(o));
      for (const o of list) if (o.k === 'slide') slide(ctx, V, o, t, aOf(o));
    }

    // ---- stage ------------------------------------------------------------------------------------
    function scaleChip(ctx, s, k, idea) {
      if (k <= 0) return;
      ctx.font = font(28, 700);
      if (idea) {
        const lab = 'Idea picture', w = ctx.measureText(lab).width + 40;
        ctx.save(); ctx.translate(STAGE.x + STAGE.w - 24 - w, STAGE.y + STAGE.h); ctx.scale(k, k);
        pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3); text(ctx, lab, 20, 1, 28, PAL.ink, { weight: 700 });
        ctx.restore();
        return;
      }
      const lab = `Scale: 1 unit = ${s} px`, tw = ctx.measureText(lab).width, w = tw + s + 60;
      ctx.save(); ctx.translate(STAGE.x + STAGE.w - 24 - w, STAGE.y + STAGE.h); ctx.scale(k, k);
      pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3);
      text(ctx, lab, 20, 1, 28, PAL.ink, { weight: 700 });
      const rx = 36 + tw;
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rx, 6); ctx.lineTo(rx + s, 6); ctx.moveTo(rx, -2); ctx.lineTo(rx, 10); ctx.moveTo(rx + s, -2); ctx.lineTo(rx + s, 10); ctx.stroke();
      text(ctx, '1 unit', rx + s / 2, -8, 15, PAL.ink, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function drawStage(ctx, t, cur) {
      const sc = beat.scene;
      const draw = ease.inOut(win(t, sc.start + 0.05, 0.9));
      if (draw <= 0) return;
      const outroFade = 1 - win(t, beat.outro.start - 0.3, 0.3);
      if (outroFade <= 0) return;
      const kn = beat.know, so = beat.solve;
      const kA = win(t, kn.start + 0.1, 0.4) * (1 - win(t, so.start - 0.35, 0.35));
      const mA = 1 - kA;
      ctx.save(); ctx.globalAlpha = outroFade;
      ctx.save();
      ctx.beginPath(); rrect(ctx, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); ctx.fillStyle = PAL.paper; ctx.fill();
      ctx.setLineDash([3400 * draw, 4000]); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.beginPath(); rrect(ctx, STAGE.x + 3, STAGE.y + 3, STAGE.w - 6, STAGE.h - 6, STAGE.r - 3); ctx.clip();
      if (mA > 0.01) drawLayer(ctx, t, 'main', mA, cur);
      if (kA > 0.01) drawLayer(ctx, t, 'know', kA, cur);
      ctx.restore();
      const ck = ease.back(win(t, sc.lines[0].start, 0.45));
      const idea = !!(P.knowView && P.knowView.idea);
      if (ck > 0) {
        if (mA > 0.01) { ctx.save(); ctx.globalAlpha *= mA; scaleChip(ctx, P.plane.s, ck, false); ctx.restore(); }
        if (kA > 0.01) { ctx.save(); ctx.globalAlpha *= kA; scaleChip(ctx, VIEW.know.s, ck, idea); ctx.restore(); }
      }
      ctx.restore();
    }

    // ---- scene card --------------------------------------------------------------------------------
    function boardScene(ctx, t, b) {
      C.boardFrame(ctx, b, t, P.sceneTitle || 'THE PLANE', PAL.teal);
      const rows = [];
      b.lines.forEach((l) => { if (l.legend) [].concat(l.legend).forEach((r, j) => rows.push({ at: l.start + j * 0.9, icon: r.icon, s: r.s })); });
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
    function icon(ctx, kind, x, y) {
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (kind === 'scale') {
        ctx.beginPath(); rrect(ctx, x - 27, y - 11, 54, 22, 5); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 27 + i * 9, y - 11); ctx.lineTo(x - 27 + i * 9, y - (i % 2 ? 3 : 0)); ctx.stroke(); }
      } else if (kind === 'pt') {
        ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fillStyle = PAL.teal; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      } else if (kind === 'seg') {
        ctx.strokeStyle = PAL.teal; ctx.lineWidth = 6; line(ctx, [x - 22, y + 12], [x + 22, y - 12]);
        ctx.fillStyle = PAL.ink; [[x - 22, y + 12], [x + 22, y - 12]].forEach((q) => { ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, TAU); ctx.fill(); });
      } else if (kind === 'line') {
        ctx.strokeStyle = PAL.plum; ctx.lineWidth = 5; line(ctx, [x - 26, y + 16], [x + 26, y - 16]);
      } else if (kind === 'pin') {
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x - 9, y); ctx.arc(x, y - 6, 12, Math.PI * 0.8, Math.PI * 0.2); ctx.closePath();
        ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      } else if (kind === 'ratio') {
        ctx.lineWidth = 10; ctx.strokeStyle = PAL.coral; line(ctx, [x - 26, y], [x + 6, y]); ctx.strokeStyle = PAL.teal; line(ctx, [x + 6, y], [x + 26, y]);
      } else if (kind === 'tri' || kind === 'poly' || kind === 'circle') {
        if (kind === 'circle') { ctx.beginPath(); ctx.arc(x, y, 17, 0, TAU); } else if (kind === 'tri') poly(ctx, [[x - 22, y + 15], [x + 22, y + 15], [x - 4, y - 17]]); else poly(ctx, [[x - 24, y + 14], [x + 12, y + 14], [x + 24, y - 14], [x - 12, y - 14]]);
        ctx.fillStyle = rgba(PAL.teal, 0.3); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.teal; ctx.stroke();
      }
      ctx.restore();
    }

    // ---- hook art: the question's own points on a plane ----------------------------------------------
    function art(ctx, t, R) {
      const A = P.hook.art || {};
      const wv = A.win || P.plane.win;
      const s = Math.min((R.w - 110) / (wv.x[1] - wv.x[0]), (R.h - 110) / (wv.y[1] - wv.y[0]));
      const V = planeView(wv, s, { x: R.x + 55, y: R.y + 60, w: R.w - 110, h: R.h - 110 });
      // the sheet
      ctx.save(); ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.rotate(-0.014);
      ctx.beginPath(); rrect(ctx, -R.w / 2 + 6, -R.h / 2 + 14, R.w - 12, R.h - 16, 26); ctx.fillStyle = rgba(PAL.ink, 0.14); ctx.fill();
      ctx.beginPath(); rrect(ctx, -R.w / 2 + 6, -R.h / 2 + 2, R.w - 12, R.h - 16, 26); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.beginPath(); rrect(ctx, R.x + 10, R.y + 6, R.w - 20, R.h - 24, 24); ctx.clip();
      drawPlane(ctx, V, wv, 1, 1);
      const items = (A.items || []).map((o) => Object.assign({ t0: -5, t1: -4 }, o));
      const fake = { l: null };
      for (const o of items) if (o.k === 'fill') fillOp(ctx, V, o, t, 1, 0);
      for (const o of items) if (LINES[o.k]) LINES[o.k](ctx, V, o, t, 1, 0);
      for (const o of items) if (o.k === 'ticks') ticks(ctx, V, o, t, 1);
      for (const o of items) if (o.k === 'pt') ptDot(ctx, V, o, t, 1, 0);
      for (const o of items) {
        if (o.k === 'pt') ptLabel(ctx, V, o, t, 1);
        else if (o.k === 'line') lineLabel(ctx, V, o, t, 1);
        else if (o.k === 'pieces') piecesLabel(ctx, V, o, t, 1);
        else if (o.k === 'label') labelOp(ctx, V, o, t, 1);
      }
      for (const o of items) if (o.k === 'pin') pin(ctx, V, Object.assign({}, o, { t0: 0 }), t + 0.5, 1);
      for (const o of items) if (o.k === 'slide') slide(ctx, V, Object.assign({}, o, { t0: -1 }), t, 1);
      ctx.restore();
      void fake;
    }

    const draw = C.compose({ art, stage: drawStage, scene: boardScene });
    return { W, H, FPS, duration: D, draw, beats, P, TL };
  }

  root.VideoEngine = { createVideo, clipLine, CONTENT, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
