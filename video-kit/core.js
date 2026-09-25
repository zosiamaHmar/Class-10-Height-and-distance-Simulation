/* Maths by Zosiama · video kit — shared canvas core.
 *
 * Everything every explainer shares: palette, fonts, maths text with stacked fractions,
 * the chrome (progress bar, creator tag, chapter chip, captions), the hook sticker and
 * question, the intro + question card, the four board cards (what we know, know first,
 * solution, answer), the "Follow Maths by Zosiama" end card, transitions and the
 * seamless loop. A topic engine (Venn diagram, right triangle, …) adds its own stage,
 * scene card and hook art, then calls core.compose().
 *
 * Every frame is a pure function of time: draw(ctx, t) depends only on t, the problem
 * data (P) and the timeline (TL) built from the narration.
 *
 * Layout (vertical 9:16, Shorts/Reels safe zone):
 *   y   0–150  kept clear (platform UI)        y 150  progress bar
 *   y 176–232  creator tag + chapter chip      y 280–818  stage
 *   y 882–1270 board (cards)                   y 1290–1436 captions
 *   y 1440+    decoration only (bottom 25 % is covered by the platform UI)
 *   x ≤ 950 below the stage so the right-hand like/comment buttons never cover content.
 */
(function (root) {
  'use strict';

  const W = 1080, H = 1920, FPS = 60;
  // One palette for everything (plus alpha tints of these six).
  const PAL = {
    ink: '#1F2544',   // Midnight Navy — text, outlines
    paper: '#FFF8EC', // Cream — background, cards
    coral: '#FF6F59', // Coral
    teal: '#17B3A3',  // Sea Teal
    sun: '#FFC23D',   // Sunflower — highlights, answer
    plum: '#7B5EA7',  // Plum — the unknown, brand
  };
  const FONT_STACK = '"Fredoka", "SetSym", "Deva", "Segoe UI Symbol", "DejaVu Sans", sans-serif';
  const font = (size, weight = 600) => `${weight} ${Math.round(size * 10) / 10}px ${FONT_STACK}`;

  // ------------------------------------------------------------------------------
  // small helpers
  // ------------------------------------------------------------------------------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const win = (t, a, d) => clamp((t - a) / d);
  const ease = {
    out: (k) => 1 - Math.pow(1 - clamp(k), 3),
    inOut: (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    back: (k) => { k = clamp(k); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); },
  };
  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function mix(h1, h2, k) {
    const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
    const c = (s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, k));
    return `rgb(${c(16)},${c(8)},${c(0)})`;
  }
  function rnd(i) { // deterministic hash → [0,1)
    let x = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296;
  }
  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function pill(ctx, x, y, w, h, fill, stroke, lw) {
    ctx.beginPath(); rrect(ctx, x, y, w, h, h / 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 4; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function card(ctx, x, y, w, h, o = {}) {
    ctx.beginPath(); rrect(ctx, x, y + 10, w, h, o.r || 34); ctx.fillStyle = rgba(PAL.ink, 0.12); ctx.fill();
    ctx.beginPath(); rrect(ctx, x, y, w, h, o.r || 34); ctx.fillStyle = o.fill || PAL.paper; ctx.fill();
    ctx.lineWidth = o.lw || 5; ctx.strokeStyle = o.stroke || PAL.ink; ctx.stroke();
  }
  function text(ctx, s, x, y, size, color, o = {}) {
    ctx.font = font(size, o.weight || 600);
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    let w = ctx.measureText(s).width;
    if (o.maxW && w > o.maxW) { ctx.font = font(size * o.maxW / w, o.weight || 600); w = o.maxW; }
    ctx.fillStyle = color; ctx.fillText(s, x, y);
    return w;
  }
  function wrap(ctx, str, maxW) {
    const words = str.split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function logo(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x - r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.teal; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.45, y, r, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.arc(x + r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill();
    ctx.restore();
  }
  function chip(ctx, x, y, label, color, tc) {
    ctx.font = font(30, 700);
    const w = ctx.measureText(label).width + 44;
    pill(ctx, x, y, w, 52, color, PAL.ink, 4);
    text(ctx, label, x + w / 2, y + 27, 30, tc || PAL.paper, { align: 'center', weight: 700 });
    return w;
  }
  function shadowBlob(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.ink, 0.12); ctx.fill(); }
  function people(ctx, x0, y0, w, rows, cols, size, t, seed, label) {
    const cols4 = [PAL.coral, PAL.teal, PAL.sun, PAL.plum];
    const gx = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x = x0 + gx * (c + 0.5) + (r % 2 ? gx * 0.25 : -gx * 0.25);
        const y = y0 + r * size * 1.25 + Math.sin(t * 3 + i * 0.7) * 2.5;
        const col = cols4[Math.floor(rnd(i + seed) * 4)];
        ctx.beginPath(); rrect(ctx, x - size * 0.42, y - size * 0.05, size * 0.84, size * 0.62, size * 0.3); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - size * 0.28, size * 0.26, 0, Math.PI * 2); ctx.fillStyle = mix(PAL.sun, PAL.paper, 0.55); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(PAL.ink, 0.7); ctx.stroke();
      }
    }
    if (label) {
      ctx.font = font(34, 700); const lw = ctx.measureText(label).width + 40;
      pill(ctx, x0 + w / 2 - lw / 2, y0 + rows * size * 1.25 - 6, lw, 50, PAL.ink);
      text(ctx, label, x0 + w / 2, y0 + rows * size * 1.25 + 20, 34, PAL.paper, { align: 'center', weight: 700 });
    }
  }

  // board area shared by every beat card
  const BX = 90, BY = 882, BW = 860, BH = 388;

  // ------------------------------------------------------------------------------
  // per-video core
  // ------------------------------------------------------------------------------
  /**
   * cfg.tokens   {name: {s, c}} — maths markup {name} draws s in colour c, bold
   * cfg.chapter  header chip text, e.g. "SETS · Q1"
   * cfg.label    question card chip, e.g. "QUESTION 1"
   */
  function createCore(P, TL, cfg) {
    const D = TL.duration;
    const beats = TL.beats;
    const beat = {};
    beats.forEach((b) => { beat[b.type] = b; });
    const allLines = [];
    beats.forEach((b) => b.lines.forEach((l) => allLines.push(Object.assign({ beat: b.type }, l))));
    allLines.sort((a, b) => a.start - b.start);
    const TOK = cfg.tokens || {};

    // ---- rich maths text ---------------------------------------------------------
    // {name} coloured token · [x] the unknown · ((a/b)) stacked fraction · ✓
    function parseRun(str, base, sym) {
      const out = [];
      const re = /(\{[^{}]+\}|\[x\]|✓)/g;
      let last = 0, m;
      while ((m = re.exec(str))) {
        const k = m[0];
        const tok = k[0] === '{' ? TOK[k.slice(1, -1)] : null;
        if (k[0] === '{' && !tok) continue;
        if (m.index > last) out.push({ s: str.slice(last, m.index), c: base });
        if (tok) out.push({ s: tok.s, c: sym || tok.c, b: 1 });
        else if (k === '[x]') out.push({ s: 'x', c: PAL.plum, b: 1 });
        else out.push({ s: '✓', c: PAL.teal, b: 1 });
        last = m.index + k.length;
      }
      if (last < str.length) out.push({ s: str.slice(last), c: base });
      return out;
    }
    // ((top/bottom)) is a stacked fraction; top and bottom may hold their own (brackets)
    function parseMath(str, base, sym) {
      const out = [];
      let last = 0, i = 0;
      while (i < str.length) {
        if (str[i] === '(' && str[i + 1] === '(') {
          let depth = 0, end = -1, cut = -1;
          for (let j = i + 2; j < str.length; j++) {
            const ch = str[j];
            if (ch === '(') depth++;
            else if (ch === ')') {
              if (depth === 0) { if (str[j + 1] === ')') end = j; break; }
              depth--;
            } else if (ch === '/' && depth === 0 && cut < 0) cut = j;
          }
          if (end > 0 && cut > 0) {
            if (i > last) out.push(...parseRun(str.slice(last, i), base, sym));
            out.push({ frac: [parseRun(str.slice(i + 2, cut), base, sym), parseRun(str.slice(cut + 1, end), base, sym)], c: base });
            i = end + 2; last = i;
            continue;
          }
        }
        i++;
      }
      if (last < str.length) out.push(...parseRun(str.slice(last), base, sym));
      return out;
    }
    const runWidth = (ctx, run, size, weight) => run.reduce((w, k) => { ctx.font = font(size, k.b ? 700 : weight); return w + ctx.measureText(k.s).width; }, 0);
    const plainPart = (run) => run.length === 1 && !run[0].b;
    function fracWidth(ctx, k, s, weight) {
      const f = s * 0.6;
      return Math.max(runWidth(ctx, k.frac[0], f, weight), runWidth(ctx, k.frac[1], f, weight)) + s * 0.34;
    }
    function mathWidth(ctx, toks, size, weight) {
      let w = 0;
      for (const k of toks) {
        if (k.frac) w += fracWidth(ctx, k, size, weight);
        else { ctx.font = font(size, k.b ? 700 : weight); w += ctx.measureText(k.s).width; }
      }
      return w;
    }
    function drawRun(ctx, run, cx, y, size, weight) {
      for (const k of run) { ctx.font = font(size, k.b ? 700 : weight); ctx.fillStyle = k.c; ctx.fillText(k.s, cx, y); cx += ctx.measureText(k.s).width; }
    }
    /** draws maths markup; returns {w, s, x}. o: align, color, sym, maxW, weight, reveal (0..1 write-on) */
    function math(ctx, str, x, y, size, o = {}) {
      const weight = o.weight || 600;
      const toks = parseMath(str, o.color || PAL.ink, o.sym);
      let s = size, w = mathWidth(ctx, toks, s, weight);
      if (o.maxW && w > o.maxW) { s = size * o.maxW / w; w = mathWidth(ctx, toks, s, weight); }
      let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const x0 = cx;
      ctx.save();
      if (o.reveal !== undefined && o.reveal < 1) {
        ctx.beginPath(); ctx.rect(x0 - 10, y - s * 1.2, (w + 20) * o.reveal, s * 2.4); ctx.clip();
      }
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      for (const k of toks) {
        if (k.frac) {
          const fw = fracWidth(ctx, k, s, weight), f = s * 0.6;
          [[k.frac[0], y - s * 0.36], [k.frac[1], y + s * 0.4]].forEach(([run, yy]) => {
            if (plainPart(run)) { // single plain part: centred text
              ctx.font = font(f, weight); ctx.fillStyle = run[0].c; ctx.textAlign = 'center';
              ctx.fillText(run[0].s, cx + fw / 2, yy); ctx.textAlign = 'left';
            } else drawRun(ctx, run, cx + (fw - runWidth(ctx, run, f, weight)) / 2, yy, f, weight);
          });
          ctx.fillStyle = k.c;
          ctx.fillRect(cx + s * 0.1, y - Math.max(2, s * 0.035), fw - s * 0.2, Math.max(4, s * 0.07));
          cx += fw;
        } else {
          ctx.font = font(s, k.b ? 700 : weight); ctx.fillStyle = k.c;
          ctx.fillText(k.s, cx, y); cx += ctx.measureText(k.s).width;
        }
      }
      ctx.restore();
      return { w, s, x: x0 };
    }

    // ---- timeline lookups ------------------------------------------------------------
    function lineAt(b, t) {
      let cur = null, next = null;
      for (let i = 0; i < b.lines.length; i++) {
        if (b.lines[i].start - 0.12 <= t) { cur = b.lines[i]; next = b.lines[i + 1] || null; }
      }
      return { cur, next };
    }
    function beatAt(t) {
      for (let i = beats.length - 1; i >= 0; i--) if (t >= beats[i].start) return beats[i];
      return beats[0];
    }
    const exitAlpha = (b, t) => 1 - win(t, b.end - 0.28, 0.28);
    const rowIn = (t, at) => ease.out(win(t, at - 0.05, 0.35));

    // ---- background (static, rendered once) ---------------------------------------
    function makeBackground() {
      const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
      const g = c.getContext('2d');
      g.fillStyle = PAL.paper; g.fillRect(0, 0, W, H);
      g.fillStyle = rgba(PAL.ink, 0.05);
      for (let y = 18; y < H; y += 40) for (let x = 20; x < W; x += 40) { g.beginPath(); g.arc(x, y, 2.2, 0, Math.PI * 2); g.fill(); }
      // bottom zone decoration (never carries information)
      g.fillStyle = rgba(PAL.coral, 0.08); g.beginPath(); g.arc(360, 1800, 330, 0, Math.PI * 2); g.fill();
      g.fillStyle = rgba(PAL.teal, 0.08); g.beginPath(); g.arc(720, 1800, 330, 0, Math.PI * 2); g.fill();
      g.fillStyle = rgba(PAL.sun, 0.10); g.beginPath(); g.arc(360, 1800, 330, 0, Math.PI * 2); g.save(); g.clip(); g.beginPath(); g.arc(720, 1800, 330, 0, Math.PI * 2); g.fill(); g.restore();
      return c;
    }

    // ---- question text layout (words + highlight groups), computed once -----------
    function layoutQuestion(ctx) {
      const segs = [];
      let grp = -1, gi = 0, buf = '';
      const flush = (g) => { if (buf) segs.push({ s: buf, g }); buf = ''; };
      for (const ch of P.question) {
        if (ch === '⟦') { flush(-1); grp = gi++; continue; }
        if (ch === '⟧') { flush(grp); grp = -1; continue; }
        buf += ch;
      }
      flush(grp);
      const words = []; let cur = [];
      for (const sg of segs) {
        const parts = sg.s.split(/(\s+)/);
        for (const p of parts) {
          if (!p) continue;
          if (/^\s+$/.test(p)) { if (cur.length) words.push(cur); cur = []; } else cur.push({ s: p, g: sg.g });
        }
      }
      if (cur.length) words.push(cur);
      const maxW = 760, maxH = 560;
      let size = 60, lines;
      for (; size > 28; size -= 1) {
        ctx.font = font(size, 600);
        const sp = ctx.measureText(' ').width;
        lines = []; let line = [], lw = 0;
        for (const w of words) {
          const ww = w.reduce((a, s) => a + ctx.measureText(s.s).width, 0);
          if (line.length && lw + sp + ww > maxW) { lines.push({ words: line, w: lw }); line = []; lw = 0; }
          line.push({ segs: w, w: ww }); lw += (line.length > 1 ? sp : 0) + ww;
        }
        if (line.length) lines.push({ words: line, w: lw });
        if (lines.length * size * 1.42 <= maxH) break;
      }
      return { size, lines, lh: size * 1.42 };
    }
    let BG = null, QL = null;

    // =============================================================================
    // chrome: progress bar, creator tag, chapter chip, captions
    // =============================================================================
    function drawProgress(ctx, t) {
      const x = 40, y = 150, w = 1000, h = 10;
      pill(ctx, x, y, w, h, rgba(PAL.ink, 0.12));
      const k = clamp(t / D);
      if (k > 0) pill(ctx, x, y, Math.max(h, w * k), h, PAL.coral);
      for (const b of beats.slice(1)) {
        const bxp = x + w * (b.start / D);
        ctx.beginPath(); ctx.arc(bxp, y + h / 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = t >= b.start ? PAL.coral : PAL.paper; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = t >= b.start ? PAL.coral : rgba(PAL.ink, 0.3); ctx.stroke();
      }
    }
    function drawHeader(ctx) {
      ctx.font = font(30, 600);
      const label = 'Maths by Zosiama';
      const tw = ctx.measureText(label).width;
      pill(ctx, 40, 178, tw + 100, 54, PAL.ink);
      logo(ctx, 80, 205, 13);
      text(ctx, label, 108, 206, 30, PAL.paper);
      const c = cfg.chapter;
      ctx.font = font(28, 700);
      const cw = ctx.measureText(c).width + 44;
      pill(ctx, 1040 - cw, 180, cw, 50, rgba(PAL.paper, 0.9), PAL.ink, 3);
      text(ctx, c, 1040 - cw / 2, 206, 28, PAL.ink, { align: 'center', weight: 700 });
    }
    const capCache = {};
    function drawCaption(ctx, t, opts) {
      if (!opts.cc) return;
      let L = null, nxt = null;
      for (let i = 0; i < allLines.length; i++) if (allLines[i].start - 0.06 <= t) { L = allLines[i]; nxt = allLines[i + 1]; }
      if (!L) return;
      const endT = Math.min(nxt ? nxt.start - 0.06 : D, L.end + 1.0);
      if (t > endT) return;
      const inK = ease.out(win(t, L.start - 0.06, 0.16));
      const outK = 1 - win(t, endT - 0.12, 0.12);
      const a = Math.min(inK, outK);
      if (a <= 0) return;
      let lay = capCache[L.id];
      if (!lay) {
        let size = 46, lines;
        for (; size >= 34; size -= 2) { ctx.font = font(size, 600); lines = wrap(ctx, L.cap, 800); if (lines.length <= 2) break; }
        ctx.font = font(size, 600);
        lay = capCache[L.id] = { size, lines, w: Math.max(...lines.map((s) => ctx.measureText(s).width)) };
      }
      const lh = lay.size * 1.28, bw = lay.w + 64, bh = lay.lines.length * lh + 36;
      const cx = 520, top = 1290 + (1 - inK) * 18;
      ctx.save(); ctx.globalAlpha = a;
      ctx.beginPath(); rrect(ctx, cx - bw / 2, top, bw, bh, 26); ctx.fillStyle = rgba(PAL.ink, 0.92); ctx.fill();
      ctx.font = font(lay.size, 600); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      lay.lines.forEach((ln, i) => {
        const words = ln.split(' ');
        let x = cx - ctx.measureText(ln).width / 2;
        const y = top + 18 + lh * (i + 0.5);
        const sp = ctx.measureText(' ').width;
        for (const w of words) {
          ctx.fillStyle = /\d/.test(w) ? PAL.sun : PAL.paper;
          ctx.fillText(w, x, y); x += ctx.measureText(w).width + sp;
        }
      });
      ctx.restore();
    }

    // =============================================================================
    // HOOK — the question's own subject (art callback) + big question
    // =============================================================================
    function drawHook(ctx, t, art) {
      const punch = 1 + 0.035 * (1 - ease.out(win(t, 0, 0.7)));
      math(ctx, P.hook.head[0], 540, 296, 92, { align: 'center', maxW: 940, weight: 700 });
      math(ctx, P.hook.head[1], 540, 386, 68, { align: 'center', maxW: 940, weight: 700 });
      // subject art (a small zoom punch; frame 0 is already complete)
      ctx.save();
      ctx.translate(540, 810); ctx.scale(punch, punch); ctx.translate(-540, -810);
      art(ctx, t, { x: 90, y: 500, w: 900, h: 620 });
      ctx.restore();
      // the ask
      const pk = 1 + 0.035 * Math.sin(t * 4.2);
      ctx.save(); ctx.translate(540, 1196); ctx.scale(pk, pk);
      ctx.font = font(60, 700);
      const aw = Math.min(900, mathWidth(ctx, parseMath(P.hook.ask, PAL.paper), 60, 700) + 90);
      ctx.beginPath(); rrect(ctx, -aw / 2, -56 + 8, aw, 112, 56); ctx.fillStyle = rgba(PAL.ink, 0.18); ctx.fill();
      ctx.beginPath(); rrect(ctx, -aw / 2, -56, aw, 112, 56); ctx.fillStyle = PAL.plum; ctx.fill();
      math(ctx, P.hook.ask, 0, 2, 60, { align: 'center', color: PAL.paper, sym: PAL.sun, weight: 700, maxW: aw - 70 });
      ctx.restore();
      // pause & try it first sticker
      const wob = Math.sin(t * 5) * 0.02;
      ctx.save(); ctx.translate(540, 462); ctx.rotate(-0.035 + wob);
      const sc = 1 + 0.035 * Math.sin(t * 6.5);
      ctx.scale(sc, sc);
      ctx.font = font(36, 700);
      const sw = ctx.measureText('Pause & try it first!').width + 110;
      ctx.beginPath(); rrect(ctx, -sw / 2, -34 + 7, sw, 68, 20); ctx.fillStyle = rgba(PAL.ink, 0.2); ctx.fill();
      ctx.beginPath(); rrect(ctx, -sw / 2, -34, sw, 68, 20); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.fillStyle = PAL.ink; ctx.fillRect(-sw / 2 + 30, -16, 10, 32); ctx.fillRect(-sw / 2 + 46, -16, 10, 32);
      text(ctx, 'Pause & try it first!', -sw / 2 + 72, 2, 36, PAL.ink, { weight: 700 });
      ctx.restore();
    }

    // =============================================================================
    // QUESTION — brand intro + the full question with highlighted numbers
    // =============================================================================
    function drawQuestion(ctx, t) {
      const b = beat.question;
      const brand = b.lines[0];
      const k = ease.back(win(t, brand.start - 0.1, 0.55));
      const bob = Math.sin((t - b.start) * 2.2) * 6;
      ctx.save(); ctx.translate(540, 420 + bob); ctx.scale(k, k);
      logo(ctx, 0, -40, 62);
      text(ctx, 'Maths by Zosiama', 0, 75, 70, PAL.ink, { align: 'center', weight: 700 });
      ctx.restore();
      const ck = ease.out(win(t, b.lines[1].start - 0.25, 0.45));
      if (ck <= 0) return;
      const x = 90, y = 580 + (1 - ck) * 70, w = 860, h = 682;
      ctx.save(); ctx.globalAlpha = ck * exitAlpha(b, t);
      card(ctx, x, y, w, h);
      chip(ctx, x + 32, y - 26, cfg.label, PAL.coral);
      const on = {};
      for (const l of b.lines) if (l.mark && t >= l.start) l.mark.forEach((g) => { on[g] = l.start; });
      const q = QL, sp = (() => { ctx.font = font(q.size, 600); return ctx.measureText(' ').width; })();
      const top = y + 40 + (h - 40 - q.lines.length * q.lh) / 2;
      q.lines.forEach((ln, i) => {
        let cx = x + (w - ln.w) / 2;
        const cy = top + q.lh * (i + 0.5);
        ctx.font = font(q.size, 600);
        let px = cx;
        ln.words.forEach((wd, wi) => {
          wd.segs.forEach((sg, si) => {
            const sw = ctx.measureText(sg.s).width;
            if (sg.g >= 0 && on[sg.g] !== undefined) {
              const hk = ease.out(win(t, on[sg.g], 0.45));
              const joinNext = si === wd.segs.length - 1 && wi < ln.words.length - 1 && ln.words[wi + 1].segs[0].g === sg.g;
              const ww = sw + (joinNext ? sp : 0);
              ctx.fillStyle = rgba(PAL.sun, 0.75);
              ctx.fillRect(px - 4, cy - q.size * 0.5, (ww + 8) * hk, q.size * 1.02);
            }
            px += sw;
          });
          px += sp;
        });
        ln.words.forEach((wd) => {
          wd.segs.forEach((sg) => {
            ctx.fillStyle = PAL.ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
            ctx.fillText(sg.s, cx, cy); cx += ctx.measureText(sg.s).width;
          });
          cx += sp;
        });
      });
      ctx.restore();
    }

    // =============================================================================
    // BOARD — one card per beat (the topic engine draws the scene card)
    // =============================================================================
    function boardFrame(ctx, b, t, title, color, h) {
      const k = ease.back(win(t, b.start + 0.02, 0.45));
      const a = win(t, b.start, 0.2) * exitAlpha(b, t);
      ctx.globalAlpha = a;
      ctx.translate(0, (1 - k) * 60);
      card(ctx, BX, BY, BW, h || BH);
      chip(ctx, BX + 32, BY - 26, title, color, color === PAL.sun ? PAL.ink : PAL.paper);
    }
    function boardGiven(ctx, t, b) {
      boardFrame(ctx, b, t, 'WHAT WE KNOW', PAL.coral);
      const items = b.lines.filter((l) => l.m);
      const rh = 80;
      items.forEach((l, i) => {
        const k = rowIn(t, l.start);
        if (k <= 0) return;
        const y = BY + 58 + rh * (i + 0.5) + (l.find ? 8 : 0);
        ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
        if (l.find) {
          ctx.beginPath(); rrect(ctx, BX + 30, y - 34, BW - 60, 68, 20);
          ctx.fillStyle = rgba(PAL.plum, 0.14); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.plum; ctx.stroke();
          text(ctx, 'Find:', BX + 52, y + 1, 40, PAL.plum, { weight: 700 });
          math(ctx, l.m, BX + 170, y + 1, 44, { maxW: BW - 230, weight: 700 });
        } else {
          ctx.beginPath(); ctx.arc(BX + 52, y, 9, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill();
          math(ctx, l.m, BX + 80, y + 1, 52, { maxW: BW - 120 });
        }
        ctx.restore();
      });
    }
    function boardKnow(ctx, t, b) {
      const pages = [...new Set(b.lines.map((l) => l.page))];
      let page = pages[0];
      for (const l of b.lines) if (t >= l.start - 0.3) page = l.page;
      const pStart = Math.min(...b.lines.filter((l) => l.page === page).map((l) => l.start)) - 0.3;
      boardFrame(ctx, b, t, page === 2 ? 'ALSO KNOW' : 'KNOW FIRST!', PAL.plum);
      const pk = page === pages[0] ? 1 : ease.out(win(t, pStart, 0.35));
      ctx.save(); ctx.globalAlpha *= pk; ctx.translate((1 - pk) * 80, 0);
      const items = b.lines.filter((l) => l.page === page && l.m);
      let y = BY + 76;
      items.forEach((l) => {
        const k = rowIn(t, l.start);
        if (l.rule) {
          const h = 124; y += 10;
          if (k > 0) {
            ctx.save(); ctx.globalAlpha *= k;
            const s = 0.9 + 0.1 * ease.back(win(t, l.start, 0.5));
            ctx.translate(BX + BW / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-(BX + BW / 2), -(y + h / 2));
            ctx.beginPath(); rrect(ctx, BX + 26, y, BW - 52, h, 24); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
            text(ctx, 'MAGIC RULE', BX + BW / 2, y + 26, 24, PAL.ink, { align: 'center', weight: 700 });
            math(ctx, l.m, BX + BW / 2, y + 78, 46, { align: 'center', maxW: BW - 100, weight: 700, sym: PAL.ink });
            ctx.restore();
          }
          y += h + 14;
        } else {
          const rh = page === 2 ? 96 : 84;
          if (k > 0) {
            ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
            ctx.beginPath(); ctx.arc(BX + 52, y + rh / 2 - 12, 9, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill();
            math(ctx, l.m, BX + 80, y + rh / 2 - 12, 46, { maxW: BW - 120 });
            ctx.restore();
          }
          y += rh;
        }
      });
      ctx.restore();
    }
    function boardSolve(ctx, t, b) {
      // steps may be split over pages (line.page); a new page slides in over the old one
      const pg = (l) => l.page || 0;
      const pages = [...new Set(b.lines.map(pg))];
      let page = pages[0];
      for (const l of b.lines) if (t >= l.start - 0.3) page = pg(l);
      const lines = b.lines.filter((l) => pg(l) === page);
      boardFrame(ctx, b, t, 'SOLUTION', PAL.ink);
      const pk = page === pages[0] ? 1 : ease.out(win(t, lines[0].start - 0.3, 0.35));
      ctx.save(); ctx.globalAlpha *= pk; ctx.translate((1 - pk) * 80, 0);
      const rh = 78;
      let curI = -1;
      lines.forEach((l, i) => { if (t >= l.start - 0.1) curI = i; });
      lines.forEach((l, i) => {
        if (t < l.start - 0.1) return;
        const y = BY + 70 + rh * (i + 0.5);
        const rev = ease.inOut(win(t, l.start - 0.05, 0.8));
        const dim = i < curI ? 0.72 : 1;
        ctx.save(); ctx.globalAlpha *= dim;
        if (l.solve) {
          const hk = ease.out(win(t, l.start + 0.6, 0.4));
          ctx.beginPath(); rrect(ctx, BX + 26, y - 36, (BW - 52) * hk, 72, 20); ctx.fillStyle = rgba(PAL.sun, 0.55); ctx.fill();
        }
        if (i === curI) { text(ctx, '▸', BX + 36, y, 44, PAL.coral, { weight: 700 }); }
        math(ctx, l.m, BX + 76, y + 1, 48, { maxW: BW - 110, reveal: rev });
        ctx.restore();
      });
      ctx.restore();
    }
    function boardAnswer(ctx, t, b) {
      const ans = b.lines[0];
      const rows = [];
      b.lines.filter((l) => l.check !== undefined).forEach((l) => l.m.split(' · ').forEach((s, j) => rows.push({ at: l.start + j * 1.4, s, last: /✓/.test(s) })));
      const cardLines = P.answer.card;
      const ch = cardLines.length > 1 ? 168 : 118;
      const rh = 54;
      const h = Math.min(BH + 12, 52 + ch + 20 + rows.length * rh + 12);
      boardFrame(ctx, b, t, 'ANSWER', PAL.sun, h);
      const k = ease.back(win(t, ans.start, 0.55));
      const cy = BY + 48 + ch / 2;
      ctx.save(); ctx.translate(BX + BW / 2, cy); ctx.scale(k, k); ctx.rotate(-0.012);
      ctx.beginPath(); rrect(ctx, -(BW - 60) / 2, -ch / 2 + 8, BW - 60, ch, 26); ctx.fillStyle = rgba(PAL.ink, 0.2); ctx.fill();
      ctx.beginPath(); rrect(ctx, -(BW - 60) / 2, -ch / 2, BW - 60, ch, 26); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      cardLines.forEach((s, i) => {
        const yy = cardLines.length > 1 ? (i - 0.5) * 72 : 0;
        math(ctx, s, 0, yy + 2, cardLines.length > 1 ? 52 : 62, { align: 'center', maxW: BW - 120, weight: 700, sym: PAL.ink });
      });
      ctx.restore();
      // burst
      const bk = win(t, ans.start + 0.1, 0.9);
      if (bk > 0 && bk < 1) {
        for (let i = 0; i < 18; i++) {
          const ang = rnd(i + 5) * Math.PI * 2, dist = 120 + 380 * ease.out(bk) * (0.6 + 0.4 * rnd(i + 40));
          const x = BX + BW / 2 + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist * 0.45;
          ctx.save(); ctx.globalAlpha *= 1 - bk; ctx.translate(x, y); ctx.rotate(ang + bk * 4);
          ctx.fillStyle = [PAL.coral, PAL.teal, PAL.plum, PAL.sun][i % 4]; ctx.fillRect(-9, -5, 18, 10);
          ctx.restore();
        }
      }
      rows.forEach((r, i) => {
        const kk = rowIn(t, r.at);
        if (kk <= 0) return;
        const y = BY + 48 + ch + 22 + rh * (i + 0.5);
        ctx.save(); ctx.globalAlpha *= kk; ctx.translate((1 - kk) * 30, 0);
        if (r.last) {
          ctx.beginPath(); rrect(ctx, BX + 30, y - 26, BW - 60, 52, 16); ctx.fillStyle = rgba(PAL.teal, 0.16); ctx.fill();
        }
        math(ctx, r.s, BX + BW / 2, y + 1, 38, { align: 'center', maxW: BW - 90, weight: r.last ? 700 : 600 });
        ctx.restore();
      });
    }

    // =============================================================================
    // OUTRO — Follow Maths by Zosiama
    // =============================================================================
    function drawOutro(ctx, t) {
      const b = beat.outro;
      const lt = t - b.start;
      const inK = ease.back(win(t, b.start + 0.05, 0.6));
      ctx.save(); ctx.translate(540, 560); ctx.rotate(lt * 0.25);
      for (let i = 0; i < 16; i++) {
        ctx.rotate(Math.PI / 8);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -620); ctx.lineTo(60, -620); ctx.closePath();
        ctx.fillStyle = rgba(i % 2 ? PAL.sun : PAL.coral, 0.12 * clamp(inK)); ctx.fill();
      }
      ctx.restore();
      const bob = Math.sin(lt * Math.PI) * 10;
      ctx.save(); ctx.translate(540, 540 + bob); ctx.scale(inK, inK);
      ctx.beginPath(); ctx.arc(0, 8, 186, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.ink, 0.12); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 186, 0, Math.PI * 2); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      logo(ctx, 0, 0, 108);
      ctx.restore();
      const tk = ease.out(win(t, b.start + 0.25, 0.5));
      ctx.save(); ctx.globalAlpha = tk;
      text(ctx, 'Maths by Zosiama', 540, 812, 96, PAL.ink, { align: 'center', weight: 700, maxW: 900 });
      text(ctx, 'Easy maths, one picture at a time', 540, 880, 38, rgba(PAL.ink, 0.75), { align: 'center' });
      ctx.restore();
      // follow button with a tapping hand (2 s loop)
      const fl = b.lines.find((l) => l.follow) || b.lines[b.lines.length - 1];
      const fk = ease.back(win(t, fl.start - 0.4, 0.5));
      if (fk > 0) {
        const cyc = ((t - fl.start) % 2 + 2) % 2;
        const press = cyc > 0.7 && cyc < 0.95 ? Math.sin((cyc - 0.7) / 0.25 * Math.PI) : 0;
        ctx.save(); ctx.translate(540, 1020); ctx.scale(fk * (1 - 0.06 * press), fk * (1 - 0.06 * press));
        ctx.beginPath(); rrect(ctx, -330, -70 + 10, 660, 140, 70); ctx.fillStyle = rgba(PAL.ink, 0.22); ctx.fill();
        ctx.beginPath(); rrect(ctx, -330, -70, 660, 140, 70); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
        text(ctx, 'Follow', -40, 2, 76, PAL.paper, { align: 'center', weight: 700 });
        bell(ctx, 170, 0, 1 + 0.12 * press, t);
        ctx.restore();
        if (cyc > 0.8) {
          const rk = win(cyc, 0.8, 1.0);
          ctx.save(); ctx.globalAlpha = 1 - rk; ctx.lineWidth = 8; ctx.strokeStyle = PAL.coral;
          ctx.beginPath(); rrect(ctx, 540 - 330 - rk * 40, 1020 - 70 - rk * 40, 660 + rk * 80, 140 + rk * 80, 70 + rk * 40); ctx.stroke(); ctx.restore();
        }
        const hx = 660 + 170 * (1 - ease.inOut(win(cyc, 0.1, 0.6))) + 170 * ease.inOut(win(cyc, 1.2, 0.7));
        const hy = 1065 + (press * 14);
        hand(ctx, hx, hy);
      }
      // recap chip
      const rk = ease.back(win(t, b.start + 0.5, 0.5));
      if (rk > 0) {
        const s = `Answer: ${P.answer.card.join('  ·  ')} ✓`;
        ctx.save(); ctx.translate(520, 1188); ctx.scale(rk, rk);
        ctx.font = font(34, 700);
        const w = Math.min(860, mathWidth(ctx, parseMath(s, PAL.ink), 34, 700) + 50);
        pill(ctx, -w / 2, -34, w, 68, PAL.sun, PAL.ink, 4);
        math(ctx, s, 0, 1, 34, { align: 'center', weight: 700, maxW: w - 40, sym: PAL.ink });
        ctx.restore();
      }
    }
    function bell(ctx, x, y, s, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 12) * 0.08 * (s > 1 ? 1 : 0));
      ctx.fillStyle = PAL.sun; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-26, 18); ctx.quadraticCurveTo(-24, -26, 0, -30); ctx.quadraticCurveTo(24, -26, 26, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); rrect(ctx, -32, 14, 64, 10, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 30, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function hand(ctx, x, y) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35);
      ctx.fillStyle = PAL.paper; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 5;
      ctx.beginPath(); rrect(ctx, -14, -60, 28, 70, 14); ctx.fill(); ctx.stroke();
      ctx.beginPath(); rrect(ctx, -30, -5, 76, 70, 24); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(14, 20); ctx.moveTo(30, 6); ctx.lineTo(30, 20); ctx.stroke();
      ctx.restore();
    }

    // =============================================================================
    // transitions + the frame
    // =============================================================================
    function swipe(ctx, t, at, color) {
      const p = win(t, at - 0.32, 0.64);
      if (p <= 0 || p >= 1) return;
      const px = lerp(-0.75 * W, 1.75 * W, ease.inOut(p));
      ctx.save();
      ctx.beginPath(); ctx.moveTo(px - 0.62 * W, 0); ctx.lineTo(px + 0.62 * W + 160, 0); ctx.lineTo(px + 0.62 * W, H); ctx.lineTo(px - 0.62 * W - 160, H); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(px + 0.62 * W + 160, 0); ctx.lineTo(px + 0.62 * W + 220, 0); ctx.lineTo(px + 0.62 * W + 60, H); ctx.lineTo(px + 0.62 * W, H); ctx.closePath();
      ctx.fillStyle = PAL.coral; ctx.fill();
      logo(ctx, px, H * 0.42, 60);
      ctx.restore();
    }

    /**
     * parts.art(ctx, t, R)             hook illustration inside rect R
     * parts.stage(ctx, t, {l, next, b}) the diagram, for the scene…answer beats
     * parts.scene(ctx, t, b)           the scene beat's board card
     */
    function compose(parts) {
      function frame(ctx, t, opts) {
        ctx.drawImage(BG, 0, 0);
        const b = beatAt(t);
        if (b.type === 'hook') drawHook(ctx, t, parts.art);
        else if (b.type === 'question') drawQuestion(ctx, t);
        else if (b.type === 'outro') drawOutro(ctx, t);
        else {
          const { cur, next } = lineAt(b, t);
          parts.stage(ctx, t, { l: cur, next, b });
          ctx.save();
          if (b.type === 'scene') parts.scene(ctx, t, b);
          else if (b.type === 'given') boardGiven(ctx, t, b);
          else if (b.type === 'know') boardKnow(ctx, t, b);
          else if (b.type === 'solve') boardSolve(ctx, t, b);
          else if (b.type === 'answer') boardAnswer(ctx, t, b);
          ctx.restore();
        }
        drawHeader(ctx, t);
        drawProgress(ctx, t);
        drawCaption(ctx, t, opts);
        swipe(ctx, t, beat.question.start, PAL.sun);
        swipe(ctx, t, beat.outro.start, PAL.teal);
      }
      return function draw(ctx, t, opts = {}) {
        opts = Object.assign({ cc: true }, opts);
        t = clamp(t, 0, D);
        if (!BG) BG = makeBackground();
        if (!QL) QL = layoutQuestion(ctx);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        frame(ctx, t, opts);
        // seamless loop: the last 0.4 s dissolve into the very first frame
        const lk = win(t, D - 0.4, 0.4);
        if (lk > 0) { ctx.globalAlpha = ease.inOut(lk); frame(ctx, 0, opts); ctx.globalAlpha = 1; }
        ctx.restore();
      };
    }

    return {
      D, beats, beat, allLines, math, parseMath, mathWidth, lineAt, beatAt, exitAlpha, rowIn,
      boardFrame, compose,
    };
  }

  root.VideoCore = {
    W, H, FPS, PAL, FONT_STACK, BX, BY, BW, BH, font, clamp, lerp, win, ease, rgba, mix, rnd,
    rrect, pill, card, text, wrap, logo, chip, shadowBlob, people, createCore,
  };
})(typeof window !== 'undefined' ? window : globalThis);
