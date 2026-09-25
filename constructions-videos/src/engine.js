/* Maths by Zosiama · Constructions explainers — compass & ruler engine.
 *
 * Built on video-kit/core.js. This file draws geometry constructions on a to-scale
 * drawing sheet: segments and rays, compass arcs, equal compass steps, parallel lines
 * slid with a set square, right angles, angle marks, labels and measurements. The
 * tools themselves (ruler, compass, set square, pencil, protractor) move as each step
 * is drawn. It also draws the "Know first" idea pictures, the scene card and the hook
 * illustrations.
 *
 * Every drawing step ("op") belongs to a narration line: it starts when the line starts
 * and runs for its own duration (the audio layout gives each line enough time for its
 * ops, see problems.js prep()). Every frame is a pure function of t.
 *
 * Geometry is in cm with y up; a view maps cm to px (P.view.s px per cm = the scale).
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, BX, BY, BW, font, clamp, lerp, win, ease, rgba, rrect, pill, text, createCore,
  } = root.VideoCore;
  const TAU = Math.PI * 2, RAD = Math.PI / 180;
  const COL = { teal: PAL.teal, coral: PAL.coral, plum: PAL.plum, ink: PAL.ink, sun: PAL.sun, paper: PAL.paper };
  const colOf = (c) => COL[c] || PAL.ink;
  const STY = {
    main: { lw: 6, a: 1 },
    help: { lw: 3.6, a: 0.95 },
    con: { lw: 2.4, a: 0.62 },
    guide: { lw: 3, a: 0.8, dash: [12, 9] },
  };
  const STAGE = { x: 90, y: 280, w: 900, h: 538, r: 28 };
  const CONTENT = { x: STAGE.x + 50, y: STAGE.y + 46, w: STAGE.w - 100, h: STAGE.h - 46 - 72 }; // labels fit around it; the scale chip sits below
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sb = (i) => String(i).split('').map((d) => SUBS[+d]).join('');

  // ---- 2D vectors ------------------------------------------------------------------
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const vmul = (a, k) => [a[0] * k, a[1] * k];
  const vlerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const vlen = (a) => Math.hypot(a[0], a[1]);
  const vdist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const vunit = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
  const dir = (deg) => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
  const sdir = (deg) => [Math.cos(deg * RAD), -Math.sin(deg * RAD)]; // screen direction of a maths angle
  const headingOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  function angleAt(A, B, C) {
    const u = vsub(B, A), v = vsub(C, A);
    return Math.acos(clamp((u[0] * v[0] + u[1] * v[1]) / (vlen(u) * vlen(v)), -1, 1)) / RAD;
  }
  function line(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
  function haloText(ctx, s, x, y, size, color, a = 1, align = 'center') {
    if (!s || a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.font = font(size, 700); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(6, size * 0.24); ctx.strokeStyle = PAL.paper; ctx.strokeText(s, x, y);
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    ctx.restore();
  }

  // ---- views: cm → px, centred on the ops of a layer --------------------------------
  function ghostAt(o, u) {
    const g = o.path;
    if (g.k === 'line') return vlerp(g.a, g.b, u);
    return vadd(g.c, vmul(dir(lerp(g.a0, g.a1, u)), g.r));
  }
  function geomPts(o, out) {
    switch (o.k) {
      case 'seg': out.push(o.a, o.b); break;
      case 'arc': for (let i = 0; i <= 24; i++) out.push(vadd(o.c, vmul(dir(lerp(o.a0, o.a1, i / 24)), o.r))); break;
      case 'pt': out.push(o.p); break;
      case 'steps': out.push(o.a, vadd(o.a, vmul(dir(o.deg), o.u * o.n))); break;
      case 'par': out.push(o.a, o.b); break;
      case 'perp': out.push(o.v, vadd(o.v, vmul(dir(o.deg), o.len))); break;
      case 'fill': out.push(...o.pts); break;
      case 'ghost': for (let i = 0; i <= 12; i++) out.push(ghostAt(o, i / 12)); out.push(...o.base); break;
      case 'bar': out.push(o.a, vlerp(o.a, o.b, Math.max(1, o.m / o.n))); break;
      default: break;
    }
  }
  function bboxOf(ops) {
    const pts = [];
    ops.forEach((o) => geomPts(o, pts));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function makeView(ops, s, box, nudge = {}) {
    const pts = [];
    ops.forEach((o) => geomPts(o, pts));
    if (!pts.length) pts.push([0, 0]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const ox = box.x + box.w / 2 - ((x0 + x1) / 2) * s + (nudge.dx || 0);
    const oy = box.y + box.h / 2 + ((y0 + y1) / 2) * s + (nudge.dy || 0);
    return { s, ox, oy, bb: [x0, y0, x1, y1], p: (q) => [ox + q[0] * s, oy - q[1] * s] };
  }

  // =================================================================================
  // tools
  // =================================================================================
  function drawPencil(ctx, tip, a, ang = 62) {
    if (a <= 0) return;
    const u = sdir(ang), n = [-u[1], u[0]]; // the body runs from the tip up and to the right
    const at = (k, w) => vadd(vadd(tip, vmul(u, k)), vmul(n, w));
    ctx.save(); ctx.globalAlpha *= a; ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink;
    poly(ctx, [tip, at(26, -8), at(26, 8)]); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.stroke();       // wood cone
    poly(ctx, [tip, at(9, -3), at(9, 3)]); ctx.fillStyle = PAL.ink; ctx.fill();                      // lead
    poly(ctx, [at(26, -8), at(96, -8), at(96, 8), at(26, 8)]); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.stroke(); // body
    poly(ctx, [at(96, -8), at(114, -8), at(114, 8), at(96, 8)]); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.stroke(); // eraser
    ctx.restore();
  }
  // compass: needle at n, pencil at q (px); side +1/-1 picks which way the hinge sits
  function drawCompass(ctx, n, q, a, side) {
    if (a <= 0) return;
    const d = vdist(n, q), L = Math.max(150, d * 0.62 + 30);
    const h = Math.sqrt(Math.max(L * L - (d * d) / 4, 900));
    const m = vlerp(n, q, 0.5), u = vunit(vsub(q, n)), nr = vmul([u[1], -u[0]], side);
    const hinge = vadd(m, vmul(nr, h));
    ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // needle leg (metal)
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 13; line(ctx, hinge, n);
    ctx.strokeStyle = PAL.paper; ctx.lineWidth = 7; line(ctx, hinge, vlerp(hinge, n, 0.96));
    // pencil leg: metal, then a sunflower pencil sleeve and a coral tip
    const s0 = vlerp(hinge, q, 0.55), s1 = vlerp(hinge, q, 0.9);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 13; line(ctx, hinge, s0);
    ctx.strokeStyle = PAL.paper; ctx.lineWidth = 7; line(ctx, hinge, s0);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 17; line(ctx, s0, s1);
    ctx.strokeStyle = PAL.sun; ctx.lineWidth = 11; line(ctx, s0, s1);
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 7; line(ctx, s1, q);
    ctx.strokeStyle = PAL.coral; ctx.lineWidth = 3; line(ctx, s1, vlerp(s1, q, 0.8));
    // hinge + handle
    const up = vunit(vsub(hinge, m));
    ctx.strokeStyle = PAL.ink; ctx.lineWidth = 12; line(ctx, hinge, vadd(hinge, vmul(up, 34)));
    ctx.strokeStyle = PAL.plum; ctx.lineWidth = 7; line(ctx, hinge, vadd(hinge, vmul(up, 32)));
    ctx.beginPath(); ctx.arc(hinge[0], hinge[1], 12, 0, TAU); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(n[0], n[1], 3.5, 0, TAU); ctx.fillStyle = PAL.ink; ctx.fill();
    ctx.restore();
  }
  // ruler lying along a→b (px), 0 at a; body on side (+1 = screen-left of a→b); s = px per cm
  function drawRuler(ctx, a, b, alpha, s, side = -1, numbers = true) {
    if (alpha <= 0) return;
    const u = vunit(vsub(b, a)), nr = vmul([u[1], -u[0]], side);
    const lenPx = vdist(a, b), pad = Math.max(0.5 * s, 26), w = 48;
    const p0 = vsub(a, vmul(u, pad)), p1 = vadd(b, vmul(u, pad));
    ctx.save(); ctx.globalAlpha *= alpha;
    poly(ctx, [p0, p1, vadd(p1, vmul(nr, w)), vadd(p0, vmul(nr, w))]);
    ctx.fillStyle = rgba(PAL.sun, 0.82); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
    ctx.strokeStyle = rgba(PAL.ink, 0.85);
    const cm = Math.floor((lenPx + pad * 0.9) / s * 2) / 2;
    for (let k = 0; k <= cm * 2; k++) {
      const x = vadd(a, vmul(u, (k / 2) * s)), big = k % 2 === 0;
      ctx.lineWidth = big ? 2.4 : 1.6;
      line(ctx, x, vadd(x, vmul(nr, big ? 16 : 9)));
      if (big && numbers && s >= 34) {
        const tp = vadd(x, vmul(nr, 30));
        ctx.font = font(15, 700); ctx.fillStyle = PAL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(k / 2), tp[0], tp[1]);
      }
    }
    ctx.restore();
  }
  // set square: its long edge from e0 to e1 (px), body behind (direction -fwd)
  function drawSquare(ctx, e0, e1, fwd, alpha) {
    if (alpha <= 0) return;
    const L = vdist(e0, e1), back = vmul(vunit(fwd), -Math.min(150, L * 0.62));
    const c = vadd(e0, back);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.lineJoin = 'round';
    poly(ctx, [e0, e1, c]); ctx.fillStyle = rgba(PAL.plum, 0.24); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.ink; ctx.stroke();
    // inner cut-out
    const g = [(e0[0] + e1[0] + c[0]) / 3, (e0[1] + e1[1] + c[1]) / 3];
    poly(ctx, [vlerp(g, e0, 0.45), vlerp(g, e1, 0.45), vlerp(g, c, 0.45)]); ctx.fillStyle = rgba(PAL.paper, 0.55); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    // right-angle corner mark at e0
    const a1 = vunit(vsub(e1, e0)), a2 = vunit(back);
    ctx.lineWidth = 2; line(ctx, vadd(e0, vmul(a1, 16)), vadd(vadd(e0, vmul(a1, 16)), vmul(a2, 16)));
    line(ctx, vadd(e0, vmul(a2, 16)), vadd(vadd(e0, vmul(a2, 16)), vmul(a1, 16)));
    ctx.restore();
  }
  function drawProtractor(ctx, v, baseDeg, r, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(v[0], v[1], r, -baseDeg * RAD, -(baseDeg + 180) * RAD, true); ctx.closePath();
    ctx.fillStyle = rgba(PAL.sun, 0.35); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
    for (let k = 0; k <= 18; k++) {
      const u = sdir(baseDeg + k * 10), big = k % 3 === 0;
      line(ctx, vadd(v, vmul(u, r)), vadd(v, vmul(u, r - (big ? 16 : 9))));
    }
    ctx.beginPath(); ctx.arc(v[0], v[1], 7, 0, TAU); ctx.fillStyle = PAL.ink; ctx.fill();
    ctx.restore();
  }

  // =================================================================================
  function createVideo(P, TL) {
    const C = createCore(P, TL, { tokens: P.tokens || {}, chapter: P.chapter, label: P.label });
    const { D, beats, beat, math, parseMath, mathWidth } = C;

    // ---- schedule every drawing op from the narration timeline (same rules as prep()) ----
    const OPS = [];
    beats.forEach((b) => b.lines.forEach((l) => {
      if (!l.draw) return;
      let cur = l.start + (l.lead === undefined ? 0.15 : l.lead), prev = cur;
      l.draw.forEach((op) => {
        const s0 = op.with ? prev : cur + (op.gap || 0);
        const o = Object.assign({}, op, { t0: s0, t1: s0 + op.dur, layer: b.type === 'know' ? 'know' : 'main', beat: b, line: l });
        if (o.life === 'beat') o.tEnd = b.end - 0.35;
        if (o.lifeLines) { const nx = b.lines[b.lines.indexOf(l) + o.lifeLines]; o.tEnd = nx ? nx.start - 0.35 : b.end - 0.35; }
        OPS.push(o);
        prev = s0; cur = Math.max(cur, s0 + op.dur);
      });
    }));
    const LAYER = { main: OPS.filter((o) => o.layer === 'main'), know: OPS.filter((o) => o.layer === 'know') };
    const BOX = CONTENT;
    const VIEW = {
      main: makeView(LAYER.main.filter((o) => o.beat.type !== 'answer' || o.k === 'fill'), P.view.s, BOX, P.view),
      know: makeView(LAYER.know, (P.knowView || P.view).s, BOX, P.knowView || {}),
    };
    // tool tracks: consecutive uses of the same tool glide from one pose to the next
    const TRACKS = {};
    for (const layer of ['main', 'know']) {
      for (const o of LAYER[layer]) {
        const tool = o.tool || null;
        if (!tool) continue;
        const key = layer + ':' + tool;
        (TRACKS[key] = TRACKS[key] || []).push(o);
      }
    }
    Object.values(TRACKS).forEach((tr) => tr.sort((a, b) => a.t0 - b.t0));

    const prog = (o, t) => clamp((t - o.t0) / Math.max(1e-3, o.t1 - o.t0));
    const lifeA = (o, t) => (o.tEnd === undefined ? 1 : 1 - win(t, o.tEnd, 0.35));

    // ---- highlight: which ops glow for the current line --------------------------------
    function glowFor(t, cur) {
      if (!cur || !cur.l || !cur.l.hl || cur.l.hl === 'none') return { k: 0, ids: new Set() };
      const L = cur.l, endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25)) * (0.72 + 0.28 * Math.sin((t - L.start) * 6));
      return { k, ids: new Set(L.hl.split('+')) };
    }

    // ---- small drawing pieces ---------------------------------------------------------------
    function tag(ctx, s, x, y, bg, fg, k, size = 28) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(size, 700);
      const w = mathWidth(ctx, parseMath(s, fg), size, 700) + 26, hh = size + 16;
      pill(ctx, -w / 2, -hh / 2, w, hh, bg, PAL.ink, 3);
      math(ctx, s, 0, 1, size, { align: 'center', color: fg, sym: fg, weight: 700 });
      ctx.restore();
    }
    function arrowHead(ctx, p, ang, col, s = 14) {
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s / 2); ctx.lineTo(-s, s / 2); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    function style(ctx, o, a) {
      const st = STY[o.st || 'main'];
      ctx.globalAlpha *= a * st.a; ctx.lineWidth = st.lw; ctx.strokeStyle = colOf(o.col); ctx.lineCap = 'round';
      ctx.setLineDash(st.dash || []);
    }
    function glowStroke(ctx, o, a, gk, path) {
      if (gk <= 0) return;
      ctx.save(); ctx.globalAlpha *= a * gk * 0.6; ctx.strokeStyle = PAL.sun; ctx.lineCap = 'round';
      ctx.lineWidth = STY[o.st || 'main'].lw + 14; path(); ctx.stroke(); ctx.restore();
    }

    // ---- ops ----------------------------------------------------------------------------------
    function seg(ctx, V, o, t, a, gk) {
      const p = ease.inOut(prog(o, t));
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(vlerp(o.a, o.b, p));
      glowStroke(ctx, o, a, gk, () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); });
      ctx.save(); style(ctx, o, a); line(ctx, A, B); ctx.restore();
    }
    function arcOp(ctx, V, o, t, a, gk) {
      const p = ease.inOut(prog(o, t));
      if (p <= 0) return;
      const c = V.p(o.c), r = o.r * V.s, e = lerp(o.a0, o.a1, p);
      const path = () => { ctx.beginPath(); ctx.arc(c[0], c[1], r, -o.a0 * RAD, -e * RAD, o.a1 > o.a0); };
      glowStroke(ctx, o, a, gk, path);
      ctx.save(); style(ctx, o, a); path(); ctx.stroke(); ctx.restore();
    }
    const stepPt = (o, i) => vadd(o.a, vmul(dir(o.deg), o.u * i));
    function steps(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      for (let i = 1; i <= o.n; i++) {
        const q = clamp(p * o.n - (i - 1));
        if (q <= 0) break;
        const c = V.p(stepPt(o, i - 1)), r = o.u * V.s, e = lerp(o.deg - 11, o.deg + 11, ease.inOut(q));
        ctx.save(); ctx.globalAlpha *= a * 0.7; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(c[0], c[1], r, -(o.deg - 11) * RAD, -e * RAD, true); ctx.stroke(); ctx.restore();
        if (q >= 1) {
          const d = V.p(stepPt(o, i));
          ctx.save(); ctx.globalAlpha *= a;
          if (gk > 0) { ctx.beginPath(); ctx.arc(d[0], d[1], 13, 0, TAU); ctx.fillStyle = rgba(PAL.sun, 0.6 * gk); ctx.fill(); }
          ctx.beginPath(); ctx.arc(d[0], d[1], 6, 0, TAU); ctx.fillStyle = colOf(o.col); ctx.fill(); ctx.restore();
        }
      }
    }
    function stepLabels(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const nrm = sdir(o.deg - 90 * (o.lside || 1));
      for (let i = 1; i <= o.n; i++) {
        if (p * o.n - (i - 1) < 1) break;
        if (o.only && !o.only.includes(i)) continue;
        const d = V.p(stepPt(o, i));
        const s = o.prefix === '' ? String(i) : `${o.prefix}${sb(i)}`;
        haloText(ctx, s, d[0] + nrm[0] * 28, d[1] + nrm[1] * 28, o.prefix === '' ? 24 : 26, colOf(o.col), a);
      }
    }
    // parallel via set square: slide from the reference line to the point, then draw a→b
    function parGeom(o) {
      const u = vunit(vsub(o.ref[1], o.ref[0]));
      const n0 = [-u[1], u[0]];
      const d = (o.through[0] - o.ref[0][0]) * n0[0] + (o.through[1] - o.ref[0][1]) * n0[1];
      const nrm = d >= 0 ? n0 : [-n0[0], -n0[1]];
      const mid = vlerp(o.a, o.b, 0.5);
      return { u, nrm, mid, mid0: vsub(mid, vmul(nrm, Math.abs(d))) };
    }
    function par(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      const q = ease.inOut(win(p, 0.62, 0.38));
      if (q <= 0) return;
      const A = V.p(o.a), B = V.p(vlerp(o.a, o.b, q));
      glowStroke(ctx, o, a, gk, () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); });
      ctx.save(); style(ctx, o, a); line(ctx, A, B); ctx.restore();
    }
    function perp(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      const q = ease.inOut(win(p, 0.32, 0.68));
      if (q <= 0) return;
      const A = V.p(o.v), B = V.p(vadd(o.v, vmul(dir(o.deg), o.len * q)));
      glowStroke(ctx, o, a, gk, () => { ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); });
      ctx.save(); style(ctx, o, a); line(ctx, A, B); ctx.restore();
    }
    function fill(ctx, V, o, t, a, gk) {
      const p = ease.out(prog(o, t));
      if (p <= 0) return;
      ctx.save(); ctx.globalAlpha *= a * Math.min(0.85, (o.alpha || 0.2) * p * (1 + gk * 1.6));
      poly(ctx, o.pts.map(V.p)); ctx.fillStyle = colOf(o.col); ctx.fill(); ctx.restore();
    }
    function pmark(ctx, V, o, t, a) {
      const p = ease.back(prog(o, t));
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), u = vunit(vsub(B, A)), m = vlerp(A, B, o.at || 0.5);
      const ang = Math.atan2(u[1], u[0]);
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(m[0], m[1]); ctx.rotate(ang); ctx.scale(p, p);
      ctx.strokeStyle = colOf(o.col); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < (o.n || 1); i++) {
        const x = (i - ((o.n || 1) - 1) / 2) * 11;
        ctx.beginPath(); ctx.moveTo(x - 7, -9); ctx.lineTo(x + 4, 0); ctx.lineTo(x - 7, 9); ctx.stroke();
      }
      ctx.restore();
    }
    function angMark(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0) return;
      const v = V.p(o.v), r = o.r || 46, e = lerp(o.a0, o.a1, ease.inOut(p));
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); ctx.moveTo(v[0], v[1]); ctx.arc(v[0], v[1], r, -o.a0 * RAD, -e * RAD, o.a1 > o.a0); ctx.closePath();
      ctx.fillStyle = rgba(o.col === 'sun' ? PAL.sun : colOf(o.col), (o.col === 'sun' ? 0.55 : 0.22) + 0.35 * gk); ctx.fill();
      ctx.beginPath(); ctx.arc(v[0], v[1], r, -o.a0 * RAD, -e * RAD, o.a1 > o.a0);
      ctx.strokeStyle = o.col === 'sun' ? PAL.ink : colOf(o.col); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    function angLabel(ctx, V, o, t, a) {
      if (!o.s) return;
      const p = prog(o, t);
      if (p < 0.6) return;
      const v = V.p(o.v), mid = (o.a0 + o.a1) / 2, u = sdir(mid), rr = (o.r || 46) + (o.lr || 30);
      haloText(ctx, o.s, v[0] + u[0] * rr + (o.dx || 0), v[1] + u[1] * rr + (o.dy || 0), 30, PAL.ink, a * win(p, 0.6, 0.3));
    }
    function rtMark(ctx, V, o, t, a, gk) {
      const p = ease.back(prog(o, t));
      if (p <= 0) return;
      const v = V.p(o.v), s = (o.size || 22) * p, u1 = sdir(o.a0), u2 = sdir(o.a0 + 90);
      const c1 = vadd(v, vmul(u1, s)), c2 = vadd(vadd(v, vmul(u1, s)), vmul(u2, s)), c3 = vadd(v, vmul(u2, s));
      ctx.save(); ctx.globalAlpha *= a;
      poly(ctx, [v, c1, c2, c3]); ctx.fillStyle = rgba(o.col === 'sun' ? PAL.sun : colOf(o.col), 0.35 + 0.35 * gk); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]);
      ctx.strokeStyle = o.col === 'sun' ? PAL.ink : colOf(o.col); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }
    function dimOp(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A0 = V.p(o.a), B0 = V.p(o.b), u = vunit(vsub(B0, A0)), n = [u[1], -u[0]];
      const off = o.off || 0, A = vadd(A0, vmul(n, off)), B = vadd(B0, vmul(n, off));
      const k = ease.inOut(p), Bk = vlerp(A, B, k), col = colOf(o.col || 'coral');
      ctx.save(); ctx.globalAlpha *= a;
      if (off) { ctx.setLineDash([5, 6]); ctx.lineWidth = 2; ctx.strokeStyle = rgba(PAL.ink, 0.5); line(ctx, A0, A); line(ctx, B0, vlerp(B0, B, k)); ctx.setLineDash([]); }
      ctx.lineWidth = 4; ctx.strokeStyle = col; line(ctx, A, Bk);
      const ang = Math.atan2(u[1], u[0]);
      arrowHead(ctx, A, ang + Math.PI, col, 13);
      if (k > 0.95) arrowHead(ctx, B, ang, col, 13);
      ctx.restore();
    }
    function dimLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p < 0.5) return;
      const A0 = V.p(o.a), B0 = V.p(o.b), u = vunit(vsub(B0, A0)), n = [u[1], -u[0]];
      const m = vadd(vlerp(A0, B0, 0.5), vmul(n, o.off || 0)), lab = o.lab || [0, 0];
      const side = Math.sign(o.off || 1);
      const lx = m[0] + lab[0] + (o.lab ? 0 : n[0] * side * 44), ly = m[1] + lab[1] + (o.lab ? 0 : n[1] * side * 20);
      tag(ctx, o.s, lx, ly, colOf(o.col || 'coral'), PAL.paper, ease.back(win(p, 0.5, 0.4)) * a, 26);
    }
    function lenLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), u = vunit(vsub(B, A));
      let n = [u[1], -u[0]];
      if (o.side === -1) n = [-n[0], -n[1]];
      const off = o.off === undefined ? 30 : o.off, m = vlerp(A, B, 0.5);
      tag(ctx, o.s, m[0] + n[0] * off + (o.dx || 0), m[1] + n[1] * off + (o.dy || 0), colOf(o.col || 'ink'), PAL.paper, ease.back(p) * a, 26);
    }
    function ptDot(ctx, V, o, t, a, gk) {
      const p = prog(o, t);
      if (p <= 0 || o.dot === false) return;
      const q = V.p(o.p), k = ease.back(p);
      ctx.save(); ctx.globalAlpha *= a;
      if (gk > 0) { ctx.beginPath(); ctx.arc(q[0], q[1], 20, 0, TAU); ctx.fillStyle = rgba(PAL.sun, 0.7 * gk); ctx.fill(); }
      ctx.beginPath(); ctx.arc(q[0], q[1], 7.5 * k, 0, TAU); ctx.fillStyle = colOf(o.col || 'ink'); ctx.fill();
      ctx.restore();
    }
    function ptLabel(ctx, V, o, t, a) {
      if (!o.name) return;
      const p = prog(o, t);
      if (p <= 0) return;
      const q = V.p(o.p), lp = o.lp || [0, -30];
      haloText(ctx, o.name, q[0] + lp[0], q[1] + lp[1], o.size || 34, colOf(o.col || 'ink'), a * clamp(p * 2));
    }
    function measOp(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b);
      const k = ease.inOut(win(p, 0.3, 0.45));
      a *= fadeAfter(o, t);
      if (k > 0 && a > 0) {
        ctx.save(); ctx.globalAlpha *= a;
        ctx.strokeStyle = PAL.sun; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.globalAlpha *= 0.8; line(ctx, A, vlerp(A, B, k));
        ctx.restore();
      }
    }
    const fadeAfter = (o, t) => 1 - win(t, o.t1 + 2.4, 0.35);
    function measLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p < 0.72) return;
      a *= fadeAfter(o, t);
      if (a <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), u = vunit(vsub(B, A)), n = vmul([u[1], -u[0]], o.rside || outside(V, A, B));
      const m = vlerp(A, B, 0.5);
      tag(ctx, `${o.s} ✓`, m[0] + n[0] * 74 + (o.dx || 0), m[1] + n[1] * 74 + (o.dy || 0), PAL.sun, PAL.ink, ease.back(win(p, 0.72, 0.25)) * a, 28);
    }
    function protOp(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0.3) return;
      const v = V.p(o.v), k = ease.inOut(win(p, 0.35, 0.4)), e = lerp(o.a0, o.a1, k), r = 104;
      a *= fadeAfter(o, t);
      if (a <= 0) return;
      const pa = win(p, 0.3, 0.15);
      drawProtractor(ctx, v, o.a1 > o.a0 ? o.a0 : o.a0 - 180, r, a * pa);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); ctx.moveTo(v[0], v[1]); ctx.arc(v[0], v[1], r - 20, -o.a0 * RAD, -e * RAD, o.a1 > o.a0); ctx.closePath();
      ctx.fillStyle = rgba(PAL.coral, 0.45); ctx.fill();
      ctx.restore();
    }
    function protLabel(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p < 0.78) return;
      a *= fadeAfter(o, t);
      if (a <= 0) return;
      const v = V.p(o.v), mid = (o.a0 + o.a1) / 2, u = sdir(mid);
      tag(ctx, `${o.s} ✓`, v[0] + u[0] * 150, v[1] + u[1] * 150, PAL.sun, PAL.ink, ease.back(win(p, 0.78, 0.2)) * a, 28);
    }
    function ghost(ctx, V, o, t, a) {
      if (t < o.t0) return;
      const k = win(t, o.t0, 0.35);
      if (k <= 0) return;
      const lt = t - o.t0;
      const u = 0.5 + 0.47 * Math.sin(lt * (o.w || 1) + (o.ph || 0));
      const Aq = ghostAt(o, u), Ap = V.p(Aq), Bp = V.p(o.base[0]), Cp = V.p(o.base[1]);
      ctx.save(); ctx.globalAlpha *= a * k;
      if (o.showPath) {
        ctx.setLineDash([10, 9]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(PAL.coral, 0.8);
        if (o.path.k === 'line') line(ctx, V.p(o.path.a), V.p(o.path.b));
        else { const c = V.p(o.path.c); ctx.beginPath(); ctx.arc(c[0], c[1], o.path.r * V.s, -o.path.a0 * RAD, -o.path.a1 * RAD, o.path.a1 > o.path.a0); ctx.stroke(); }
        ctx.setLineDash([]);
      }
      if (o.spoke) { ctx.setLineDash([6, 7]); ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(PAL.coral, 0.9); line(ctx, V.p(o.spoke), Ap); ctx.setLineDash([]); }
      ctx.lineWidth = 4; ctx.strokeStyle = rgba(PAL.ink, 0.75); ctx.setLineDash([12, 8]);
      line(ctx, Ap, Bp); line(ctx, Ap, Cp); ctx.setLineDash([]);
      const ang = angleAt(Aq, o.base[0], o.base[1]);
      const hB = headingOf(Aq, o.base[0]), hC = headingOf(Aq, o.base[1]);
      ctx.beginPath(); ctx.moveTo(Ap[0], Ap[1]); ctx.arc(Ap[0], Ap[1], 38, -hB * RAD, -hC * RAD, hC > hB); ctx.closePath();
      const hit = Math.abs(ang - o.theta) < 1.5;
      ctx.fillStyle = rgba(hit ? PAL.sun : PAL.plum, hit ? 0.8 : 0.3); ctx.fill();
      ctx.beginPath(); ctx.arc(Ap[0], Ap[1], 9, 0, TAU); ctx.fillStyle = PAL.plum; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.paper; ctx.stroke();
      ctx.restore();
      haloText(ctx, o.vname, Ap[0] - 26, Ap[1] - 26, 32, PAL.plum, a * k);
      const s = `∠${o.vname} = ${Math.round(ang)}°${hit ? ' ✓' : ''}`;
      tag(ctx, s, Ap[0] + (Ap[0] > V.p([0, 0])[0] + 200 ? -40 : 40), Ap[1] - 66, hit ? PAL.sun : PAL.plum, hit ? PAL.ink : PAL.paper, a * k, 26);
    }
    function bar(ctx, V, o, t, a) {
      const p = prog(o, t);
      if (p <= 0) return;
      const A = V.p(o.a), B = V.p(o.b), u = vsub(B, A), part = vmul(u, 1 / o.n);
      const k0 = ease.inOut(win(p, 0, 0.3));
      ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
      ctx.strokeStyle = PAL.teal; ctx.lineWidth = 10; line(ctx, A, vlerp(A, B, k0));
      if (o.m > o.n && k0 >= 1) { ctx.setLineDash([10, 9]); ctx.strokeStyle = rgba(PAL.ink, 0.45); ctx.lineWidth = 4; line(ctx, B, vadd(A, vmul(part, o.m))); ctx.setLineDash([]); }
      const tk = win(p, 0.28, 0.12);
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
      for (let i = 0; i <= Math.max(o.n, o.m); i++) {
        if (i > o.n && p < 0.4) break;
        const x = vadd(A, vmul(part, i));
        if (tk > 0) line(ctx, [x[0], x[1] - 16 * tk], [x[0], x[1] + 16 * tk]);
      }
      const n = o.m;
      for (let i = 0; i < n; i++) {
        const q = clamp((p - 0.42) / 0.58 * n - i);
        if (q <= 0) break;
        const x0 = vadd(A, vmul(part, i)), x1 = vadd(A, vmul(part, i + ease.out(q)));
        ctx.strokeStyle = PAL.coral; ctx.lineWidth = 16; ctx.globalAlpha = a * 0.9;
        line(ctx, [x0[0] + 5, x0[1] - 26], [x1[0] - 5, x1[1] - 26]);
        ctx.globalAlpha = a;
        if (q >= 1) haloText(ctx, String(i + 1), (x0[0] + x1[0]) / 2, x0[1] - 54, 26, PAL.coral, a);
      }
      ctx.restore();
      haloText(ctx, `${o.n} equal parts`, (A[0] + B[0]) / 2, A[1] + 36, 24, PAL.teal, a * win(p, 0.3, 0.2));
    }

    // ---- tools for a layer ----------------------------------------------------------------------
    function compassPose(V, o, p) {
      if (o.k === 'steps') {
        const i = Math.min(o.n - 1, Math.floor(p * o.n)), q = clamp(p * o.n - i);
        const n = V.p(stepPt(o, i)), ang = lerp(o.deg - 11, o.deg + 11, ease.inOut(q));
        return { n, q: V.p(vadd(stepPt(o, i), vmul(dir(ang), o.u))), side: o.cside || 1 };
      }
      const e = lerp(o.a0, o.a1, ease.inOut(p));
      const mid = (o.a0 + o.a1) / 2, sm = sdir(mid);
      const side = o.cside || (sm[0] >= 0 ? 1 : -1); // hinge above the chord
      return { n: V.p(o.c), q: V.p(vadd(o.c, vmul(dir(e), o.r))), side };
    }
    const CEN = (V) => V.p([(V.bb[0] + V.bb[2]) / 2, (V.bb[1] + V.bb[3]) / 2]);
    function outside(V, A, B) { // which side of A→B faces away from the middle of the drawing
      const u = vunit(vsub(B, A)), n = [u[1], -u[0]], m = vlerp(A, B, 0.5), c = CEN(V);
      return (m[0] - c[0]) * n[0] + (m[1] - c[1]) * n[1] >= 0 ? 1 : -1;
    }
    function rulerPose(V, o, p) {
      const A = V.p(o.a), B = V.p(o.b), side = o.rside || outside(V, A, B);
      if (o.k === 'meas') return { a: A, b: B, tip: null, side };
      return { a: A, b: B, tip: vlerp(A, B, ease.inOut(p)), side };
    }
    function squarePose(V, o, p) {
      if (o.k === 'perp') {
        const v = V.p(o.v), L = Math.max(170, o.len * V.s * 0.75);
        const e1 = vadd(v, vmul(sdir(o.deg), L)), fwd = sdir(o.refDeg);
        const q = ease.inOut(win(p, 0.32, 0.68));
        return { e0: v, e1, fwd: vmul(fwd, -1), tip: q > 0 && q < 1 ? V.p(vadd(o.v, vmul(dir(o.deg), o.len * q))) : null };
      }
      const g = parGeom(o);
      const k = ease.inOut(win(p, 0.26, 0.34));
      const c = vlerp(g.mid0, g.mid, k);
      const halfCm = Math.max(1.6, vdist(o.a, o.b) / 2 + 0.3);
      const e0 = V.p(vsub(c, vmul(g.u, halfCm))), e1 = V.p(vadd(c, vmul(g.u, halfCm)));
      const q = ease.inOut(win(p, 0.62, 0.38));
      return { e0, e1, fwd: [g.nrm[0], -g.nrm[1]], tip: q > 0 && q < 1 ? V.p(vlerp(o.a, o.b, q)) : null };
    }
    const POSE = { compass: compassPose, ruler: rulerPose, square: squarePose };
    function lerpPose(tool, A, B, k) {
      if (tool === 'compass') return { n: vlerp(A.n, B.n, k), q: vlerp(A.q, B.q, k), side: k < 0.5 ? A.side : B.side };
      if (tool === 'ruler') return { a: vlerp(A.a, B.a, k), b: vlerp(A.b, B.b, k), tip: null, side: k < 0.5 ? A.side : B.side };
      if (tool === 'square') return { e0: vlerp(A.e0, B.e0, k), e1: vlerp(A.e1, B.e1, k), fwd: k < 0.5 ? A.fwd : B.fwd, tip: null };
      return A;
    }
    function toolState(track, t) {
      let i = -1;
      for (let k = 0; k < track.length; k++) if (track[k].t0 <= t) i = k;
      const cur = i >= 0 ? track[i] : null, nxt = track[i + 1] || null;
      if (cur && t <= cur.t1 + (cur.k === 'meas' ? 2.4 : 0)) return { o: cur, p: prog(cur, t), a: cur.k === 'meas' ? 1 - win(t, cur.t1 + 2.1, 0.3) : 1 };
      if (cur && nxt && nxt.t0 - cur.t1 < 0.75 && nxt.line === cur.line) return { lerp: [cur, nxt], k: ease.inOut((t - cur.t1) / (nxt.t0 - cur.t1)), a: 1 };
      const aOut = cur ? 1 - win(t, cur.t1 + 0.05, 0.28) : 0;
      const aIn = nxt ? win(t, nxt.t0 - 0.25, 0.25) : 0;
      if (aIn > 0 && aIn >= aOut) return { o: nxt, p: 0, a: aIn };
      if (aOut > 0) return { o: cur, p: 1, a: aOut };
      return null;
    }
    function drawTools(ctx, t, layer, V, alpha) {
      for (const [key, track] of Object.entries(TRACKS)) {
        const [lay, tool] = key.split(':');
        if (lay !== layer) continue;
        const st = toolState(track, t);
        if (!st) continue;
        const a = st.a * alpha;
        let pose;
        if (st.lerp) {
          const [A, B] = st.lerp;
          pose = lerpPose(tool, POSE[tool](V, A, 1), POSE[tool](V, B, 0), st.k);
        } else pose = POSE[tool](V, st.o, st.p);
        if (tool === 'compass') drawCompass(ctx, pose.n, pose.q, a, pose.side);
        else if (tool === 'ruler') {
          drawRuler(ctx, pose.a, pose.b, a * 0.95, V.s, pose.side);
          if (pose.tip) drawPencil(ctx, pose.tip, a);
        } else if (tool === 'square') {
          drawSquare(ctx, pose.e0, pose.e1, pose.fwd, a * 0.95);
          if (pose.tip) drawPencil(ctx, pose.tip, a);
        }
      }
    }

    // ---- one layer: fills → lines → marks → points → labels → tools -----------------------------
    const LINES = { seg, arc: arcOp, steps, par, perp, bar, dim: dimOp, meas: measOp, prot: protOp };
    const MARKS = { ang: angMark, rt: rtMark, pm: pmark };
    function drawLayer(ctx, t, layer, alpha, cur) {
      const V = VIEW[layer];
      const g = glowFor(t, cur);
      const ansK = ease.inOut(win(t, beat.answer.start, 0.6));
      const list = LAYER[layer].filter((o) => t >= o.t0 - 0.001);
      const aOf = (o) => {
        let a = alpha * lifeA(o, t);
        if ((o.st === 'con' || o.st === 'guide' || o.st === 'help') && layer === 'main' && o.beat.type !== 'answer') a *= 1 - 0.5 * ansK;
        return a;
      };
      const gOf = (o) => (g.ids.has(o.id) ? g.k : 0);
      for (const o of list) if (o.k === 'fill') fill(ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) if (LINES[o.k]) LINES[o.k](ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) if (MARKS[o.k]) MARKS[o.k](ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) if (o.k === 'ghost') ghost(ctx, V, o, t, aOf(o));
      for (const o of list) if (o.k === 'pt') ptDot(ctx, V, o, t, aOf(o), gOf(o));
      for (const o of list) {
        const a = aOf(o);
        if (o.k === 'pt') ptLabel(ctx, V, o, t, a);
        else if (o.k === 'steps') stepLabels(ctx, V, o, t, a);
        else if (o.k === 'len') lenLabel(ctx, V, o, t, a);
        else if (o.k === 'ang') angLabel(ctx, V, o, t, a);
        else if (o.k === 'dim') dimLabel(ctx, V, o, t, a);
      }
      ctx.save(); ctx.beginPath(); ctx.rect(0, 244, W, 1040); ctx.clip();
      drawTools(ctx, t, layer, V, alpha);
      ctx.restore();
      for (const o of list) {
        if (o.k === 'meas') measLabel(ctx, V, o, t, aOf(o));
        else if (o.k === 'prot') protLabel(ctx, V, o, t, aOf(o));
      }
    }

    // ---- stage ------------------------------------------------------------------------------------
    function grid(ctx, V, a) {
      if (a <= 0) return;
      ctx.save(); ctx.beginPath(); rrect(ctx, STAGE.x, STAGE.y, STAGE.w, STAGE.h, STAGE.r); ctx.clip();
      ctx.strokeStyle = rgba(PAL.teal, 0.13 * a); ctx.lineWidth = 1.5;
      const x0 = V.ox - Math.ceil((V.ox - STAGE.x) / V.s) * V.s, y0 = V.oy - Math.ceil((V.oy - STAGE.y) / V.s) * V.s;
      ctx.beginPath();
      for (let x = x0; x <= STAGE.x + STAGE.w; x += V.s) { ctx.moveTo(x, STAGE.y); ctx.lineTo(x, STAGE.y + STAGE.h); }
      for (let y = y0; y <= STAGE.y + STAGE.h; y += V.s) { ctx.moveTo(STAGE.x, y); ctx.lineTo(STAGE.x + STAGE.w, y); }
      ctx.stroke(); ctx.restore();
    }
    function scaleChip(ctx, V, k, idea) {
      if (k <= 0) return;
      ctx.font = font(28, 700);
      if (idea) {
        const s = 'Idea picture', w = ctx.measureText(s).width + 40;
        ctx.save(); ctx.translate(STAGE.x + STAGE.w - 24 - w, STAGE.y + STAGE.h); ctx.scale(k, k);
        pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3); text(ctx, s, 20, 1, 28, PAL.ink, { weight: 700 });
        ctx.restore();
        return;
      }
      const s = `Scale: 1 cm = ${V.s} px`, tw = ctx.measureText(s).width, len = V.s, w = tw + len + 60;
      ctx.save(); ctx.translate(STAGE.x + STAGE.w - 24 - w, STAGE.y + STAGE.h); ctx.scale(k, k);
      pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3);
      text(ctx, s, 20, 1, 28, PAL.ink, { weight: 700 });
      const rx = 36 + tw;
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(rx, 6); ctx.lineTo(rx + len, 6); ctx.moveTo(rx, -2); ctx.lineTo(rx, 10); ctx.moveTo(rx + len, -2); ctx.lineTo(rx + len, 10); ctx.stroke();
      text(ctx, '1 cm', rx + len / 2, -8, 16, PAL.ink, { align: 'center', weight: 700 });
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
      const idea = !!(P.knowView && P.knowView.idea);
      grid(ctx, VIEW.main, mA * draw);
      if (!idea) grid(ctx, VIEW.know, kA * draw);
      if (mA > 0.01) drawLayer(ctx, t, 'main', mA, cur);
      if (kA > 0.01) drawLayer(ctx, t, 'know', kA, cur);
      const ck = ease.back(win(t, sc.lines[0].start, 0.45));
      if (ck > 0) {
        if (mA > 0.01) { ctx.save(); ctx.globalAlpha *= mA; scaleChip(ctx, VIEW.main, ck, false); ctx.restore(); }
        if (kA > 0.01) { ctx.save(); ctx.globalAlpha *= kA; scaleChip(ctx, VIEW.know, ck, idea); ctx.restore(); }
      }
      ctx.restore();
    }

    // ---- scene card --------------------------------------------------------------------------------
    function boardScene(ctx, t, b) {
      C.boardFrame(ctx, b, t, P.sceneTitle || 'THE DRAWING', PAL.teal);
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
      if (kind === 'ruler' || kind === 'scale') {
        ctx.beginPath(); rrect(ctx, x - 27, y - 11, 54, 22, 5); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 27 + i * 9, y - 11); ctx.lineTo(x - 27 + i * 9, y - (i % 2 ? 3 : 0)); ctx.stroke(); }
        if (kind === 'scale') { ctx.fillStyle = PAL.ink; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.fillText('cm', x, y + 5); }
      } else if (kind === 'compass') {
        ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x - 13, y + 16); ctx.moveTo(x, y - 16); ctx.lineTo(x + 13, y + 16); ctx.stroke();
        ctx.strokeStyle = PAL.sun; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 12, y + 13); ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y - 16, 5, 0, TAU); ctx.fillStyle = PAL.plum; ctx.fill();
      } else if (kind === 'tri') {
        poly(ctx, [[x - 22, y + 15], [x + 22, y + 15], [x - 4, y - 17]]); ctx.fillStyle = rgba(PAL.teal, 0.35); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.teal; ctx.stroke();
      } else if (kind === 'ghost') {
        ctx.setLineDash([5, 5]); poly(ctx, [[x - 22, y + 15], [x + 22, y + 15], [x + 4, y - 15]]); ctx.lineWidth = 3; ctx.strokeStyle = PAL.plum; ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(x + 4, y - 15, 6, 0, TAU); ctx.fillStyle = PAL.plum; ctx.fill();
      }
      ctx.restore();
    }

    // ---- hook art: the triangle itself ------------------------------------------------------------
    function fitIn(pts, R, padX, padTop, padBot) {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const s = Math.min((R.w - 2 * padX) / (x1 - x0), (R.h - padTop - padBot) / (y1 - y0));
      const ox = R.x + R.w / 2 - ((x0 + x1) / 2) * s, oy = R.y + padTop + (R.h - padTop - padBot) / 2 + ((y0 + y1) / 2) * s;
      return { s, ox, oy, p: (q) => [ox + q[0] * s, oy - q[1] * s] };
    }
    function sheet(ctx, R, t) {
      ctx.save(); ctx.translate(R.x + R.w / 2, R.y + R.h / 2); ctx.rotate(-0.018);
      ctx.beginPath(); rrect(ctx, -R.w / 2 + 6, -R.h / 2 + 14, R.w - 12, R.h - 16, 26); ctx.fillStyle = rgba(PAL.ink, 0.14); ctx.fill();
      ctx.beginPath(); rrect(ctx, -R.w / 2 + 6, -R.h / 2 + 2, R.w - 12, R.h - 16, 26); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.clip();
      ctx.strokeStyle = rgba(PAL.teal, 0.16); ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = -R.w / 2; x < R.w / 2; x += 44) { ctx.moveTo(x, -R.h / 2); ctx.lineTo(x, R.h / 2); }
      for (let y = -R.h / 2; y < R.h / 2; y += 44) { ctx.moveTo(-R.w / 2, y); ctx.lineTo(R.w / 2, y); }
      ctx.stroke(); ctx.restore();
    }
    function artScale(ctx, t, R) {
      const g = P.geo, A = P.hook.art || {};
      const V = fitIn([g.A, g.B, g.C, g.A2, g.C2], R, 150, 90, 70);
      sheet(ctx, R, t);
      const tri = (pts, col, lw, fa) => {
        poly(ctx, pts.map(V.p)); ctx.fillStyle = rgba(col, fa); ctx.fill();
        ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.stroke();
      };
      tri([g.A, g.B, g.C], PAL.teal, 9, 0.14);
      // the copy breathes between the old size and the new one
      const cyc = (t % 3.0) / 3.0;
      const e = cyc < 0.45 ? ease.inOut(cyc / 0.45) : cyc < 0.8 ? 1 : 1 - ease.inOut((cyc - 0.8) / 0.2);
      const kk = lerp(1, g.k, e);
      const A2 = vlerp(g.B, g.A, kk), C2 = vlerp(g.B, g.C, kk);
      ctx.save(); ctx.setLineDash(g.k > 1 ? [18, 10] : []);
      tri([A2, g.B, C2], PAL.coral, 8, 0.26); ctx.restore();
      const lb = (s, p, off) => { const q = V.p(p); haloText(ctx, s, q[0] + off[0], q[1] + off[1], 40, PAL.ink); };
      lb('A', g.A, [0, -38]); lb('B', g.B, [-34, 28]); lb('C', g.C, [30, 28]);
      // measures of the first triangle
      const L = A.labels || [];
      const mid = (p, q) => V.p(vlerp(p, q, 0.5));
      if (L[0]) { const m = mid(g.B, g.C); tag(ctx, L[0], m[0], m[1] + 40, PAL.teal, PAL.paper, 1, 32); }
      if (L[1]) { const m = mid(g.B, g.A); tag(ctx, L[1], m[0] - 56, m[1] - 8, PAL.teal, PAL.paper, 1, 32); }
      if (L[2] && /°/.test(L[2])) { const b = V.p(g.B); tag(ctx, L[2], b[0] + 96, b[1] - 36, PAL.sun, PAL.ink, 1, 30); }
      else if (L[2]) { const m = mid(g.A, g.C); tag(ctx, L[2], m[0] + 56, m[1] - 8, PAL.teal, PAL.paper, 1, 32); }
      if (A.topAngle) { const a = V.p(g.A); tag(ctx, A.topAngle, a[0] - 78, a[1] - 18, PAL.sun, PAL.ink, 1, 30); }
      if (A.right) { const b = V.p(g.B); ctx.save(); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4; ctx.strokeRect(b[0], b[1] - 30, 30, 30); ctx.restore(); }
      if (A.alt) { const a = V.p(g.A), m = V.p([g.A[0], 0]); ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3; line(ctx, a, m); ctx.restore(); tag(ctx, A.alt, m[0] + 50, (a[1] + m[1]) / 2, PAL.teal, PAL.paper, 1, 30); }
      // the scale factor badge
      const fr = `× ((${g.m}/${g.n}))`;
      const pk = 1 + 0.06 * Math.sin(t * 5);
      ctx.save(); ctx.translate(R.x + R.w - 130, R.y + 92); ctx.scale(pk, pk); ctx.rotate(0.06);
      tag(ctx, fr, 0, 0, PAL.coral, PAL.paper, 1, 60);
      ctx.restore();
      // a compass swinging an arc from B
      const r = vdist(V.p(g.B), V.p(g.C2)) * 0.98, sw = Math.sin(t * 1.6) * 16;
      const n = V.p(g.B), q = vadd(n, vmul(sdir(8 + sw), r));
      ctx.save(); ctx.strokeStyle = rgba(PAL.ink, 0.5); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n[0], n[1], r, -(8 - 16) * RAD, -(8 + 16) * RAD, true); ctx.stroke(); ctx.restore();
      drawCompass(ctx, n, q, 1, 1);
    }
    function artLocus(ctx, t, R) {
      const g = P.geo;
      const kind = P.kind, [nb, nc, v] = g.names;
      const extra = kind === 'alt' ? [[g.A2[0] - 0.4, g.h], [g.A[0] + 0.4, g.h]] : [[g.M[0] - g.md, 0], [g.M[0] + g.md, 0], [g.M[0], g.md]];
      const V = fitIn([g.B, g.C, g.A, g.A2, ...extra], R, 110, 120, 80);
      sheet(ctx, R, t);
      const o = kind === 'alt'
        ? { path: { k: 'line', a: [g.A2[0] - 0.4, g.h], b: [g.A[0] + 0.4, g.h] }, base: [g.B, g.C], vname: v, theta: g.theta, showPath: true, t0: -1, w: 1.1, ph: 0.6 }
        : { path: { k: 'circle', c: g.M, r: g.md, a0: 12, a1: 168 }, base: [g.B, g.C], vname: v, theta: g.theta, showPath: true, spoke: g.M, t0: -1, w: 1.0, ph: 0.9 };
      // base
      const b = V.p(g.B), c = V.p(g.C);
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = PAL.teal; ctx.lineWidth = 10; line(ctx, b, c); ctx.restore();
      haloText(ctx, nb, b[0] - 30, b[1] + 30, 40, PAL.ink); haloText(ctx, nc, c[0] + 30, c[1] + 30, 40, PAL.ink);
      tag(ctx, `${g.a} cm`, kind === 'alt' ? (b[0] + c[0]) / 2 : b[0] + (c[0] - b[0]) * 0.76, b[1] + 44, PAL.teal, PAL.paper, 1, 30);
      if (kind === 'alt') {
        const m = V.p([g.a / 2, 0]), h = V.p([g.a / 2, g.h]);
        ctx.save(); ctx.strokeStyle = PAL.coral; ctx.fillStyle = PAL.coral; ctx.lineWidth = 4; line(ctx, m, h);
        arrowHead(ctx, h, -Math.PI / 2, PAL.coral); arrowHead(ctx, m, Math.PI / 2, PAL.coral); ctx.restore();
        tag(ctx, `${g.h} cm`, m[0] + 62, (m[1] + h[1]) / 2, PAL.coral, PAL.paper, 1, 28);
      } else {
        const m = V.p(g.M); ctx.beginPath(); ctx.arc(m[0], m[1], 8, 0, TAU); ctx.fillStyle = PAL.ink; ctx.fill();
        haloText(ctx, 'M', m[0], m[1] + 32, 32, PAL.ink);
      }
      ghost(ctx, V, o, t + 1, 1);
      // big question mark
      const bob = Math.sin(t * 3) * 8;
      ctx.save(); ctx.translate(R.x + R.w - 120, R.y + 110 + bob); ctx.rotate(0.12);
      ctx.beginPath(); ctx.arc(0, 0, 58, 0, TAU); ctx.fillStyle = PAL.plum; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, '?', 0, 4, 80, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function art(ctx, t, R) {
      if (P.type === 'scaled') artScale(ctx, t, R);
      else artLocus(ctx, t, R);
    }

    const draw = C.compose({ art, stage: drawStage, scene: boardScene });
    return { W, H, FPS, duration: D, draw, beats, P, TL };
  }

  root.VideoEngine = { createVideo, bboxOf, CONTENT, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
