/* Maths by Zosiama · Coordinate Geometry explainers (section formula, midpoint, centroid)
 * Problem data and narration for questions 1–19.
 *
 *  cap    = caption on screen; say = what the offline voice reads (made from cap by sayify()
 *           unless given: A(5, −2) → "A at 5, minus 2", 3 : 1 → "3 to 1", x₁ → "x 1",
 *           3/4 → "three quarters", AP → "A P"). Never start a sentence with the article "A".
 *  m      = maths line on a board card; ((a/b)) is a stacked fraction
 *  draw   = drawing steps (ops) on the plane, in units with y up; they play one after another
 *           while the line is spoken. prep() gives each line a minimum length (min) and sounds.
 *  hl     = op ids that glow while the line plays ('+' joins several)
 *  legend = row(s) on the scene card {icon, s}
 */
(function (root) {
  'use strict';

  const MINUS = '−';
  const n = (v) => (v < 0 ? MINUS : '') + String(Math.abs(v));
  const xy = (p) => `${n(p[0])}, ${n(p[1])}`;
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';

  // ------------------------------------------------------------------------------
  // drawing ops (plane units, y up)
  // ------------------------------------------------------------------------------
  const op = (k, id, o) => Object.assign({ id, k }, o);
  const OP = {
    plane: (id, win) => op('plane', id, { win }),
    seg: (id, a, b, o = {}) => op('seg', id, Object.assign({ a, b, st: 'main', col: 'teal' }, o)),
    line: (id, eq, lab, o = {}) => op('line', id, Object.assign({ eq, lab, st: 'help', col: 'plum' }, o)),
    pt: (id, p, tag, o = {}) => op('pt', id, Object.assign({ p, tag, col: 'teal' }, o)),
    proj: (id, p, o = {}) => op('proj', id, Object.assign({ p, col: 'teal' }, o)),
    pieces: (id, a, b, nPieces, m, o = {}) => op('pieces', id, Object.assign({ a, b, n: nPieces, m }, o)),
    pin: (id, p, s = '?', o = {}) => op('pin', id, Object.assign({ p, s, col: 'coral' }, o)),
    walk: (id, a, b, lx, ly, o = {}) => op('walk', id, Object.assign({ a, b, lx, ly, col: 'sun' }, o)),
    poly: (id, pts, o = {}) => op('poly', id, Object.assign({ pts, st: 'main', col: 'teal' }, o)),
    circle: (id, c, r, o = {}) => op('circle', id, Object.assign({ c, r, st: 'help', col: 'plum' }, o)),
    ticks: (id, a, b, o = {}) => op('ticks', id, Object.assign({ a, b, n: 1 }, o)),
    slide: (id, a, b, o = {}) => op('slide', id, Object.assign({ a, b, s: '?', life: 'beat' }, o)),
    label: (id, p, s, o = {}) => op('label', id, Object.assign({ p, s }, o)),
    fill: (id, pts, o = {}) => op('fill', id, Object.assign({ pts, col: 'teal', alpha: 0.16 }, o)),
  };

  // ------------------------------------------------------------------------------
  // narration helpers
  // ------------------------------------------------------------------------------
  const FRW = {
    '1/2': 'one half', '3/4': 'three quarters', '2/3': 'two thirds', '1/3': 'one third', '2/5': 'two fifths',
    '3/7': 'three sevenths', '2/7': 'two sevenths', '5/3': 'five thirds', '3/2': 'three halves', '−1/3': 'minus one third',
  };
  function spellGroup(g) {
    let out = '';
    for (const ch of g) out += ch === '′' ? 'dash ' : SUBS.includes(ch) ? SUBS.indexOf(ch) + ' ' : ch + ' ';
    return out.trim();
  }
  function sayify(s) {
    let x = s.replace(/’/g, "'");
    x = x.replace(/\(ii\)/g, 'two').replace(/\(i\)/g, 'one');
    x = x.replace(/\b([A-Z])\(([^()]*,[^()]*)\)/g, '$1 at $2');
    x = x.replace(/\(([^()]*,[^()]*)\)/g, '$1');
    x = x.replace(/(\w+)\s+:\s+(\w+)/g, '$1 to $2');
    x = x.replace(/(−?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/g, (m, a, b) => FRW[m] || `${a} over ${b}`);
    x = x.replace(/△\s*/g, 'triangle ').replace(/√\s*/g, 'root ').replace(/²/g, ' squared');
    x = x.replace(/\s*≈\s*/g, ' is about ').replace(/\s*×\s*/g, ' times ').replace(/\s*÷\s*/g, ' divided by ');
    x = x.replace(/\s*−\s*/g, ' minus ').replace(/\s*\+\s*/g, ' plus ').replace(/\s*=\s*/g, ' is ');
    x = x.replace(/\s*→\s*/g, ', so ').replace(/✓/g, '').replace(/…/g, ', ').replace(/\//g, ' over ');
    x = x.replace(/(\d+)\s*px\b/g, '$1 pixels');
    x = x.replace(/divided by ([^\s,]+) is\b/g, 'divided by $1, which is');
    x = x.replace(/(\d)([a-z])\b/g, '$1 $2');
    x = x.replace(/([a-z])([₀-₉]+)/g, (m, l, d) => `${l} ${[...d].map((c) => SUBS.indexOf(c)).join(' ')}`);
    x = x.replace(/(?<![A-Za-z])[A-Z][A-Z′₀-₉]*(?![a-z])/g, (g) => (g.length > 1 ? spellGroup(g) : g));
    return x.replace(/\s+([,.!?:])/g, '$1').replace(/\(\s+/g, '(').replace(/\s{2,}/g, ' ').trim();
  }

  // durations, minimum line lengths and drawing sounds (the engine replays the same schedule)
  const LEAD = 0.15;
  const DUR = {
    plane: () => 1.5, seg: () => 0.75, line: () => 0.9, pt: () => 0.32, proj: () => 0.75, pieces: (o) => 0.3 * (o.cuts ? o.cuts.length - 1 : o.n) + 0.3,
    pin: () => 0.4, walk: () => 1.3, poly: (o) => 0.35 * o.pts.length + 0.3, circle: () => 1.1, ticks: () => 0.3, slide: () => 0.3,
    label: () => 0.35, fill: () => 0.5,
  };
  const SOUND = { seg: 'pencil', line: 'pencil', poly: 'pencil', circle: 'compass', pt: 'tick', pin: 'tick' };
  function prep(l, fix) {
    l.say = l.say ? l.say.replace(/’/g, "'") : sayify(l.cap);
    if (fix) fix.forEach(([re, to]) => { l.say = l.say.replace(re, to); });
    if (!l.draw) return l;
    l.draw = l.draw.filter(Boolean);
    let cur = LEAD, prev = cur;
    const fx = [];
    for (const o of l.draw) {
      if (o.dur === undefined) o.dur = Math.round(DUR[o.k](o) * 100) / 100;
      const s0 = o.with ? prev : cur + (o.gap || 0);
      if (SOUND[o.k]) fx.push({ dt: Math.round(s0 * 100) / 100, name: SOUND[o.k] });
      prev = s0; cur = Math.max(cur, s0 + o.dur);
    }
    l.min = Math.round((cur + 0.25) * 100) / 100;
    if (fx.length) l.fx = fx;
    return l;
  }
  const L = (o) => o;
  const pause = { cap: 'Pause & try it first! Then stay till the end!', say: 'Pause and try it first. Then stay till the end!' };

  // the plane window grows to fill the stage (808 × 436 px content box) at scale s
  function fillWin(w, s) {
    const cw = 808 / s, ch = 436 / s, cx = (w.x[0] + w.x[1]) / 2, cy = (w.y[0] + w.y[1]) / 2;
    return { x: [Math.ceil(cx - cw / 2), Math.floor(cx + cw / 2)], y: [Math.ceil(cy - ch / 2), Math.floor(cy + ch / 2)] };
  }
  const planeLine = (s, extra) => L({ cap: `Here is the coordinate plane, drawn to scale: 1 unit = ${s} px.`, legend: { icon: 'scale', s: `Scale: 1 unit = ${s} px` }, draw: [OP.plane('plane', null)].concat(extra || []), sfx: 'whoosh' });
  function dirs(p) {
    const a = p[0] === 0 ? 'on the y-axis' : `${Math.abs(p[0])} ${p[0] > 0 ? 'right' : 'left'}`;
    const b = p[1] === 0 ? 'on the x-axis' : `${Math.abs(p[1])} ${p[1] > 0 ? 'up' : 'down'}`;
    return `${a}, and ${b}`;
  }
  // "A is at (5, −2): 5 right, and 2 down."
  function plot(id, name, p, o = {}) {
    return L({
      cap: o.cap || `${name} is at (${xy(p)}): ${dirs(p)}.`,
      legend: o.legend === false ? undefined : { icon: 'pt', s: `${name}(${xy(p)})` },
      draw: [OP.pt(id, p, `${name}(${xy(p)})`, { col: o.col || 'teal', tp: o.tp }), OP.proj('p' + id, p, { col: o.col || 'teal', noX: o.noX, noY: o.noY }), ...(o.draw || [])],
      hl: o.hl,
    });
  }

  // ------------------------------------------------------------------------------
  // "Know first" blocks (idea pictures are drawn in their own little picture)
  // ------------------------------------------------------------------------------
  const IA = [-3, -1.3], IB = [5, 1.3];
  function knowSection(m, nn, o = {}) {
    const [nA, nB, nP] = o.names || ['A', 'B', 'P'];
    const lines = [
      L({ m: `${m} : ${nn} → ${m + nn} equal pieces, ${nP} after ${m}`, cap: o.cap1 || `Know this first! ${m} : ${nn} means cut AB into ${m} + ${nn} = ${m + nn} equal pieces. P sits after ${m} of them.`, page: 0, sfx: 'pop', draw: [
        OP.seg('kAB', IA, IB, { st: 'thin', col: 'ink', dur: 0.4 }),
        OP.pt('kA', IA, nA, { col: 'teal', tp: [-26, 30] }), OP.pt('kB', IB, nB, { col: 'teal', tp: [26, -30], with: true }),
        OP.pieces('kPieces', IA, IB, m + nn, m, { side: 1 }),
        OP.pin('kP', [IA[0] + (IB[0] - IA[0]) * m / (m + nn), IA[1] + (IB[1] - IA[1]) * m / (m + nn)], nP),
      ] }),
      L({ m: 'x = ((m x₂ + n x₁/m + n))', cap: 'Section formula! x = (m × x₂ + n × x₁) ÷ (m + n).', say: 'Here is the section formula. x is m times x 2, plus n times x 1, all over m plus n.', page: 0 }),
      L({ m: 'y = ((m y₂ + n y₁/m + n))', cap: 'And y = (m × y₂ + n × y₁) ÷ (m + n). Same pattern!', say: 'And y is m times y 2, plus n times y 1, all over m plus n. Same pattern!', page: 0 }),
      L({ m: 'P = ( ((m x₂ + n x₁/m + n)), ((m y₂ + n y₁/m + n)) )', cap: o.ruleCap || 'm goes with the far end B, n with the near end A. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
    ];
    return lines;
  }
  // unknown ratio k : 1
  function knowK(extra) {
    const life = extra.some((l) => l.draw) ? { lifeLines: 2 } : {};
    const w = (o) => Object.assign(o, life);
    return [
      L({ m: 'unknown ratio → call it k : 1', cap: 'Know this first! We don’t know the ratio yet, so we call it k : 1.', page: 0, sfx: 'pop', draw: [
        w(OP.seg('kAB', IA, IB, { st: 'thin', col: 'ink', dur: 0.4 })),
        w(OP.pt('kA', IA, 'A', { col: 'teal', tp: [-26, 30] })), w(OP.pt('kB', IB, 'B', { col: 'teal', tp: [26, -30], with: true })),
        w(OP.pieces('kPieces', IA, IB, 2, 1, { cuts: [0, 0.62, 1], texts: ['k', '1'], side: 1 })),
        w(OP.pin('kP', [IA[0] + (IB[0] - IA[0]) * 0.62, IA[1] + (IB[1] - IA[1]) * 0.62], 'P')),
      ] }),
      L({ m: 'P = ( ((k x₂ + x₁/k + 1)), ((k y₂ + y₁/k + 1)) )', cap: 'The section formula, with k in place of m and 1 in place of n, gives P’s x and y.', page: 0 }),
      ...extra,
    ];
  }
  function knowMid(o = {}) {
    const M = [(IA[0] + IB[0]) / 2, (IA[1] + IB[1]) / 2];
    return [
      L({ m: 'midpoint = exactly halfway', cap: o.cap1 || 'Know this first! The midpoint sits exactly halfway between the two ends.', page: 0, sfx: 'pop', draw: [
        OP.seg('kAB', IA, IB, { col: 'teal', dur: 0.4 }),
        OP.pt('kA', IA, 'A', { col: 'teal', tp: [-26, 30] }), OP.pt('kB', IB, 'B', { col: 'teal', tp: [26, -30], with: true }),
        OP.ticks('kt1', IA, M, { col: 'coral' }), OP.ticks('kt2', M, IB, { col: 'coral', with: true }),
        OP.pin('kM', M, 'M'),
      ] }),
      L({ m: 'its x = ((x₁ + x₂/2))', cap: 'Its x is the average of the two x’s: add them, then divide by 2.', page: 0 }),
      L({ m: 'its y = ((y₁ + y₂/2))', cap: 'Its y is the average of the two y’s.', page: 0 }),
      ...(o.extra || []),
      L({ m: 'M = ( ((x₁ + x₂/2)), ((y₁ + y₂/2)) )', cap: o.ruleCap || 'That’s the midpoint formula: our magic rule!', rule: true, page: 1, sfx: 'ding' }),
    ];
  }
  function knowAxis(axis) {
    const w = { x: [-3, 4], y: [-3, 3] };
    const pts = axis === 'y' ? [[0, 2], [0, -1]] : [[2, 0], [-2, 0]];
    return L({ m: axis === 'y' ? 'on the y-axis, x = 0' : 'on the x-axis, y = 0', cap: axis === 'y' ? 'Every point on the y-axis has x = 0. It is 0 steps right or left!' : 'Every point on the x-axis has y = 0. It is 0 steps up or down!', page: 0, draw: [
      OP.plane('kPlane', w),
      OP.seg('kAxis', axis === 'y' ? [0, -3] : [-3, 0], axis === 'y' ? [0, 3] : [4, 0], { col: 'coral', st: 'help', dur: 0.5 }),
      ...pts.map((p, i) => OP.pt('kq' + i, p, `(${xy(p)})`, { col: 'coral', tp: axis === 'y' ? [62, 0] : [0, -34] })),
    ] });
  }
  function knowOnLine() {
    return L({ m: 'P on a line → P fits its equation', cap: 'If a point is on a line, its x and y make the line’s equation true.', page: 0, draw: [
      OP.line('kLine', [3, 1, -3], '3x + y − 3 = 0', { win: { x: [-0.6, 1.9], y: [-2.8, 4.8] }, lt: 0.1, lo: [100, 0], dur: 0.6 }),
      OP.pt('kLP', [0, 3], '(0, 3)', { col: 'coral', tp: [-58, 6] }),
      OP.label('kChk', [0, 3], '3 × 0 + 3 − 3 = 0 ✓', { off: [150, 70], bg: 'sun' }),
    ] });
  }
  function knowPara() {
    const A = [0, 0], B = [5, 0], C = [7, 3], Dp = [2, 3], M = [3.5, 1.5];
    return [
      L({ m: 'diagonals cut each other in half', cap: 'Know this first! In a parallelogram, the two diagonals cut each other in half.', page: 0, sfx: 'pop', draw: [
        OP.poly('kPar', [A, B, C, Dp], { col: 'teal', fill: 0.14 }),
        OP.seg('kd1', A, C, { st: 'help', col: 'plum', dur: 0.5 }), OP.seg('kd2', B, Dp, { st: 'help', col: 'plum', dur: 0.5 }),
        OP.ticks('kt1', A, M, { col: 'coral' }), OP.ticks('kt2', M, C, { col: 'coral', with: true }),
        OP.ticks('kt3', B, M, { col: 'coral', n: 2, with: true }), OP.ticks('kt4', M, Dp, { col: 'coral', n: 2, with: true }),
        OP.pin('kM', M, 'M'),
      ] }),
      L({ m: 'midpoint of AC = midpoint of BD', cap: 'So both diagonals, AC and BD, have the same midpoint.', page: 0 }),
      L({ m: 'midpoint = ( ((x₁ + x₂/2)), ((y₁ + y₂/2)) )', cap: 'And a midpoint is the average: add the x’s and halve, add the y’s and halve.', page: 0 }),
      L({ m: 'mid AC = mid BD', cap: 'Make the two midpoints equal. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
    ];
  }
  function knowCentroid(o = {}) {
    const A = [3, 5], B = [0, 0], C = [7, 0];
    const mA = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], mB = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2], mC = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    return [
      L({ m: 'median: a corner to the middle of the far side', cap: 'Know this first! A median joins a corner to the middle of the opposite side.', page: 0, sfx: 'pop', draw: [
        OP.poly('kTri', [A, B, C], { col: 'teal', fill: 0.14 }),
        OP.seg('km1', A, mA, { st: 'help', col: 'plum', dur: 0.4 }), OP.ticks('kt1', B, mA, { col: 'coral' }), OP.ticks('kt2', mA, C, { col: 'coral', with: true }),
        OP.seg('km2', B, mB, { st: 'help', col: 'plum', dur: 0.35 }), OP.seg('km3', C, mC, { st: 'help', col: 'plum', dur: 0.35 }),
        OP.pin('kG', G, 'G'),
      ] }),
      ...(o.extra || []),
      L({ m: 'centroid G = ( ((x₁ + x₂ + x₃/3)), ((y₁ + y₂ + y₃/3)) )', cap: 'The medians meet at the centroid G: the average of the 3 corners.', page: 0 }),
      L({ m: 'G = average of the 3 corners', cap: o.ruleCap || 'Add the 3 x’s and divide by 3. Same for the y’s. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
    ];
  }

  // ------------------------------------------------------------------------------
  // assemble one problem
  // ------------------------------------------------------------------------------
  function mk(c) {
    const s = c.s;
    const win = fillWin(c.win, s);
    const fixPlane = (lines) => lines.forEach((l) => (l.draw || []).forEach((o) => { if (o.k === 'plane' && !o.win) o.win = win; }));
    const P = Object.assign({}, c, {
      chapter: `COORDINATES · Q${c.num}`, label: `QUESTION ${c.num}`,
      plane: { win, s }, knowView: c.knowView || { s: 58, idea: true }, sceneTitle: c.sceneTitle || 'THE PLANE', tokens: {},
    });
    fixPlane(P.sceneLines);
    if (P.hook.art && !P.hook.art.win) P.hook.art.win = c.hookWin || c.win;
    return P;
  }

  const PROBLEMS = [];

  // ================================================================== Q1: divide in 3 : 1
  {
    const A = [5, -2], B = [9, 6], Pp = [8, 4];
    PROBLEMS.push(mk({
      id: 'q01', num: 1, slug: 'q01-point-dividing-in-ratio-3-1', title: 'The point that cuts 3 : 1',
      question: 'Find the coordinates of the point which ⟦divides the join of (5, −2) and (9, 6)⟧ in the ⟦ratio 3 : 1 internally⟧.',
      win: { x: [-1, 10], y: [-3, 7] }, s: 42,
      hook: {
        head: ['Cut this line 3 : 1', 'Where is the cut?'], ask: 'P = ( ?, ? )',
        art: { items: [OP.seg('h', A, B), OP.pieces('hp', A, B, 4, 3, { side: -1 }), OP.pt('hA', A, 'A(5, −2)', { tp: [70, 10] }), OP.pt('hB', B, 'B(9, 6)', { tp: [-72, -6] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'Can you find the point that cuts this line in the ratio 3 : 1?' },
          { cap: 'All you need is one little formula!' },
          pause,
        ],
      },
      qLines: [
        { cap: 'Find the point that divides the line from (5, −2) to (9, 6),', mark: [0] },
        { cap: 'in the ratio 3 : 1, between the two ends.', mark: [1] },
      ],
      sceneLines: [
        planeLine(42),
        plot('A', 'A', A, { tp: [-76, 8] }),
        plot('B', 'B', B, { tp: [-74, -4], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join A to B. The point P is somewhere on AB. Where?', legend: { icon: 'pin', s: 'P on AB, AP : PB = 3 : 1' }, draw: [OP.slide('slideP', A, B, { w: 1.1, ph: 0.3 })] }),
      ],
      given: [
        L({ m: 'A(5, −2),  B(9, 6)', cap: 'A is (5, −2) and B is (9, 6).', hl: 'A+B' }),
        L({ m: 'm : n = 3 : 1', cap: 'The ratio m : n is 3 : 1.' }),
      ],
      find: L({ m: 'P(x, y) = ?', cap: 'Find P: its x and its y.' }),
      know: knowSection(3, 1),
      steps: [
        L({ m: 'x₁ = 5, y₁ = −2, x₂ = 9, y₂ = 6', cap: 'Name them: x₁ = 5, y₁ = −2, x₂ = 9, y₂ = 6.', hl: 'A+B' }),
        L({ m: 'x = ((3 × 9 + 1 × 5/3 + 1))', cap: 'x = (3 × 9 + 1 × 5) ÷ (3 + 1).', say: 'x is 3 times 9, plus 1 times 5, all over 3 plus 1.' }),
        L({ m: 'x = ((27 + 5/4)) = ((32/4)) = 8', cap: 'That’s 32 ÷ 4 = 8.', solve: true }),
        L({ m: 'y = ((3 × 6 + 1 × (−2)/3 + 1))', cap: 'y = (3 × 6 + 1 × (−2)) ÷ (3 + 1).', say: 'y is 3 times 6, plus 1 times minus 2, all over 3 plus 1.', page: 1 }),
        L({ m: 'y = ((18 − 2/4)) = ((16/4)) = 4', cap: 'That’s 16 ÷ 4 = 4.', page: 1, solve: true }),
        L({ m: 'P = (8, 4) ✓', cap: 'So P is at (8, 4)!', page: 1, solve: true, draw: [OP.pt('P', Pp, 'P(8, 4)', { col: 'coral', tp: [-72, -8] }), OP.proj('pP', Pp, { col: 'coral' })], hl: 'P' }),
      ],
      answer: { card: ['P = (8, 4)'], cap: 'The point is P(8, 4)!' },
      check: [
        L({ m: 'A → P: 3 right, 6 up · P → B: 1 right, 2 up', cap: 'Check! A to P is 3 right and 6 up. P to B is 1 right and 2 up.', draw: [OP.walk('w1', A, Pp, '3 right', '6 up'), OP.walk('w2', Pp, B, '1', '2', { col: 'plum' })] }),
        L({ m: '3 = 3 × 1 and 6 = 3 × 2 → AP : PB = 3 : 1 ✓', cap: 'The first trip is 3 times the second. So AP : PB = 3 : 1. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q2: midpoint with p and q
  {
    const A = [7, 4], B = [5, 2], M = [6, 3];
    PROBLEMS.push(mk({
      id: 'q02', num: 2, slug: 'q02-midpoint-find-p-and-q', title: 'Midpoint (2p, q): find p and q',
      question: 'The coordinates of the ⟦midpoint⟧ of the line segment joining the points ⟦A(2p + 1, 4)⟧ and ⟦B(5, q − 1)⟧ are ⟦(2p, q)⟧. Find the values of p and q.',
      win: { x: [-1, 9], y: [-1, 6] }, s: 58,
      hook: {
        head: ['The midpoint is (2p, q)', 'Find p and q!'], ask: 'p = ?   q = ?',
        art: { items: [OP.seg('h', A, B), OP.ticks('ht1', A, M, { col: 'coral' }), OP.ticks('ht2', M, B, { col: 'coral' }), OP.pt('hA', A, 'A(2p + 1, 4)', { tp: [0, -36] }), OP.pt('hB', B, 'B(5, q − 1)', { tp: [0, 36] }), OP.pin('hM', M, 'M')] },
        lines: [
          { cap: 'Two points with secret numbers p and q, and their midpoint.' },
          { cap: 'Can you find p and q?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'The midpoint of A(2p + 1, 4) and B(5, q − 1) is (2p, q).', mark: [0, 1, 2, 3] },
        { cap: 'Find the values of p and q.' },
      ],
      sceneLines: [
        planeLine(58),
        L({ cap: 'A’s y is 4, so A lives somewhere on the line y = 4. Its x, 2p + 1, is a secret.', legend: { icon: 'line', s: 'A on y = 4' }, draw: [OP.line('yA', [0, 1, -4], 'y = 4', { st: 'guide', col: 'teal', lt: 0.07, lo: [0, -26] }), OP.slide('sA', [1, 4], [8.5, 4], { s: 'A', col: 'teal', w: 1.2 })] }),
        L({ cap: 'B’s x is 5, so B lives on the line x = 5. Its y, q − 1, is a secret too.', legend: { icon: 'line', s: 'B on x = 5' }, draw: [OP.line('xB', [1, 0, -5], 'x = 5', { st: 'guide', col: 'plum', lt: 0.9, lo: [40, 0] }), OP.slide('sB', [5, -0.5], [5, 5.5], { s: 'B', col: 'plum', w: 0.9, ph: 1 })] }),
      ],
      given: [
        L({ m: 'A(2p + 1, 4),  B(5, q − 1)', cap: 'A is (2p + 1, 4), and B is (5, q − 1).' }),
        L({ m: 'midpoint M = (2p, q)', cap: 'Their midpoint is (2p, q).' }),
      ],
      find: L({ m: 'p = ?  and  q = ?', cap: 'Find p and q.' }),
      know: knowMid(),
      steps: [
        L({ m: '((2p + 1 + 5/2)) = 2p', cap: 'The x’s: (2p + 1 + 5) ÷ 2 must equal 2p.', say: 'The x’s: 2p plus 1 plus 5, over 2, must equal 2p.' }),
        L({ m: '2p + 6 = 4p  →  p = 3', cap: 'So 2p + 6 = 4p. Then 2p = 6, and p = 3!', solve: true }),
        L({ m: '((4 + q − 1/2)) = q', cap: 'The y’s: (4 + q − 1) ÷ 2 must equal q.', say: 'The y’s: 4 plus q minus 1, over 2, must equal q.' }),
        L({ m: 'q + 3 = 2q  →  q = 3', cap: 'So q + 3 = 2q, and q = 3!', solve: true }),
        L({ m: 'A(7, 4),  B(5, 2),  M(6, 3)', cap: 'Now A is (7, 4), B is (5, 2), and the midpoint is (6, 3).', page: 1, draw: [
          OP.pt('A', A, 'A(7, 4)', { tp: [66, -8] }), OP.pt('B', B, 'B(5, 2)', { col: 'plum', tp: [-70, 8] }), OP.seg('AB', A, B),
          OP.pt('M', M, 'M(6, 3)', { col: 'coral', tp: [78, 14] }), OP.ticks('t1', A, M, { col: 'coral' }), OP.ticks('t2', M, B, { col: 'coral', with: true }),
        ], hl: 'M' }),
      ],
      answer: { card: ['p = 3,  q = 3'], cap: 'So p = 3 and q = 3!' },
      check: [
        L({ m: '((7 + 5/2)) = 6 = 2p ✓', cap: 'Check! (7 + 5) ÷ 2 = 6, and 2p = 6.' }),
        L({ m: '((4 + 2/2)) = 3 = q ✓', cap: '(4 + 2) ÷ 2 = 3, and q = 3. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q3: AP/AB = 2/5
  {
    const A = [4, -5], B = [4, 5], Pp = [4, -1];
    PROBLEMS.push(mk({
      id: 'q03', num: 3, slug: 'q03-ap-is-two-fifths-of-ab', title: 'AP is 2/5 of AB',
      question: 'The line segment joining the points ⟦A(4, −5)⟧ and ⟦B(4, 5)⟧ is divided by the point P such that ⟦AP/AB = 2/5⟧. Find the coordinates of P.',
      win: { x: [-2, 7], y: [-6, 6] }, s: 36,
      hook: {
        head: ['AP is ((2/5)) of AB', 'Where is P?'], ask: 'P = ( ?, ? )',
        art: { items: [OP.seg('h', A, B), OP.pieces('hp', A, B, 5, 2, { side: -1 }), OP.pt('hA', A, 'A(4, −5)', { tp: [74, 0] }), OP.pt('hB', B, 'B(4, 5)', { tp: [70, 0] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'P sits on AB, and AP is 2/5 of the whole line.' },
          { cap: 'Can you find P?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'P is on the line from A(4, −5) to B(4, 5).', mark: [0, 1] },
        { cap: 'AP/AB = 2/5. Find the coordinates of P.', mark: [2] },
      ],
      sceneLines: [
        planeLine(36),
        plot('A', 'A', A, { tp: [74, 0] }),
        plot('B', 'B', B, { tp: [70, 0], noX: true, draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them: this line stands straight up. P is on it, 2/5 of the way from A.', legend: { icon: 'pin', s: 'AP = ((2/5)) of AB' }, draw: [OP.slide('slideP', A, B, { w: 1.1 })] }),
      ],
      given: [
        L({ m: 'A(4, −5),  B(4, 5)', cap: 'A is (4, −5) and B is (4, 5).', hl: 'A+B' }),
        L({ m: '((AP/AB)) = ((2/5))', cap: 'AP is 2/5 of AB.' }),
      ],
      find: L({ m: 'P(x, y) = ?', cap: 'Find P.' }),
      know: [
        L({ m: 'AP = 2 parts of 5 → PB = 3 parts', cap: 'Know this first! If AP is 2 parts out of 5, then PB is the other 3 parts.', page: 0, sfx: 'pop', draw: [
          OP.seg('kAB', IA, IB, { st: 'thin', col: 'ink', dur: 0.4 }),
          OP.pt('kA', IA, 'A', { col: 'teal', tp: [-26, 30] }), OP.pt('kB', IB, 'B', { col: 'teal', tp: [26, -30], with: true }),
          OP.pieces('kPieces', IA, IB, 5, 2, { side: 1 }), OP.pin('kP', [IA[0] + (IB[0] - IA[0]) * 0.4, IA[1] + (IB[1] - IA[1]) * 0.4], 'P'),
        ] }),
        L({ m: 'so AP : PB = 2 : 3', cap: 'So P cuts AB in the ratio 2 : 3.', page: 0 }),
        L({ m: 'P = ( ((m x₂ + n x₁/m + n)), ((m y₂ + n y₁/m + n)) )', cap: 'Then use the section formula, with m = 2 and n = 3.', page: 0 }),
        L({ m: 'AP : PB = 2 : (5 − 2) = 2 : 3', cap: 'Turn “2 out of 5” into the ratio 2 : 3. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ],
      steps: [
        L({ m: 'm = 2,  n = 3', cap: 'So m = 2 and n = 3.' }),
        L({ m: 'x = ((2 × 4 + 3 × 4/5)) = ((20/5)) = 4', cap: 'x = (2 × 4 + 3 × 4) ÷ 5 = 20 ÷ 5 = 4.', say: 'x is 2 times 4, plus 3 times 4, over 5. That’s 20 over 5, which is 4.' }),
        L({ m: 'y = ((2 × 5 + 3 × (−5)/5))', cap: 'y = (2 × 5 + 3 × (−5)) ÷ 5.', say: 'y is 2 times 5, plus 3 times minus 5, over 5.' }),
        L({ m: 'y = ((10 − 15/5)) = ((−5/5)) = −1', cap: 'That’s −5 ÷ 5 = −1.', solve: true }),
        L({ m: 'P = (4, −1) ✓', cap: 'So P is at (4, −1)!', page: 1, solve: true, draw: [OP.pt('P', Pp, 'P(4, −1)', { col: 'coral', tp: [76, 0] })], hl: 'P' }),
      ],
      answer: { card: ['P = (4, −1)'], cap: 'The point is P(4, −1)!' },
      check: [
        L({ m: 'AP = 4 units,  AB = 10 units', cap: 'Check! From A up to P is 4 units. From A up to B is 10 units.', draw: [OP.walk('w1', A, Pp, null, '4 units'), OP.walk('w2', Pp, B, null, '6 more', { col: 'plum', lx0: -70 })] }),
        L({ m: '((4/10)) = ((2/5)) ✓', cap: '4/10 = 2/5. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q4: in what ratio does (−4, 6) divide AB?
  {
    const A = [-6, 10], B = [3, -8], Pp = [-4, 6];
    PROBLEMS.push(mk({
      id: 'q04', num: 4, slug: 'q04-ratio-point-minus-4-6-divides-ab', title: 'In what ratio does (−4, 6) cut AB?',
      question: 'In what ratio does the point ⟦(−4, 6)⟧ divide the line segment joining the points ⟦A(−6, 10)⟧ and ⟦B(3, −8)⟧?',
      win: { x: [-8, 5], y: [-9, 11] }, s: 21,
      hook: {
        head: ['(−4, 6) sits on AB', 'In what ratio does it cut AB?'], ask: 'AP : PB = ?',
        art: { items: [OP.seg('h', A, B), OP.pieces('hp', A, B, 2, 1, { cuts: [0, 2 / 9, 1], texts: ['?', '?'], side: -1 }), OP.pt('hA', A, 'A(−6, 10)', { tp: [86, 0] }), OP.pt('hB', B, 'B(3, −8)', { tp: [-80, 0] }), OP.pt('hP', Pp, 'P(−4, 6)', { col: 'coral', tp: [88, 0] })] },
        lines: [
          { cap: 'The point (−4, 6) sits on the line AB.' },
          { cap: 'Can you find the ratio it cuts AB in?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'In what ratio does the point (−4, 6) divide the line', mark: [0] },
        { cap: 'from A(−6, 10) to B(3, −8)?', mark: [1, 2] },
      ],
      sceneLines: [
        planeLine(21),
        plot('A', 'A', A, { tp: [-90, 0] }),
        plot('B', 'B', B, { tp: [86, 0], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'P(−4, 6) is on AB. It cuts AB into two parts: AP and PB.', legend: { icon: 'ratio', s: 'P(−4, 6) cuts AB' }, draw: [OP.pt('P', Pp, 'P(−4, 6)', { col: 'coral', tp: [-92, 0] }), OP.pieces('parts', A, B, 2, 1, { cuts: [0, 2 / 9, 1], texts: ['?', '?'], side: -1 })] }),
      ],
      given: [
        L({ m: 'A(−6, 10),  B(3, −8)', cap: 'A is (−6, 10) and B is (3, −8).', hl: 'A+B' }),
        L({ m: 'P(−4, 6) on AB', cap: 'P is (−4, 6), on AB.', hl: 'P' }),
      ],
      find: L({ m: 'AP : PB = k : 1 = ?', cap: 'Find the ratio AP : PB.' }),
      know: knowK([
        L({ m: 'P’s x (or y) → an equation in k', cap: 'We know P’s x, so we can solve for k.', page: 0 }),
        L({ m: 'x = ((k x₂ + x₁/k + 1))  → solve for k', cap: 'Put in P’s x and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: '−4 = ((k × 3 + (−6)/k + 1))', cap: 'Put in the x’s: −4 = (3k − 6) ÷ (k + 1).', say: 'Put in the x’s: minus 4 equals 3k minus 6, over k plus 1.' }),
        L({ m: '−4k − 4 = 3k − 6', cap: 'Multiply both sides by k + 1: −4k − 4 = 3k − 6.' }),
        L({ m: '2 = 7k  →  k = ((2/7))', cap: 'Move things over: 2 = 7k, so k = 2/7.', solve: true }),
        L({ m: 'ratio = ((2/7)) : 1 = 2 : 7', cap: 'So the ratio is 2/7 : 1. Times 7: that’s 2 : 7!', say: 'So the ratio is two sevenths to 1. Multiply by 7: that’s 2 to 7!', solve: true, page: 1, draw: [OP.pieces('parts2', A, B, 2, 1, { cuts: [0, 2 / 9, 1], texts: ['2', '7'], side: 1 })] }),
      ],
      answer: { card: ['AP : PB = 2 : 7'], cap: 'The point divides AB in the ratio 2 : 7!' },
      check: [
        L({ m: 'y = ((2 × (−8) + 7 × 10/9)) = ((54/9)) = 6 ✓', cap: 'Check with the y’s: (2 × (−8) + 7 × 10) ÷ 9 = 54 ÷ 9 = 6.', say: 'Check with the y’s: 2 times minus 8, plus 7 times 10, over 9. That’s 54 over 9, which is 6.' }),
        L({ m: 'P’s y is 6 ✓', cap: 'That’s exactly P’s y. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q5: trisection
  {
    const A = [2, -2], B = [-7, 4], Pp = [-1, 0], Q = [-4, 2];
    PROBLEMS.push(mk({
      id: 'q05', num: 5, slug: 'q05-points-of-trisection', title: 'Points of trisection',
      question: 'Find the coordinates of the ⟦points of trisection⟧ (i.e., points dividing in three equal parts) of the line segment joining the points ⟦A(2, −2)⟧ and ⟦B(−7, 4)⟧.',
      win: { x: [-8, 3], y: [-3, 5] }, s: 54,
      hook: {
        head: ['Cut AB into 3 equal parts', 'Where are the cuts?'], ask: 'P = ?   Q = ?',
        art: { items: [OP.seg('h', A, B), OP.pieces('hp', A, B, 3, 3, { nums: false }), OP.pt('hA', A, 'A(2, −2)', { tp: [0, 36] }), OP.pt('hB', B, 'B(−7, 4)', { tp: [0, -36] }), OP.pin('hP', Pp, 'P'), OP.pin('hQ', Q, 'Q')] },
        lines: [
          { cap: 'Two cuts chop this line into 3 equal parts.' },
          { cap: 'Can you find both cut points?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'Find the points of trisection: the 2 points that cut a line into 3 equal parts.', mark: [0] },
        { cap: 'The line goes from A(2, −2) to B(−7, 4).', mark: [1] },
      ],
      sceneLines: [
        planeLine(54),
        plot('A', 'A', A, { tp: [0, 38] }),
        plot('B', 'B', B, { tp: [0, -38], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them. Two cut points, P and Q, will make 3 equal pieces.', legend: { icon: 'pin', s: 'P, Q cut AB into 3 equal parts' }, draw: [OP.pieces('parts', A, B, 3, 3, { nums: false })] }),
      ],
      given: [
        L({ m: 'A(2, −2),  B(−7, 4)', cap: 'A is (2, −2) and B is (−7, 4).', hl: 'A+B' }),
        L({ m: '3 equal parts: AP = PQ = QB', cap: 'AP, PQ and QB are all equal.' }),
      ],
      find: L({ m: 'P = ?   Q = ?', cap: 'Find P and Q.' }),
      know: [
        L({ m: '2 cuts → 3 equal pieces', cap: 'Know this first! Two cut points make 3 equal pieces.', page: 0, sfx: 'pop', draw: [
          OP.seg('kAB', IA, IB, { st: 'thin', col: 'ink', dur: 0.4 }),
          OP.pt('kA', IA, 'A', { col: 'teal', tp: [-26, 30] }), OP.pt('kB', IB, 'B', { col: 'teal', tp: [26, -30], with: true }),
          OP.pieces('kPieces', IA, IB, 3, 3, { nums: false }),
          OP.pin('kP', [IA[0] + (IB[0] - IA[0]) / 3, IA[1] + (IB[1] - IA[1]) / 3], 'P'), OP.pin('kQ', [IA[0] + (IB[0] - IA[0]) * 2 / 3, IA[1] + (IB[1] - IA[1]) * 2 / 3], 'Q'),
        ] }),
        L({ m: 'P: AP : PB = 1 : 2', cap: 'P is 1 piece from A and 2 pieces from B: the ratio 1 : 2.', page: 0 }),
        L({ m: 'Q: AQ : QB = 2 : 1', cap: 'Q is 2 pieces from A and 1 piece from B: the ratio 2 : 1.', page: 0 }),
        L({ m: 'P = ( ((m x₂ + n x₁/m + n)), ((m y₂ + n y₁/m + n)) )', cap: 'Use the section formula twice. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ],
      steps: [
        L({ m: 'P = ( ((1 × (−7) + 2 × 2/3)), ((1 × 4 + 2 × (−2)/3)) )', cap: 'For P, ratio 1 : 2. x = (1 × (−7) + 2 × 2) ÷ 3, and y = (1 × 4 + 2 × (−2)) ÷ 3.', say: 'For P, the ratio is 1 to 2. x is minus 7 plus 4, over 3. y is 4 minus 4, over 3.' }),
        L({ m: 'P = ( ((−3/3)), ((0/3)) ) = (−1, 0)', cap: 'That’s (−3 ÷ 3, 0 ÷ 3). So P = (−1, 0)!', say: 'That’s minus 3 over 3, and 0 over 3. So P is minus 1, 0!', solve: true, draw: [OP.pt('P', Pp, 'P(−1, 0)', { col: 'coral', tp: [0, 38] })], hl: 'P' }),
        L({ m: 'Q = ( ((2 × (−7) + 1 × 2/3)), ((2 × 4 + 1 × (−2)/3)) )', cap: 'For Q, ratio 2 : 1. x = (2 × (−7) + 1 × 2) ÷ 3, and y = (2 × 4 + 1 × (−2)) ÷ 3.', say: 'For Q, the ratio is 2 to 1. x is minus 14 plus 2, over 3. y is 8 minus 2, over 3.', page: 1 }),
        L({ m: 'Q = ( ((−12/3)), ((6/3)) ) = (−4, 2)', cap: 'That’s (−12 ÷ 3, 6 ÷ 3). So Q = (−4, 2)!', say: 'That’s minus 12 over 3, and 6 over 3. So Q is minus 4, 2!', page: 1, solve: true, draw: [OP.pt('Q', Q, 'Q(−4, 2)', { col: 'coral', tp: [0, -38] })], hl: 'Q' }),
      ],
      answer: { card: ['P = (−1, 0),  Q = (−4, 2)'], cap: 'The points of trisection are P(−1, 0) and Q(−4, 2)!' },
      check: [
        L({ m: 'A → P → Q → B: each step 3 left, 2 up ✓', cap: 'Check! A to P, P to Q, Q to B: each step is 3 left and 2 up. Equal pieces!', draw: [OP.walk('w1', A, Pp, '3 left', '2 up'), OP.walk('w2', Pp, Q, null, null, { col: 'plum' }), OP.walk('w3', Q, B, null, null)] }),
      ],
    }));
  }

  // ================================================================== Q6: two lines cut two segments
  {
    const A = [1, 3], B = [2, 7], Pi = [10 / 7, 33 / 7], Cc = [3, -1], Dd = [8, 9], Q = [5, 3];
    PROBLEMS.push(mk({
      id: 'q06', num: 6, slug: 'q06-ratio-lines-cut-segments', title: 'Where a line cuts a segment (two parts)',
      question: '(i) Determine the ratio in which the line ⟦3x + y − 9 = 0⟧ divides the line segment joining the points ⟦(1, 3) and (2, 7)⟧. (ii) In what ratio does the line ⟦x − y − 2 = 0⟧ divide the line segment joining ⟦(3, −1) and (8, 9)⟧?',
      win: { x: [-1, 9], y: [-2, 10] }, s: 36,
      hook: {
        head: ['A line cuts a segment', 'In what ratio?'], ask: 'k : 1 = ?',
        art: { items: [OP.line('hl1', [3, 1, -9], '3x + y − 9 = 0', { lt: 0.12, lo: [120, 0] }), OP.seg('h1', A, B), OP.pt('hA', A, '', { tp: [0, 0] }), OP.pt('hB', B, '', {}), OP.pin('hP', Pi), OP.line('hl2', [1, -1, -2], 'x − y − 2 = 0', { col: 'coral', lt: 0.85, lo: [-110, 0] }), OP.seg('h2', Cc, Dd, { col: 'teal' }), OP.pt('hC', Cc, '', {}), OP.pt('hD', Dd, '', {}), OP.pin('hQ', Q)] },
        lines: [
          { cap: 'A line slices right through a segment.' },
          { cap: 'Can you find the ratio it cuts it in? Twice?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'Part (i): the line 3x + y − 9 = 0 cuts the segment from (1, 3) to (2, 7). In what ratio?', mark: [0, 1] },
        { cap: 'Part (ii): the line x − y − 2 = 0 cuts the segment from (3, −1) to (8, 9).', mark: [2, 3] },
      ],
      sceneLines: [
        planeLine(36),
        L({ cap: 'Part (i): A(1, 3) and B(2, 7), and the line 3x + y − 9 = 0.', legend: { icon: 'line', s: '(i) AB and 3x + y − 9 = 0' }, draw: [
          OP.pt('A', A, 'A(1, 3)', { tp: [-66, 6] }), OP.pt('B', B, 'B(2, 7)', { tp: [66, -6] }), OP.seg('AB', A, B),
          OP.line('L1', [3, 1, -9], '3x + y − 9 = 0', { lt: 0.25, lo: [-122, 0] }), OP.pin('P1', Pi),
        ] }),
        L({ cap: 'Part (ii): C(3, −1) and D(8, 9), and the line x − y − 2 = 0.', legend: { icon: 'line', s: '(ii) CD and x − y − 2 = 0' }, draw: [
          OP.pt('C', Cc, 'C(3, −1)', { tp: [74, 8] }), OP.pt('D', Dd, 'D(8, 9)', { tp: [-66, 0] }), OP.seg('CD', Cc, Dd),
          OP.line('L2', [1, -1, -2], 'x − y − 2 = 0', { col: 'coral', lt: 0.8, lo: [96, 22] }), OP.pin('P2', Q),
        ] }),
      ],
      given: [
        L({ m: '(i) A(1, 3), B(2, 7);  3x + y − 9 = 0', cap: 'Part (i): A(1, 3), B(2, 7), and the line 3x + y − 9 = 0.', hl: 'L1' }),
        L({ m: '(ii) C(3, −1), D(8, 9);  x − y − 2 = 0', cap: 'Part (ii): C(3, −1), D(8, 9), and the line x − y − 2 = 0.', hl: 'L2' }),
      ],
      find: L({ m: 'each ratio k : 1 = ?', cap: 'Find each ratio.' }),
      know: knowK([
        knowOnLine(),
        L({ m: 'put the cut point into the equation → k', cap: 'So put the cut point into the equation, and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: 'P = ( ((2k + 1/k + 1)), ((7k + 3/k + 1)) )', cap: 'Part (i): the cut point is ((2k + 1) ÷ (k + 1), (7k + 3) ÷ (k + 1)).', say: 'Part one: the cut point is 2k plus 1 over k plus 1, and 7k plus 3 over k plus 1.', hl: 'AB' }),
        L({ m: '3(2k + 1) + (7k + 3) − 9(k + 1) = 0', cap: 'Put it into 3x + y − 9 = 0, and multiply by k + 1.', hl: 'L1' }),
        L({ m: '4k − 3 = 0  →  k = ((3/4))', cap: 'That gives 4k − 3 = 0, so k = 3/4.' }),
        L({ m: 'ratio (i) = 3 : 4', cap: 'So part (i) is 3/4 : 1, which is 3 : 4!', say: 'So part one is three quarters to 1, which is 3 to 4!', solve: true }),
        L({ m: 'Q = ( ((8k + 3/k + 1)), ((9k − 1/k + 1)) )', cap: 'Part (ii): the cut point is ((8k + 3) ÷ (k + 1), (9k − 1) ÷ (k + 1)).', say: 'Part two: the cut point is 8k plus 3 over k plus 1, and 9k minus 1 over k plus 1.', page: 1, hl: 'CD' }),
        L({ m: '(8k + 3) − (9k − 1) − 2(k + 1) = 0', cap: 'Put it into x − y − 2 = 0, and multiply by k + 1.', page: 1, hl: 'L2' }),
        L({ m: '−3k + 2 = 0  →  k = ((2/3))', cap: 'That gives −3k + 2 = 0, so k = 2/3.', page: 1 }),
        L({ m: 'ratio (ii) = 2 : 3', cap: 'So part (ii) is 2/3 : 1, which is 2 : 3!', say: 'So part two is two thirds to 1, which is 2 to 3!', page: 1, solve: true }),
      ],
      answer: { card: ['(i) 3 : 4', '(ii) 2 : 3'], cap: 'Part (i): 3 : 4. Part (ii): 2 : 3!' },
      check: [
        L({ m: '(i) point ( ((10/7)), ((33/7)) ): ((30/7)) + ((33/7)) − 9 = 0 ✓', cap: 'Check (i): the cut point is (10/7, 33/7), and 30/7 + 33/7 − 63/7 = 0.', draw: [OP.label('c1', Pi, '( ((10/7)), ((33/7)) )', { off: [-104, 0] })] }),
        L({ m: '(ii) point (5, 3): 5 − 3 − 2 = 0 ✓', cap: 'Part (ii)’s point is (5, 3), and 5 − 3 − 2 = 0. They match!', draw: [OP.label('c2', Q, '(5, 3)', { off: [62, 10] })] }),
      ],
    }));
  }

  // ================================================================== Q7: find k, P on x − y + 2 = 0
  {
    const A = [-1, 3], B = [9, 8], Pp = [3, 5];
    PROBLEMS.push(mk({
      id: 'q07', num: 7, slug: 'q07-find-k-point-on-line', title: 'Find k: P on AB and on a line',
      question: 'Point P divides the line segment joining the points ⟦A(−1, 3)⟧ and ⟦B(9, 8)⟧ such that ⟦AP/BP = k/1⟧. If ⟦P lies on the line x − y + 2 = 0⟧, find the value of k.',
      win: { x: [-2, 10], y: [-1, 9] }, s: 42,
      hook: {
        head: ['P is on AB, and on a line', 'Find k!'], ask: 'k = ?',
        art: { items: [OP.line('hl', [1, -1, 2], 'x − y + 2 = 0', { lt: 0.12, lo: [110, 0] }), OP.seg('h', A, B), OP.pt('hA', A, 'A(−1, 3)', { tp: [0, 38] }), OP.pt('hB', B, 'B(9, 8)', { tp: [0, 38] }), OP.pin('hP', Pp, 'P')] },
        lines: [
          { cap: 'P is on the segment AB, and on this line too.' },
          { cap: 'Can you find the ratio k?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'P divides the line from A(−1, 3) to B(9, 8), with AP/BP = k/1.', mark: [0, 1, 2] },
        { cap: 'P also lies on the line x − y + 2 = 0. Find k.', mark: [3] },
      ],
      sceneLines: [
        planeLine(42),
        plot('A', 'A', A, { tp: [0, 38] }),
        plot('B', 'B', B, { tp: [0, 38], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Now the line x − y + 2 = 0. P is where it crosses AB.', legend: { icon: 'line', s: 'x − y + 2 = 0 crosses AB at P' }, draw: [OP.line('L', [1, -1, 2], 'x − y + 2 = 0', { lt: 0.12, lo: [110, 0] }), OP.pin('P?', Pp)] }),
      ],
      given: [
        L({ m: 'A(−1, 3),  B(9, 8)', cap: 'A is (−1, 3) and B is (9, 8).', hl: 'A+B' }),
        L({ m: 'AP : PB = k : 1', cap: 'AP : PB = k : 1.' }),
        L({ m: 'P on x − y + 2 = 0', cap: 'P is on the line x − y + 2 = 0.', hl: 'L' }),
      ],
      find: L({ m: 'k = ?', cap: 'Find k.' }),
      know: knowK([
        knowOnLine(),
        L({ m: 'put P into the equation → k', cap: 'So put P into the line’s equation, and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: 'P = ( ((9k − 1/k + 1)), ((8k + 3/k + 1)) )', cap: 'With ratio k : 1, P = ((9k − 1) ÷ (k + 1), (8k + 3) ÷ (k + 1)).', say: 'With the ratio k to 1, P is 9k minus 1 over k plus 1, and 8k plus 3 over k plus 1.' }),
        L({ m: '(9k − 1) − (8k + 3) + 2(k + 1) = 0', cap: 'Put P into x − y + 2 = 0, and multiply by k + 1.', hl: 'L' }),
        L({ m: '3k − 2 = 0  →  k = ((2/3))', cap: 'That gives 3k − 2 = 0, so k = 2/3!', solve: true }),
        L({ m: 'P = (3, 5)', cap: 'Then P works out to (3, 5).', page: 1, draw: [OP.pt('P', Pp, 'P(3, 5)', { col: 'coral', tp: [-66, -8] })], hl: 'P' }),
      ],
      answer: { card: ['k = ((2/3))'], cap: 'So k = 2/3!' },
      check: [
        L({ m: 'P(3, 5): 3 − 5 + 2 = 0 ✓', cap: 'Check! P(3, 5) is on the line: 3 − 5 + 2 = 0.' }),
        L({ m: 'A → P: 4 right, 2 up · P → B: 6 right, 3 up → 4 : 6 = 2 : 3 ✓', cap: 'And A to P is 4 right, 2 up, while P to B is 6 right, 3 up. 4 : 6 = 2 : 3!', draw: [OP.walk('w1', A, Pp, '4', '2'), OP.walk('w2', Pp, B, '6', '3', { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q8: parallelogram, find a and b
  {
    const A = [-2, -1], B = [1, 0], Cc = [4, 3], Dd = [1, 2], Mm = [1, 1];
    PROBLEMS.push(mk({
      id: 'q08', num: 8, slug: 'q08-parallelogram-find-a-and-b', title: 'Parallelogram: find a and b',
      question: 'If ⟦A(−2, −1), B(a, 0), C(4, b) and D(1, 2)⟧ are the vertices of a ⟦parallelogram⟧, find the values of a and b.',
      win: { x: [-3, 5], y: [-2, 4] }, s: 72,
      hook: {
        head: ['This parallelogram hides a and b', 'Find them!'], ask: 'a = ?   b = ?',
        art: { items: [OP.poly('hp', [A, B, Cc, Dd], { fill: 0.14 }), OP.seg('hd1', A, Cc, { st: 'guide', col: 'plum' }), OP.seg('hd2', B, Dd, { st: 'guide', col: 'plum' }), OP.pt('hA', A, 'A(−2, −1)', { tp: [0, 36] }), OP.pt('hD', Dd, 'D(1, 2)', { tp: [-64, -8] }), OP.pin('hB', B, 'B'), OP.pin('hC', Cc, 'C')] },
        lines: [
          { cap: 'Two corners of this parallelogram have secret numbers.' },
          { cap: 'Can you find them?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'A(−2, −1), B(a, 0), C(4, b) and D(1, 2) are the corners of a parallelogram.', say: 'Eigh at minus 2, minus 1. B at Eigh, 0. C at 4, b. And D at 1, 2. They are the corners of a parallelogram.', mark: [0, 1] },
        { cap: 'Find a and b.', say: 'Find Eigh and b.' },
      ],
      sceneLines: [
        planeLine(72),
        plot('A', 'A', A, { tp: [0, 38] }),
        plot('D', 'D', Dd, { tp: [-66, -8] }),
        L({ cap: 'B(a, 0) has y = 0: it sits on the x-axis. C(4, b) sits on the line x = 4.', say: 'B has y equal to 0, so it sits on the x-axis. C sits on the line x equals 4.', legend: { icon: 'pin', s: 'B on the x-axis, C on x = 4' }, draw: [OP.slide('sB', [-1.5, 0], [4, 0], { s: 'B', col: 'plum', w: 1.1 }), OP.line('xC', [1, 0, -4], 'x = 4', { st: 'guide', col: 'teal', lt: 0.12, lo: [40, 0] }), OP.slide('sC', [4, -1], [4, 3.6], { s: 'C', col: 'plum', w: 0.9, ph: 1.2 })] }),
      ],
      given: [
        L({ m: 'A(−2, −1),  B(a, 0),  C(4, b),  D(1, 2)', cap: 'The corners are A(−2, −1), B(a, 0), C(4, b) and D(1, 2).', say: 'The corners are Eigh at minus 2, minus 1. B at Eigh, 0. C at 4, b. And D at 1, 2.' }),
        L({ m: 'ABCD is a parallelogram', cap: 'ABCD is a parallelogram.' }),
      ],
      find: L({ m: 'a = ?   b = ?', cap: 'Find a and b.', say: 'Find Eigh and b.' }),
      know: knowPara(),
      steps: [
        L({ m: 'mid AC = ( ((−2 + 4/2)), ((−1 + b/2)) ) = ( 1, ((b − 1/2)) )', cap: 'Midpoint of AC: ((−2 + 4) ÷ 2, (−1 + b) ÷ 2) = (1, (b − 1) ÷ 2).', say: 'The midpoint of A C: minus 2 plus 4, over 2, is 1. And its y is b minus 1, over 2.' }),
        L({ m: 'mid BD = ( ((a + 1/2)), ((0 + 2/2)) ) = ( ((a + 1/2)), 1 )', cap: 'Midpoint of BD: ((a + 1) ÷ 2, (0 + 2) ÷ 2) = ((a + 1) ÷ 2, 1).', say: 'The midpoint of B D: its x is Eigh plus 1, over 2. Its y is 0 plus 2, over 2, which is 1.' }),
        L({ m: '((a + 1/2)) = 1  →  a = 1', cap: 'The x’s must match: (a + 1) ÷ 2 = 1, so a = 1!', say: 'The x’s must match: Eigh plus 1, over 2, equals 1. So Eigh is 1!', solve: true }),
        L({ m: '((b − 1/2)) = 1  →  b = 3', cap: 'The y’s must match: (b − 1) ÷ 2 = 1, so b = 3!', solve: true }),
        L({ m: 'B(1, 0),  C(4, 3)', cap: 'So B is (1, 0) and C is (4, 3).', page: 1, draw: [
          OP.pt('B', B, 'B(1, 0)', { col: 'plum', tp: [58, 20] }), OP.pt('C', Cc, 'C(4, 3)', { col: 'plum', tp: [-66, -10] }),
          OP.poly('par', [A, B, Cc, Dd], { fill: 0.14 }), OP.seg('d1', A, Cc, { st: 'guide', col: 'plum' }), OP.seg('d2', B, Dd, { st: 'guide', col: 'plum', with: true }),
          OP.pt('M', Mm, '', { col: 'coral' }),
        ], hl: 'par' }),
      ],
      answer: { card: ['a = 1,  b = 3'], cap: 'So a = 1 and b = 3!', say: 'So Eigh is 1, and b is 3!' },
      check: [
        L({ m: 'A → B: 3 right, 1 up · D → C: 3 right, 1 up ✓', cap: 'Check! A to B is 3 right, 1 up. D to C is also 3 right, 1 up. The opposite sides match!', draw: [OP.walk('w1', A, B, '3', '1'), OP.walk('w2', Dd, Cc, '3', '1', { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q9: y-axis cuts (5, −6)–(−1, −4)
  {
    const A = [5, -6], B = [-1, -4], Pp = [0, -13 / 3];
    PROBLEMS.push(mk({
      id: 'q09', num: 9, slug: 'q09-y-axis-divides-segment', title: 'Where the y-axis cuts a segment',
      question: 'Find the ratio in which the ⟦y-axis⟧ divides the line segment joining the points ⟦(5, −6) and (−1, −4)⟧. Also find the ⟦point of intersection⟧.',
      win: { x: [-2, 6], y: [-7, 1] }, s: 54,
      hook: {
        head: ['The y-axis cuts this line', 'In what ratio? At what point?'], ask: 'k : 1 = ?   P = ?',
        art: { items: [OP.seg('h', A, B), OP.pt('hA', A, 'A(5, −6)', { tp: [0, 38] }), OP.pt('hB', B, 'B(−1, −4)', { tp: [0, -38] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'The y-axis slices through this line.' },
          { cap: 'Can you find the ratio, and the point where it cuts?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'In what ratio does the y-axis divide the line from (5, −6) to (−1, −4)?', mark: [0, 1] },
        { cap: 'Also find the point where they meet.', mark: [2] },
      ],
      sceneLines: [
        planeLine(54),
        plot('A', 'A', A, { tp: [0, 38] }),
        plot('B', 'B', B, { tp: [0, -38], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them. The y-axis crosses AB at a point P.', legend: { icon: 'pin', s: 'the y-axis cuts AB at P' }, draw: [OP.pin('P?', Pp)] }),
      ],
      given: [
        L({ m: 'A(5, −6),  B(−1, −4)', cap: 'A is (5, −6) and B is (−1, −4).', hl: 'A+B' }),
        L({ m: 'P on the y-axis', cap: 'The cut point P is on the y-axis.' }),
      ],
      find: L({ m: 'k : 1 = ?   P = ?', cap: 'Find the ratio, and the point P.' }),
      know: knowK([
        knowAxis('y'),
        L({ m: 'set P’s x = 0 → k', cap: 'So set P’s x to 0, and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: 'x = ((k × (−1) + 5/k + 1)) = 0', cap: 'P is on the y-axis, so its x is 0: (−k + 5) ÷ (k + 1) = 0.', say: 'P is on the y-axis, so its x is 0. Minus k plus 5, over k plus 1, is 0.' }),
        L({ m: '−k + 5 = 0  →  k = 5', cap: 'So −k + 5 = 0, and k = 5. The ratio is 5 : 1!', solve: true }),
        L({ m: 'y = ((5 × (−4) + 1 × (−6)/6))', cap: 'Now P’s y: (5 × (−4) + 1 × (−6)) ÷ 6.', say: 'Now P’s y: 5 times minus 4, plus 1 times minus 6, over 6.' }),
        L({ m: 'y = ((−26/6)) = ((−13/3))', cap: 'That’s −26 ÷ 6 = −13/3.', solve: true }),
        L({ m: 'P = ( 0, ((−13/3)) ) ≈ (0, −4.33)', cap: 'So P is (0, −13/3), about (0, −4.33).', page: 1, draw: [OP.pt('P', Pp, 'P( 0, ((−13/3)) )', { col: 'coral', tp: [-96, 12] })], hl: 'P' }),
      ],
      answer: { card: ['ratio 5 : 1', 'P = ( 0, ((−13/3)) )'], cap: 'The ratio is 5 : 1, and the point is (0, −13/3)!' },
      check: [
        L({ m: 'A → P: 5 left · P → B: 1 left → 5 : 1 ✓', cap: 'Check! From A to the y-axis is 5 steps left. From there to B is 1 more step left. 5 : 1!', draw: [OP.walk('w1', A, [0, -6], '5 left', null), OP.walk('w2', [0, -4], B, '1 left', null, { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q10: x-axis cuts A(1, −5)–B(−4, 5)
  {
    const A = [1, -5], B = [-4, 5], Pp = [-1.5, 0];
    PROBLEMS.push(mk({
      id: 'q10', num: 10, slug: 'q10-x-axis-divides-segment', title: 'Where the x-axis cuts a segment',
      question: 'Find the ratio in which the line segment joining ⟦A(1, −5) and B(−4, 5)⟧ is divided by the ⟦x-axis⟧. Also find the ⟦coordinates of the point of division⟧.',
      win: { x: [-5, 2], y: [-6, 6] }, s: 36,
      hook: {
        head: ['The x-axis cuts AB', 'In what ratio? At what point?'], ask: 'k : 1 = ?   P = ?',
        art: { items: [OP.seg('h', A, B), OP.pt('hA', A, 'A(1, −5)', { tp: [70, 0] }), OP.pt('hB', B, 'B(−4, 5)', { tp: [-76, 0] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'The x-axis slices right through AB.' },
          { cap: 'Can you find the ratio, and the point?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'In what ratio does the x-axis divide the line from A(1, −5) to B(−4, 5)?', mark: [0, 1] },
        { cap: 'Also find the point of division.', mark: [2] },
      ],
      sceneLines: [
        planeLine(36),
        plot('A', 'A', A, { tp: [70, 0] }),
        plot('B', 'B', B, { tp: [-76, 0], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them. The x-axis crosses AB at a point P.', legend: { icon: 'pin', s: 'the x-axis cuts AB at P' }, draw: [OP.pin('P?', Pp)] }),
      ],
      given: [
        L({ m: 'A(1, −5),  B(−4, 5)', cap: 'A is (1, −5) and B is (−4, 5).', hl: 'A+B' }),
        L({ m: 'P on the x-axis', cap: 'The cut point P is on the x-axis.' }),
      ],
      find: L({ m: 'k : 1 = ?   P = ?', cap: 'Find the ratio, and the point P.' }),
      know: knowK([
        knowAxis('x'),
        L({ m: 'set P’s y = 0 → k', cap: 'So set P’s y to 0, and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: 'y = ((k × 5 + (−5)/k + 1)) = 0', cap: 'P is on the x-axis, so its y is 0: (5k − 5) ÷ (k + 1) = 0.', say: 'P is on the x-axis, so its y is 0. 5k minus 5, over k plus 1, is 0.' }),
        L({ m: '5k − 5 = 0  →  k = 1', cap: 'So 5k = 5, and k = 1. The ratio is 1 : 1!', solve: true }),
        L({ m: 'x = ((1 × (−4) + 1 × 1/2)) = ((−3/2))', cap: 'P’s x: (−4 + 1) ÷ 2 = −3/2.', say: 'P’s x: minus 4 plus 1, over 2, is minus 3 over 2.', solve: true }),
        L({ m: 'P = ( ((−3/2)), 0 )', cap: 'So P is (−3/2, 0).', page: 1, draw: [OP.pt('P', Pp, 'P( ((−3/2)), 0 )', { col: 'coral', tp: [-92, -26] })], hl: 'P' }),
      ],
      answer: { card: ['ratio 1 : 1', 'P = ( ((−3/2)), 0 )'], cap: 'The ratio is 1 : 1, and the point is (−3/2, 0)!' },
      check: [
        L({ m: '1 : 1 = the midpoint: ( ((1 + (−4)/2)), ((−5 + 5/2)) ) = ( ((−3/2)), 0 ) ✓', cap: 'Check! 1 : 1 means the midpoint: ((1 − 4) ÷ 2, (−5 + 5) ÷ 2) = (−3/2, 0). It matches!', say: 'Check! 1 to 1 means the midpoint. 1 minus 4, over 2, and minus 5 plus 5, over 2. That’s minus 3 over 2, and 0. It matches!', draw: [OP.ticks('t1', A, Pp, { col: 'coral' }), OP.ticks('t2', Pp, B, { col: 'coral', with: true })] }),
      ],
    }));
  }

  // ================================================================== Q11: parallelogram, find p
  {
    const A = [6, 1], B = [8, 2], Cc = [9, 4], Dd = [7, 3], Mm = [7.5, 2.5];
    PROBLEMS.push(mk({
      id: 'q11', num: 11, slug: 'q11-parallelogram-find-p', title: 'Parallelogram: find p',
      question: 'If the points ⟦A(6, 1), B(8, 2), C(9, 4) and D(p, 3)⟧ are the vertices of a ⟦parallelogram, taken in order⟧, find the value of p.',
      win: { x: [-1, 10], y: [-1, 5] }, s: 72,
      hook: {
        head: ['Parallelogram ABCD', 'D is (p, 3). Find p!'], ask: 'p = ?',
        art: { win: { x: [4, 10], y: [0, 5] }, items: [OP.poly('hp', [A, B, Cc, Dd], { fill: 0.14 }), OP.seg('hd1', A, Cc, { st: 'guide', col: 'plum' }), OP.seg('hd2', B, Dd, { st: 'guide', col: 'plum' }), OP.pt('hA', A, 'A(6, 1)', { tp: [0, 36] }), OP.pt('hB', B, 'B(8, 2)', { tp: [64, 10] }), OP.pt('hC', Cc, 'C(9, 4)', { tp: [0, -36] }), OP.pin('hD', Dd, 'D')] },
        lines: [
          { cap: 'Three corners of this parallelogram are known.' },
          { cap: 'Can you find the fourth one?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'A(6, 1), B(8, 2), C(9, 4) and D(p, 3) are the corners of a parallelogram, in order.', mark: [0, 1] },
        { cap: 'Find the value of p.' },
      ],
      sceneLines: [
        planeLine(72),
        L({ cap: 'Plot A(6, 1), B(8, 2) and C(9, 4).', legend: { icon: 'pt', s: 'A(6, 1),  B(8, 2),  C(9, 4)' }, draw: [
          OP.pt('A', A, 'A(6, 1)', { tp: [0, 36] }), OP.pt('B', B, 'B(8, 2)', { tp: [66, 12] }), OP.pt('C', Cc, 'C(9, 4)', { tp: [0, -36] }),
          OP.seg('AB', A, B, { st: 'help' }), OP.seg('BC', B, Cc, { st: 'help' }),
        ] }),
        L({ cap: 'D(p, 3) has y = 3, so it sits on the line y = 3. Where exactly?', legend: { icon: 'pin', s: 'D on the line y = 3' }, draw: [OP.line('yD', [0, 1, -3], 'y = 3', { st: 'guide', col: 'plum', lt: 0.06, lo: [0, -24] }), OP.slide('sD', [4.5, 3], [8.5, 3], { s: 'D', col: 'plum', w: 1.2 })] }),
      ],
      given: [
        L({ m: 'A(6, 1),  B(8, 2),  C(9, 4),  D(p, 3)', cap: 'A(6, 1), B(8, 2), C(9, 4) and D(p, 3).' }),
        L({ m: 'ABCD is a parallelogram', cap: 'ABCD is a parallelogram.' }),
      ],
      find: L({ m: 'p = ?', cap: 'Find p.' }),
      know: knowPara(),
      steps: [
        L({ m: 'mid AC = ( ((6 + 9/2)), ((1 + 4/2)) ) = ( ((15/2)), ((5/2)) )', cap: 'Midpoint of AC: ((6 + 9) ÷ 2, (1 + 4) ÷ 2) = (15/2, 5/2).', say: 'The midpoint of A C: 6 plus 9, over 2, and 1 plus 4, over 2. That’s 15 over 2, and 5 over 2.' }),
        L({ m: 'mid BD = ( ((8 + p/2)), ((2 + 3/2)) )', cap: 'Midpoint of BD: ((8 + p) ÷ 2, (2 + 3) ÷ 2).', say: 'The midpoint of B D: 8 plus p, over 2, and 2 plus 3, over 2.' }),
        L({ m: '((8 + p/2)) = ((15/2))  →  8 + p = 15', cap: 'The x’s must match: (8 + p) ÷ 2 = 15/2, so 8 + p = 15.' }),
        L({ m: 'p = 7', cap: 'So p = 7!', solve: true, page: 1, draw: [
          OP.pt('D', Dd, 'D(7, 3)', { col: 'coral', tp: [-66, -8] }), OP.poly('par', [A, B, Cc, Dd], { fill: 0.14 }),
          OP.seg('d1', A, Cc, { st: 'guide', col: 'plum' }), OP.seg('d2', B, Dd, { st: 'guide', col: 'plum', with: true }), OP.pt('M', Mm, '', { col: 'coral' }),
        ], hl: 'D' }),
      ],
      answer: { card: ['p = 7'], cap: 'So p = 7, and D is (7, 3)!' },
      check: [
        L({ m: 'A → B: 2 right, 1 up · D → C: 2 right, 1 up ✓', cap: 'Check! A to B is 2 right, 1 up. D to C is also 2 right, 1 up. Opposite sides match!', draw: [OP.walk('w1', A, B, '2', '1'), OP.walk('w2', Dd, Cc, '2', '1', { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q12: AP = 3/7 AB
  {
    const A = [-2, -2], B = [2, -4], Pp = [-2 / 7, -20 / 7];
    PROBLEMS.push(mk({
      id: 'q12', num: 12, slug: 'q12-ap-is-three-sevenths-of-ab', title: 'AP is 3/7 of AB',
      question: 'If A and B are two points having coordinates ⟦(−2, −2) and (2, −4)⟧ respectively, find the coordinates of P such that ⟦AP = 3/7 AB⟧ and P lies on the line segment AB.',
      win: { x: [-3, 3], y: [-5, 1] }, s: 72,
      hook: {
        head: ['AP is ((3/7)) of AB', 'Where is P?'], ask: 'P = ( ?, ? )',
        art: { items: [OP.seg('h', A, B), OP.pieces('hp', A, B, 7, 3, { side: 1 }), OP.pt('hA', A, 'A(−2, −2)', { tp: [0, -38] }), OP.pt('hB', B, 'B(2, −4)', { tp: [0, 38] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'P is on AB, and AP is 3/7 of the whole line.' },
          { cap: 'Can you find P?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'A is (−2, −2) and B is (2, −4).', mark: [0] },
        { cap: 'Find P on AB, with AP = 3/7 of AB.', mark: [1] },
      ],
      sceneLines: [
        planeLine(72),
        plot('A', 'A', A, { tp: [0, -38] }),
        plot('B', 'B', B, { tp: [0, 38], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them. P is on AB, 3/7 of the way from A.', legend: { icon: 'pin', s: 'AP = ((3/7)) of AB' }, draw: [OP.slide('slideP', A, B, { w: 1.1 })] }),
      ],
      given: [
        L({ m: 'A(−2, −2),  B(2, −4)', cap: 'A is (−2, −2) and B is (2, −4).', hl: 'A+B' }),
        L({ m: 'AP = ((3/7)) AB', cap: 'AP is 3/7 of AB.' }),
      ],
      find: L({ m: 'P(x, y) = ?', cap: 'Find P.' }),
      know: [
        L({ m: 'AP = 3 parts of 7 → PB = 4 parts', cap: 'Know this first! If AP is 3 parts out of 7, then PB is the other 4 parts.', page: 0, sfx: 'pop', draw: [
          OP.seg('kAB', IA, IB, { st: 'thin', col: 'ink', dur: 0.4 }),
          OP.pt('kA', IA, 'A', { col: 'teal', tp: [-26, 30] }), OP.pt('kB', IB, 'B', { col: 'teal', tp: [26, -30], with: true }),
          OP.pieces('kPieces', IA, IB, 7, 3, { side: 1 }), OP.pin('kP', [IA[0] + (IB[0] - IA[0]) * 3 / 7, IA[1] + (IB[1] - IA[1]) * 3 / 7], 'P'),
        ] }),
        L({ m: 'so AP : PB = 3 : 4', cap: 'So P cuts AB in the ratio 3 : 4.', page: 0 }),
        L({ m: 'P = ( ((m x₂ + n x₁/m + n)), ((m y₂ + n y₁/m + n)) )', cap: 'Then use the section formula, with m = 3 and n = 4.', page: 0 }),
        L({ m: 'AP : PB = 3 : (7 − 3) = 3 : 4', cap: 'Turn “3 out of 7” into the ratio 3 : 4. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ],
      steps: [
        L({ m: 'm = 3,  n = 4', cap: 'So m = 3 and n = 4.' }),
        L({ m: 'x = ((3 × 2 + 4 × (−2)/7)) = ((−2/7))', cap: 'x = (3 × 2 + 4 × (−2)) ÷ 7 = −2/7.', say: 'x is 3 times 2, plus 4 times minus 2, over 7. That’s minus 2 over 7.', solve: true }),
        L({ m: 'y = ((3 × (−4) + 4 × (−2)/7)) = ((−20/7))', cap: 'y = (3 × (−4) + 4 × (−2)) ÷ 7 = −20/7.', say: 'y is 3 times minus 4, plus 4 times minus 2, over 7. That’s minus 20 over 7.', solve: true }),
        L({ m: 'P = ( ((−2/7)), ((−20/7)) ) ≈ (−0.29, −2.86)', cap: 'So P is (−2/7, −20/7), about (−0.29, −2.86).', page: 1, draw: [OP.pt('P', Pp, 'P( ((−2/7)), ((−20/7)) )', { col: 'coral', tp: [0, -52] })], hl: 'P' }),
      ],
      answer: { card: ['P = ( ((−2/7)), ((−20/7)) )'], cap: 'The point is P(−2/7, −20/7)!' },
      check: [
        L({ m: 'A → B: 4 right, 2 down', cap: 'Check! A to B is 4 right and 2 down.', draw: [OP.walk('w1', A, B, '4 right', '2 down')] }),
        L({ m: 'A → P: ((12/7)) right, ((6/7)) down = ((3/7)) of it ✓', cap: 'A to P is 12/7 right and 6/7 down: exactly 3/7 of the trip!' }),
      ],
    }));
  }

  // ================================================================== Q13: diameter AB, centre (2, −3), B(1, 4)
  {
    const O = [2, -3], B = [1, 4], A = [3, -10], r = Math.sqrt(50);
    PROBLEMS.push(mk({
      id: 'q13', num: 13, slug: 'q13-other-end-of-diameter', title: 'The other end of a diameter',
      question: 'Find the coordinates of a point A, where ⟦AB is the diameter⟧ of a circle whose ⟦centre is (2, −3)⟧ and ⟦B is (1, 4)⟧.',
      win: { x: [-6, 10], y: [-11, 5] }, s: 27,
      hook: {
        head: ['AB goes right across the circle', 'Where is A?'], ask: 'A = ( ?, ? )',
        art: { items: [OP.circle('hc', O, r, { fill: 0.08 }), OP.seg('hd', B, A, { st: 'guide', col: 'coral' }), OP.pt('hO', O, 'O(2, −3)', { col: 'plum', tp: [70, 0] }), OP.pt('hB', B, 'B(1, 4)', { tp: [0, -36] }), OP.pin('hA', A, 'A')] },
        lines: [
          { cap: 'We know the centre of this circle, and one end of a diameter.' },
          { cap: 'Can you find the other end?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'AB is a diameter of a circle. Its centre is (2, −3), and B is (1, 4).', mark: [0, 1, 2] },
        { cap: 'Find the coordinates of A.' },
      ],
      sceneLines: [
        planeLine(27),
        plot('O', 'O', O, { col: 'plum', tp: [72, 0], cap: 'The centre O is at (2, −3): 2 right, and 3 down.' }),
        plot('B', 'B', B, { tp: [0, -36], draw: [OP.circle('circ', O, r, { fill: 0.06 })] }),
        L({ cap: 'The diameter goes from B, through the centre, to the other side. That end is A.', legend: { icon: 'circle', s: 'AB is a diameter' }, draw: [OP.seg('diam', B, A, { st: 'guide', col: 'coral' }), OP.pin('A?', A)] }),
      ],
      given: [
        L({ m: 'centre O(2, −3),  B(1, 4)', cap: 'The centre is O(2, −3), and B is (1, 4).', hl: 'O+B' }),
        L({ m: 'AB is a diameter', cap: 'AB is a diameter.', hl: 'diam' }),
      ],
      find: L({ m: 'A(x, y) = ?', cap: 'Find A.' }),
      know: knowMid({
        cap1: 'Know this first! The centre sits exactly halfway along any diameter.',
        ruleCap: 'So the centre is the midpoint of AB. That’s our magic rule!',
      }),
      steps: [
        L({ m: '((x + 1/2)) = 2  →  x = 3', cap: 'The centre is the midpoint of AB. So (x + 1) ÷ 2 = 2, and x = 3.', say: 'The centre is the midpoint of A B. So x plus 1, over 2, is 2, and x is 3.', solve: true }),
        L({ m: '((y + 4/2)) = −3  →  y + 4 = −6', cap: 'And (y + 4) ÷ 2 = −3, so y + 4 = −6.', say: 'And y plus 4, over 2, is minus 3. So y plus 4 is minus 6.' }),
        L({ m: 'y = −10', cap: 'So y = −10.', solve: true }),
        L({ m: 'A = (3, −10) ✓', cap: 'So A is at (3, −10)!', page: 1, solve: true, draw: [OP.pt('A', A, 'A(3, −10)', { col: 'coral', tp: [80, 0] })], hl: 'A' }),
      ],
      answer: { card: ['A = (3, −10)'], cap: 'The other end is A(3, −10)!' },
      check: [
        L({ m: 'B → O: 1 right, 7 down · O → A: 1 right, 7 down ✓', cap: 'Check! B to the centre is 1 right and 7 down. The centre to A is the same. It matches!', draw: [OP.walk('w1', B, O, '1', '7 down'), OP.walk('w2', O, A, '1', '7 down', { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q14: midpoint on x + y − 10 = 0
  {
    const A = [3, 4], B = [7, 6], Pp = [5, 5];
    PROBLEMS.push(mk({
      id: 'q14', num: 14, slug: 'q14-midpoint-on-a-line-find-k', title: 'Midpoint on a line: find k',
      question: 'If the ⟦midpoint of the line segment joining the points A(3, 4) and B(k, 6)⟧ is ⟦P(x, y)⟧ and ⟦x + y − 10 = 0⟧, find the value of k.',
      win: { x: [-1, 9], y: [-1, 8] }, s: 48,
      hook: {
        head: ['The midpoint sits on a line', 'Find k!'], ask: 'k = ?',
        art: { items: [OP.line('hl', [1, 1, -10], 'x + y − 10 = 0', { lt: 0.2, lo: [118, 0] }), OP.seg('h', A, B), OP.pt('hA', A, 'A(3, 4)', { tp: [0, 38] }), OP.pt('hB', B, 'B(k, 6)', { tp: [64, 0] }), OP.pin('hP', Pp, 'P')] },
        lines: [
          { cap: 'The midpoint of AB lands right on this line.' },
          { cap: 'Can you find the secret number k?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'The midpoint of A(3, 4) and B(k, 6) is P(x, y).', mark: [0, 1] },
        { cap: 'And x + y − 10 = 0. Find k.', mark: [2] },
      ],
      sceneLines: [
        planeLine(48),
        plot('A', 'A', A, { tp: [0, 38] }),
        L({ cap: 'B(k, 6) has y = 6, so B sits on the line y = 6. Where exactly?', legend: { icon: 'pin', s: 'B on the line y = 6' }, draw: [OP.line('yB', [0, 1, -6], 'y = 6', { st: 'guide', col: 'teal', lt: 0.06, lo: [0, -24] }), OP.slide('sB', [4, 6], [8.5, 6], { s: 'B', col: 'teal', w: 1.1 })] }),
        L({ cap: 'And the line x + y − 10 = 0. The midpoint P must sit on it.', legend: { icon: 'line', s: 'P on x + y − 10 = 0' }, draw: [OP.line('L', [1, 1, -10], 'x + y − 10 = 0', { lt: 0.86, lo: [-10, -34] })] }),
      ],
      given: [
        L({ m: 'A(3, 4),  B(k, 6)', cap: 'A is (3, 4) and B is (k, 6).' }),
        L({ m: 'P = midpoint of AB', cap: 'P is the midpoint of AB.' }),
        L({ m: 'P on x + y − 10 = 0', cap: 'P is on the line x + y − 10 = 0.', hl: 'L' }),
      ],
      find: L({ m: 'k = ?', cap: 'Find k.' }),
      know: knowMid({ extra: [], ruleCap: 'Find P with the midpoint formula, then put P into the line. That’s our magic rule!' }),
      steps: [
        L({ m: 'P = ( ((3 + k/2)), ((4 + 6/2)) ) = ( ((3 + k/2)), 5 )', cap: 'P = ((3 + k) ÷ 2, (4 + 6) ÷ 2) = ((3 + k) ÷ 2, 5).', say: 'P is 3 plus k, over 2, and 4 plus 6, over 2. That’s 3 plus k over 2, and 5.' }),
        L({ m: '((3 + k/2)) + 5 − 10 = 0', cap: 'Put P into x + y − 10 = 0.', say: 'Put P into x plus y minus 10 equals 0.', hl: 'L' }),
        L({ m: '((3 + k/2)) = 5  →  3 + k = 10', cap: 'So (3 + k) ÷ 2 = 5, and 3 + k = 10.', say: 'So 3 plus k, over 2, is 5. Then 3 plus k is 10.' }),
        L({ m: 'k = 7', cap: 'So k = 7!', solve: true, page: 1, draw: [
          OP.pt('B', B, 'B(7, 6)', { tp: [66, -6] }), OP.seg('AB', A, B), OP.pt('P', Pp, 'P(5, 5)', { col: 'coral', tp: [-4, -40] }),
          OP.ticks('t1', A, Pp, { col: 'coral' }), OP.ticks('t2', Pp, B, { col: 'coral', with: true }),
        ], hl: 'P' }),
      ],
      answer: { card: ['k = 7'], cap: 'So k = 7!' },
      check: [
        L({ m: 'P = (5, 5):  5 + 5 − 10 = 0 ✓', cap: 'Check! The midpoint is (5, 5), and 5 + 5 − 10 = 0. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q15: y-axis cuts (−2, −3)–(3, 7)
  {
    const A = [-2, -3], B = [3, 7], Pp = [0, 1];
    PROBLEMS.push(mk({
      id: 'q15', num: 15, slug: 'q15-y-axis-divides-segment', title: 'The y-axis cuts a segment: ratio and point',
      question: 'In what ratio is the line segment joining the points ⟦(−2, −3) and (3, 7)⟧ divided by the ⟦y-axis⟧? Also, find the ⟦coordinates of the point of division⟧.',
      win: { x: [-3, 4], y: [-4, 8] }, s: 36,
      hook: {
        head: ['The y-axis cuts this line', 'In what ratio? At what point?'], ask: 'k : 1 = ?   P = ?',
        art: { items: [OP.seg('h', A, B), OP.pt('hA', A, 'A(−2, −3)', { tp: [-86, 0] }), OP.pt('hB', B, 'B(3, 7)', { tp: [72, 0] }), OP.pin('hP', Pp)] },
        lines: [
          { cap: 'The y-axis slices through this line.' },
          { cap: 'Can you find the ratio, and the point?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'In what ratio does the y-axis divide the line from (−2, −3) to (3, 7)?', mark: [0, 1] },
        { cap: 'Also find the point of division.', mark: [2] },
      ],
      sceneLines: [
        planeLine(36),
        plot('A', 'A', A, { tp: [-86, 0] }),
        plot('B', 'B', B, { tp: [72, 0], draw: [OP.seg('AB', A, B)] }),
        L({ cap: 'Join them. The y-axis crosses AB at a point P.', legend: { icon: 'pin', s: 'the y-axis cuts AB at P' }, draw: [OP.pin('P?', Pp)] }),
      ],
      given: [
        L({ m: 'A(−2, −3),  B(3, 7)', cap: 'A is (−2, −3) and B is (3, 7).', hl: 'A+B' }),
        L({ m: 'P on the y-axis', cap: 'The cut point P is on the y-axis.' }),
      ],
      find: L({ m: 'k : 1 = ?   P = ?', cap: 'Find the ratio, and the point P.' }),
      know: knowK([
        knowAxis('y'),
        L({ m: 'set P’s x = 0 → k', cap: 'So set P’s x to 0, and solve for k. That’s our magic rule!', rule: true, page: 1, sfx: 'ding' }),
      ]),
      steps: [
        L({ m: 'x = ((k × 3 + (−2)/k + 1)) = 0', cap: 'P is on the y-axis, so its x is 0: (3k − 2) ÷ (k + 1) = 0.', say: 'P is on the y-axis, so its x is 0. 3k minus 2, over k plus 1, is 0.' }),
        L({ m: '3k − 2 = 0  →  k = ((2/3))  →  2 : 3', cap: 'So 3k = 2, and k = 2/3. The ratio is 2 : 3!', solve: true }),
        L({ m: 'y = ((2 × 7 + 3 × (−3)/5)) = ((5/5)) = 1', cap: 'P’s y: (2 × 7 + 3 × (−3)) ÷ 5 = 5 ÷ 5 = 1.', say: 'P’s y: 2 times 7, plus 3 times minus 3, over 5. That’s 5 over 5, which is 1.', solve: true }),
        L({ m: 'P = (0, 1)', cap: 'So P is (0, 1).', page: 1, draw: [OP.pt('P', Pp, 'P(0, 1)', { col: 'coral', tp: [-64, -8] })], hl: 'P' }),
      ],
      answer: { card: ['ratio 2 : 3', 'P = (0, 1)'], cap: 'The ratio is 2 : 3, and the point is (0, 1)!' },
      check: [
        L({ m: 'A → P: 2 right · P → B: 3 right → 2 : 3 ✓', cap: 'Check! From A to the y-axis is 2 steps right. From there to B is 3 steps right. 2 : 3!', draw: [OP.walk('w1', A, [0, -3], '2 right', null), OP.walk('w2', Pp, [3, 1], '3 right', null, { col: 'plum' })] }),
      ],
    }));
  }

  // ================================================================== Q16: trisect PQ, A on 2x + y + k = 0
  {
    const Pp = [3, 3], Q = [6, -6], A = [4, 0], B = [5, -3];
    PROBLEMS.push(mk({
      id: 'q16', num: 16, slug: 'q16-trisection-point-on-line-find-k', title: 'A trisection point on a line: find k',
      question: 'The line segment joining the points ⟦P(3, 3) and Q(6, −6)⟧ is ⟦trisected at the points A and B⟧ such that ⟦A is nearer to P⟧. If ⟦A is also on the line given by 2x + y + k = 0⟧, find the value of k.',
      win: { x: [-1, 8], y: [-7, 4] }, s: 39,
      hook: {
        head: ['PQ is cut into 3 equal parts', 'A lies on 2x + y + k = 0. Find k!'], ask: 'k = ?',
        art: { items: [OP.seg('h', Pp, Q), OP.pieces('hp', Pp, Q, 3, 3, { nums: false }), OP.pt('hP', Pp, 'P(3, 3)', { tp: [70, 0] }), OP.pt('hQ', Q, 'Q(6, −6)', { tp: [76, 0] }), OP.pin('hA', A, 'A'), OP.pin('hB', B, 'B', { col: 'plum' })] },
        lines: [
          { cap: 'This line is cut into 3 equal parts, and A lies on a line with a secret number k.' },
          { cap: 'Can you find k?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'The line from P(3, 3) to Q(6, −6) is cut into 3 equal parts at A and B. A is nearer P.', mark: [0, 1, 2] },
        { cap: 'A is also on the line 2x + y + k = 0. Find k.', mark: [3] },
      ],
      sceneLines: [
        planeLine(39),
        plot('P', 'P', Pp, { tp: [70, 0] }),
        plot('Q', 'Q', Q, { tp: [76, 0], draw: [OP.seg('PQ', Pp, Q)] }),
        L({ cap: 'Cut PQ into 3 equal parts. A is the cut nearer P, and B the other.', legend: { icon: 'pin', s: 'A, B trisect PQ' }, draw: [OP.pieces('parts', Pp, Q, 3, 3, { nums: false }), OP.pin('A?', A, 'A'), OP.pin('B?', B, 'B', { col: 'plum' })] }),
      ],
      given: [
        L({ m: 'P(3, 3),  Q(6, −6)', cap: 'P is (3, 3) and Q is (6, −6).', hl: 'P+Q' }),
        L({ m: 'PA = AB = BQ,  A nearer P', cap: 'PA, AB and BQ are equal, and A is nearer P.' }),
        L({ m: 'A on 2x + y + k = 0', cap: 'A is on the line 2x + y + k = 0.' }),
      ],
      find: L({ m: 'k = ?', cap: 'Find k.' }),
      know: [
        ...knowSection(1, 2, { names: ['P', 'Q', 'A'], cap1: 'Know this first! A is 1 piece from P and 2 pieces from Q, so PA : AQ = 1 : 2.', ruleCap: 'Find A with the section formula, then put A into the line. That’s our magic rule!' }),
      ],
      steps: [
        L({ m: 'A: m : n = 1 : 2', cap: 'For A, the ratio is 1 : 2.' }),
        L({ m: 'A = ( ((1 × 6 + 2 × 3/3)), ((1 × (−6) + 2 × 3/3)) ) = (4, 0)', cap: 'A = ((1 × 6 + 2 × 3) ÷ 3, (1 × (−6) + 2 × 3) ÷ 3) = (4, 0).', say: 'A is 6 plus 6, over 3, and minus 6 plus 6, over 3. That’s 4, 0.', draw: [OP.pt('A', A, 'A(4, 0)', { col: 'coral', tp: [-66, -10] })], hl: 'A' }),
        L({ m: '2 × 4 + 0 + k = 0', cap: 'Put A(4, 0) into 2x + y + k = 0: 2 × 4 + 0 + k = 0.', say: 'Put A into 2x plus y plus k equals 0. 2 times 4, plus 0, plus k, is 0.' }),
        L({ m: 'k = −8', cap: 'So 8 + k = 0, and k = −8!', solve: true, page: 1, draw: [OP.line('L', [2, 1, -8], '2x + y − 8 = 0', { lt: 0.15, lo: [-118, 0] })] }),
      ],
      answer: { card: ['k = −8'], cap: 'So k = −8!' },
      check: [
        L({ m: 'P → A → B → Q: each step 1 right, 3 down ✓', cap: 'Check! P to A, A to B, B to Q: each step is 1 right and 3 down. Equal parts!', draw: [OP.pt('B', B, 'B(5, −3)', { col: 'plum', tp: [74, 0] }), OP.walk('w1', Pp, A, '1', '3'), OP.walk('w2', A, B, null, null, { col: 'plum' }), OP.walk('w3', B, Q, null, null)] }),
        L({ m: 'A(4, 0):  2 × 4 + 0 − 8 = 0 ✓', cap: 'And 2 × 4 + 0 − 8 = 0, so A is on the line. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q17: triangle from its side midpoints
  {
    const Dm = [3, 4], Em = [4, 6], Fm = [5, 7], A = [6, 9], B = [4, 5], Cc = [2, 3];
    PROBLEMS.push(mk({
      id: 'q17', num: 17, slug: 'q17-triangle-from-midpoints', title: 'A triangle from its three midpoints',
      question: 'If the coordinates of the ⟦midpoints of the sides of a triangle⟧ are ⟦(3, 4), (4, 6) and (5, 7)⟧, find its vertices.',
      win: { x: [-1, 8], y: [-1, 10] }, s: 39,
      hook: {
        head: ['Only the 3 midpoints are known', 'Where are the corners?'], ask: 'A, B, C = ?',
        art: { items: [OP.poly('ht', [A, B, Cc], { st: 'guide', col: 'teal', fill: 0.08 }), OP.pt('hD', Dm, '(3, 4)', { col: 'coral', tp: [-58, 8] }), OP.pt('hE', Em, '(4, 6)', { col: 'coral', tp: [-58, -6] }), OP.pt('hF', Fm, '(5, 7)', { col: 'coral', tp: [60, 10] }), OP.pin('hA', A, 'A', { col: 'plum' }), OP.pin('hB', B, 'B', { col: 'plum' }), OP.pin('hC', Cc, 'C', { col: 'plum' })] },
        lines: [
          { cap: 'We only know the middle of each side of this triangle.' },
          { cap: 'Can you find its three corners?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'The midpoints of the sides of a triangle are (3, 4), (4, 6) and (5, 7).', say: 'The midpoints of the sides of a triangle are: 3, 4. Then 4, 6. And 5, 7.', mark: [0, 1] },
        { cap: 'Find its vertices, the three corners.' },
      ],
      sceneLines: [
        planeLine(39),
        L({ cap: 'Plot the three midpoints: D(3, 4), E(4, 6) and F(5, 7).', legend: { icon: 'pt', s: 'D(3, 4),  E(4, 6),  F(5, 7)' }, draw: [
          OP.pt('D', Dm, 'D(3, 4)', { col: 'coral', tp: [70, 10] }), OP.pt('E', Em, 'E(4, 6)', { col: 'coral', tp: [-70, -4] }), OP.pt('F', Fm, 'F(5, 7)', { col: 'coral', tp: [70, 8] }),
        ] }),
        L({ cap: 'Call the corners A, B and C. D is the middle of BC, E of CA, and F of AB.', legend: { icon: 'tri', s: 'D mid BC, E mid CA, F mid AB' } }),
      ],
      given: [
        L({ m: 'D(3, 4) = mid BC', cap: 'D(3, 4) is the midpoint of BC.', hl: 'D' }),
        L({ m: 'E(4, 6) = mid CA,  F(5, 7) = mid AB', cap: 'E(4, 6) is the midpoint of CA, and F(5, 7) of AB.', hl: 'E+F' }),
      ],
      find: L({ m: 'A(x₁, y₁),  B(x₂, y₂),  C(x₃, y₃) = ?', cap: 'Find the three corners.' }),
      know: knowMid({ extra: [], ruleCap: 'So twice a midpoint’s x is the sum of the two corner x’s. That’s our magic rule!' }),
      steps: [
        L({ m: 'x₂ + x₃ = 6,  x₃ + x₁ = 8,  x₁ + x₂ = 10', cap: 'Double each midpoint’s x: x₂ + x₃ = 6, x₃ + x₁ = 8, x₁ + x₂ = 10.' }),
        L({ m: 'x₁ + x₂ + x₃ = ((24/2)) = 12', cap: 'Add all three: that’s 2 of every x, making 24. So the three x’s add to 12.' }),
        L({ m: 'x₁ = 12 − 6 = 6,  x₂ = 4,  x₃ = 2', cap: 'Take away each pair: x₁ = 12 − 6 = 6, x₂ = 12 − 8 = 4, x₃ = 12 − 10 = 2.', say: 'Take away each pair. x 1 is 12 minus 6, which is 6. x 2 is 12 minus 8, which is 4. x 3 is 12 minus 10, which is 2.', solve: true }),
        L({ m: 'y₂ + y₃ = 8,  y₃ + y₁ = 12,  y₁ + y₂ = 14', cap: 'Same for the y’s: y₂ + y₃ = 8, y₃ + y₁ = 12, y₁ + y₂ = 14.', page: 1 }),
        L({ m: 'y₁ + y₂ + y₃ = ((34/2)) = 17', cap: 'All three add to 34, so the three y’s add to 17.', page: 1 }),
        L({ m: 'y₁ = 17 − 8 = 9,  y₂ = 5,  y₃ = 3', cap: 'So y₁ = 17 − 8 = 9, y₂ = 17 − 12 = 5, y₃ = 17 − 14 = 3.', say: 'So y 1 is 17 minus 8, which is 9. y 2 is 17 minus 12, which is 5. y 3 is 17 minus 14, which is 3.', page: 1, solve: true }),
        L({ m: 'A(6, 9),  B(4, 5),  C(2, 3)', cap: 'The corners are A(6, 9), B(4, 5) and C(2, 3)!', page: 1, solve: true, draw: [
          OP.poly('tri', [A, B, Cc], { col: 'teal', fill: 0.14 }),
          OP.pt('A', A, 'A(6, 9)', { tp: [0, -36] }), OP.pt('B', B, 'B(4, 5)', { tp: [70, 8] }), OP.pt('C', Cc, 'C(2, 3)', { tp: [-68, 8] }),
        ], hl: 'tri' }),
      ],
      answer: { card: ['A(6, 9),  B(4, 5),  C(2, 3)'], cap: 'The vertices are A(6, 9), B(4, 5) and C(2, 3)!' },
      check: [
        L({ m: 'mid BC = ( ((4 + 2/2)), ((5 + 3/2)) ) = (3, 4) ✓', cap: 'Check! The midpoint of BC is ((4 + 2) ÷ 2, (5 + 3) ÷ 2) = (3, 4).', say: 'Check! The midpoint of B C: 4 plus 2 over 2, and 5 plus 3 over 2. That’s 3, 4!' }),
        L({ m: 'mid CA = (4, 6) ✓ · mid AB = (5, 7) ✓', cap: 'And the midpoints of CA and AB are (4, 6) and (5, 7). It matches!' }),
      ],
    }));
  }

  // ================================================================== Q18: median length and centroid
  {
    const A = [5, -1], B = [-3, -2], Cc = [-1, 8], Dm = [-2, 3], G = [1 / 3, 5 / 3];
    PROBLEMS.push(mk({
      id: 'q18', num: 18, slug: 'q18-median-length-and-centroid', title: 'Median length and centroid',
      question: 'If ⟦A(5, −1), B(−3, −2) and C(−1, 8)⟧ are the vertices of triangle ABC, find the ⟦length of median through A⟧ and the ⟦coordinates of the centroid⟧.',
      win: { x: [-4, 6], y: [-3, 9] }, s: 36,
      hook: {
        head: ['Triangle ABC', 'How long is the median? Where is the centroid?'], ask: 'AD = ?   G = ?',
        art: { items: [OP.poly('ht', [A, B, Cc], { fill: 0.12 }), OP.seg('hm', A, Dm, { st: 'help', col: 'plum' }), OP.pt('hA', A, 'A(5, −1)', { tp: [0, 36] }), OP.pt('hB', B, 'B(−3, −2)', { tp: [0, 36] }), OP.pt('hC', Cc, 'C(−1, 8)', { tp: [70, 0] }), OP.pin('hG', G, 'G')] },
        lines: [
          { cap: 'Here is triangle ABC, with a median from A.' },
          { cap: 'How long is it? And where is the centre point?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'Triangle ABC has corners A(5, −1), B(−3, −2) and C(−1, 8).', mark: [0] },
        { cap: 'Find the length of the median through A, and the centroid.', mark: [1, 2] },
      ],
      sceneLines: [
        planeLine(36),
        L({ cap: 'Plot A(5, −1), B(−3, −2) and C(−1, 8), and join them.', legend: { icon: 'tri', s: 'A(5, −1),  B(−3, −2),  C(−1, 8)' }, draw: [
          OP.pt('A', A, 'A(5, −1)', { tp: [0, 36] }), OP.pt('B', B, 'B(−3, −2)', { tp: [0, 36] }), OP.pt('C', Cc, 'C(−1, 8)', { tp: [72, 0] }),
          OP.poly('tri', [A, B, Cc], { fill: 0.12 }),
        ] }),
        L({ cap: 'The median from A goes to D, the middle of BC. G is where the medians meet.', legend: { icon: 'pin', s: 'median AD, centroid G' }, draw: [OP.seg('AD', A, Dm, { st: 'help', col: 'plum' }), OP.pin('D?', Dm, 'D', { col: 'plum' })] }),
      ],
      given: [
        L({ m: 'A(5, −1),  B(−3, −2),  C(−1, 8)', cap: 'A(5, −1), B(−3, −2) and C(−1, 8).', hl: 'tri' }),
      ],
      find: L({ m: 'median AD = ?   centroid G = ?', cap: 'Find the median AD, and the centroid G.' }),
      know: knowCentroid({ extra: [
        L({ m: 'distance = √((x₂ − x₁)² + (y₂ − y₁)²)', cap: 'The distance between two points is the square root of (x difference)² + (y difference)².', say: 'The distance between two points is the square root of: the x difference squared, plus the y difference squared.', page: 0 }),
      ] }),
      steps: [
        L({ m: 'D = ( ((−3 + (−1)/2)), ((−2 + 8/2)) ) = (−2, 3)', cap: 'D, the midpoint of BC: ((−3 − 1) ÷ 2, (−2 + 8) ÷ 2) = (−2, 3).', say: 'D, the midpoint of B C: minus 3 minus 1, over 2, and minus 2 plus 8, over 2. That’s minus 2, 3.', draw: [OP.pt('D', Dm, 'D(−2, 3)', { col: 'plum', tp: [-74, 0] })], hl: 'D' }),
        L({ m: 'AD = √((5 − (−2))² + (−1 − 3)²)', cap: 'AD = √((5 + 2)² + (−1 − 3)²).', say: 'A D is the square root of 5 plus 2, squared, plus minus 1 minus 3, squared.', hl: 'AD' }),
        L({ m: 'AD = √(49 + 16) = √65 ≈ 8.06 units', cap: 'That’s √(49 + 16) = √65, about 8.06 units!', say: 'That is the root of 49 plus 16. Root 65, about 8.06 units!', solve: true }),
        L({ m: 'G = ( ((5 + (−3) + (−1)/3)), ((−1 + (−2) + 8/3)) )', cap: 'Centroid: G = ((5 − 3 − 1) ÷ 3, (−1 − 2 + 8) ÷ 3).', say: 'The centroid G: 5 minus 3 minus 1, over 3, and minus 1 minus 2 plus 8, over 3.', page: 1 }),
        L({ m: 'G = ( ((1/3)), ((5/3)) )', cap: 'So G = (1/3, 5/3)!', page: 1, solve: true, draw: [OP.pt('G', G, 'G( ((1/3)), ((5/3)) )', { col: 'coral', tp: [84, 10] })], hl: 'G' }),
      ],
      answer: { card: ['median AD = √65 ≈ 8.06 units', 'centroid G = ( ((1/3)), ((5/3)) )'], cap: 'The median is √65, about 8.06 units, and the centroid is (1/3, 5/3)!' },
      check: [
        L({ m: 'G is ((2/3)) of the way from A to D: 5 + ((2/3)) × (−7) = ((1/3)) ✓', cap: 'Check! G sits 2/3 of the way from A to D: 5 + 2/3 × (−7) = 1/3. It matches!', say: 'Check! G sits two thirds of the way from A to D. 5 plus two thirds of minus 7 is one third. It matches!' }),
      ],
    }));
  }

  // ================================================================== Q19: third vertex from the centroid (two parts)
  {
    const A1 = [6, 4], B1 = [-2, 2], G1 = [3, 4], C1 = [5, 6];
    const A2 = [3, 2], B2 = [-2, 1], G2 = [5 / 3, -1 / 3], C2 = [4, -4];
    PROBLEMS.push(mk({
      id: 'q19', num: 19, slug: 'q19-third-vertex-from-centroid', title: 'The third corner from the centroid (two parts)',
      question: '(i) Two vertices of a △ABC are given by ⟦A(6, 4) and B(−2, 2)⟧ and its ⟦centroid is G(3, 4)⟧. Find the coordinates of the third vertex C of △ABC. (ii) If ⟦A(3, 2) and B(−2, 1)⟧ are two vertices of a triangle ABC whose ⟦centroid G has coordinates (5/3, −1/3)⟧. Find the coordinates of the third vertex C of the triangle.',
      win: { x: [-3, 7], y: [-5, 7] }, s: 36,
      hook: {
        head: ['Two corners and the centroid', 'Where is the third corner?'], ask: 'C = ?',
        art: { win: { x: [-3, 7], y: [0, 7] }, items: [OP.poly('ht', [A1, B1, C1], { st: 'guide', fill: 0.08 }), OP.pt('hA', A1, 'A(6, 4)', { tp: [66, 6] }), OP.pt('hB', B1, 'B(−2, 2)', { tp: [0, 36] }), OP.pt('hG', G1, 'G(3, 4)', { col: 'plum', tp: [-70, 0] }), OP.pin('hC', C1, 'C')] },
        lines: [
          { cap: 'We know two corners of a triangle, and its centre point.' },
          { cap: 'Can you find the third corner? Twice?' },
          pause,
        ],
      },
      qLines: [
        { cap: 'Part (i): A(6, 4), B(−2, 2), and the centroid G(3, 4). Find C.', mark: [0, 1] },
        { cap: 'Part (ii): A(3, 2), B(−2, 1), and the centroid (5/3, −1/3). Find C.', mark: [2, 3] },
      ],
      sceneLines: [
        planeLine(36),
        L({ cap: 'Part (i): plot A(6, 4), B(−2, 2) and the centroid G(3, 4).', legend: { icon: 'pt', s: '(i) A(6, 4),  B(−2, 2),  G(3, 4)' }, draw: [
          OP.pt('A1', A1, 'A(6, 4)', { tp: [66, 6], hideFrom: 'solve.4' }), OP.pt('B1', B1, 'B(−2, 2)', { tp: [0, 36], hideFrom: 'solve.4' }), OP.pt('G1', G1, 'G(3, 4)', { col: 'plum', tp: [-64, -18], hideFrom: 'solve.4' }),
        ] }),
        L({ cap: 'C is the missing corner. G is the average of all 3 corners.', legend: { icon: 'pin', s: 'C = ?' } }),
      ],
      given: [
        L({ m: '(i) A(6, 4),  B(−2, 2),  G(3, 4)', cap: 'Part (i): A(6, 4), B(−2, 2), and G(3, 4).' }),
        L({ m: '(ii) A(3, 2),  B(−2, 1),  G( ((5/3)), ((−1/3)) )', cap: 'Part (ii): A(3, 2), B(−2, 1), and G(5/3, −1/3).' }),
      ],
      find: L({ m: 'C(x, y) = ?  (both parts)', cap: 'Find C in both parts.' }),
      know: knowCentroid({ ruleCap: 'G’s x = (sum of the 3 x’s) ÷ 3. Work backwards to find C. That’s our magic rule!' }),
      steps: [
        L({ m: '(i) ((6 + (−2) + x/3)) = 3', cap: 'Part (i), the x’s: (6 − 2 + x) ÷ 3 = 3.', say: 'Part one, the x’s: 6 minus 2 plus x, over 3, is 3.' }),
        L({ m: '4 + x = 9  →  x = 5', cap: 'So 4 + x = 9, and x = 5.' }),
        L({ m: '((4 + 2 + y/3)) = 4  →  6 + y = 12  →  y = 6', cap: 'The y’s: (4 + 2 + y) ÷ 3 = 4, so 6 + y = 12, and y = 6.', say: 'The y’s: 4 plus 2 plus y, over 3, is 4. So 6 plus y is 12, and y is 6.' }),
        L({ m: '(i) C = (5, 6)', cap: 'So in part (i), C = (5, 6)!', solve: true, draw: [OP.pt('C1', C1, 'C(5, 6)', { col: 'coral', tp: [68, 0], hideFrom: 'solve.4' }), OP.poly('tri1', [A1, B1, C1], { fill: 0.12, hideFrom: 'solve.4' })], hl: 'C1' }),
        L({ m: '(ii) ((3 + (−2) + x/3)) = ((5/3))  →  1 + x = 5', cap: 'Part (ii), the x’s: (3 − 2 + x) ÷ 3 = 5/3, so 1 + x = 5.', say: 'Part two, the x’s: 3 minus 2 plus x, over 3, is 5 over 3. So 1 plus x is 5.', page: 1, draw: [
          OP.pt('A2', A2, 'A(3, 2)', { tp: [66, -8] }), OP.pt('B2', B2, 'B(−2, 1)', { tp: [0, -36] }), OP.pt('G2', G2, 'G( ((5/3)), ((−1/3)) )', { col: 'plum', tp: [-104, 8] }),
        ] }),
        L({ m: 'x = 4', cap: 'So x = 4.', page: 1 }),
        L({ m: '((2 + 1 + y/3)) = ((−1/3))  →  3 + y = −1  →  y = −4', cap: 'The y’s: (2 + 1 + y) ÷ 3 = −1/3, so 3 + y = −1, and y = −4.', say: 'The y’s: 2 plus 1 plus y, over 3, is minus 1 over 3. So 3 plus y is minus 1, and y is minus 4.', page: 1 }),
        L({ m: '(ii) C = (4, −4)', cap: 'So in part (ii), C = (4, −4)!', page: 1, solve: true, draw: [OP.pt('C2', C2, 'C(4, −4)', { col: 'coral', tp: [74, 0] }), OP.poly('tri2', [A2, B2, C2], { fill: 0.12 })], hl: 'C2' }),
      ],
      answer: { card: ['(i) C = (5, 6)', '(ii) C = (4, −4)'], cap: 'Part (i): C = (5, 6). Part (ii): C = (4, −4)!' },
      check: [
        L({ m: '(i) ( ((6 − 2 + 5/3)), ((4 + 2 + 6/3)) ) = (3, 4) ✓', cap: 'Check (i): (6 − 2 + 5) ÷ 3 = 3, and (4 + 2 + 6) ÷ 3 = 4. That’s G!', say: 'Check part one: 6 minus 2 plus 5, over 3, is 3. And 4 plus 2 plus 6, over 3, is 4. That’s G!' }),
        L({ m: '(ii) ( ((3 − 2 + 4/3)), ((2 + 1 − 4/3)) ) = ( ((5/3)), ((−1/3)) ) ✓', cap: 'Check (ii): (3 − 2 + 4) ÷ 3 = 5/3, and (2 + 1 − 4) ÷ 3 = −1/3. It matches!', say: 'Check part two: 3 minus 2 plus 4, over 3, is 5 over 3. And 2 plus 1 minus 4, over 3, is minus 1 over 3. It matches!' }),
      ],
    }));
  }

  // ------------------------------------------------------------------------------
  // storyboard: the 8 beats of every video
  // ------------------------------------------------------------------------------
  function buildBeats(p) {
    const beats = [];
    const fix = p.sayFix;
    const add = (type, title, lines) => beats.push({ type, title, lines: lines.map((l) => prep(JSON.parse(JSON.stringify(l)), fix)) });
    add('hook', 'Hook: the points on the plane + the big question', p.hook.lines.map((l, i) => Object.assign({ sfx: i === 0 ? 'hit' : undefined }, l)));
    add('question', 'The question', [
      { cap: 'Let’s solve it together, step by step!', say: 'Let us solve it together, step by step!', brand: true, sfx: 'whoosh' },
      { cap: 'Here is the question.', mark: [] },
      ...p.qLines,
    ]);
    add('scene', 'The plane, to scale', p.sceneLines);
    add('given', 'What we know + what we must find', [
      { cap: 'What do we know?', sfx: 'pop', hl: 'none' },
      ...p.given.map((g) => Object.assign({ sfx: 'pop' }, g)),
      Object.assign({ find: true, sfx: 'pop' }, p.find),
    ]);
    add('know', 'Know first: the formula and an idea picture', p.know);
    add('solve', 'Solution board, one step per line', p.steps.map((s) => Object.assign({ sfx: 'write' }, s)));
    add('answer', 'Answer card + quick check', [
      Object.assign({ answer: true, sfx: 'ding' }, p.answer),
      ...p.check.map((c, i) => Object.assign({ check: i, sfx: i === p.check.length - 1 ? 'sparkle' : 'pop' }, c)),
    ]);
    add('outro', 'End card: Follow Maths by Zosiama', [
      { cap: 'Great job! You solved it!', sfx: 'tada' },
      { cap: 'For more easy maths… Follow Maths by Zosiama!', say: 'For more easy maths, follow Maths by Zosiama!', follow: true },
    ]);
    beats.forEach((b) => b.lines.forEach((l, li) => { l.id = `${b.type}.${li}`; if (!l.cap) l.cap = l.say; }));
    return beats;
  }

  const api = { PROBLEMS, buildBeats, sayify };
  root.COORDINATES = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
