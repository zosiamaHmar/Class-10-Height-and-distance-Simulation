/* Maths by Zosiama · Heights & Distances explainers — right-triangle engine.
 *
 * Built on video-kit/core.js (chrome, maths text, board cards, end card, loop). This
 * file adds the stage: a sky scene drawn to scale (1 m = P.scene.scale px) with the
 * right triangle ABC (A = ground point, B = foot of the height, C = the top), the
 * side names, angle and right-angle marks, the unknown on its side, the scene card
 * and the hook illustration. Every frame is a pure function of time.
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, BX, BY, BW, font, clamp, lerp, win, ease, rgba, mix, rnd,
    rrect, pill, text, shadowBlob, createCore,
  } = root.VideoCore;

  const SIDE = { BC: PAL.coral, AC: PAL.plum, AB: PAL.teal }; // opposite / hypotenuse / adjacent

  function createVideo(P, TL) {
    const C = createCore(P, TL, {
      tokens: {
        BC: { s: 'BC', c: SIDE.BC }, AC: { s: 'AC', c: SIDE.AC }, AB: { s: 'AB', c: SIDE.AB },
        Opp: { s: 'Opposite', c: SIDE.BC }, Hyp: { s: 'Hypotenuse', c: SIDE.AC }, Adj: { s: 'Adjacent', c: SIDE.AB },
      },
      chapter: `HEIGHTS & DISTANCES · SIM ${P.num}`,
      label: `QUESTION · SIM ${P.num}`,
    });
    const { D, beats, beat, math, parseMath, mathWidth } = C;
    const S = P.scene;

    // ---- geometry, to scale -----------------------------------------------------------
    const G = { bx: 90, by: 280, bw: 900, bh: 538, br: 28, ground: 770 };
    const rad = S.angle * Math.PI / 180;
    const hPx = S.height * S.scale, basePx = hPx / Math.tan(rad);
    const A = { x: 380, y: G.ground }, B = { x: 380 + basePx, y: G.ground }, Ct = { x: 380 + basePx, y: G.ground - hPx };
    const dir = { x: Math.cos(rad), y: -Math.sin(rad) };      // A → C
    const out = { x: -Math.sin(rad), y: -Math.cos(rad) };     // away from the triangle, above the string
    const along = (k, off = 0) => ({ x: A.x + (Ct.x - A.x) * k + out.x * off, y: A.y + (Ct.y - A.y) * k + out.y * off });
    const boxP = (ctx) => rrect(ctx, G.bx, G.by, G.bw, G.bh, G.br);

    // when does each scene element appear? (first line that shows it)
    const showAt = {};
    for (const b of beats) for (const l of b.lines) if (l.show && showAt[l.show] === undefined) showAt[l.show] = l.start;
    const at = (k) => (showAt[k] === undefined ? Infinity : showAt[k]);
    const pop = (t, k, d = 0.45) => ease.back(win(t, at(k), d));

    // ---- stage ------------------------------------------------------------------------
    function drawStage(ctx, t, cur) {
      const sc = beat.scene;
      const draw = ease.inOut(win(t, sc.lines[0].start - 0.1, 1.0));
      if (draw <= 0) return;
      const outroFade = 1 - win(t, beat.outro.start - 0.3, 0.3);
      if (outroFade <= 0) return;
      ctx.save(); ctx.globalAlpha = outroFade;

      // frame + sky + ground (clipped to the stage)
      ctx.save();
      ctx.beginPath(); boxP(ctx); ctx.fillStyle = PAL.paper; ctx.fill(); ctx.clip();
      ctx.globalAlpha *= draw;
      ctx.fillStyle = rgba(PAL.teal, 0.13); ctx.fillRect(G.bx, G.by, G.bw, G.ground - G.by);
      sun(ctx, 905, 352, t);
      cloud(ctx, G.bx + ((t * 9 + 120) % (G.bw + 260)) - 130, 360, 1.0);
      cloud(ctx, G.bx + ((t * 6 + 620) % (G.bw + 260)) - 130, 450, 0.75);
      ctx.fillStyle = rgba(PAL.teal, 0.45); ctx.fillRect(G.bx, G.ground, G.bw, G.by + G.bh - G.ground);
      for (let i = 0; i < 40; i++) { // grass tufts
        const gx = G.bx + 12 + i * 23 + rnd(i) * 8;
        ctx.beginPath(); ctx.moveTo(gx, G.ground + 4); ctx.lineTo(gx + 4, G.ground - 6); ctx.lineTo(gx + 8, G.ground + 4);
        ctx.fillStyle = rgba(PAL.teal, 0.9); ctx.fill();
      }
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink;
      ctx.beginPath(); ctx.moveTo(G.bx, G.ground); ctx.lineTo(G.bx + G.bw * draw, G.ground); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.beginPath(); boxP(ctx); ctx.setLineDash([3400 * draw, 4000]); ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.stroke(); ctx.restore();

      const hl = highlight(t, cur);
      // triangle fill
      const triK = Math.max(win(t, at('tri'), 0.4) * 0.12, hl.tri * 0.3);
      if (triK > 0 && t >= at('tri')) {
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(Ct.x, Ct.y); ctx.closePath();
        ctx.fillStyle = rgba(PAL.sun, triK); ctx.fill();
      }
      // glow under the sides that matter right now
      glowSide(ctx, A, B, SIDE.AB, hl.AB);
      glowSide(ctx, B, Ct, SIDE.BC, hl.BC);
      glowSide(ctx, A, Ct, SIDE.AC, hl.AC);

      // AB on the ground
      if (t >= at('tri')) {
        const k = ease.out(win(t, at('tri'), 0.5));
        ctx.lineWidth = 6; ctx.strokeStyle = SIDE.AB; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(lerp(A.x, B.x, k), B.y); ctx.stroke();
      }
      // BC: dashed drop from the kite to the ground
      if (t >= at('B')) {
        const k = ease.inOut(win(t, at('B'), 0.7));
        ctx.save(); ctx.setLineDash([12, 9]); ctx.lineWidth = 5; ctx.strokeStyle = t >= at('tri') ? SIDE.BC : PAL.ink;
        ctx.beginPath(); ctx.moveTo(Ct.x, Ct.y + 8); ctx.lineTo(Ct.x, lerp(Ct.y + 8, B.y, k)); ctx.stroke(); ctx.restore();
      }
      // angle at A
      const ak = pop(t, 'angle');
      if (ak > 0) {
        const r = 72 * clamp(ak, 0, 1.2);
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.arc(A.x, A.y, r, -rad, 0); ctx.closePath();
        ctx.fillStyle = rgba(PAL.sun, 0.55 + 0.35 * hl.angle); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        const lab = t >= at('opp') ? `θ = ${S.angle}°` : `${S.angle}°`;
        const p = { x: A.x + Math.cos(rad / 2) * 118, y: A.y - Math.sin(rad / 2) * 118 };
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(ak, ak);
        ctx.font = font(32, 700); const w = ctx.measureText(lab).width + 26;
        pill(ctx, -w / 2, -21, w, 42, PAL.sun, PAL.ink, 3);
        text(ctx, lab, 0, 1, 32, PAL.ink, { align: 'center', weight: 700 });
        ctx.restore();
      }
      // right angle at B
      if (t >= at('tri')) {
        const k = ease.back(win(t, at('tri') + 0.3, 0.4)), s = 24 * k * (1 + 0.25 * hl.right);
        ctx.lineWidth = 4 + 2 * hl.right; ctx.strokeStyle = PAL.ink;
        ctx.beginPath(); ctx.moveTo(B.x - s, B.y); ctx.lineTo(B.x - s, B.y - s); ctx.lineTo(B.x, B.y - s); ctx.stroke();
      }
      // the string A → kite, and the kite
      const kite = kitePos(t);
      if (kite) {
        ctx.lineWidth = t >= at('x') ? 5 : 3.5; ctx.strokeStyle = t >= at('x') ? SIDE.AC : PAL.ink;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(kite.x, kite.y); ctx.stroke();
        drawKite(ctx, kite.x, kite.y, t, 1);
      }
      // peg and the kid at A
      if (t >= at('A')) {
        const k = ease.back(win(t, at('A'), 0.45));
        ctx.save(); ctx.translate(A.x, A.y); ctx.scale(k, k);
        ctx.fillStyle = mix(PAL.coral, PAL.ink, 0.45); ctx.beginPath(); rrect(ctx, -5, -18, 10, 30, 3); ctx.fill();
        ctx.restore();
        kid(ctx, A.x - 78, A.y, k, t, 0.95);
      }
      // height arrow and label
      const hk = pop(t, 'height');
      if (hk > 0) {
        const x = B.x + 96, top = Ct.y + 6, bot = B.y - 6;
        ctx.save(); ctx.globalAlpha *= clamp(hk);
        ctx.strokeStyle = SIDE.BC; ctx.fillStyle = SIDE.BC; ctx.lineWidth = 4;
        const y1 = lerp(bot, top, ease.out(win(t, at('height'), 0.6)));
        ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, y1); ctx.stroke();
        arrowHead(ctx, x, bot, Math.PI / 2); arrowHead(ctx, x, y1, -Math.PI / 2);
        ctx.restore();
        tag(ctx, `${S.height} m`, x + 18, (top + bot) / 2, SIDE.BC, PAL.paper, hk, 'left');
      }
      // side names (know first → solution)
      const nameK = (k) => ease.back(win(t, at(k), 0.45)) * (1 - win(t, beat.answer.start - 0.3, 0.3));
      if (t >= at('opp')) tag(ctx, 'Opposite', B.x + 114, (Ct.y + B.y) / 2 + 58, SIDE.BC, PAL.paper, nameK('opp'), 'left', 26);
      if (t >= at('hyp')) { const p = along(0.3, 70); tag(ctx, 'Hypotenuse', p.x, p.y, SIDE.AC, PAL.paper, nameK('hyp'), 'center', 26); }
      if (t >= at('adj')) tag(ctx, 'Adjacent', (A.x + B.x) / 2, G.ground + 26, SIDE.AB, PAL.paper, nameK('adj'), 'center', 26);
      // check: lay the height along the string — it falls short of C
      compare(ctx, t);
      // the unknown on the string (pill ends just outside the string)
      if (t >= at('x')) {
        const p = along(0.62, 44);
        const solved = t >= at('solved') + 0.7;
        const lab = t >= beat.answer.start ? `x = ${P.unknown.value}` : solved ? `x ${P.unknown.approx}` : 'x = ?';
        const k = solved ? ease.back(win(t, t >= beat.answer.start ? beat.answer.start : at('solved') + 0.7, 0.45)) : pop(t, 'x');
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(k, k);
        const pulse = solved ? 1 : 1 + 0.05 * Math.sin(t * 6);
        ctx.scale(pulse, pulse);
        ctx.font = font(34, 700); const w = mathWidth(ctx, parseMath(lab, PAL.paper), 34, 700) + 36;
        pill(ctx, -w, -26, w, 52, PAL.plum, PAL.ink, 3);
        math(ctx, lab, -w / 2, 1, 34, { align: 'center', color: PAL.paper, weight: 700, sym: PAL.paper });
        ctx.restore();
      }
      // point labels
      if (t >= at('A')) pointLabel(ctx, 'A', A.x - 30, G.ground + 26, pop(t, 'A'));
      if (t >= at('B')) pointLabel(ctx, 'B', B.x + 30, G.ground + 26, pop(t, 'B'));
      if (t >= at('C')) pointLabel(ctx, 'C', Ct.x - 38, Ct.y - 34, ease.back(win(t, at('C') + 1.1, 0.45)));
      // scale chip
      const sk = pop(t, 'ground');
      if (sk > 0) {
        const s = `Scale: 1 m = ${S.scale} px`;
        ctx.font = font(28, 700); const tw = ctx.measureText(s).width;
        const w = tw + 130;
        ctx.save(); ctx.translate(G.bx + G.bw - 24 - w, G.by + G.bh); ctx.scale(sk, sk);
        pill(ctx, 0, -22, w, 44, PAL.paper, PAL.ink, 3);
        text(ctx, s, 20, 1, 28, PAL.ink, { weight: 700 });
        const rx = 30 + tw, len = 10 * S.scale;
        ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(rx, 6); ctx.lineTo(rx + len, 6); ctx.moveTo(rx, -2); ctx.lineTo(rx, 10); ctx.moveTo(rx + len, -2); ctx.lineTo(rx + len, 10); ctx.stroke();
        text(ctx, '10 m', rx + len / 2, -8, 16, PAL.ink, { align: 'center', weight: 700 });
        ctx.restore();
      }
      ctx.restore();
    }

    // how strongly each part glows for the current line (0..1)
    function highlight(t, cur) {
      const z = { BC: 0, AC: 0, AB: 0, angle: 0, right: 0, tri: 0 };
      if (!cur || !cur.l || !cur.l.hl || cur.l.hl === 'none') return z;
      const L = cur.l;
      const endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25)) * (0.8 + 0.2 * Math.sin((t - L.start) * 6));
      for (const part of L.hl.split('+')) if (part in z) z[part] = k;
      return z;
    }
    function glowSide(ctx, p, q, col, k) {
      if (k <= 0) return;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = rgba(col, 0.45 * k);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
    }
    function tag(ctx, s, x, y, bg, fg, k, align, size = 30) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(size, 700); const w = ctx.measureText(s).width + 28, hgt = size + 16;
      const x0 = align === 'left' ? 0 : -w / 2;
      pill(ctx, x0, -hgt / 2, w, hgt, bg, PAL.ink, 3);
      text(ctx, s, x0 + w / 2, 1, size, fg, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function pointLabel(ctx, s, x, y, k) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fillStyle = PAL.ink; ctx.fill();
      text(ctx, s, 0, 1, 26, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function arrowHead(ctx, x, y, ang) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -8); ctx.lineTo(-14, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    // the kite flies in from the top-right and settles at C
    function kitePos(t) {
      const t0 = at('C');
      if (t < t0) return null;
      const k = ease.inOut(win(t, t0, 1.2));
      const from = { x: G.bx + G.bw + 60, y: G.by + 40 };
      const bob = (1 - k) * Math.sin(k * Math.PI) * 40;
      return { x: lerp(from.x, Ct.x, k), y: lerp(from.y, Ct.y, k) - bob };
    }
    function compare(ctx, t) {
      const t0 = at('compare');
      if (t < t0) return;
      const move = ease.inOut(win(t, t0 + 0.2, 0.7)), turn = ease.inOut(win(t, t0 + 1.0, 0.9));
      const fade = 1 - win(t, beat.answer.end - 0.4, 0.3);
      const base = { x: lerp(B.x, A.x, move), y: B.y };
      const ang = lerp(Math.PI / 2, rad, turn);
      const tip = { x: base.x + Math.cos(ang) * hPx, y: base.y - Math.sin(ang) * hPx };
      ctx.save(); ctx.globalAlpha *= fade;
      ctx.lineCap = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = rgba(SIDE.BC, 0.85);
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
      if (turn >= 1) {
        const k = ease.back(win(t, t0 + 2.0, 0.45));
        const gap = ((Math.hypot(Ct.x - A.x, Ct.y - A.y) - hPx) / S.scale).toFixed(2);
        const p = along(0.93, -58);
        tag(ctx, `+${gap} m`, p.x + 40, p.y + 6, PAL.sun, PAL.ink, k, 'left', 26);
        const mid = { x: A.x + dir.x * hPx / 2 - out.x * 52, y: A.y + dir.y * hPx / 2 - out.y * 52 };
        tag(ctx, `height ${S.height} m`, mid.x, mid.y, SIDE.BC, PAL.paper, k, 'center', 24);
      }
      ctx.restore();
    }

    // =============================================================================
    // SCENE CARD — what the picture shows
    // =============================================================================
    function boardScene(ctx, t, b) {
      C.boardFrame(ctx, b, t, 'THE PICTURE', PAL.teal);
      const rows = [];
      for (const l of b.lines) {
        if (l.legend === 'scale') rows.push({ at: l.start, icon: 'ruler', s: `Scale: 1 m = ${S.scale} px (drawn to scale)` });
        if (l.legend === 'A') rows.push({ at: l.start, icon: 'A', s: 'A = where the string is tied' });
        if (l.legend === 'C') rows.push({ at: l.start, icon: 'C', s: 'C = the kite' });
        if (l.legend === 'B') rows.push({ at: l.start, icon: 'B', s: 'B = ground point below the kite' });
        if (l.legend === 'tri') rows.push({ at: l.start, icon: 'tri', s: '△ABC: right angle at B' });
      }
      const rh = 62;
      rows.forEach((r, i) => {
        const k = C.rowIn(t, r.at);
        if (k <= 0) return;
        const y = BY + 56 + rh * (i + 0.5);
        ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
        legendIcon(ctx, r.icon, BX + 58, y, t);
        math(ctx, r.s, BX + 104, y, 42, { maxW: BW - 140 });
        ctx.restore();
      });
    }
    function legendIcon(ctx, kind, x, y, t) {
      ctx.save();
      if (kind === 'ruler') {
        ctx.beginPath(); rrect(ctx, x - 26, y - 11, 52, 22, 5); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x - 26 + i * 8.7, y - 11); ctx.lineTo(x - 26 + i * 8.7, y - (i % 2 ? 3 : 0)); ctx.stroke(); }
      } else if (kind === 'tri') {
        ctx.beginPath(); ctx.moveTo(x - 24, y + 16); ctx.lineTo(x + 20, y + 16); ctx.lineTo(x + 20, y - 20); ctx.closePath();
        ctx.fillStyle = rgba(PAL.sun, 0.5); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 11, y + 16); ctx.lineTo(x + 11, y + 7); ctx.lineTo(x + 20, y + 7); ctx.stroke();
      } else if (kind === 'C') {
        ctx.translate(x, y); ctx.scale(0.36, 0.36); drawKite(ctx, -10, 40, t, 0);
      } else {
        pointLabel(ctx, kind, x, y, 1);
      }
      ctx.restore();
    }

    // =============================================================================
    // shared drawings: kite, kid, sun, cloud
    // =============================================================================
    function drawKite(ctx, x, y, t, tail) {
      // (x, y) is the bridle point where the string ties on
      const sway = Math.sin(t * 2.1) * 0.06;
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.22 + sway);
      const cx = 0, cy = -58, w = 46, h = 62;
      if (tail) {
        ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(cx, cy + h);
        const tx = (i) => cx + Math.sin(t * 4 + i * 0.7) * 8 * (i / 12) + i * 4.2, ty = (i) => cy + h + i * 5.2;
        for (let i = 1; i <= 12; i++) ctx.lineTo(tx(i), ty(i));
        ctx.stroke();
        for (let i = 3; i <= 12; i += 3) {
          const bx = tx(i), by = ty(i);
          ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 4 + i) * 0.3);
          ctx.fillStyle = i % 6 ? PAL.teal : PAL.plum;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-11, -6); ctx.lineTo(-11, 6); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, -6); ctx.lineTo(11, 6); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
      // bridle
      ctx.lineWidth = 2; ctx.strokeStyle = rgba(PAL.ink, 0.7);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cx, cy - h * 0.5); ctx.moveTo(0, 0); ctx.lineTo(cx, cy + h * 0.6); ctx.stroke();
      // sail: four panels
      const top = [cx, cy - h], right = [cx + w, cy - h * 0.25], bot = [cx, cy + h], left = [cx - w, cy - h * 0.25], mid = [cx, cy - h * 0.25];
      [[top, right, PAL.coral], [right, bot, PAL.sun], [bot, left, PAL.coral], [left, top, PAL.sun]].forEach(([p, q, col]) => {
        ctx.beginPath(); ctx.moveTo(mid[0], mid[1]); ctx.lineTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      });
      ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(right[0], right[1]); ctx.lineTo(bot[0], bot[1]); ctx.lineTo(left[0], left[1]); ctx.closePath();
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(bot[0], bot[1]); ctx.moveTo(left[0], left[1]); ctx.lineTo(right[0], right[1]); ctx.stroke();
      ctx.restore();
    }
    function kid(ctx, x, y, k, t, s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(k * s, k * s);
      ctx.lineCap = 'round'; ctx.strokeStyle = PAL.ink; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-6, -38); ctx.moveTo(10, 0); ctx.lineTo(6, -38); ctx.stroke();     // legs
      ctx.beginPath(); rrect(ctx, -20, -86, 40, 54, 16); ctx.fillStyle = PAL.teal; ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); // body
      const wave = Math.sin(t * 3) * 0.12;
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(14, -78); ctx.lineTo(44 + wave * 30, -118); ctx.stroke();            // arm pointing up
      ctx.beginPath(); ctx.moveTo(-14, -76); ctx.lineTo(-30, -48); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -108, 20, 0, Math.PI * 2); ctx.fillStyle = mix(PAL.sun, PAL.paper, 0.55); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -114, 21, Math.PI * 1.05, Math.PI * 1.95); ctx.fillStyle = PAL.ink; ctx.fill();         // hair
      ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(7, -106, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function sun(ctx, x, y, t) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3);
      ctx.strokeStyle = PAL.sun; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(0, 64); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill();
      ctx.restore();
    }
    function cloud(ctx, x, y, s) {
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = rgba(PAL.paper, 0.95); ctx.strokeStyle = rgba(PAL.ink, 0.18); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-40, 10, 26, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-10, -12, 32, Math.PI, Math.PI * 1.9);
      ctx.arc(30, -2, 26, Math.PI * 1.3, Math.PI * 0.2); ctx.lineTo(-40, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    // =============================================================================
    // HOOK ART — the kite, its string and the question mark
    // =============================================================================
    function art(ctx, t, R) {
      const ground = R.y + 575, peg = { x: R.x + 230, y: ground };
      const hh = 400, kx = peg.x + hh / Math.tan(rad), ky = ground - hh;
      ctx.save();
      ctx.beginPath(); rrect(ctx, R.x, R.y + 10, R.w, R.h - 30, 30); ctx.fillStyle = rgba(PAL.teal, 0.13); ctx.fill();
      ctx.save(); ctx.clip();
      sun(ctx, R.x + R.w - 110, R.y + 110, t);
      cloud(ctx, R.x + ((t * 14 + 200) % (R.w + 200)) - 100, R.y + 150, 1.1);
      cloud(ctx, R.x + ((t * 10 + 650) % (R.w + 200)) - 100, R.y + 300, 0.8);
      ctx.fillStyle = rgba(PAL.teal, 0.45); ctx.fillRect(R.x, ground, R.w, R.h);
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(R.x, ground); ctx.lineTo(R.x + R.w, ground); ctx.stroke();
      // height and angle
      ctx.save(); ctx.setLineDash([12, 9]); ctx.lineWidth = 5; ctx.strokeStyle = PAL.coral;
      ctx.beginPath(); ctx.moveTo(kx, ky + 10); ctx.lineTo(kx, ground); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(peg.x, peg.y); ctx.arc(peg.x, peg.y, 84, -rad, 0); ctx.closePath();
      ctx.fillStyle = rgba(PAL.sun, 0.8); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      // string
      ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(peg.x, peg.y); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.save(); ctx.translate(kx, ky); ctx.scale(1.25, 1.25); drawKite(ctx, 0, 0, t, 1); ctx.restore();
      ctx.fillStyle = mix(PAL.coral, PAL.ink, 0.45); ctx.beginPath(); rrect(ctx, peg.x - 6, peg.y - 20, 12, 34, 3); ctx.fill();
      kid(ctx, peg.x - 95, ground, 1, t, 1.3);
      // labels
      tag(ctx, `${S.height} m`, kx + 26, (ky + ground) / 2 + 40, PAL.coral, PAL.paper, 1, 'left', 40);
      tag(ctx, `${S.angle}°`, peg.x + 150, ground - 40, PAL.sun, PAL.ink, 1, 'center', 40);
      const m = { x: (peg.x + kx) / 2 - 60, y: (peg.y + ky) / 2 - 30 };
      const q = 1 + 0.08 * Math.sin(t * 5);
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(q, q);
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, '?', 0, 4, 70, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
      ctx.restore();
    }

    const draw = C.compose({ art, stage: drawStage, scene: boardScene });
    return { W, H, FPS, duration: D, draw, beats, P, TL };
  }

  root.VideoEngine = { createVideo, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
