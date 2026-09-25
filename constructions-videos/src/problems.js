/* Maths by Zosiama · Constructions explainers
 * Problem data and narration for two sets of textbook construction questions:
 *   Set 1 Q1–Q3, Set 2 Q1–Q4  draw a triangle, then a similar one m/n times as big
 *   Set 2 Q5–Q8               a triangle from its base, the angle at the top and a height
 *                             or a median (the arc of equal angles)
 *
 *  cap    = caption on screen; say = what the offline voice reads. say is made from cap by
 *           sayify() unless given (BC → "B C", A′ → "A dash", B₄ → "B 4", 3/4 → "three
 *           quarters", 6 cm → "6 centimetres"). Never start a sentence with the article "A":
 *           a lone capital A is read as the letter.
 *  m      = maths line on a board card; ((a/b)) is a stacked fraction
 *  draw   = drawing steps ("ops") that play one after another while the line is spoken.
 *           Coordinates are in cm with y up; B (or Q) is at the origin and the base runs
 *           along the x-axis. prep() gives every op its duration and every line a minimum
 *           length (min) so the voice waits for the drawing, plus its drawing sounds (fx).
 *  hl     = op ids that glow while the line plays ('+' joins several)
 *  legend = row(s) on the scene card {icon, s}
 */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------------------
  // geometry (cm, y up)
  // ------------------------------------------------------------------------------
  const RAD = Math.PI / 180;
  const dir = (d) => [Math.cos(d * RAD), Math.sin(d * RAD)];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const polar = (p, d, len) => add(p, mul(dir(d), len));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const heading = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  const r4 = (p) => p.map((v) => Math.round(v * 10000) / 10000);
  const fix = (v, d = 2) => String(Math.round(v * 10 ** d) / 10 ** d);
  function meet(p1, q1, p2, q2) { // lines p1q1 and p2q2
    const d1 = sub(q1, p1), d2 = sub(q2, p2);
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    return add(p1, mul(d1, t));
  }
  function circles(c1, r1, c2, r2) { // [left of c1→c2, right of c1→c2]
    const d = dist(c1, c2), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const u = mul(sub(c2, c1), 1 / d), m = add(c1, mul(u, a)), n = [-u[1], u[0]];
    return [add(m, mul(n, h)), sub(m, mul(n, h))];
  }
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sb = (i) => String(i).split('').map((d) => SUBS[+d]).join('');

  // ------------------------------------------------------------------------------
  // drawing ops
  //   seg a→b · arc (centre c, radius r, from a0° to a1°) · pt p (label name at lp px)
  //   len (length tag on a→b) · ang (angle mark at v from a0° to a1°) · rt (right angle)
  //   steps (n equal compass steps u along a ray) · par (set square slides from ref to
  //   through, then draws a→b) · perp (set square at v, new line at deg) · fill (polygon)
  //   pm (parallel marks) · dim (arrowed size line) · meas (ruler measures a→b)
  //   prot (protractor at v) · ghost (a vertex sliding along a path with its angle)
  //   bar (a length cut into n equal parts, m of them taken)
  //   st: main | help | con | guide · col: teal | coral | plum | ink | sun · tool: ruler | compass
  // ------------------------------------------------------------------------------
  const op = (k, id, o) => Object.assign({ id, k }, o);
  const OP = {
    seg: (id, a, b, o = {}) => op('seg', id, Object.assign({ a: r4(a), b: r4(b), st: 'main', col: 'ink' }, o)),
    arc: (id, c, r, a0, a1, o = {}) => op('arc', id, Object.assign({ c: r4(c), r, a0, a1, st: 'con', col: 'ink', tool: 'compass' }, o)),
    pt: (id, p, name, lp, o = {}) => op('pt', id, Object.assign({ p: r4(p), name, lp }, o)),
    len: (id, a, b, s, o = {}) => op('len', id, Object.assign({ a: r4(a), b: r4(b), s }, o)),
    ang: (id, v, a0, a1, s, o = {}) => op('ang', id, Object.assign({ v: r4(v), a0, a1, s }, o)),
    rt: (id, v, a0, o = {}) => op('rt', id, Object.assign({ v: r4(v), a0 }, o)),
    steps: (id, a, deg, u, n, o = {}) => op('steps', id, Object.assign({ a: r4(a), deg, u, n, prefix: 'B', col: 'plum', tool: 'compass' }, o)),
    par: (id, ref, through, a, b, o = {}) => op('par', id, Object.assign({ ref: ref.map(r4), through: r4(through), a: r4(a), b: r4(b), st: 'help', col: 'plum', tool: 'square' }, o)),
    perp: (id, v, refDeg, deg, len, o = {}) => op('perp', id, Object.assign({ v: r4(v), refDeg, deg, len, st: 'help', col: 'plum', tool: 'square' }, o)),
    fill: (id, pts, o = {}) => op('fill', id, Object.assign({ pts: pts.map(r4), col: 'teal' }, o)),
    pm: (id, a, b, o = {}) => op('pm', id, Object.assign({ a: r4(a), b: r4(b), n: 1, col: 'ink' }, o)),
    dim: (id, a, b, s, o = {}) => op('dim', id, Object.assign({ a: r4(a), b: r4(b), s, col: 'coral' }, o)),
    meas: (id, a, b, s, o = {}) => op('meas', id, Object.assign({ a: r4(a), b: r4(b), s, tool: 'ruler' }, o)),
    prot: (id, v, a0, a1, s, o = {}) => op('prot', id, Object.assign({ v: r4(v), a0, a1, s }, o)),
    ghost: (id, path, base, o = {}) => op('ghost', id, Object.assign({ path, base: base.map(r4), vname: 'A' }, o)),
    bar: (id, a, b, n, m, o = {}) => op('bar', id, Object.assign({ a: r4(a), b: r4(b), n, m }, o)),
  };

  // standard compass constructions → { ops, …points }
  // an angle of 60° (s = +1 anticlockwise, -1 clockwise from the base direction phi0)
  function arcs60(pre, V, phi0, s, r) {
    const P1 = polar(V, phi0, r), Q = polar(V, phi0 + s * 60, r);
    return {
      ops: [
        OP.arc(pre + '1', V, r, phi0 - s * 12, phi0 + s * 78),
        OP.arc(pre + '2', P1, r, phi0 + s * 106, phi0 + s * 134),
      ],
      P1, Q,
    };
  }
  // a right angle: 60° and 120° marks, then bisect between them
  function arcs90(pre, V, phi0, s, r) {
    const P1 = polar(V, phi0, r), Q1 = polar(V, phi0 + s * 60, r), Q2 = polar(V, phi0 + s * 120, r);
    const R = polar(V, phi0 + s * 90, r * Math.sqrt(3));
    const h1 = heading(Q1, R), h2 = heading(Q2, R);
    return {
      ops: [
        OP.arc(pre + '1', V, r, phi0 - s * 12, phi0 + s * 136),
        OP.arc(pre + '2', P1, r, phi0 + s * 108, phi0 + s * 132),
        OP.arc(pre + '3', Q1, r, phi0 + s * 168, phi0 + s * 192),
        OP.arc(pre + '4', Q1, r, h1 - 14, h1 + 14),
        OP.arc(pre + '5', Q2, r, h2 - 14, h2 + 14),
      ],
      P1, Q1, Q2, R,
    };
  }
  // bisect the angle between directions a1° and a2° at V (the arc of radius r is already drawn)
  function arcsBisect(pre, V, a1, a2, r, rho) {
    const U1 = polar(V, a1, r), U2 = polar(V, a2, r);
    const [X1, X2] = circles(U1, rho, U2, rho);
    const S = dist(X1, V) > dist(X2, V) ? X1 : X2;
    const h1 = heading(U1, S), h2 = heading(U2, S);
    return { ops: [OP.arc(pre + '1', U1, rho, h1 - 15, h1 + 15), OP.arc(pre + '2', U2, rho, h2 - 15, h2 + 15)], S };
  }
  // perpendicular bisector of BC: arcs from both ends above and below, then the line
  function arcsPerpBis(pre, B, C, rho, y0, y1) {
    const [T1, T2] = circles(B, rho, C, rho); // T1 above, T2 below
    const b1 = heading(B, T1), b2 = heading(B, T2);
    let c1 = heading(C, T1), c2 = heading(C, T2);
    if (c2 < c1) c2 += 360;
    const x = (B[0] + C[0]) / 2;
    return {
      ops: [
        OP.arc(pre + 'b', B, rho, b2 - 12, b1 + 12),
        OP.arc(pre + 'c', C, rho, c1 - 12, c2 + 12),
        OP.seg(pre + 'line', [x, Math.min(y0, T2[1] - 0.3)], [x, y1], { st: 'con', tool: 'ruler' }),
      ],
      T1, T2, M: [x, 0],
    };
  }

  // ------------------------------------------------------------------------------
  // narration helpers
  // ------------------------------------------------------------------------------
  const FRW = { '3/4': 'three quarters', '2/3': 'two thirds', '7/5': 'seven fifths', '3/2': 'three halves', '4/3': 'four thirds', '5/3': 'five thirds' };
  function spellGroup(g) { // A′BC′ → "A dash B C dash", B₄C → "B 4 C"
    let out = '';
    for (const ch of g) {
      if (ch === '′') out += 'dash ';
      else if (SUBS.includes(ch)) out += SUBS.indexOf(ch) + ' ';
      else out += ch + ' ';
    }
    return out.trim();
  }
  function sayify(s) {
    let x = s.replace(/’/g, "'");
    x = x.replace(/1½/g, 'one and a half');
    x = x.replace(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (m, a, b) => FRW[m] || `${a} over ${b}`);
    x = x.replace(/△\s*/g, 'triangle ').replace(/∠\s*/g, 'angle ').replace(/\s*∥\s*/g, ' parallel to ').replace(/\s*⊥\s*/g, ' perpendicular to ');
    x = x.replace(/\s*≈\s*/g, ' is about ').replace(/\s*×\s*/g, ' times ').replace(/\s*−\s*/g, ' minus ').replace(/\s*\+\s*/g, ' plus ');
    x = x.replace(/\s*=\s*/g, ' is ').replace(/\s*→\s*/g, ', so ').replace(/✓/g, '').replace(/…/g, ', ').replace(/\//g, ' over ');
    x = x.replace(/(\d)\s*°\s+angle/g, '$1 degree angle').replace(/(\d)\s*°/g, '$1 degrees');
    x = x.replace(/(\d+(?:\.\d+)?)\s*cm\b/g, (m, n) => `${n} ${n === '1' ? 'centimetre' : 'centimetres'}`);
    x = x.replace(/(\d+)\s*px\b/g, '$1 pixels');
    x = x.replace(/(?<![A-Za-z])[A-Z][A-Z′₀-₉]*(?![a-z])/g, (g) => (g.length > 1 ? spellGroup(g) : g));
    return x.replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  }

  // ops → durations, a minimum line length and drawing sounds (the engine replays the same schedule)
  const LEAD = 0.15;
  const DUR = {
    seg: (o) => (o.tool === 'ruler' ? Math.min(1.3, 0.55 + 0.1 * dist(o.a, o.b)) : 0.45),
    arc: (o) => Math.min(1.15, 0.34 + Math.abs(o.a1 - o.a0) / 400),
    pt: () => 0.28, len: () => 0.32, ang: () => 0.45, rt: () => 0.3, pm: () => 0.3, fill: () => 0.5,
    steps: (o) => 0.4 * o.n + 0.1, par: () => 2.3, perp: () => 1.5, dim: () => 0.6, meas: () => 1.9,
    prot: () => 2.1, ghost: () => 0.4, bar: (o) => 1.0 + 0.3 * Math.max(o.m, o.n),
  };
  const SOUND = { seg: 'pencil', par: 'pencil', perp: 'pencil', arc: 'compass' };
  function prep(l) {
    if (!l.say) l.say = sayify(l.cap);
    if (!l.draw) return l;
    l.draw = l.draw.filter(Boolean);
    let cur = LEAD, prev = cur, prevTool = null;
    const fx = [];
    for (const o of l.draw) {
      if (o.dur === undefined) o.dur = Math.round(DUR[o.k](o) * 100) / 100;
      if (o.tool && o.tool === prevTool && o.gap === undefined && !o.with) o.gap = 0.16;
      const s0 = o.with ? prev : cur + (o.gap || 0);
      const name = SOUND[o.k] && (o.k !== 'seg' || o.tool === 'ruler') ? SOUND[o.k] : null;
      if (name) fx.push({ dt: Math.round((s0 + (o.k === 'par' ? 1.45 : o.k === 'perp' ? 0.5 : 0)) * 100) / 100, name });
      if (o.k === 'steps') for (let i = 0; i < o.n; i++) fx.push({ dt: Math.round((s0 + 0.4 * i + 0.3) * 100) / 100, name: 'tick' });
      prev = s0; cur = Math.max(cur, s0 + o.dur);
      if (o.tool) prevTool = o.tool;
    }
    l.min = Math.round((cur + 0.25) * 100) / 100;
    if (fx.length) l.fx = fx;
    return l;
  }
  const L = (o) => o; // readability marker for narration lines
  const pause = { cap: 'Pause & try it first! Then stay till the end!', say: 'Pause and try it first. Then stay till the end!' };

  // the base segment with its ends and length
  function base(names, B, C, s, o = {}) {
    return [
      OP.seg('BC', B, C, { col: 'teal', tool: 'ruler' }),
      OP.pt('B', B, names[0], [-26, 30]),
      OP.pt('C', C, names[1], [26, 30]),
      OP.len('lBC', B, C, s, Object.assign({ col: 'teal', side: -1, off: 34 }, o)),
    ];
  }

  // ------------------------------------------------------------------------------
  // builder 1: a triangle ABC, then △A′BC′ with every side m/n as long (NCERT method)
  // ------------------------------------------------------------------------------
  function scaled(c) {
    const { A, B, C, m, n } = c;
    const k = m / n, N = Math.max(m, n), grow = m > n;
    const rd = c.rayDeg || -22, u = c.u;
    const Bi = (i) => polar(B, rd, u * i);
    const A2 = mix(B, A, k), C2 = mix(B, C, k);
    const f = `${m}/${n}`, F = `((${m}/${n}))`;
    const BC = dist(B, C), BC2 = BC * k;
    const bn = `B${sb(n)}`, bm = `B${sb(m)}`, bN = `B${sb(N)}`;
    const list = Array.from({ length: N }, (_, i) => `B${sb(i + 1)}`);
    const listCap = N > 4 ? `B₁ to ${bN}` : list.join(', ');
    const overC = add(C2, mul(sub(C2, Bi(m)), 0.12 / dist(C2, Bi(m)) * 3));  // the parallel runs a little past C′
    const overA = add(A2, mul(sub(A2, C2), 0.3 / dist(A2, C2)));
    const L1 = c.labels || {};

    const solve = [
      L({ m: 'ray BX below BC', cap: 'Draw a ray BX below BC, at a small angle.', draw: [
        OP.seg('BX', B, polar(B, rd, u * N + 0.9), { st: 'help', col: 'plum', tool: 'ruler' }),
        OP.pt('X', polar(B, rd, u * N + 0.9), 'X', [18, 24], { dot: false, col: 'plum' }),
      ] }),
      L({ m: `${N} equal steps: ${N > 5 ? `B₁ … ${bN}` : list.join(', ')}`, cap: `Mark ${N} equal steps with the compass: ${listCap}. Why ${N}? It’s the bigger number in ${f}.`, draw: [
        OP.steps('steps', B, rd, u, N, { lside: c.stepSide || 1, only: N >= 5 ? [1, n, m] : undefined }),
      ], hl: 'BX' }),
      L({ m: `join ${bn}C`, cap: `Join ${bn} to C.`, draw: [OP.seg('BnC', Bi(n), C, { st: 'help', col: 'plum', tool: 'ruler' })] }),
      L({ m: `through ${bm}: a line ∥ ${bn}C → C′`, cap: grow ? `Extend BC. Through ${bm}, slide the set square parallel to ${bn}C. It meets BC at C′.` : `Through ${bm}, slide the set square parallel to ${bn}C. It meets BC at C′.`, draw: [
        grow ? OP.seg('BCx', C, add(C2, [0.7, 0]), { st: 'guide', col: 'teal', tool: 'ruler' }) : null,
        OP.par('BmC2', [Bi(n), C], Bi(m), Bi(m), overC),
        OP.pt('C2', C2, 'C′', L1.C2 || [18, 32]),
        OP.pm('pm1', Bi(n), C, { col: 'plum', with: true }),
        OP.pm('pm2', Bi(m), C2, { col: 'plum', with: true }),
      ] }),
      L({ m: `((BC′/BC)) = ((B${bm}/B${bn})) = ${F}`, cap: `Parallel lines copy the steps: BC′/BC = B${bm}/B${bn} = ${f}.`, say: `Parallel lines copy the steps. So B C dash over B C is the same as B B ${m} over B B ${n}: ${FRW[f]}!`, page: 1, draw: [
        OP.seg('BC2', B, C2, { col: 'coral' }),
      ], hl: 'BC2+steps' }),
      L({ m: `BC′ = ${F} × ${fix(BC)} = ${fix(BC2)} cm`, cap: `So BC′ = ${f} × ${fix(BC)} = ${fix(BC2)} cm.`, say: `So B C dash is ${FRW[f]} of ${fix(BC)}, which is ${fix(BC2)} centimetres.`, page: 1, draw: [
        OP.len('lBC2', B, C2, `${fix(BC2)} cm`, Object.assign({ col: 'coral', side: 1, off: 30, dx: 30 }, L1.lBC2 || {})),
      ], hl: 'BC2' }),
      L({ m: 'through C′: a line ∥ CA → A′', cap: grow ? 'Extend BA. Through C′, draw a line parallel to CA. It meets BA at A′.' : 'Through C′, draw a line parallel to CA. It meets BA at A′.', page: 1, draw: [
        grow ? OP.seg('BAx', A, add(A2, mul(sub(A2, B), 0.6 / dist(A2, B))), { st: 'guide', col: 'teal', tool: 'ruler' }) : null,
        OP.par('C2A2', [C, A], C2, C2, overA, { st: 'main', col: 'coral' }),
        OP.pt('A2', A2, 'A′', L1.A2 || [-30, -14]),
        OP.pm('pm3', C, A, { col: 'teal', n: 2, with: true }),
        OP.pm('pm4', C2, A2, { col: 'coral', n: 2, with: true }),
      ] }),
      L({ m: '△A′BC′ is the answer ✓', cap: 'Triangle A′BC′ is the one we want!', page: 1, solve: true, draw: [
        OP.seg('BA2', B, A2, { col: 'coral' }),
        OP.fill('newtri', [A2, B, C2], { col: 'coral', alpha: 0.24 }),
      ], hl: 'newtri' }),
    ];

    // Know first: an idea picture (not to scale): a length in parts, a ladder of parallels, two triangles
    const pl = 6.2 / N, ps = 4.4 / N, pu = 5.0 / N;
    const V0 = [0, 0.9], dl = -17, du = 13;
    const lo = (i) => polar(V0, dl, ps * i), up = (i) => polar(V0, du, pu * i);
    const base0 = 3.9 / Math.max(1, k), T0 = [6.7, -0.6];
    const tA = add(T0, [0.36 * base0, 0.78 * base0]), tC = add(T0, [base0, 0]);
    const tA2 = mix(T0, tA, k), tC2 = mix(T0, tC, k);
    const rungs = [];
    for (let i = 1; i <= N; i++) {
      rungs.push(OP.seg('r' + i, lo(i), up(i), { st: i === n ? 'help' : 'guide', col: i === m ? 'coral' : 'plum', dur: 0.26 }));
      rungs.push(OP.pt('u' + i, up(i), '', null, { col: 'teal', with: true }));
    }
    const know = [
      L({ m: `${F} = ${m} of ${n} equal parts`, cap: grow ? `Know this first! ${f} means: cut into ${n} equal parts, then line up ${m} of them.` : `Know this first! ${f} means: cut into ${n} equal parts, and keep ${m}.`, page: 0, sfx: 'pop', draw: [
        OP.bar('bar', [0, 4.3], [pl * n, 4.3], n, m),
      ] }),
      L({ m: 'parallel lines copy equal steps', cap: 'Lines that are parallel copy equal steps onto another line.', page: 0, draw: [
        OP.seg('kLo', V0, polar(V0, dl, ps * N + 0.5), { st: 'help', col: 'plum', dur: 0.4 }),
        OP.seg('kUp', V0, polar(V0, du, pu * N + 0.5), { st: 'main', col: 'teal', dur: 0.4, with: true }),
        OP.steps('kSteps', V0, dl, ps, N, { prefix: '', lside: 1, tool: 'compass', dur: 0.22 * N + 0.1 }),
        ...rungs,
      ] }),
      L({ m: 'sides ∥ → same angles → same shape', cap: 'Parallel sides make the same angles. Same angles, same shape!', page: 0, draw: [
        OP.seg('kt1', T0, tC, { col: 'teal', dur: 0.3 }), OP.seg('kt2', tC, tA, { col: 'teal', dur: 0.3 }), OP.seg('kt3', tA, T0, { col: 'teal', dur: 0.3 }),
        OP.fill('ktf', [T0, tC, tA], { col: 'teal', alpha: 0.14 }),
        OP.seg('ks1', T0, tC2, { col: 'coral', dur: 0.3 }), OP.seg('ks2', tC2, tA2, { col: 'coral', dur: 0.3 }), OP.seg('ks3', tA2, T0, { col: 'coral', dur: 0.3 }),
        OP.fill('ksf', [T0, tC2, tA2], { col: 'coral', alpha: 0.22 }),
        OP.ang('kan1', tC, 180, heading(tC, tA), '', { r: 30, col: 'teal' }),
        OP.ang('kan2', tC2, 180, heading(tC2, tA2), '', { r: 30, col: 'coral', with: true }),
        OP.pm('kpm1', tC, tA, { col: 'teal', with: true }), OP.pm('kpm2', tC2, tA2, { col: 'coral', with: true }),
      ] }),
      L({ m: `new side = ${F} × old side`, cap: `So every side becomes ${f} as long. That’s our magic rule!`, rule: true, page: 1, sfx: 'ding', hl: 'ksf' }),
    ];

    const P = {
      type: 'scaled', id: c.id, set: c.set, num: c.num, slug: c.slug, title: c.title, question: c.question,
      chapter: `CONSTRUCTIONS · SET ${c.set} Q${c.num}`, label: `SET ${c.set} · QUESTION ${c.num}`,
      geo: { A: r4(A), B: r4(B), C: r4(C), A2: r4(A2), C2: r4(C2), k, m, n },
      view: c.view, knowView: { s: 68, idea: true }, sceneTitle: 'STEP 1: △ABC',
      tokens: {},
      hook: c.hook, qLines: c.qLines, sceneLines: c.scene, given: c.given, find: c.find,
      know, steps: solve, answer: c.answer, check: c.check,
    };
    return P;
  }

  // ------------------------------------------------------------------------------
  // builder 2: base, angle at the top, and a height (alt) or a median (med)
  // ------------------------------------------------------------------------------
  function locus(c) {
    const [nb, nc] = c.base, v = c.v;              // e.g. ['B','C'], 'A'
    const a = c.a, th = c.theta;
    const B = [0, 0], C = [a, 0], M = [a / 2, 0];
    const R = a / (2 * Math.sin(th * RAD)), O = [a / 2, (a / 2) / Math.tan(th * RAD)];
    let A, A2;
    if (c.kind === 'alt') {
      const dx = Math.sqrt(R * R - (c.h - O[1]) ** 2);
      A = [a / 2 + dx, c.h]; A2 = [a / 2 - dx, c.h];
    } else {
      const [X1, X2] = circles(M, c.md, O, R);
      A = X1[0] > X2[0] ? X1 : X2; A2 = X1[0] > X2[0] ? X2 : X1;
    }
    const BC = `${nb}${nc}`, VB = `${v}${nb}`, VC = `${v}${nc}`, tri = `△${v}${nb}${nc}`, tri2 = `△${v}′${nb}${nc}`;
    const hN = c.hName || 'P';
    const H = c.kind === 'alt' ? [a / 2, c.h] : null;
    const tanLen = 2.1, aB = heading(O, B), aC = heading(O, C);
    const arcA0 = aC - 10, arcA1 = aB + 10 + (aB < aC ? 360 : 0);
    const sc = c.view.s;
    const val = c.kind === 'alt' ? c.h : c.md;

    // the angle θ below BC at B (the tangent BX)
    let firstOps = null, cutOps;
    const rr = c.angR || 1.0;
    if (th === 45) {
      const g = arcs90('t', B, 0, -1, rr), h = arcsBisect('tb', B, 0, -90, rr, rr * 0.85);
      firstOps = [...g.ops, OP.seg('t90', B, [0, -(rr * Math.sqrt(3) + 0.25)], { st: 'con', tool: 'ruler' })]; cutOps = h.ops;
    } else if (th === 30) {
      const g = arcs60('t', B, 0, -1, rr), h = arcsBisect('tb', B, 0, -60, rr, rr * 0.8);
      firstOps = g.ops; cutOps = h.ops;
    } else {
      cutOps = arcs60('t', B, 0, -1, rr).ops;
    }
    const X = polar(B, -th, tanLen);
    const bisTop = Math.max(O[1], c.kind === 'alt' ? c.h : 0) + 0.8;
    const pb = arcsPerpBis('pb', B, C, a * 0.5 + 0.6, -1.4, bisTop);
    const Yend = polar(B, 90 - th, dist(B, O) + 1.0);

    const vLab = c.vLab || [18, -26], v2Lab = c.v2Lab || [-20, -26];
    const scene = [
      L({ cap: `Drawn to scale: 1 cm = ${sc} px. First, draw the base ${BC}, ${a} cm long.`, legend: [{ icon: 'scale', s: `Scale: 1 cm = ${sc} px` }, { icon: 'ruler', s: `base ${BC} = ${a} cm` }], draw: base([nb, nc], B, C, `${a} cm`, { side: 1, off: 30, dx: Math.round(a * 0.25 * sc) }), sfx: 'whoosh' }),
      c.kind === 'alt'
        ? L({ cap: `Where is ${v}? It must be ${c.h} cm above ${BC}: that’s its height.`, legend: { icon: 'ghost', s: `${v} is ${c.h} cm above ${BC}` }, draw: [
          OP.ghost('ghost', { k: 'line', a: [A2[0] - 0.5, c.h], b: [A[0] + 0.4, c.h] }, [B, C], { vname: v, theta: th, life: 'beat', showPath: true, w: 0.9, ph: -0.4 }),
        ] })
        : L({ cap: `Where is ${v}? The median goes to M, the middle of ${BC}. So ${v} is ${c.md} cm from M.`, legend: { icon: 'ghost', s: `${v} is ${c.md} cm from M` }, draw: [
          OP.pt('Mg', M, 'M', [0, 30], { life: 'beat' }),
          OP.ghost('ghost', { k: 'circle', c: M, r: c.md, a0: heading(M, A) - 8, a1: heading(M, A2) + 8 }, [B, C], { vname: v, theta: th, life: 'beat', showPath: true, spoke: M, w: 0.8, ph: -0.2 }),
        ] }),
      L({ cap: `As ${v} moves, the angle at ${v} changes. We need exactly ${th}°!`, legend: { icon: 'compass', s: `need ∠${v} = ${th}°` } }),
    ];

    const given = [
      L({ m: `${BC} = ${a} cm`, cap: `The base ${BC} is ${a} cm.`, hl: 'BC' }),
      L({ m: `∠${v} = ${th}°`, cap: `The angle at ${v} is ${th}°.` }),
      c.kind === 'alt'
        ? L({ m: `height of ${v} above ${BC} = ${c.h} cm`, cap: `The height of ${v} above ${BC} is ${c.h} cm.` })
        : L({ m: `median ${v}M = ${c.md} cm`, cap: `The median ${v}M is ${c.md} cm.` }),
    ];
    const find = c.kind === 'alt'
      ? L({ m: `where ${v} is → ${tri}`, cap: `Find: the corner ${v}, and draw triangle ${v}${nb}${nc}.` })
      : L({ m: `${tri}, and how many?`, cap: `Find: triangle ${v}${nb}${nc}, and how many there are.` });

    // Know first — drawn to scale on the same base
    const orbit = { k: 'circle', c: O, r: R, a0: aC + 14, a1: aB - 14 + (aB < aC ? 360 : 0) };
    const know = [
      L({ m: 'same arc → same angle', cap: `Know this first! Every point on this arc sees ${BC} at the same angle.`, page: 0, sfx: 'pop', draw: [
        OP.seg('kBC', B, C, { col: 'teal', dur: 0.3 }),
        OP.pt('kB', B, nb, [-26, 30], { with: true }), OP.pt('kC', C, nc, [26, 30], { with: true }),
        OP.arc('kArc', O, R, arcA0, arcA1, { st: 'help', col: 'plum', tool: null, dur: 0.9 }),
        OP.ghost('kOrbit', orbit, [B, C], { vname: v, theta: th, lifeLines: 2, w: 0.7, ph: 0.3 }),
      ] }),
      L({ m: `∠${nc}${nb}X = ∠${v}  (tangent rule)`, cap: `The angle between ${BC} and the tangent at ${nb} is that same angle!`, page: 0, draw: [
        OP.seg('kTan', polar(B, 180 - th, 1.2), X, { st: 'help', col: 'plum', dur: 0.5 }),
        OP.pt('kX', X, 'X', [16, 22], { dot: false, col: 'plum' }),
        OP.ang('kAng', B, 0, -th, `${th}°`, { r: 52, col: 'sun', lr: 34 }),
      ] }),
      L({ m: `O${nb} ⊥ tangent, O on the middle line`, cap: `The radius O${nb} is at right angles to the tangent. And O sits on the middle line of ${BC}.`, page: 0, draw: [
        OP.seg('kOB', B, O, { st: 'help', col: 'plum', dur: 0.45 }),
        OP.rt('kRt', B, -th, { col: 'plum' }),
        OP.seg('kBis', [a / 2, -1.0], [a / 2, O[1] + 1.0], { st: 'guide', col: 'ink', dur: 0.5 }),
        OP.pt('kM', M, 'M', [18, 28]), OP.pt('kO', O, 'O', [22, -8]),
      ] }),
      c.kind === 'alt'
        ? L({ m: `height ${c.h} cm → a line ∥ ${BC}`, cap: `Height ${c.h} cm means ${v} is on a line parallel to ${BC}, ${c.h} cm up.`, page: 1, draw: [
          OP.seg('kLine', [A2[0] - 0.7, c.h], [A[0] + 0.7, c.h], { st: 'guide', col: 'coral', dur: 0.6 }),
          OP.dim('kDim', M, [a / 2, c.h], `${c.h} cm`, { off: c.kDimOff || -34 }),
        ] })
        : L({ m: `${v}M = ${c.md} cm → a circle round M`, cap: `${v} is ${c.md} cm from M, so ${v} is on a circle around M.`, page: 1, draw: [
          OP.arc('kMed', M, c.md, 4, 176, { st: 'guide', col: 'coral', tool: null, dur: 0.8 }),
          OP.dim('kDim', M, polar(M, c.kMedDeg || 125, c.md), `${c.md} cm`, { off: 0, lab: c.kMedLab || [-40, 0] }),
        ] }),
      L({ m: `${v} = where the arc meets the ${c.kind === 'alt' ? 'line' : 'circle'}`, cap: `So ${v} is where the arc meets the ${c.kind === 'alt' ? 'line' : 'circle'}. That’s our magic rule!`, rule: true, page: 1, sfx: 'ding', draw: [
        OP.pt('kA', A, v, vLab, { col: 'coral' }), OP.pt('kA2', A2, `${v}′`, v2Lab, { col: 'coral', with: true }),
      ], hl: 'kA+kA2' }),
    ];

    const steps = [
      firstOps ? L({ m: th === 45 ? `a right angle at ${nb}, below ${BC}` : `60° at ${nb}, below ${BC}`, cap: th === 45 ? `At ${nb}, make a right angle below ${BC} with the compass.` : `At ${nb}, make a 60° angle below ${BC} with the compass.`, draw: firstOps }) : null,
      L({ m: `∠${nc}${nb}X = ${th}° below ${BC}`, cap: firstOps ? `Cut it in half. That’s ${th}°: the ray ${nb}X.` : `At ${nb}, make a 60° angle below ${BC} with the compass: the ray ${nb}X.`, draw: [
        ...cutOps,
        OP.seg('BX', B, X, { st: 'help', col: 'plum', tool: 'ruler' }),
        OP.pt('X', X, 'X', [16, 22], { dot: false, col: 'plum' }),
        OP.ang('angX', B, 0, -th, `${th}°`, { r: 56, col: 'sun', lr: 36 }),
      ] }),
      L({ m: `${nb}Y ⊥ ${nb}X`, cap: `With the set square, draw ${nb}Y at right angles to ${nb}X.`, draw: [
        OP.perp('BY', B, -th, 90 - th, dist(B, O) + 1.0),
        OP.pt('Y', Yend, 'Y', [14, -18], { dot: false, col: 'plum' }),
        OP.rt('rtB', B, -th, { col: 'plum' }),
      ] }),
      L({ m: `⊥ bisector of ${BC} meets ${nb}Y at O`, cap: `Draw the perpendicular bisector of ${BC}. It meets ${nb}Y at O.`, draw: [
        ...pb.ops,
        OP.pt('M', M, 'M', [18, 28]),
        OP.pt('O', O, 'O', c.oLab || [24, -6]),
      ] }),
      L({ m: `centre O, radius O${nb}: the big arc`, cap: c.arcParts ? `Put the compass on O, open it to ${nb}, and draw the big arc on both sides.` : `Put the compass on O, open it to ${nb}, and draw the big arc.`, page: firstOps ? 1 : 0, draw: c.arcParts
        ? c.arcParts.map(([p0, p1], i) => OP.arc(i ? 'bigArc' + i : 'bigArc', O, R, p0, p1, { st: 'help', col: 'plum' }))
        : [OP.arc('bigArc', O, R, arcA0, arcA1, { st: 'help', col: 'plum' })], hl: c.arcParts ? 'bigArc+bigArc1' : 'bigArc' }),
      ...(c.kind === 'alt' ? [
        L({ m: `M${hN} = ${c.h} cm on the bisector`, cap: `On the bisector, mark ${hN} so that M${hN} = ${c.h} cm.`, page: 1, draw: [
          OP.arc('cutH', M, c.h, 78, 102),
          OP.pt('H', H, hN, [26, -18]),
          OP.dim('dimH', M, H, `${c.h} cm`, { off: -30, lab: c.dimLab || [60, 10] }),
        ] }),
        L({ m: `through ${hN}: a line ∥ ${BC} → ${v}, ${v}′`, cap: `Through ${hN}, draw a line parallel to ${BC}. It cuts the arc at ${v} and ${v}′.`, page: 1, draw: [
          OP.par('hLine', [B, C], H, [A2[0] - 0.7, c.h], [A[0] + 0.7, c.h], { col: 'coral' }),
          OP.pt('A', A, v, vLab, { col: 'coral' }),
          OP.pt('A2', A2, `${v}′`, v2Lab, { col: 'coral' }),
        ], hl: 'A+A2' }),
      ] : [
        L({ m: `centre M, radius ${c.md} cm: an arc`, cap: `Put the compass on M, open it to ${c.md} cm, and draw an arc.`, page: 1, draw: [
          OP.arc('medArc', M, c.md, heading(M, A) - 14, heading(M, A2) + 14, { st: 'help', col: 'coral' }),
        ], hl: 'medArc' }),
        L({ m: `it cuts the big arc at ${v} and ${v}′`, cap: `It cuts the big arc at two points: ${v} and ${v}′.`, page: 1, draw: [
          OP.pt('A', A, v, vLab, { col: 'coral' }),
          OP.pt('A2', A2, `${v}′`, v2Lab, { col: 'coral' }),
        ], hl: 'A+A2' }),
      ]),
      L({ m: `join ${VB}, ${VC}: ${tri} ✓`, cap: `Join ${VB} and ${VC}. Triangle ${v}${nb}${nc} is the one we want!`, page: 1, solve: true, draw: [
        OP.seg('AB', A, B, { col: 'coral', tool: 'ruler' }),
        OP.seg('AC', A, C, { col: 'coral', tool: 'ruler' }),
        OP.fill('tri', [A, B, C], { col: 'coral', alpha: 0.22 }),
      ], hl: 'tri' }),
    ];

    // answer: the mirror triangle (median questions ask how many); checks: protractor + height or median
    const answer = Object.assign({}, c.answer);
    if (c.kind === 'med') answer.draw = [
      OP.seg('A2B', A2, B, { st: 'guide', col: 'coral' }),
      OP.seg('A2C', A2, C, { st: 'guide', col: 'coral', with: true }),
      OP.fill('tri2', [A2, B, C], { col: 'coral', alpha: 0.1 }),
    ];
    const check = [
      L({ m: `∠${v} = ${th}° ✓`, cap: `Check with a protractor: the angle at ${v} is ${th}°.`, draw: [OP.prot('prot', A, heading(A, B), heading(A, C), `${th}°`)] }),
      c.kind === 'alt'
        ? L({ m: `${v} is ${c.h} cm above ${BC} ✓`, cap: `And ${v} is ${c.h} cm above ${BC}. It matches!`, draw: [
          A[0] > a ? OP.seg('ext', C, [A[0] + 0.5, 0], { st: 'guide', col: 'teal' }) : null,
          OP.dim('dimA', [A[0], 0], A, `${c.h} cm`, { off: -38 }),
        ] })
        : L({ m: `median ${v}M = ${c.md} cm ✓`, cap: `And the median ${v}M is ${c.md} cm. It matches!`, draw: [OP.meas('mAM', M, A, `${c.md} cm`, { side: 1 })] }),
    ];

    const stepsList = steps.filter(Boolean);

    const P = {
      type: 'locus', kind: c.kind, id: c.id, set: c.set, num: c.num, slug: c.slug, title: c.title, question: c.question,
      chapter: `CONSTRUCTIONS · SET ${c.set} Q${c.num}`, label: `SET ${c.set} · QUESTION ${c.num}`,
      geo: { B, C, M, O: r4(O), R, A: r4(A), A2: r4(A2), theta: th, a, h: c.h, md: c.md, names: [nb, nc, v] },
      view: c.view, knowView: { s: c.knowS || c.view.s }, sceneTitle: 'THE BASE',
      tokens: {},
      hook: c.hook, qLines: c.qLines, sceneLines: scene, given, find, know, steps: stepsList,
      answer, check,
      tri, tri2,
    };
    return P;
  }

  // ------------------------------------------------------------------------------
  // the 11 questions
  // ------------------------------------------------------------------------------
  const PROBLEMS = [];

  // ------------------------------------------------------------------ Set 1 · Q1
  {
    const B = [0, 0], C = [6, 0], A = polar(B, 60, 5);
    const g = arcs60('g', B, 0, 1, 1.4);
    PROBLEMS.push(scaled({
      id: 'c01', set: 1, num: 1, slug: 'set1-q1-triangle-6-5-60-scaled-3-4', title: 'Shrink a triangle to 3/4',
      question: 'Draw a triangle ABC with side ⟦BC = 6 cm⟧, ⟦AB = 5 cm⟧ and ⟦∠ABC = 60°⟧. Then construct a triangle whose sides are ⟦3/4 of the corresponding sides⟧ of the triangle ABC.',
      A, B, C, m: 3, n: 4, u: 1.05, rayDeg: -22,
      view: { s: 60 },
      hook: {
        head: ['Shrink this triangle', 'to ((3/4)) of its size!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['6 cm', '5 cm', '60°'] },
        lines: [
          { cap: 'Can you shrink this triangle to 3/4 of its size?', say: 'Can you shrink this triangle to three quarters of its size?' },
          { cap: 'With only a ruler and a compass?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw triangle ABC: BC is 6 cm, AB is 5 cm, and the angle at B is 60°.', mark: [0, 1, 2] },
        { cap: 'Then draw a new triangle with every side 3/4 as long.', mark: [3] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 60 px. First, draw BC, 6 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 60 px' }, { icon: 'ruler', s: 'BC = 6 cm' }], draw: base(['B', 'C'], B, C, '6 cm'), sfx: 'whoosh' }),
        L({ cap: 'At B, make a 60° angle with the compass.', legend: { icon: 'compass', s: '∠B = 60°' }, draw: [
          ...g.ops,
          OP.seg('rayB', B, polar(B, 60, 5.45), { st: 'con', tool: 'ruler' }),
          OP.ang('angB', B, 0, 60, '60°', { r: 46, col: 'sun', lr: 30 }),
        ] }),
        L({ cap: 'Open the compass to 5 cm, and cut the ray at A.', legend: { icon: 'compass', s: 'BA = 5 cm' }, draw: [
          OP.arc('cutA', B, 5, 52, 68),
          OP.pt('A', A, 'A', [0, -32]),
          OP.seg('BA', B, A, { col: 'teal' }),
          OP.len('lBA', B, A, '5 cm', { col: 'teal', side: 1, off: 32 }),
        ] }),
        L({ cap: 'Join AC. That’s triangle ABC, drawn to scale!', legend: { icon: 'tri', s: '△ABC ✓' }, draw: [
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 6 cm,  AB = 5 cm', cap: 'BC is 6 cm and AB is 5 cm.', hl: 'BC+BA' }),
        L({ m: '∠B = 60°', cap: 'The angle at B is 60°.', hl: 'angB' }),
        L({ m: 'new sides = ((3/4)) of old sides', cap: 'Every new side must be 3/4 of the old side.' }),
      ],
      find: L({ m: '△A′BC′ = a ((3/4)) copy of △ABC', cap: 'Find: triangle A′BC′, a 3/4 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ = 4.5 cm', 'A′B = 3.75 cm,  ∠B = 60°'], cap: 'Here it is: △A′BC′! BC′ is 4.5 cm, and A′B is 3.75 cm.' },
      check: [
        L({ m: 'BC′ = 4.5 cm → ((4.5/6)) = ((3/4)) ✓', cap: 'Check with a ruler! BC′ is 4.5 cm, and 4.5/6 = 3/4.', draw: [OP.meas('mBC2', B, C2of(B, C, 0.75), '4.5 cm')] }),
        L({ m: 'A′B = 3.75 cm → ((3.75/5)) = ((3/4)) ✓', cap: 'A′B is 3.75 cm, and 3.75/5 = 3/4 too. It matches!', draw: [OP.meas('mBA2', B, mix(B, A, 0.75), '3.75 cm', { side: 1 })] }),
      ],
      labels: { A2: [-34, -10] },
    }));
  }
  function C2of(B, C, k) { return mix(B, C, k); }

  // ------------------------------------------------------------------ Set 1 · Q2
  {
    const B = [0, 0], C = [6, 0], A = circles(B, 5, C, 4)[0];
    PROBLEMS.push(scaled({
      id: 'c02', set: 1, num: 2, slug: 'set1-q2-triangle-4-5-6-scaled-2-3', title: 'A copy 2/3 as big',
      question: 'Construct a triangle of sides ⟦4 cm, 5 cm and 6 cm⟧ and then a triangle similar to it whose sides are ⟦2/3 of the corresponding sides⟧ of the first triangle.',
      A, B, C, m: 2, n: 3, u: 1.35, rayDeg: -22,
      view: { s: 68 },
      hook: {
        head: ['Triangle: 4 cm, 5 cm, 6 cm', 'Make a copy ((2/3)) as big!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['6 cm', '5 cm', '4 cm'] },
        lines: [
          { cap: 'This triangle has sides 4, 5 and 6 cm.', say: 'This triangle has sides 4, 5 and 6 centimetres.' },
          { cap: 'Can you draw a copy that is 2/3 as big?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw a triangle with sides 4 cm, 5 cm and 6 cm.', mark: [0] },
        { cap: 'Then draw a copy with every side 2/3 as long.', mark: [1] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 68 px. Draw the longest side, BC, 6 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 68 px' }, { icon: 'ruler', s: 'BC = 6 cm' }], draw: base(['B', 'C'], B, C, '6 cm'), sfx: 'whoosh' }),
        L({ cap: 'Open the compass to 5 cm. From B, draw an arc.', legend: { icon: 'compass', s: 'arc from B: 5 cm' }, draw: [OP.arc('arcB', B, 5, heading(B, A) - 13, heading(B, A) + 13)] }),
        L({ cap: 'Open it to 4 cm. From C, draw an arc. The arcs cross at A.', legend: { icon: 'compass', s: 'arc from C: 4 cm → A' }, draw: [
          OP.arc('arcC', C, 4, heading(C, A) - 16, heading(C, A) + 16),
          OP.pt('A', A, 'A', [0, -32]),
        ] }),
        L({ cap: 'Join AB and AC. That’s triangle ABC, drawn to scale!', legend: { icon: 'tri', s: '△ABC ✓' }, draw: [
          OP.seg('BA', B, A, { col: 'teal', tool: 'ruler' }),
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.len('lBA', B, A, '5 cm', { col: 'teal', side: 1, off: 32 }),
          OP.len('lAC', A, C, '4 cm', { col: 'teal', side: 1, off: 32, with: true }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 6 cm', cap: 'BC is 6 cm.', hl: 'BC' }),
        L({ m: 'AB = 5 cm,  AC = 4 cm', cap: 'AB is 5 cm and AC is 4 cm.', hl: 'BA+AC' }),
        L({ m: 'new sides = ((2/3)) of old sides', cap: 'Every new side must be 2/3 of the old side.' }),
      ],
      find: L({ m: '△A′BC′ = a ((2/3)) copy of △ABC', cap: 'Find: triangle A′BC′, a 2/3 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ = 4 cm', 'A′B ≈ 3.33 cm,  A′C′ ≈ 2.67 cm'], cap: 'Here it is: △A′BC′! BC′ is 4 cm, and A′C′ is about 2.67 cm.' },
      check: [
        L({ m: 'BC′ = 4 cm → ((4/6)) = ((2/3)) ✓', cap: 'Check with a ruler! BC′ is 4 cm, and 4/6 = 2/3.', draw: [OP.meas('mBC2', B, mix(B, C, 2 / 3), '4 cm')] }),
        L({ m: 'A′C′ ≈ 2.67 cm → ((2.67/4)) ≈ ((2/3)) ✓', cap: 'A′C′ is about 2.67 cm, and 2.67/4 is about 2/3. It matches!', draw: [OP.meas('mCA2', mix(B, C, 2 / 3), mix(B, A, 2 / 3), '2.67 cm', { side: -1 })] }),
      ],
      labels: { A2: [-34, -12] },
    }));
  }

  // ------------------------------------------------------------------ Set 1 · Q3
  {
    const B = [0, 0], C = [7, 0], A = circles(B, 5, C, 6)[0];
    PROBLEMS.push(scaled({
      id: 'c03', set: 1, num: 3, slug: 'set1-q3-triangle-5-6-7-scaled-7-5', title: 'Grow a triangle to 7/5',
      question: 'Construct a triangle with sides ⟦5 cm, 6 cm and 7 cm⟧ and then another triangle whose sides are ⟦7/5 of the corresponding sides⟧ of the first triangle.',
      A, B, C, m: 7, n: 5, u: 0.72, rayDeg: -20,
      view: { s: 48 },
      hook: {
        head: ['Triangle: 5 cm, 6 cm, 7 cm', 'Make it ((7/5)) as big!'], ask: 'Grow it with a compass?', art: { kind: 'scale', labels: ['7 cm', '5 cm', '6 cm'] },
        lines: [
          { cap: 'This triangle has sides 5, 6 and 7 cm.', say: 'This triangle has sides 5, 6 and 7 centimetres.' },
          { cap: 'Can you make it 7/5 as big, with a ruler and compass?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw a triangle with sides 5 cm, 6 cm and 7 cm.', mark: [0] },
        { cap: 'Then draw a bigger one, with every side 7/5 as long.', mark: [1] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 48 px. Draw the longest side, BC, 7 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 48 px' }, { icon: 'ruler', s: 'BC = 7 cm' }], draw: base(['B', 'C'], B, C, '7 cm'), sfx: 'whoosh' }),
        L({ cap: 'Open the compass to 5 cm. From B, draw an arc.', legend: { icon: 'compass', s: 'arc from B: 5 cm' }, draw: [OP.arc('arcB', B, 5, heading(B, A) - 13, heading(B, A) + 13)] }),
        L({ cap: 'Open it to 6 cm. From C, draw an arc. The arcs cross at A.', legend: { icon: 'compass', s: 'arc from C: 6 cm → A' }, draw: [
          OP.arc('arcC', C, 6, heading(C, A) - 12, heading(C, A) + 12),
          OP.pt('A', A, 'A', [0, -32]),
        ] }),
        L({ cap: 'Join AB and AC. That’s triangle ABC, drawn to scale!', legend: { icon: 'tri', s: '△ABC ✓' }, draw: [
          OP.seg('BA', B, A, { col: 'teal', tool: 'ruler' }),
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.len('lBA', B, A, '5 cm', { col: 'teal', side: 1, off: 32 }),
          OP.len('lAC', A, C, '6 cm', { col: 'teal', side: -1, off: 30, with: true }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 7 cm', cap: 'BC is 7 cm.', hl: 'BC' }),
        L({ m: 'AB = 5 cm,  AC = 6 cm', cap: 'AB is 5 cm and AC is 6 cm.', hl: 'BA+AC' }),
        L({ m: 'new sides = ((7/5)) of old sides', cap: 'Every new side must be 7/5 of the old side: bigger!' }),
      ],
      find: L({ m: '△A′BC′ = a ((7/5)) copy of △ABC', cap: 'Find: triangle A′BC′, a 7/5 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ = 9.8 cm', 'A′B = 7 cm,  A′C′ = 8.4 cm'], cap: 'Here it is: △A′BC′! BC′ is 9.8 cm, and A′C′ is 8.4 cm.' },
      check: [
        L({ m: 'BC′ = 9.8 cm → ((9.8/7)) = ((7/5)) ✓', cap: 'Check with a ruler! BC′ is 9.8 cm, and 9.8/7 = 7/5.', draw: [OP.meas('mBC2', B, mix(B, C, 1.4), '9.8 cm')] }),
        L({ m: 'A′C′ = 8.4 cm → ((8.4/6)) = ((7/5)) ✓', cap: 'A′C′ is 8.4 cm, and 8.4/6 = 7/5 too. It matches!', draw: [OP.meas('mCA2', mix(B, C, 1.4), mix(B, A, 1.4), '8.4 cm', { side: -1 })] }),
      ],
      labels: { C2: [18, 32], A2: [-32, -16], lBC2: { side: 1, off: 30, dx: 60 } },
      stepSide: 1,
    }));
  }

  // ------------------------------------------------------------------ Set 2 · Q1
  {
    const B = [0, 0], C = [8, 0], M = [4, 0], A = [4, 4];
    const pb = arcsPerpBis('pb', B, C, 4.3, -1.9, 4.7);
    PROBLEMS.push(scaled({
      id: 'c04', set: 2, num: 1, slug: 'set2-q1-isosceles-triangle-scaled-1-5', title: 'Isosceles triangle, 1½ times',
      question: 'Construct an ⟦isosceles triangle whose base is 8 cm⟧ and ⟦altitude 4 cm⟧ and then another triangle whose sides are ⟦1½ times the corresponding sides⟧ of the isosceles triangle.',
      A, B, C, m: 3, n: 2, u: 1.3, rayDeg: -18,
      view: { s: 46 },
      hook: {
        head: ['Isosceles triangle: base 8 cm', 'Make it 1½ times as big!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['8 cm', '', ''], alt: '4 cm' },
        lines: [
          { cap: 'This triangle has two equal sides. Its base is 8 cm, and it is 4 cm tall.' },
          { cap: 'Can you make it one and a half times as big?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw an isosceles triangle: base 8 cm, height 4 cm.', mark: [0, 1] },
        { cap: 'Then draw a bigger one, with every side 1½ times as long.', mark: [2] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 46 px. First, draw the base BC, 8 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 46 px' }, { icon: 'ruler', s: 'BC = 8 cm' }], draw: base(['B', 'C'], B, C, '8 cm', { side: 1, off: 30, dx: 100 }), sfx: 'whoosh' }),
        L({ cap: 'Draw the perpendicular bisector of BC. It cuts BC in half at M.', legend: { icon: 'compass', s: 'bisector of BC → M' }, draw: [...pb.ops, OP.pt('M', M, 'M', [22, 28])] }),
        L({ cap: 'Mark A on it, 4 cm above M.', legend: { icon: 'compass', s: 'MA = 4 cm' }, draw: [
          OP.arc('cutA', M, 4, 78, 102),
          OP.pt('A', A, 'A', [0, -32]),
          OP.dim('dimA', M, A, '4 cm', { off: -34, col: 'teal' }),
        ] }),
        L({ cap: 'Join AB and AC. Two equal sides: an isosceles triangle!', legend: { icon: 'tri', s: '△ABC ✓  (AB = AC)' }, draw: [
          OP.seg('BA', B, A, { col: 'teal', tool: 'ruler' }),
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'base BC = 8 cm', cap: 'The base BC is 8 cm.', hl: 'BC' }),
        L({ m: 'height AM = 4 cm,  AB = AC', cap: 'The height AM is 4 cm, and AB = AC.', hl: 'dimA' }),
        L({ m: 'new sides = 1½ = ((3/2)) × old sides', cap: 'Every new side must be 1½ times as long. That’s 3/2.' }),
      ],
      find: L({ m: '△A′BC′ = a ((3/2)) copy of △ABC', cap: 'Find: triangle A′BC′, a 3/2 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ = 12 cm', 'A′B = A′C′ ≈ 8.49 cm,  height 6 cm'], cap: 'Here it is: △A′BC′! BC′ is 12 cm, and it is 6 cm tall.' },
      check: [
        L({ m: 'BC′ = 12 cm → ((12/8)) = ((3/2)) ✓', cap: 'Check with a ruler! BC′ is 12 cm, and 12/8 = 3/2.', draw: [OP.meas('mBC2', B, [12, 0], '12 cm')] }),
        L({ m: 'height 6 cm → ((6/4)) = ((3/2)) ✓', cap: 'The new height is 6 cm, and 6/4 = 3/2 too. It matches!', draw: [OP.dim('dimA2', [6, 0], [6, 6], '6 cm', { off: -34 })] }),
      ],
      labels: { C2: [18, 32], A2: [0, -32], lBC2: { side: 1, off: 30, dx: 170 } },
    }));
  }

  // ------------------------------------------------------------------ Set 2 · Q2
  {
    const B = [0, 0], C = [7, 0];
    const A = meet(B, polar(B, 45, 1), C, polar(C, 150, 1));
    const g90 = arcs90('b', B, 0, 1, 1.25), b45 = arcsBisect('bb', B, 0, 90, 1.25, 1.05);
    const g60 = arcs60('c', C, 180, -1, 1.25), b30 = arcsBisect('cb', C, 180, 120, 1.25, 1.0);
    PROBLEMS.push(scaled({
      id: 'c05', set: 2, num: 2, slug: 'set2-q2-triangle-7-45-105-scaled-4-3', title: 'Angles 45° and 105°, 4/3 as big',
      question: 'Draw a triangle ABC with side ⟦BC = 7 cm⟧, ⟦∠B = 45°⟧, ⟦∠A = 105°⟧. Then, construct a triangle whose sides are ⟦4/3 times the corresponding sides⟧ of △ABC.',
      A, B, C, m: 4, n: 3, u: 0.95, rayDeg: -20,
      view: { s: 68 },
      hook: {
        head: ['BC = 7 cm, ∠B = 45°, ∠A = 105°', 'Make it ((4/3)) as big!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['7 cm', '', '45°'], topAngle: '105°' },
        lines: [
          { cap: 'We know one side and two angles of this triangle.' },
          { cap: 'Can you draw it, and then make it 4/3 as big?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw triangle ABC: BC is 7 cm, angle B is 45°, and angle A is 105°.', mark: [0, 1, 2] },
        { cap: 'Then draw a bigger one, with every side 4/3 as long.', mark: [3] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 68 px. First, draw BC, 7 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 68 px' }, { icon: 'ruler', s: 'BC = 7 cm' }], draw: base(['B', 'C'], B, C, '7 cm'), sfx: 'whoosh' }),
        L({ cap: 'The three angles add up to 180°, so ∠C = 30°.', say: 'The three angles add up to 180 degrees, so angle C is 30 degrees.', legend: { icon: 'tri', s: '∠C = 180° − 45° − 105° = 30°' } }),
        L({ cap: 'At B, make a right angle with the compass.', draw: [...g90.ops, OP.seg('ray90', B, [0, 2.45], { st: 'con', tool: 'ruler' })] }),
        L({ cap: 'Cut it in half. That’s 45°.', legend: { icon: 'compass', s: '∠B = 45°' }, draw: [
          ...b45.ops,
          OP.seg('rayB', B, polar(B, 45, 4.2), { st: 'con', tool: 'ruler' }),
          OP.ang('angB', B, 0, 45, '45°', { r: 62, col: 'sun', lr: 32 }),
        ] }),
        L({ cap: 'At C, make a 60° angle.', draw: g60.ops }),
        L({ cap: 'Cut it in half. That’s 30°. The two rays meet at A.', legend: { icon: 'compass', s: '∠C = 30° → A' }, draw: [
          ...b30.ops,
          OP.seg('rayC', C, polar(C, 150, 5.9), { st: 'con', tool: 'ruler' }),
          OP.ang('angC', C, 150, 180, '30°', { r: 70, col: 'sun', lr: 32 }),
          OP.pt('A', A, 'A', [0, -32]),
          OP.seg('BA', B, A, { col: 'teal' }), OP.seg('AC', A, C, { col: 'teal', with: true }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 7 cm', cap: 'BC is 7 cm.', hl: 'BC' }),
        L({ m: '∠B = 45°,  ∠A = 105°,  so ∠C = 30°', cap: 'The angles are 45°, 105° and 30°.', hl: 'angB+angC' }),
        L({ m: 'new sides = ((4/3)) of old sides', cap: 'Every new side must be 4/3 of the old side: bigger!' }),
      ],
      find: L({ m: '△A′BC′ = a ((4/3)) copy of △ABC', cap: 'Find: triangle A′BC′, a 4/3 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ ≈ 9.33 cm', 'A′B ≈ 4.83 cm,  A′C′ ≈ 6.83 cm'], cap: 'Here it is: △A′BC′! BC′ is about 9.33 cm.' },
      check: [
        L({ m: 'BC′ ≈ 9.33 cm → ((9.33/7)) ≈ ((4/3)) ✓', cap: 'Check with a ruler! BC′ is about 9.33 cm, and 9.33/7 is about 4/3.', draw: [OP.meas('mBC2', B, mix(B, C, 4 / 3), '9.33 cm')] }),
        L({ m: 'angles stay 45°, 105°, 30° ✓', cap: 'The angles stay 45°, 105° and 30°: same shape, just bigger!', hl: 'newtri' }),
      ],
      labels: { C2: [18, 32], A2: [-10, -32], lBC2: { side: 1, off: 30, dx: 200 } },
    }));
  }

  // ------------------------------------------------------------------ Set 2 · Q3
  {
    const B = [0, 0], C = [5, 0], A = [0, 4];
    const g = arcs90('b', B, 0, 1, 1.2);
    PROBLEMS.push(scaled({
      id: 'c06', set: 2, num: 3, slug: 'set2-q3-right-triangle-5-4-scaled-5-3', title: 'Right triangle, 5/3 as big',
      question: 'Draw a ⟦right triangle⟧ in which the sides (other than hypotenuse) are of lengths ⟦5 cm and 4 cm⟧. Then construct another triangle whose sides are ⟦5/3 times the corresponding sides⟧ of the given triangle.',
      A, B, C, m: 5, n: 3, u: 0.78, rayDeg: -20,
      view: { s: 46 },
      hook: {
        head: ['Right triangle: 5 cm and 4 cm', 'Make it ((5/3)) as big!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['5 cm', '4 cm', ''], right: true },
        lines: [
          { cap: 'This right triangle has legs of 5 cm and 4 cm.' },
          { cap: 'Can you make it 5/3 as big, with a ruler and compass?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw a right triangle with its two short sides 5 cm and 4 cm.', mark: [0, 1] },
        { cap: 'Then draw a bigger one, with every side 5/3 as long.', mark: [2] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 46 px. First, draw BC, 5 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 46 px' }, { icon: 'ruler', s: 'BC = 5 cm' }], draw: base(['B', 'C'], B, C, '5 cm', { side: 1, off: 30 }), sfx: 'whoosh' }),
        L({ cap: 'At B, make a right angle with the compass.', legend: { icon: 'compass', s: '∠B = 90°' }, draw: [
          ...g.ops,
          OP.seg('rayB', B, [0, 4.7], { st: 'con', tool: 'ruler' }),
          OP.rt('rtB', B, 0, { col: 'sun', size: 26 }),
        ] }),
        L({ cap: 'Cut BA = 4 cm on it. Join AC.', legend: { icon: 'ruler', s: 'BA = 4 cm, join AC' }, draw: [
          OP.arc('cutA', B, 4, 80, 100),
          OP.pt('A', A, 'A', [-30, -8]),
          OP.seg('BA', B, A, { col: 'teal' }),
          OP.len('lBA', B, A, '4 cm', { col: 'teal', side: 1, off: 44 }),
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 5 cm,  BA = 4 cm', cap: 'BC is 5 cm and BA is 4 cm.', hl: 'BC+BA' }),
        L({ m: '∠B = 90°', cap: 'The angle at B is a right angle.', hl: 'rtB' }),
        L({ m: 'new sides = ((5/3)) of old sides', cap: 'Every new side must be 5/3 of the old side: bigger!' }),
      ],
      find: L({ m: '△A′BC′ = a ((5/3)) copy of △ABC', cap: 'Find: triangle A′BC′, a 5/3 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ ≈ 8.33 cm', 'BA′ ≈ 6.67 cm,  A′C′ ≈ 10.67 cm'], cap: 'Here it is: △A′BC′! BC′ is about 8.33 cm, and BA′ is about 6.67 cm.' },
      check: [
        L({ m: 'BC′ ≈ 8.33 cm → ((8.33/5)) ≈ ((5/3)) ✓', cap: 'Check with a ruler! BC′ is about 8.33 cm, and 8.33/5 is about 5/3.', draw: [OP.meas('mBC2', B, mix(B, C, 5 / 3), '8.33 cm')] }),
        L({ m: 'BA′ ≈ 6.67 cm → ((6.67/4)) ≈ ((5/3)) ✓', cap: 'BA′ is about 6.67 cm, and 6.67/4 is about 5/3 too. It matches!', draw: [OP.meas('mBA2', B, mix(B, A, 5 / 3), '6.67 cm', { side: 1 })] }),
      ],
      labels: { C2: [18, 32], A2: [-34, -6], lBC2: { side: 1, off: 30, dx: 93 } },
    }));
  }

  // ------------------------------------------------------------------ Set 2 · Q4
  {
    const B = [0, 0], C = [8, 0], A = [0, 6];
    const g = arcs90('b', B, 0, 1, 1.3);
    PROBLEMS.push(scaled({
      id: 'c07', set: 2, num: 4, slug: 'set2-q4-right-triangle-8-6-scaled-3-4', title: 'Right triangle, 3/4 as big',
      question: 'Draw a ⟦right triangle⟧ in which sides (other than hypotenuse) are of lengths ⟦8 cm and 6 cm⟧. Then construct another triangle whose sides are ⟦3/4 times the corresponding sides⟧ of the first triangle.',
      A, B, C, m: 3, n: 4, u: 1.15, rayDeg: -20,
      view: { s: 48 },
      hook: {
        head: ['Right triangle: 8 cm and 6 cm', 'Shrink it to ((3/4))!'], ask: 'Only ruler & compass. How?', art: { kind: 'scale', labels: ['8 cm', '6 cm', ''], right: true },
        lines: [
          { cap: 'This right triangle has legs of 8 cm and 6 cm.' },
          { cap: 'Can you shrink it to 3/4, with a ruler and compass?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'First, draw a right triangle with its two short sides 8 cm and 6 cm.', mark: [0, 1] },
        { cap: 'Then draw a smaller one, with every side 3/4 as long.', mark: [2] },
      ],
      scene: [
        L({ cap: 'Drawn to scale: 1 cm = 48 px. First, draw BC, 8 cm long.', legend: [{ icon: 'scale', s: 'Scale: 1 cm = 48 px' }, { icon: 'ruler', s: 'BC = 8 cm' }], draw: base(['B', 'C'], B, C, '8 cm', { side: 1, off: 30, dx: 110 }), sfx: 'whoosh' }),
        L({ cap: 'At B, make a right angle with the compass.', legend: { icon: 'compass', s: '∠B = 90°' }, draw: [
          ...g.ops,
          OP.seg('rayB', B, [0, 6.7], { st: 'con', tool: 'ruler' }),
          OP.rt('rtB', B, 0, { col: 'sun', size: 26 }),
        ] }),
        L({ cap: 'Cut BA = 6 cm on it. Join AC.', legend: { icon: 'ruler', s: 'BA = 6 cm, join AC' }, draw: [
          OP.arc('cutA', B, 6, 80, 100),
          OP.pt('A', A, 'A', [-30, -8]),
          OP.seg('BA', B, A, { col: 'teal' }),
          OP.len('lBA', B, A, '6 cm', { col: 'teal', side: 1, off: 44 }),
          OP.seg('AC', A, C, { col: 'teal', tool: 'ruler' }),
          OP.fill('ABC', [A, B, C], { col: 'teal', alpha: 0.12 }),
        ], hl: 'ABC' }),
      ],
      given: [
        L({ m: 'BC = 8 cm,  BA = 6 cm', cap: 'BC is 8 cm and BA is 6 cm.', hl: 'BC+BA' }),
        L({ m: '∠B = 90°', cap: 'The angle at B is a right angle.', hl: 'rtB' }),
        L({ m: 'new sides = ((3/4)) of old sides', cap: 'Every new side must be 3/4 of the old side.' }),
      ],
      find: L({ m: '△A′BC′ = a ((3/4)) copy of △ABC', cap: 'Find: triangle A′BC′, a 3/4 copy of triangle ABC.', hl: 'ABC' }),
      answer: { card: ['△A′BC′:  BC′ = 6 cm', 'BA′ = 4.5 cm,  A′C′ = 7.5 cm'], cap: 'Here it is: △A′BC′! BC′ is 6 cm, and BA′ is 4.5 cm.' },
      check: [
        L({ m: 'BC′ = 6 cm → ((6/8)) = ((3/4)) ✓', cap: 'Check with a ruler! BC′ is 6 cm, and 6/8 = 3/4.', draw: [OP.meas('mBC2', B, [6, 0], '6 cm')] }),
        L({ m: 'A′C′ = 7.5 cm → ((7.5/10)) = ((3/4)) ✓', cap: 'The long side AC is 10 cm. A′C′ is 7.5 cm, and 7.5/10 = 3/4. It matches!', draw: [OP.meas('mCA2', [6, 0], [0, 4.5], '7.5 cm', { side: -1 })] }),
      ],
      labels: { C2: [18, 32], A2: [-34, -6], lBC2: { side: 1, off: 30 } },
    }));
  }

  // ------------------------------------------------------------------ Set 2 · Q5–Q8
  PROBLEMS.push(locus({
    id: 'c08', set: 2, num: 5, slug: 'set2-q5-triangle-base-5-angle-45-altitude-4-2', title: 'Base, top angle and height',
    question: 'Construct a triangle ABC in which ⟦BC = 5 cm⟧, ⟦∠A = 45°⟧ and ⟦altitude through A is 4.2 cm⟧.',
    base: ['B', 'C'], v: 'A', a: 5, theta: 45, kind: 'alt', h: 4.2, hName: 'P',
    view: { s: 50 },
    hook: {
      head: ['Base 5 cm, ∠A = 45°', 'and A is 4.2 cm high'], ask: 'Where is A?', art: { kind: 'locus' },
      lines: [
        { cap: 'We know the base, the top angle, and the height.' },
        { cap: 'Can you find the top corner A?' },
        pause,
      ],
    },
    qLines: [
        { cap: 'Draw triangle ABC. Its base BC is 5 cm, and the angle at A is 45°.', mark: [0, 1] },
        { cap: 'The altitude, the height from A down to BC, is 4.2 cm.', mark: [2] },
    ],
    answer: { card: ['△ABC:  AB = 7 cm,  AC ≈ 4.24 cm', '∠A = 45°,  height 4.2 cm'], cap: 'Here it is: triangle ABC! AB is 7 cm, and AC is about 4.24 cm.' },
    vLab: [20, -24], v2Lab: [-24, -24], oLab: [26, 4], dimLab: [80, -20],
  }));
  PROBLEMS.push(locus({
    id: 'c09', set: 2, num: 6, slug: 'set2-q6-triangle-pqr-base-6-angle-30-altitude-4-7', title: 'Triangle PQR from base, angle and height',
    question: 'Construct a triangle PQR in which ⟦QR = 6 cm⟧, ⟦∠P = 30°⟧ and ⟦altitude through P is 4.7 cm⟧.',
    base: ['Q', 'R'], v: 'P', a: 6, theta: 30, kind: 'alt', h: 4.7, hName: 'S',
    view: { s: 44 }, knowS: 32, angR: 1.2, arcParts: [[-70, 14], [166, 250]],
    hook: {
      head: ['Base 6 cm, ∠P = 30°', 'and P is 4.7 cm high'], ask: 'Where is P?', art: { kind: 'locus' },
      lines: [
        { cap: 'We know the base, the top angle, and the height.' },
        { cap: 'Can you find the top corner P?' },
        pause,
      ],
    },
    qLines: [
      { cap: 'Draw triangle PQR. Its base QR is 6 cm, and the angle at P is 30°.', mark: [0, 1] },
      { cap: 'The altitude, the height from P down to QR, is 4.7 cm.', mark: [2] },
    ],
    answer: { card: ['△PQR:  PQ ≈ 10.1 cm,  PR ≈ 5.6 cm', '∠P = 30°,  height 4.7 cm'], cap: 'Here it is: triangle PQR! PQ is about 10.1 cm, and PR is about 5.6 cm.' },
    vLab: [22, -20], v2Lab: [-26, -20], oLab: [26, 0], dimOff: -30,
  }));
  PROBLEMS.push(locus({
    id: 'c10', set: 2, num: 7, slug: 'set2-q7-triangle-base-7-angle-60-median-5-3', title: 'Base, top angle and median: how many?',
    question: 'Construct a triangle ABC in which ⟦BC = 7 cm⟧, ⟦∠A = 60°⟧ and the ⟦median from A on BC is 5.3 cm⟧ long. ⟦How many such triangles are possible?⟧',
    base: ['B', 'C'], v: 'A', a: 7, theta: 60, kind: 'med', md: 5.3,
    view: { s: 46 },
    hook: {
      head: ['Base 7 cm, ∠A = 60°', 'median 5.3 cm'], ask: 'How many triangles?', art: { kind: 'locus' },
      lines: [
        { cap: 'We know the base, the top angle, and the median.' },
        { cap: 'How many triangles can you draw?' },
        pause,
      ],
    },
    qLines: [
      { cap: 'Draw triangle ABC. Its base BC is 7 cm, and the angle at A is 60°.', mark: [0, 1] },
      { cap: 'The median from A to the middle of BC is 5.3 cm. How many such triangles are there?', mark: [2, 3] },
    ],
    answer: { card: ['2 triangles: △ABC and △A′BC', 'mirror images: AB ≈ 8.1 cm, AC ≈ 3.9 cm'], cap: 'Two triangles are possible: ABC and A′BC. They are mirror images!' },
    vLab: [22, -18], v2Lab: [-26, -18], oLab: [26, 6], kMedDeg: 130,
  }));
  PROBLEMS.push(locus({
    id: 'c11', set: 2, num: 8, slug: 'set2-q8-triangle-pqr-base-5-5-angle-45-median-5', title: 'Triangle PQR from base, angle and median: how many?',
    question: 'Construct a triangle PQR in which ⟦QR = 5.5 cm⟧, ⟦∠P = 45°⟧ and the ⟦median from P on QR is 5 cm⟧. ⟦How many such triangles are possible?⟧',
    base: ['Q', 'R'], v: 'P', a: 5.5, theta: 45, kind: 'med', md: 5,
    view: { s: 46 },
    hook: {
      head: ['Base 5.5 cm, ∠P = 45°', 'median 5 cm'], ask: 'How many triangles?', art: { kind: 'locus' },
      lines: [
        { cap: 'We know the base, the top angle, and the median.' },
        { cap: 'How many triangles can you draw?' },
        pause,
      ],
    },
    qLines: [
      { cap: 'Draw triangle PQR. Its base QR is 5.5 cm, and the angle at P is 45°.', mark: [0, 1] },
      { cap: 'The median from P to the middle of QR is 5 cm. How many such triangles are there?', mark: [2, 3] },
    ],
    answer: { card: ['2 triangles: △PQR and △P′QR', 'mirror images: PQ ≈ 7.3 cm, PR ≈ 3.4 cm'], cap: 'Two triangles are possible: PQR and P′QR. They are mirror images!' },
    vLab: [22, -18], v2Lab: [-26, -18], oLab: [26, 4], kMedDeg: 130,
  }));

  // ------------------------------------------------------------------------------
  // storyboard: the 8 beats of every video
  // ------------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const add_ = (type, title, lines) => beats.push({ type, title, lines: lines.map((l) => prep(Object.assign({}, l))) });
    add_('hook', 'Hook: the triangle itself + the big question', p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));
    add_('question', 'The question', [
      { cap: 'Let’s solve it together, step by step!', say: 'Let us solve it together, step by step!', brand: true, sfx: 'whoosh' },
      { cap: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);
    add_('scene', 'The drawing, to scale', p.sceneLines);
    add_('given', 'What we know + what we must find', [
      { cap: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);
    add_('know', 'Know first: the ideas behind the construction', p.know);
    add_('solve', 'Construction, one step per line', p.steps.map((s) => Object.assign({ sfx: 'write' }, s)));
    add_('answer', 'Answer card + quick check', [
      Object.assign({ answer: true, sfx: 'ding', hl: p.type === 'scaled' ? 'newtri' : 'tri' }, p.answer),
      ...p.check.map((c, i) => Object.assign({ check: i, sfx: i === p.check.length - 1 ? 'sparkle' : 'pop' }, c)),
    ]);
    add_('outro', 'End card: Follow Maths by Zosiama', [
      { cap: 'Great job! You constructed it!', sfx: 'tada' },
      { cap: 'For more easy maths… Follow Maths by Zosiama!', say: 'For more easy maths, follow Maths by Zosiama!', follow: true },
    ]);
    beats.forEach((b) => b.lines.forEach((l, li) => { l.id = `${b.type}.${li}`; if (!l.cap) l.cap = l.say; }));
    return beats;
  }

  const api = { PROBLEMS, buildBeats, sayify };
  root.CONSTRUCTIONS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
