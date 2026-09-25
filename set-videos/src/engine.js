/* Maths by Zosiama · Sets explainers — canvas engine.
 *
 * Every frame is a pure function of time: video.draw(ctx, t, opts) paints the whole
 * 1080×1920 frame for time t (seconds) from the problem data (P) and the timeline (TL)
 * that audio.py built from the narration. Nothing depends on the previous frame, so any
 * frame can be rendered exactly, in any order, at 60 fps.
 *
 * Layout (vertical 9:16, Shorts/Reels safe zone):
 *   y   0–150  kept clear (platform UI)        y 150  progress bar
 *   y 176–232  creator tag + chapter chip      y 292–840  stage (Venn diagram)
 *   y 862–1262 board (cards)                   y 1284–1436 captions
 *   y 1440+    decoration only (bottom 25 % is covered by the platform UI)
 *   x ≤ 950 below y≈860 so the right-hand like/comment buttons never cover content.
 */
(function (root) {
  'use strict';

  const W = 1080, H = 1920, FPS = 60;
  // One palette for everything (plus alpha tints of these six).
  const PAL = {
    ink: '#1F2544',   // Midnight Navy — text, outlines
    paper: '#FFF8EC', // Cream — background, cards
    coral: '#FF6F59', // Coral — first set
    teal: '#17B3A3',  // Sea Teal — second set
    sun: '#FFC23D',   // Sunflower — "both", highlights, answer
    plum: '#7B5EA7',  // Plum — the unknown, "neither", brand
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

  // ------------------------------------------------------------------------------
  // the video
  // ------------------------------------------------------------------------------
  function createVideo(P, TL) {
    const D = TL.duration;
    const beats = TL.beats;
    const beat = {};
    beats.forEach((b) => { beat[b.type] = b; });
    const allLines = [];
    beats.forEach((b) => b.lines.forEach((l) => allLines.push(Object.assign({ beat: b.type }, l))));
    allLines.sort((a, b) => a.start - b.start);
    const U1 = P.unit[0], UN = P.unit[1];
    const withUnit = (v) => (P.pct || /%$/.test(String(v)) ? `${String(v).replace(/%$/, '')}%` : `${v} ${+v === 1 ? U1 : UN}`);

    // ---- rich maths text ---------------------------------------------------------
    function parseMath(str, base, sym) {
      const out = [];
      const re = /(\{A\}|\{B\}|\[x\]|\(\([^)]*?\)\)|✓)/g;
      let last = 0, m;
      while ((m = re.exec(str))) {
        if (m.index > last) out.push({ s: str.slice(last, m.index), c: base });
        const k = m[0];
        if (k === '{A}') out.push({ s: P.A.s, c: sym || PAL.coral, b: 1 });
        else if (k === '{B}') out.push({ s: P.B.s, c: sym || PAL.teal, b: 1 });
        else if (k === '[x]') out.push({ s: 'x', c: PAL.plum, b: 1 });
        else if (k === '✓') out.push({ s: '✓', c: PAL.teal, b: 1 });
        else { const [a, b] = k.slice(2, -2).split('/'); out.push({ frac: [a, b], c: base }); }
        last = m.index + k.length;
      }
      if (last < str.length) out.push({ s: str.slice(last), c: base });
      return out;
    }
    function mathWidth(ctx, toks, size, weight) {
      let w = 0;
      for (const k of toks) {
        if (k.frac) {
          ctx.font = font(size * 0.6, weight);
          w += Math.max(ctx.measureText(k.frac[0]).width, ctx.measureText(k.frac[1]).width) + size * 0.34;
        } else { ctx.font = font(size, k.b ? 700 : weight); w += ctx.measureText(k.s).width; }
      }
      return w;
    }
    /** draws maths markup; returns {w, s}. o: align, color, maxW, weight, reveal (0..1 write-on) */
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
          ctx.font = font(s * 0.6, weight);
          const fw = Math.max(ctx.measureText(k.frac[0]).width, ctx.measureText(k.frac[1]).width) + s * 0.34;
          ctx.fillStyle = k.c; ctx.textAlign = 'center';
          ctx.fillText(k.frac[0], cx + fw / 2, y - s * 0.36);
          ctx.fillText(k.frac[1], cx + fw / 2, y + s * 0.4);
          ctx.fillRect(cx + s * 0.1, y - Math.max(2, s * 0.035), fw - s * 0.2, Math.max(4, s * 0.07));
          ctx.textAlign = 'left'; cx += fw;
        } else {
          ctx.font = font(s, k.b ? 700 : weight); ctx.fillStyle = k.c;
          ctx.fillText(k.s, cx, y); cx += ctx.measureText(k.s).width;
        }
      }
      ctx.restore();
      return { w, s, x: x0 };
    }

    // ---- Venn geometry ------------------------------------------------------------
    const G = { bx: 90, by: 280, bw: 900, bh: 538, br: 28, cy: 598, r: 205, ax: 400, bx2: 680 };
    const circA = (ctx) => { ctx.moveTo(G.ax + G.r, G.cy); ctx.arc(G.ax, G.cy, G.r, 0, Math.PI * 2); };
    const circB = (ctx) => { ctx.moveTo(G.bx2 + G.r, G.cy); ctx.arc(G.bx2, G.cy, G.r, 0, Math.PI * 2); };
    const boxP = (ctx) => rrect(ctx, G.bx, G.by, G.bw, G.bh, G.br);
    const BADGE = { a: [G.ax - 100, G.cy], ab: [(G.ax + G.bx2) / 2, G.cy], b: [G.bx2 + 100, G.cy], n: [932, G.by + G.bh - 50] };

    function fillRegion(ctx, name, style) {
      ctx.save(); ctx.fillStyle = style; ctx.beginPath();
      switch (name) {
        case 'A': circA(ctx); ctx.fill(); break;
        case 'B': circB(ctx); ctx.fill(); break;
        case 'AB': circA(ctx); ctx.clip(); ctx.beginPath(); circB(ctx); ctx.fill(); break;
        case 'Aonly': circA(ctx); ctx.clip(); ctx.beginPath(); ctx.rect(0, 0, W, H); circB(ctx); ctx.fill('evenodd'); break;
        case 'Bonly': circB(ctx); ctx.clip(); ctx.beginPath(); ctx.rect(0, 0, W, H); circA(ctx); ctx.fill('evenodd'); break;
        case 'union': circA(ctx); circB(ctx); ctx.fill('nonzero'); break;
        case 'neither': boxP(ctx); circA(ctx); ctx.clip('evenodd'); ctx.beginPath(); boxP(ctx); circB(ctx); ctx.fill('evenodd'); break;
        case 'U': boxP(ctx); ctx.fill(); break;
      }
      ctx.restore();
    }

    // ---- dots drawn to scale (1 dot = P.dot units), placed once, deterministic ----
    const dots = (() => {
      const N = { a: P.counts.a / P.dot, ab: P.counts.ab / P.dot, b: P.counts.b / P.dot, n: P.counts.n / P.dot };
      const inside = (reg, x, y, m) => {
        const dA = Math.hypot(x - G.ax, y - G.cy), dB = Math.hypot(x - G.bx2, y - G.cy);
        const inA = dA < G.r - m, inB = dB < G.r - m, outA = dA > G.r + m, outB = dB > G.r + m;
        for (const k of Object.keys(BADGE)) {
          const [bx, by] = BADGE[k];
          if (Math.abs(x - bx) < 58 + m * 0.4 && Math.abs(y - by) < 40 + m * 0.4) return false;
        }
        if (reg === 'a') return inA && outB;
        if (reg === 'b') return inB && outA;
        if (reg === 'ab') return inA && inB;
        // neither: inside the box, away from labels (top band) and bottom chips
        if (!(outA && outB)) return false;
        if (x < G.bx + m + 4 || x > G.bx + G.bw - m - 4 || y > G.by + G.bh - m - 26 || y < G.by + 140) return false;
        return true;
      };
      const grid = (reg, s, m) => {
        const pts = [], hs = s * Math.sqrt(3) / 2;
        for (let j = 0, y = G.by + 10; y < G.by + G.bh; j++, y += hs) {
          for (let x = G.bx + 10 + (j % 2 ? s / 2 : 0); x < G.bx + G.bw; x += s) if (inside(reg, x, y, m)) pts.push([x, y]);
        }
        return pts;
      };
      const fit = (reg, n, m) => {
        if (!n) return { s: Infinity, pts: [] };
        let lo = 8, hi = 160;
        for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (grid(reg, mid, m).length >= n) lo = mid; else hi = mid; }
        return { s: lo, pts: grid(reg, lo, m) };
      };
      const regs = ['a', 'ab', 'b', 'n'];
      let smin = Math.min(...regs.map((r) => fit(r, N[r], 12).s));
      const rd = clamp(smin * 0.36, 6.5, 16);
      const out = { rd };
      regs.forEach((r, ri) => {
        let { pts } = fit(r, N[r], rd + 4);
        // trim extras deterministically
        pts = pts.map((p, i) => ({ p, k: rnd(i * 31 + ri * 997 + P.num * 7) })).sort((u, v) => u.k - v.k).slice(0, N[r]).map((o) => o.p);
        const [ax, ay] = BADGE[r];
        pts.sort((u, v) => Math.hypot(u[0] - ax, u[1] - ay) - Math.hypot(v[0] - ax, v[1] - ay));
        out[r] = pts;
      });
      return out;
    })();

    // ---- facts shown on the diagram, as timed events -----------------------------
    const unknownSlot = { AB: 'ab', neither: 'n', union: 'union', B: 'B' }[P.unknown];
    const unknownValue = (() => {
      const c = P.counts, v = { AB: c.ab, neither: c.n, union: c.a + c.ab + c.b, B: c.ab + c.b }[P.unknown];
      return P.pct ? `${v}%` : String(v);
    })();
    const facts = (() => {
      const ev = [];
      const push = (t, slot, v) => ev.push({ t, slot, v });
      for (const b of beats) {
        if (!['given', 'know', 'solve'].includes(b.type)) continue;
        for (const l of b.lines) {
          if (!l.m) continue;
          let mm;
          if ((mm = /n\(\{A\}\) = (\d+%?)/.exec(l.m))) push(l.start + 0.1, 'A', mm[1]);
          if ((mm = /n\(\{B\}\) = (\d+%?)/.exec(l.m))) push(l.start + 0.1, 'B', mm[1]);
          if ((mm = /n\(\{A\}∩\{B\}\) = (\d+%?)/.exec(l.m))) push(l.start + 0.1, 'ab', mm[1]);
          if ((mm = /n\(\{A\}∪\{B\}\) = (\d+%?)(?: \w+)?$/.exec(l.m))) push(l.start + 0.1, 'union', mm[1]);
          if ((mm = /only \{B\} = .*= (\d+)$/.exec(l.m))) push(l.start + 0.5, 'b', mm[1]);
          if (l.find) push(l.start + 0.1, unknownSlot, 'x');
          if (l.solve) push(l.start + 0.7, unknownSlot, unknownValue);
        }
      }
      // answer beat: every region gets its dots + count
      const ans = beat.answer, chk = ans.lines.filter((l) => l.check !== undefined);
      const order = { AB: ['ab'], neither: ['n'], union: ['a', 'ab', 'b'], B: ['ab', 'b'] }[P.unknown];
      const rest = ['a', 'ab', 'b'].filter((r) => !order.includes(r));
      const hasN = P.counts.n > 0 || P.unknown === 'neither';
      const groups = [[ans.lines[0].start + 0.35, order], [chk[0].start + 0.1, rest], [chk[chk.length - 1].start + 0.1, hasN && !order.includes('n') ? ['n'] : []]];
      const fill = [];
      for (const [t0, regs] of groups) {
        regs.forEach((r, i) => {
          const at = t0 + i * 0.9;
          fill.push({ r, t: at });
          const v = P.pct ? `${P.counts[r]}%` : String(P.counts[r]);
          push(at + 0.45, r, v);
        });
      }
      ev.sort((a, b) => a.t - b.t);
      return { ev, fill };
    })();
    function fact(slot, t) {
      let cur = null;
      for (const e of facts.ev) { if (e.t <= t && e.slot === slot) cur = e; }
      return cur;
    }

    // ---- which line is playing ---------------------------------------------------
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

    // ---- background (static, rendered once) ---------------------------------------
    let BG = null;
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
    let QL = null;
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
      // split into words, each word = list of {s,g}
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
    function logo(ctx, x, y, r, t) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x - r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill();
      ctx.beginPath(); ctx.arc(x + r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.teal; ctx.fill();
      ctx.beginPath(); ctx.arc(x - r * 0.45, y, r, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(x + r * 0.45, y, r, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill();
      ctx.restore();
    }
    function drawHeader(ctx, t) {
      // creator tag (whole video)
      ctx.font = font(30, 600);
      const label = 'Maths by Zosiama';
      const tw = ctx.measureText(label).width;
      pill(ctx, 40, 178, tw + 100, 54, PAL.ink);
      logo(ctx, 80, 205, 13, t);
      text(ctx, label, 108, 206, 30, PAL.paper);
      // chapter chip
      const chip = `SETS · Q${P.num}`;
      ctx.font = font(28, 700);
      const cw = ctx.measureText(chip).width + 44;
      pill(ctx, 1040 - cw, 180, cw, 50, rgba(PAL.paper, 0.9), PAL.ink, 3);
      text(ctx, chip, 1040 - cw / 2, 206, 28, PAL.ink, { align: 'center', weight: 700 });
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
    // HOOK — the question's own subject + big question
    // =============================================================================
    function drawHook(ctx, t) {
      const b = beat.hook;
      const punch = 1 + 0.035 * (1 - ease.out(win(t, 0, 0.7)));
      // headline
      math(ctx, P.hook.head[0], 540, 296, 92, { align: 'center', maxW: 940, weight: 700 });
      math(ctx, P.hook.head[1], 540, 386, 68, { align: 'center', maxW: 940, weight: 700 });
      // subject art (a small zoom punch; frame 0 is already complete)
      ctx.save();
      ctx.translate(540, 810); ctx.scale(punch, punch); ctx.translate(-540, -810);
      ART[P.art.kind](ctx, t, { x: 90, y: 500, w: 900, h: 620 }, P);
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
      // brand badge
      const k = ease.back(win(t, brand.start - 0.1, 0.55));
      const bob = Math.sin((t - b.start) * 2.2) * 6;
      ctx.save(); ctx.translate(540, 420 + bob); ctx.scale(k, k);
      logo(ctx, 0, -40, 62, t);
      text(ctx, 'Maths by Zosiama', 0, 75, 70, PAL.ink, { align: 'center', weight: 700 });
      ctx.restore();
      // question card
      const ck = ease.out(win(t, b.lines[1].start - 0.25, 0.45));
      if (ck <= 0) return;
      const x = 90, y = 580 + (1 - ck) * 70, w = 860, h = 682;
      ctx.save(); ctx.globalAlpha = ck * exitAlpha(b, t);
      card(ctx, x, y, w, h);
      chip(ctx, x + 32, y - 26, `QUESTION ${P.num}`, PAL.coral);
      // highlight groups turned on by the narration
      const on = {};
      for (const l of b.lines) if (l.mark && t >= l.start) l.mark.forEach((g) => { on[g] = l.start; });
      const q = QL, sp = (() => { ctx.font = font(q.size, 600); return ctx.measureText(' ').width; })();
      const top = y + 40 + (h - 40 - q.lines.length * q.lh) / 2;
      q.lines.forEach((ln, i) => {
        let cx = x + (w - ln.w) / 2;
        const cy = top + q.lh * (i + 0.5);
        ctx.font = font(q.size, 600);
        // highlighter first
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
    function chip(ctx, x, y, label, color, tc) {
      ctx.font = font(30, 700);
      const w = ctx.measureText(label).width + 44;
      pill(ctx, x, y, w, 52, color, PAL.ink, 4);
      text(ctx, label, x + w / 2, y + 27, 30, tc || PAL.paper, { align: 'center', weight: 700 });
      return w;
    }
    function exitAlpha(b, t) { return 1 - win(t, b.end - 0.28, 0.28); }

    // =============================================================================
    // STAGE — the Venn diagram (scene → answer)
    // =============================================================================
    function drawStage(ctx, t, cur) {
      const sc = beat.scene;
      const draw = ease.inOut(win(t, sc.lines[0].start - 0.1, 1.1));
      if (draw <= 0) return;
      const outroFade = 1 - win(t, beat.outro.start - 0.3, 0.3);
      if (outroFade <= 0) return;
      ctx.save(); ctx.globalAlpha = outroFade;

      const legendAt = (key) => { const l = sc.lines.find((x) => x.legend === key); return l ? l.start : Infinity; };
      // box U
      ctx.save();
      ctx.beginPath(); boxP(ctx); ctx.fillStyle = rgba(PAL.paper, 0.96 * draw); ctx.fill();
      ctx.setLineDash([3400 * draw, 4000]);
      ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
      // U tab
      const uk = ease.back(win(t, legendAt('U'), 0.45));
      if (uk > 0) {
        const lbl = P.U.total ? `${P.U.label} · ${withUnit(P.U.total)}` : P.U.label;
        ctx.save(); ctx.globalAlpha *= clamp(uk); ctx.translate(G.bx + G.bw / 2, G.by); ctx.scale(uk, uk);
        ctx.font = font(30, 700); const w = ctx.measureText(lbl).width + 40;
        pill(ctx, -w / 2, -23, w, 46, PAL.ink); text(ctx, lbl, 0, 1, 30, PAL.paper, { align: 'center', weight: 700 });
        ctx.restore();
      }
      // circles: light fills + outline drawn in
      const fk = win(t, sc.lines[0].start + 0.5, 0.6);
      fillRegion(ctx, 'A', rgba(PAL.coral, 0.12 * fk));
      fillRegion(ctx, 'B', rgba(PAL.teal, 0.12 * fk));
      if (P.counts.n > 0 || P.unknown === 'neither') fillRegion(ctx, 'neither', rgba(PAL.plum, 0.05 * fk));

      // highlights for the current line
      drawHighlight(ctx, t, cur);

      // answer dots
      drawDots(ctx, t);

      ctx.lineWidth = 7;
      const a0 = -Math.PI / 2;
      ctx.beginPath(); ctx.arc(G.ax, G.cy, G.r, a0, a0 + Math.PI * 2 * draw); ctx.strokeStyle = PAL.coral; ctx.stroke();
      ctx.beginPath(); ctx.arc(G.bx2, G.cy, G.r, a0, a0 + Math.PI * 2 * draw); ctx.strokeStyle = PAL.teal; ctx.stroke();

      // set labels
      const lk = ease.out(win(t, legendAt('AB'), 0.4));
      if (lk > 0) {
        ctx.save(); ctx.globalAlpha *= lk;
        setLabel(ctx, t, 'A', G.bx + 26, 'left');
        setLabel(ctx, t, 'B', G.bx + G.bw - 26, 'right');
        ctx.restore();
      }
      // region names — the labelled diagram for "know first"
      const kb = beat.know;
      const nk = win(t, kb.start + 0.2, 0.4) * (1 - win(t, kb.end - 0.3, 0.3));
      if (nk > 0) {
        ctx.save(); ctx.globalAlpha *= nk;
        regionName(ctx, `only ${P.A.s}`, BADGE.a[0] - 10, G.cy + 68, PAL.coral);
        regionName(ctx, 'both', BADGE.ab[0], G.cy + 68, mix(PAL.sun, PAL.ink, 0.35));
        regionName(ctx, `only ${P.B.s}`, BADGE.b[0] + 10, G.cy + 68, PAL.teal);
        regionName(ctx, 'neither', G.bx + 78, G.by + G.bh - 62, PAL.plum);
        ctx.restore();
      }
      // badges
      for (const r of ['a', 'ab', 'b', 'n']) {
        const f = fact(r, t);
        if (f) badge(ctx, t, r, f);
      }
      // union chip (bottom edge) and scale chip
      const fu = fact('union', t);
      if (fu) {
        const k = ease.back(win(t, fu.t, 0.4));
        const s = `n({A}∪{B}) = ${fu.v === 'x' ? '[x]' : withUnit(fu.v)}`;
        ctx.save(); ctx.translate(G.bx2 + 40, G.by + G.bh); ctx.scale(k, k);
        ctx.font = font(30, 700); const w = mathWidth(ctx, parseMath(s, PAL.ink), 30, 700) + 40;
        pill(ctx, -w / 2, -23, w, 46, PAL.sun, PAL.ink, 3);
        math(ctx, s, 0, 1, 30, { align: 'center', weight: 700, sym: PAL.ink });
        ctx.restore();
      }
      const sk = ease.back(win(t, legendAt('scale'), 0.4));
      if (sk > 0) {
        ctx.save(); ctx.translate(G.bx + 24, G.by + G.bh); ctx.scale(sk, sk);
        const s = `1 dot = ${P.pct ? '1%' : withUnit(P.dot)}`;
        ctx.font = font(28, 700); const w = ctx.measureText(s).width + 70;
        pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3);
        ctx.beginPath(); ctx.arc(26, 0, 10, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill();
        text(ctx, s, 46, 1, 28, PAL.ink, { weight: 700 });
        ctx.restore();
      }
      ctx.restore();
    }
    function regionName(ctx, s, x, y, color) {
      ctx.font = font(26, 700); const w = ctx.measureText(s).width + 26;
      pill(ctx, x - w / 2, y - 18, w, 36, rgba(PAL.paper, 0.9), color, 3);
      text(ctx, s, x, y + 1, 26, color, { align: 'center', weight: 700 });
    }
    function setLabel(ctx, t, which, x, align) {
      const S = P[which], col = which === 'A' ? PAL.coral : PAL.teal;
      ctx.font = font(54, 700);
      const lw = ctx.measureText(S.s).width;
      const dir = align === 'left' ? 1 : -1;
      text(ctx, S.s, x, G.by + 46, 54, col, { align, weight: 700 });
      text(ctx, S.label, x + dir * (lw + 12), G.by + 49, 34, PAL.ink, { align, weight: 600, maxW: 250 });
      const f = fact(which, t);
      if (f) {
        const k = ease.back(win(t, f.t, 0.4));
        const s = `n(${which === 'A' ? '{A}' : '{B}'}) = ${f.v === 'x' ? '[x]' : withUnit(f.v)}`;
        ctx.save(); ctx.translate(x, G.by + 92); ctx.scale(k, k);
        math(ctx, s, 0, 0, 30, { align, weight: 700, color: PAL.ink, maxW: 330 });
        ctx.restore();
      }
    }
    function badge(ctx, t, r, f) {
      const [x, y] = BADGE[r];
      const k = ease.back(win(t, f.t, 0.45));
      const col = { a: PAL.coral, ab: PAL.sun, b: PAL.teal, n: PAL.plum }[r];
      const isX = f.v === 'x';
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      const pulse = isX ? 1 + 0.06 * Math.sin(t * 6) : 1;
      ctx.scale(pulse, pulse);
      const fill = isX ? PAL.plum : col, tc = isX || r !== 'ab' ? PAL.paper : PAL.ink;
      if (isX) {
        ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
        text(ctx, 'x', 0, -2, 46, PAL.paper, { align: 'center', weight: 700 });
      } else {
        const num = P.pct ? `${String(f.v).replace('%', '')}%` : String(f.v);
        const unit = P.pct ? '' : (+f.v === 1 ? U1 : UN);
        ctx.font = font(36, 700); const nw = ctx.measureText(num).width;
        ctx.font = font(18, 600); const uw = unit ? ctx.measureText(unit).width : 0;
        const w = Math.max(nw, uw) + 30, h = unit ? 70 : 54;
        ctx.beginPath(); rrect(ctx, -w / 2, -h / 2, w, h, 18); ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
        text(ctx, num, 0, unit ? -9 : 1, 36, tc, { align: 'center', weight: 700 });
        if (unit) text(ctx, unit, 0, 21, 18, tc, { align: 'center', weight: 600 });
      }
      ctx.restore();
    }
    function drawHighlight(ctx, t, cur) {
      if (!cur || !cur.l) return;
      const L = cur.l, hl = L.hl;
      if (!hl || hl === 'none') return;
      const endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25));
      if (k <= 0) return;
      const pulse = 0.85 + 0.15 * Math.sin((t - L.start) * 6);
      const a = k * pulse;
      const col = { A: PAL.coral, B: PAL.teal, AB: PAL.sun, Aonly: PAL.coral, Bonly: PAL.teal, union: PAL.sun, neither: PAL.plum, U: PAL.ink };
      if (hl === 'A+B') {
        fillRegion(ctx, 'A', rgba(PAL.coral, 0.3 * a)); fillRegion(ctx, 'B', rgba(PAL.teal, 0.3 * a));
      } else if (hl === 'double') {
        const p1 = ease.out(win(t, L.start, 0.45)), p2 = ease.out(win(t, L.start + 0.55, 0.45));
        const fade = 1 - win(t, endT - 0.2, 0.25);
        fillRegion(ctx, 'A', rgba(PAL.coral, 0.34 * p1 * fade));
        fillRegion(ctx, 'B', rgba(PAL.teal, 0.34 * p2 * fade));
        const bk = ease.back(win(t, L.start + 1.0, 0.45)) * fade;
        if (bk > 0) {
          ctx.save(); ctx.translate(BADGE.ab[0], G.cy - 95); ctx.scale(bk, bk); ctx.rotate(-0.08);
          ctx.beginPath(); rrect(ctx, -62, -36, 124, 72, 20); ctx.fillStyle = PAL.sun; ctx.fill();
          ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
          text(ctx, '2×', 0, 2, 46, PAL.ink, { align: 'center', weight: 700 });
          ctx.restore();
        }
      } else if (hl === 'U') {
        ctx.save(); ctx.beginPath(); boxP(ctx); ctx.lineWidth = 12; ctx.strokeStyle = rgba(PAL.sun, 0.9 * a); ctx.stroke(); ctx.restore();
      } else {
        fillRegion(ctx, hl, rgba(col[hl] || PAL.sun, (hl === 'AB' || hl === 'union' ? 0.5 : 0.34) * a));
      }
    }
    function drawDots(ctx, t) {
      const col = { a: PAL.coral, ab: PAL.sun, b: PAL.teal, n: PAL.plum };
      for (const f of facts.fill) {
        const pts = dots[f.r];
        const n = pts.length;
        for (let i = 0; i < n; i++) {
          const at = f.t + (n > 1 ? (i / (n - 1)) * 0.75 : 0);
          const k = ease.back(win(t, at, 0.3));
          if (k <= 0) continue;
          const [x, y] = pts[i];
          ctx.beginPath(); ctx.arc(x, y, dots.rd * k, 0, Math.PI * 2);
          ctx.fillStyle = col[f.r]; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = rgba(PAL.ink, 0.55); ctx.stroke();
        }
      }
    }

    // =============================================================================
    // BOARD — one card per beat
    // =============================================================================
    const BX = 90, BY = 882, BW = 860, BH = 388;
    function boardFrame(ctx, b, t, title, color, h) {
      const k = ease.back(win(t, b.start + 0.02, 0.45));
      const a = win(t, b.start, 0.2) * exitAlpha(b, t);
      ctx.globalAlpha = a;
      ctx.translate(0, (1 - k) * 60);
      card(ctx, BX, BY, BW, h || BH);
      chip(ctx, BX + 32, BY - 26, title, color, color === PAL.sun ? PAL.ink : PAL.paper);
    }
    function drawBoard(ctx, t, b) {
      ctx.save();
      if (b.type === 'scene') boardScene(ctx, t, b);
      else if (b.type === 'given') boardGiven(ctx, t, b);
      else if (b.type === 'know') boardKnow(ctx, t, b);
      else if (b.type === 'solve') boardSolve(ctx, t, b);
      else if (b.type === 'answer') boardAnswer(ctx, t, b);
      ctx.restore();
    }
    function rowIn(t, at) { return ease.out(win(t, at - 0.05, 0.35)); }

    function boardScene(ctx, t, b) {
      boardFrame(ctx, b, t, 'THE PICTURE', PAL.teal);
      const rows = [];
      for (const l of b.lines) {
        if (l.legend === 'U') rows.push({ at: l.start, icon: 'box', s: P.U.total ? `U = ${P.U.label.replace('U · ', 'the ')} (${withUnit(P.U.total)})` : 'U = all the elements' });
        if (l.legend === 'AB') {
          const named = !/^Set /.test(P.A.label);
          rows.push({ at: l.start, icon: 'A', s: named ? `{A} = ${P.A.legend || P.A.say}` : `{A} = coral circle` });
          rows.push({ at: l.start + 0.5, icon: 'B', s: named ? `{B} = ${P.B.legend || P.B.say}` : `{B} = teal circle` });
        }
        if (l.legend === 'mid') rows.push({ at: l.start, icon: 'lens', s: `middle {A}∩{B} = in both` });
        if (l.legend === 'out') rows.push({ at: l.start, icon: 'out', s: 'outside the circles = neither' });
        if (l.legend === 'scale') rows.push({ at: l.start, icon: 'dot', s: `Scale: 1 dot = ${P.pct ? '1%' : withUnit(P.dot)}` });
      }
      const rh = rows.length > 5 ? 54 : 62;
      rows.forEach((r, i) => {
        const k = rowIn(t, r.at);
        if (k <= 0) return;
        const y = BY + 56 + rh * (i + 0.5);
        ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
        legendIcon(ctx, r.icon, BX + 58, y);
        math(ctx, r.s, BX + 104, y, rows.length > 5 ? 40 : 44, { maxW: BW - 140 });
        ctx.restore();
      });
    }
    function legendIcon(ctx, kind, x, y) {
      ctx.save(); ctx.lineWidth = 4;
      if (kind === 'box') { ctx.beginPath(); rrect(ctx, x - 24, y - 18, 48, 36, 8); ctx.strokeStyle = PAL.ink; ctx.stroke(); }
      if (kind === 'A' || kind === 'B') { ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fillStyle = rgba(kind === 'A' ? PAL.coral : PAL.teal, 0.25); ctx.fill(); ctx.strokeStyle = kind === 'A' ? PAL.coral : PAL.teal; ctx.lineWidth = 5; ctx.stroke(); }
      if (kind === 'lens') {
        ctx.beginPath(); ctx.arc(x - 9, y, 17, 0, Math.PI * 2); ctx.strokeStyle = PAL.coral; ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 9, y, 17, 0, Math.PI * 2); ctx.strokeStyle = PAL.teal; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(x - 9, y, 17, 0, Math.PI * 2); ctx.clip(); ctx.beginPath(); ctx.arc(x + 9, y, 17, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.restore();
      }
      if (kind === 'out') { ctx.beginPath(); rrect(ctx, x - 24, y - 18, 48, 36, 8); ctx.fillStyle = rgba(PAL.plum, 0.35); ctx.fill(); ctx.strokeStyle = PAL.plum; ctx.stroke(); }
      if (kind === 'dot') { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill(); ctx.strokeStyle = rgba(PAL.ink, 0.55); ctx.lineWidth = 2.5; ctx.stroke(); }
      ctx.restore();
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
      boardFrame(ctx, b, t, 'SOLUTION', PAL.ink);
      const rh = 78;
      let curI = -1;
      b.lines.forEach((l, i) => { if (t >= l.start - 0.1) curI = i; });
      b.lines.forEach((l, i) => {
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
      // answer card
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
      // check rows
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
      // rays
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
      logo(ctx, 0, 0, 108, t);
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
        // ripple
        if (cyc > 0.8) {
          const rk = win(cyc, 0.8, 1.0);
          ctx.save(); ctx.globalAlpha = 1 - rk; ctx.lineWidth = 8; ctx.strokeStyle = PAL.coral;
          ctx.beginPath(); rrect(ctx, 540 - 330 - rk * 40, 1020 - 70 - rk * 40, 660 + rk * 80, 140 + rk * 80, 70 + rk * 40); ctx.stroke(); ctx.restore();
        }
        // hand
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
      ctx.beginPath(); rrect(ctx, -14, -60, 28, 70, 14); ctx.fill(); ctx.stroke();                 // finger
      ctx.beginPath(); rrect(ctx, -30, -5, 76, 70, 24); ctx.fill(); ctx.stroke();                  // palm
      ctx.beginPath(); ctx.moveTo(14, 6); ctx.lineTo(14, 20); ctx.moveTo(30, 6); ctx.lineTo(30, 20); ctx.stroke();
      ctx.restore();
    }

    // =============================================================================
    // transitions
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
      logo(ctx, px, H * 0.42, 60, t);
      ctx.restore();
    }

    // =============================================================================
    // the frame
    // =============================================================================
    function frame(ctx, t, opts) {
      ctx.drawImage(BG, 0, 0);
      const b = beatAt(t);
      if (b.type === 'hook') {
        drawHook(ctx, t);
      } else if (b.type === 'question') {
        drawQuestion(ctx, t);
      } else if (b.type === 'outro') {
        drawOutro(ctx, t);
      } else {
        const { cur, next } = lineAt(b, t);
        drawStage(ctx, t, { l: cur, next, b });
        drawBoard(ctx, t, b);
      }
      drawHeader(ctx, t);
      drawProgress(ctx, t);
      drawCaption(ctx, t, opts);
      swipe(ctx, t, beat.question.start, PAL.sun);
      swipe(ctx, t, beat.outro.start, PAL.teal);
    }

    function draw(ctx, t, opts = {}) {
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
    }

    return { W, H, FPS, duration: D, draw, beats, P, TL, dots };
  }

  // ================================================================================
  // HOOK ART — each problem opens on its own subject, drawn in code
  // ================================================================================
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
  function shadowBlob(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.ink, 0.12); ctx.fill(); }

  const ART = {
    tokens(ctx, t, R, P) {
      const cx = R.x + R.w / 2, cy = R.y + 330, r = 225, d = 150;
      const shape = P.art.shape;
      ctx.save();
      [[cx - d, PAL.coral, 'A'], [cx + d, PAL.teal, 'B']].forEach(([x, col]) => {
        ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fillStyle = rgba(col, 0.14); ctx.fill();
        ctx.lineWidth = 9; ctx.strokeStyle = col; ctx.stroke();
      });
      // tokens in the "only" parts
      const sides = [[cx - d, cx + d, PAL.coral, 1], [cx + d, cx - d, PAL.teal, 2]];
      for (const [x, ox, col, sd] of sides) {
        let n = 0;
        for (let j = -4; j <= 4; j++) for (let i = -5; i <= 5; i++) {
          const px = x + i * 54 + (j % 2 ? 27 : 0), py = cy + j * 48;
          if (Math.hypot(px - x, py - cy) > r - 34 || Math.hypot(px - ox, py - cy) < r + 30) continue;
          n++;
          const bob = Math.sin(t * 3 + n * 0.9 + sd) * 4;
          token(ctx, shape, px, py + bob, 19, col, n + sd * 50, t);
        }
      }
      // the mystery middle
      const q = 1 + 0.08 * Math.sin(t * 5);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(q, q);
      ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, '?', 0, 4, 82, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
      // set tags
      [[cx - d - 150, PAL.coral, P.A.s, P.art.a], [cx + d + 150, PAL.teal, P.B.s, P.art.b]].forEach(([x, col, s, n]) => {
        const y = cy - r + 10;
        ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
        text(ctx, s, x, y + 3, 64, PAL.paper, { align: 'center', weight: 700 });
        const lab = `${n}`;
        ctx.font = font(38, 700); const w = ctx.measureText(lab).width + 34;
        pill(ctx, x - w / 2, y + 48, w, 52, PAL.paper, PAL.ink, 4);
        text(ctx, lab, x, y + 75, 38, PAL.ink, { align: 'center', weight: 700 });
      });
      ctx.restore();
    },
    sports(ctx, t, R) {
      // football
      const fx = R.x + 250, fy = R.y + 250 + Math.abs(Math.sin(t * 3.2)) * -40, fr = 150;
      shadowBlob(ctx, R.x + 250, R.y + 420, 120 - Math.abs(Math.sin(t * 3.2)) * 20, 22);
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(t * 0.8);
      ctx.beginPath(); ctx.arc(0, 0, fr, 0, Math.PI * 2); ctx.fillStyle = PAL.paper; ctx.fill();
      ctx.save(); ctx.clip();
      const pent = (x, y, s, rot) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i * Math.PI * 2 / 5; ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } ctx.closePath(); ctx.fillStyle = PAL.ink; ctx.fill(); };
      pent(0, 0, 48, -Math.PI / 2);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + Math.PI / 5; pent(Math.cos(a) * 138, Math.sin(a) * 138, 46, a + Math.PI); }
      ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink;
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 48, Math.sin(a) * 48); ctx.lineTo(Math.cos(a) * 100, Math.sin(a) * 100); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, fr, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
      // racket + tennis ball
      ctx.save(); ctx.translate(R.x + 670, R.y + 230); ctx.rotate(0.5 + Math.sin(t * 2) * 0.08);
      ctx.fillStyle = PAL.ink; ctx.beginPath(); rrect(ctx, -16, 120, 32, 170, 14); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 105, 135, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.teal, 0.12); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(PAL.teal, 0.8); ctx.lineWidth = 3;
      for (let i = -120; i <= 120; i += 22) { ctx.beginPath(); ctx.moveTo(i, -140); ctx.lineTo(i, 140); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-110, i); ctx.lineTo(110, i); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, 105, 135, 0, 0, Math.PI * 2); ctx.lineWidth = 16; ctx.strokeStyle = PAL.teal; ctx.stroke();
      ctx.restore();
      const tx = R.x + 770, ty = R.y + 360 + Math.sin(t * 4) * 16;
      ctx.beginPath(); ctx.arc(tx, ty, 70, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(tx, ty, 70, 0, Math.PI * 2); ctx.clip(); ctx.lineWidth = 8; ctx.strokeStyle = PAL.paper;
      ctx.beginPath(); ctx.arc(tx - 88, ty, 70, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(tx + 88, ty, 70, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke(); ctx.restore();
      people(ctx, R.x + 20, R.y + 470, R.w - 40, 2, 20, 42, t, 11, '40 students');
    },
    speech(ctx, t, R) {
      const bubble = (x, y, w, h, col, s, tail, fontFam) => {
        ctx.beginPath(); rrect(ctx, x - w / 2, y - h / 2 + 10, w, h, 50); ctx.fillStyle = rgba(PAL.ink, 0.15); ctx.fill();
        ctx.beginPath(); rrect(ctx, x - w / 2, y - h / 2, w, h, 50);
        ctx.moveTo(x + tail - 30, y + h / 2 - 2); ctx.lineTo(x + tail, y + h / 2 + 70); ctx.lineTo(x + tail + 34, y + h / 2 - 2);
        ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = PAL.ink; ctx.stroke();
        ctx.font = fontFam; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = PAL.paper; ctx.fillText(s, x, y + 4);
      };
      const b1 = Math.sin(t * 2.6) * 10, b2 = Math.sin(t * 2.6 + 1.6) * 10;
      bubble(R.x + 250, R.y + 150 + b1, 400, 160, PAL.coral, 'Hello!', -60, font(84, 700));
      bubble(R.x + 650, R.y + 300 + b2, 420, 160, PAL.teal, 'नमस्ते!', 40, `700 84px "Deva", ${FONT_STACK}`);
      text(ctx, 'English', R.x + 250, R.y + 50 + b1, 34, PAL.coral, { align: 'center', weight: 700 });
      text(ctx, 'Hindi', R.x + 650, R.y + 200 + b2, 34, PAL.teal, { align: 'center', weight: 700 });
      people(ctx, R.x + 10, R.y + 478, R.w - 20, 2, 18, 44, t, 23, '400 people');
    },
    juice(ctx, t, R) {
      const glass = (x, liquid, fruit) => {
        const y = R.y + 70, gw = 230, gh = 360;
        shadowBlob(ctx, x, y + gh + 10, 130, 20);
        // liquid
        const lv = y + 90 + Math.sin(t * 2 + x) * 5;
        ctx.save(); ctx.beginPath(); ctx.moveTo(x - gw / 2, y); ctx.lineTo(x + gw / 2, y); ctx.lineTo(x + gw / 2 - 30, y + gh); ctx.lineTo(x - gw / 2 + 30, y + gh); ctx.closePath(); ctx.clip();
        ctx.fillStyle = liquid; ctx.fillRect(x - gw, lv, gw * 2, gh);
        ctx.fillStyle = rgba(PAL.paper, 0.35);
        for (let i = 0; i < 7; i++) { const by = y + gh - ((t * 60 + i * 55) % (gh - 90)); ctx.beginPath(); ctx.arc(x - 60 + rnd(i + x) * 120, by, 7 + 5 * rnd(i + 9), 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        // straw
        ctx.save(); ctx.translate(x + 40, y + 40); ctx.rotate(0.28);
        ctx.fillStyle = PAL.plum; ctx.beginPath(); rrect(ctx, -12, -160, 24, 330, 12); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke(); ctx.restore();
        ctx.beginPath(); ctx.moveTo(x - gw / 2, y); ctx.lineTo(x + gw / 2, y); ctx.lineTo(x + gw / 2 - 30, y + gh); ctx.lineTo(x - gw / 2 + 30, y + gh); ctx.closePath();
        ctx.fillStyle = rgba(PAL.paper, 0.25); ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink; ctx.stroke();
        fruit(x - gw / 2 + 10, y + 10);
      };
      glass(R.x + 250, mix(PAL.sun, PAL.paper, 0.35), (x, y) => {
        ctx.beginPath(); ctx.arc(x, y, 58, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + 18, y - 70, 26, 12, -0.6, 0, Math.PI * 2); ctx.fillStyle = PAL.teal; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.lineTo(x + 4, y - 78); ctx.stroke();
      });
      glass(R.x + 650, mix(PAL.coral, PAL.sun, 0.55), (x, y) => {
        ctx.beginPath(); ctx.arc(x, y, 60, Math.PI, 0); ctx.closePath(); ctx.fillStyle = mix(PAL.coral, PAL.sun, 0.5); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 44, Math.PI, 0); ctx.closePath(); ctx.fillStyle = mix(PAL.sun, PAL.paper, 0.4); ctx.fill();
        ctx.strokeStyle = mix(PAL.coral, PAL.sun, 0.5); ctx.lineWidth = 4;
        for (let i = 1; i < 6; i++) { const a = Math.PI + i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 44, y + Math.sin(a) * 44); ctx.stroke(); }
      });
      text(ctx, 'Apple', R.x + 250, R.y + 470, 40, PAL.coral, { align: 'center', weight: 700 });
      text(ctx, 'Orange', R.x + 650, R.y + 470, 40, mix(PAL.coral, PAL.ink, 0.15), { align: 'center', weight: 700 });
      people(ctx, R.x + 20, R.y + 540, R.w - 40, 1, 20, 42, t, 31, '600 students');
    },
    cups(ctx, t, R) {
      const steam = (x, y) => {
        ctx.save(); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.strokeStyle = rgba(PAL.ink, 0.25);
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          for (let k = 0; k <= 20; k++) { const yy = y - k * 7; const xx = x + (i - 1) * 34 + Math.sin(k * 0.45 + t * 4 + i) * 10; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
          ctx.stroke();
        }
        ctx.restore();
      };
      // coffee mug
      const mx = R.x + 240, my = R.y + 200;
      const brown = mix(PAL.coral, PAL.ink, 0.5);
      steam(mx, my - 20);
      shadowBlob(ctx, mx, my + 290, 150, 22);
      ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink;
      ctx.beginPath(); ctx.ellipse(mx + 130, my + 140, 58, 70, 0, 0, Math.PI * 2); ctx.lineWidth = 26; ctx.strokeStyle = PAL.coral; ctx.stroke();
      ctx.beginPath(); rrect(ctx, mx - 130, my, 260, 280, 36); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(mx, my + 8, 124, 28, 0, 0, Math.PI * 2); ctx.fillStyle = brown; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      text(ctx, 'COFFEE', mx, my + 160, 44, PAL.paper, { align: 'center', weight: 700 });
      // tea cup
      const cx = R.x + 660, cy = R.y + 250;
      steam(cx, cy - 20);
      ctx.beginPath(); ctx.ellipse(cx, cy + 222, 200, 36, 0, 0, Math.PI * 2); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + 150, cy + 80, 44, 50, 0, 0, Math.PI * 2); ctx.lineWidth = 22; ctx.strokeStyle = PAL.teal; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 160, cy); ctx.lineTo(cx + 160, cy); ctx.quadraticCurveTo(cx + 150, cy + 210, cx, cy + 210); ctx.quadraticCurveTo(cx - 150, cy + 210, cx - 160, cy); ctx.closePath();
      ctx.fillStyle = PAL.teal; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, 160, 28, 0, 0, Math.PI * 2); ctx.fillStyle = mix(PAL.sun, PAL.coral, 0.35); ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
      // tea bag
      ctx.beginPath(); ctx.moveTo(cx - 60, cy - 2); ctx.lineTo(cx - 110, cy + 90 + Math.sin(t * 3) * 6); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.beginPath(); rrect(ctx, cx - 140, cy + 88 + Math.sin(t * 3) * 6, 62, 46, 8); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      text(ctx, 'TEA', cx + 30, cy + 110, 44, PAL.paper, { align: 'center', weight: 700 });
      people(ctx, R.x + 20, R.y + 540, R.w - 40, 1, 20, 42, t, 41, '80 people');
    },
    exam(ctx, t, R) {
      // answer sheet
      ctx.save(); ctx.translate(R.x + 250, R.y + 250); ctx.rotate(-0.08 + Math.sin(t * 2) * 0.015);
      ctx.beginPath(); rrect(ctx, -170, -210 + 10, 340, 440, 18); ctx.fillStyle = rgba(PAL.ink, 0.15); ctx.fill();
      ctx.beginPath(); rrect(ctx, -170, -210, 340, 440, 18); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, 'ENGLISH', 0, -160, 40, PAL.ink, { align: 'center', weight: 700 });
      ctx.strokeStyle = rgba(PAL.ink, 0.3); ctx.lineWidth = 5;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-130, -100 + i * 44); ctx.lineTo(130 - (i % 3) * 40, -100 + i * 44); ctx.stroke(); }
      ctx.restore();
      stamp(ctx, R.x + 320, R.y + 380, '63% failed', t, 0);
      // laptop (ICT)
      ctx.save(); ctx.translate(R.x + 660, R.y + 200 + Math.sin(t * 2 + 1) * 6);
      ctx.beginPath(); rrect(ctx, -190, -140, 380, 250, 20); ctx.fillStyle = PAL.ink; ctx.fill();
      ctx.beginPath(); rrect(ctx, -170, -120, 340, 210, 10); ctx.fillStyle = PAL.teal; ctx.fill();
      text(ctx, 'ICT', 0, -60, 64, PAL.paper, { align: 'center', weight: 700 });
      ctx.strokeStyle = rgba(PAL.paper, 0.7); ctx.lineWidth = 8; ctx.lineCap = 'round';
      [[-120, 0, 60], [-120, 34, 150], [-60, 68, 90]].forEach(([x, y, w]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-230, 110); ctx.lineTo(230, 110); ctx.lineTo(200, 140); ctx.lineTo(-200, 140); ctx.closePath(); ctx.fillStyle = PAL.ink; ctx.fill();
      ctx.restore();
      stamp(ctx, R.x + 700, R.y + 400, '42% failed', t, 1);
      people(ctx, R.x + 20, R.y + 540, R.w - 40, 1, 20, 42, t, 51, 'all candidates = 100%');
    },
    games(ctx, t, R) {
      // badminton racket
      ctx.save(); ctx.translate(R.x + 250, R.y + 250); ctx.rotate(-0.45 + Math.sin(t * 2.4) * 0.1);
      ctx.fillStyle = PAL.ink; ctx.beginPath(); rrect(ctx, -14, 130, 28, 190, 12); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, 95, 130, 0, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.coral, 0.12); ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = rgba(PAL.coral, 0.8); ctx.lineWidth = 3;
      for (let i = -130; i <= 130; i += 20) { ctx.beginPath(); ctx.moveTo(i, -140); ctx.lineTo(i, 140); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-100, i); ctx.lineTo(100, i); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, 0, 95, 130, 0, 0, Math.PI * 2); ctx.lineWidth = 14; ctx.strokeStyle = PAL.coral; ctx.stroke();
      ctx.restore();
      // shuttlecock flying
      const sx = R.x + 430 + Math.sin(t * 1.6) * 30, sy = R.y + 90 + Math.cos(t * 1.6) * 20;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(0.9);
      ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-60, -110); ctx.lineTo(60, -110); ctx.lineTo(24, 0); ctx.closePath(); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 8, 0); ctx.lineTo(i * 24, -110); ctx.lineWidth = 3; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 14, 28, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
      // chess king + board
      const kx = R.x + 670, ky = R.y + 370;
      ctx.save();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? PAL.ink : PAL.paper; ctx.fillRect(kx - 160 + i * 80, ky + 10 + j * 40, 80, 40); }
      ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.strokeRect(kx - 160, ky + 10, 320, 80);
      ctx.translate(kx, ky + Math.sin(t * 3) * -8);
      ctx.fillStyle = PAL.teal; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 7;
      ctx.beginPath(); rrect(ctx, -95, -30, 190, 40, 14); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-60, -30); ctx.quadraticCurveTo(-40, -150, -55, -200); ctx.lineTo(55, -200); ctx.quadraticCurveTo(40, -150, 60, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); rrect(ctx, -80, -230, 160, 40, 14); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -230); ctx.lineTo(0, -300); ctx.moveTo(-28, -272); ctx.lineTo(28, -272); ctx.lineWidth = 16; ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = PAL.teal; ctx.beginPath(); ctx.moveTo(0, -234); ctx.lineTo(0, -296); ctx.moveTo(-24, -272); ctx.lineTo(24, -272); ctx.stroke();
      ctx.restore();
      text(ctx, 'Badminton', R.x + 120, R.y + 490, 38, PAL.coral, { align: 'center', weight: 700 });
      text(ctx, 'Chess', R.x + 670, R.y + 490, 38, PAL.teal, { align: 'center', weight: 700 });
      people(ctx, R.x + 20, R.y + 545, R.w - 40, 1, 20, 40, t, 61, '65 people');
    },
  };
  function token(ctx, shape, x, y, s, col, i, t) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (shape === 'marble') { ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.35, s * 0.28, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.paper, 0.7); ctx.fill(); }
    else if (shape === 'tile') { ctx.rotate(Math.sin(t * 2 + i) * 0.15); rrect(ctx, -s, -s, 2 * s, 2 * s, 6); ctx.fill(); ctx.stroke(); }
    else if (shape === 'star') { ctx.rotate(t * 0.8 + i); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? s * 0.5 : s * 1.1; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  function stamp(ctx, x, y, s, t, i) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.14 + i * 0.22);
    const k = 1 + 0.05 * Math.sin(t * 5 + i * 2);
    ctx.scale(k, k);
    ctx.font = font(46, 700); const w = ctx.measureText(s).width + 46;
    ctx.beginPath(); rrect(ctx, -w / 2, -40, w, 80, 16); ctx.fillStyle = rgba(PAL.paper, 0.9); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = PAL.coral; ctx.stroke();
    text(ctx, s, 0, 3, 46, PAL.coral, { align: 'center', weight: 700 });
    ctx.restore();
  }

  root.SetsVideo = { createVideo, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
