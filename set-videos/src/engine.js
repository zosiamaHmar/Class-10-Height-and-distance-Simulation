/* Maths by Zosiama · Sets explainers — Venn-diagram engine.
 *
 * Built on video-kit/core.js (chrome, maths text, board cards, end card, loop). This
 * file adds what is special to the set problems: the Venn diagram stage, dots drawn to
 * scale, the scene card and the hook illustrations. Every frame is a pure function of
 * time: video.draw(ctx, t, opts).
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, FONT_STACK, BX, BY, BW, font, clamp, win, ease, rgba, mix, rnd,
    rrect, pill, text, shadowBlob, people, createCore,
  } = root.VideoCore;

  // ------------------------------------------------------------------------------
  // the video
  // ------------------------------------------------------------------------------
  function createVideo(P, TL) {
    const C = createCore(P, TL, {
      tokens: { A: { s: P.A.s, c: PAL.coral }, B: { s: P.B.s, c: PAL.teal } },
      chapter: `SETS · Q${P.num}`,
      label: `QUESTION ${P.num}`,
    });
    const { D, beats, beat, math, parseMath, mathWidth } = C;
    const U1 = P.unit[0], UN = P.unit[1];
    const withUnit = (v) => (P.pct || /%$/.test(String(v)) ? `${String(v).replace(/%$/, '')}%` : `${v} ${+v === 1 ? U1 : UN}`);

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
    // SCENE CARD — the legend for the picture
    // =============================================================================
    function boardScene(ctx, t, b) {
      C.boardFrame(ctx, b, t, 'THE PICTURE', PAL.teal);
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
        const k = C.rowIn(t, r.at);
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

    const draw = C.compose({
      art: (ctx, t, R) => ART[P.art.kind](ctx, t, R, P),
      stage: drawStage,
      scene: boardScene,
    });
    return { W, H, FPS, duration: D, draw, beats, P, TL, dots };
  }

  // ================================================================================
  // HOOK ART — each problem opens on its own subject, drawn in code
  // ================================================================================
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

  root.VideoEngine = { createVideo, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
