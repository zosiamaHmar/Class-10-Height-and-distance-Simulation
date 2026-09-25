/* Maths by Zosiama · Heights & Distances explainers — balloon engine (two right triangles).
 *
 * Built on video-kit/core.js like engine.js, for the "girl and balloon" kind of problem:
 * a girl whose eyes E are P.scene.eye m up watches a balloon drift along a level line
 * P.scene.height m above the ground. At P the angle of elevation is a1, later at Q it is a2.
 * Dropping P and Q to her eye level gives M and N, so △EMP and △ENQ share the height
 * PM = QN, and the distance flown is d = PQ = MN = EN − EM.
 *
 * The stage is drawn to scale (1 m = P.scene.scale px). At that scale the girl is only a
 * few pixels tall, so a zoom bubble shows her eye height. The "Know first" beat swaps the
 * scene for an idea picture: one clean right triangle with Opposite / Adjacent /
 * Hypotenuse, θ and the right-angle mark. Every frame is a pure function of time.
 */
(function (root) {
  'use strict';

  const {
    W, H, FPS, PAL, BX, BY, BW, font, clamp, lerp, win, ease, rgba, mix, rnd,
    rrect, pill, text, createCore,
  } = root.VideoCore;

  // coral = the height (opposite) · teal = along her eye level (adjacent) · ink = line of sight
  // (hypotenuse) · plum = the unknown distance d · sunflower = angles and the answer
  const COL = { h: PAL.coral, g: PAL.teal, sight: PAL.ink, d: PAL.plum };
  const DEG = Math.PI / 180;

  function createVideo(P, TL) {
    const S = P.scene;
    const C = createCore(P, TL, {
      tokens: {
        PM: { s: 'PM', c: COL.h }, QN: { s: 'QN', c: COL.h },
        EM: { s: 'EM', c: COL.g }, EN: { s: 'EN', c: COL.g },
        MN: { s: 'MN', c: COL.d }, PQ: { s: 'PQ', c: COL.d }, d: { s: 'd', c: COL.d },
        Opp: { s: 'Opposite', c: COL.h }, Adj: { s: 'Adjacent', c: COL.g }, Hyp: { s: 'Hypotenuse', c: COL.sight },
      },
      chapter: `HEIGHTS & DISTANCES · SIM ${P.num}`,
      label: `QUESTION · SIM ${P.num}`,
    });
    const { beats, beat, math, parseMath, mathWidth } = C;

    // ---- geometry, to scale (1 m = S.scale px) ----------------------------------------
    const G = { bx: 90, by: 280, bw: 900, bh: 538, br: 28, ground: 770 };
    const s = S.scale, hEff = S.height - S.eye;
    const E = { x: 190, y: G.ground - S.eye * s };               // her eyes
    const yB = G.ground - S.height * s;                          // the balloon's level line
    const run1 = hEff / Math.tan(S.a1 * DEG), run2 = hEff / Math.tan(S.a2 * DEG); // EM, EN in m
    const Pp = { x: E.x + run1 * s, y: yB }, Qp = { x: E.x + run2 * s, y: yB };
    const M = { x: Pp.x, y: E.y }, N = { x: Qp.x, y: E.y };
    const DIM_Y = 794;                                           // measuring lines under the ground
    const H88 = { x: Qp.x + 75 };                                // the 88.2 m arrow, right of QN
    const ZOOM = { x: 178, y: 536, r: 80, z: 80 };               // bubble: centre, radius, px per m inside
    const R1 = 64, R2 = 110;                                     // angle arcs at E (a1 inner, a2 outer)
    const BSC = 0.72;                                            // balloon drawing scale (about 25 m tall)
    const boxP = (ctx) => rrect(ctx, G.bx, G.by, G.bw, G.bh, G.br);
    const fmt2 = (v) => v.toFixed(2);

    // when does each scene element appear? (first line that shows it)
    const showAt = {};
    for (const b of beats) for (const l of b.lines) if (l.show && showAt[l.show] === undefined) showAt[l.show] = l.start;
    const at = (k) => (showAt[k] === undefined ? Infinity : showAt[k]);
    const pop = (t, k, d = 0.45) => ease.back(win(t, at(k), d));

    // the balloon drifts from P to Q while the drift line plays
    const DRIFT = 4.2;
    const driftK = (t) => ease.inOut(win(t, at('drift') + 0.35, DRIFT));
    const balloonX = (t) => lerp(Pp.x, Qp.x, driftK(t));
    const angleNow = (x) => Math.atan2(hEff * s, x - E.x) / DEG;

    // =============================================================================
    // STAGE — the scene to scale (scene, given, solve, answer) or the idea picture (know)
    // =============================================================================
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
      const idea = ideaK(t);
      if (idea < 1) {
        ctx.save(); ctx.globalAlpha *= 1 - idea;
        sun(ctx, 930, 340, t, 0.8);
        cloud(ctx, G.bx + ((t * 11 + 160) % (G.bw + 260)) - 130, 352, 0.9);
        cloud(ctx, G.bx + ((t * 7 + 640) % (G.bw + 260)) - 130, 470, 0.7);
        ctx.restore();
      }
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

      if (idea > 0) { ctx.save(); ctx.globalAlpha *= idea; ideaPicture(ctx, t, cur); ctx.restore(); }
      if (idea < 1) { ctx.save(); ctx.globalAlpha *= 1 - idea; scene(ctx, t, cur); ctx.restore(); }
      ctx.restore();
    }

    // the idea picture covers the know beat until the line that goes back to the scene
    function ideaK(t) {
      const k = beat.know;
      return ease.inOut(win(t, k.start - 0.1, 0.45)) * (1 - ease.inOut(win(t, at('mn') - 0.35, 0.45)));
    }

    function scene(ctx, t, cur) {
      const hl = highlight(t, cur);
      const ansOn = t >= beat.answer.start;

      // wind swirls (the wind carries the balloon)
      if (t >= at('P')) {
        const wk = win(t, at('P'), 0.6) * (0.55 + 0.45 * win(t, at('drift'), 0.5));
        ctx.save(); ctx.beginPath(); boxP(ctx); ctx.clip();
        for (let i = 0; i < 3; i++) {
          const span = G.bw + 240, x = G.bx - 120 + ((t * (46 + i * 9) + i * 330) % span);
          wind(ctx, x, [360, 505, 460][i], t + i, wk * 0.8);
        }
        ctx.restore();
      }

      // triangle fills
      if (t >= at('drops')) {
        const k = win(t, at('drops') + 1.2, 0.5);
        tri(ctx, E, M, Pp, rgba(PAL.sun, Math.max(0.1 * k, 0.32 * hl.tri1)));
        tri(ctx, E, N, Qp, rgba(PAL.sun, Math.max(0.1 * k, 0.32 * hl.tri2)));
      }
      // glows under the parts that matter right now
      glow(ctx, Pp, M, COL.h, hl.PM); glow(ctx, Qp, N, COL.h, hl.QN);
      glow(ctx, E, M, COL.g, hl.EM); glow(ctx, E, N, COL.g, hl.EN);
      glow(ctx, M, N, COL.d, hl.MN); glow(ctx, Pp, Qp, COL.d, hl.PQ);
      glow(ctx, E, Pp, PAL.plum, hl.EP);

      // her eye level E → N (teal), drawn with the drops
      if (t >= at('drops')) {
        const k = ease.inOut(win(t, at('drops') + 0.9, 0.7));
        ctx.save(); ctx.setLineDash([14, 8]); ctx.lineWidth = 4; ctx.strokeStyle = COL.g;
        ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(lerp(E.x, N.x, k), E.y); ctx.stroke(); ctx.restore();
      }
      // drops P → M and Q → N (coral, dashed)
      [[Pp, M, 0], [Qp, N, 0.35]].forEach(([top, foot, dl]) => {
        if (t < at('drops') + dl) return;
        const k = ease.inOut(win(t, at('drops') + dl, 0.7));
        ctx.save(); ctx.setLineDash([12, 9]); ctx.lineWidth = 5; ctx.strokeStyle = COL.h;
        ctx.beginPath(); ctx.moveTo(top.x, top.y + 4); ctx.lineTo(top.x, lerp(top.y + 4, foot.y, k)); ctx.stroke(); ctx.restore();
      });
      // right angles at M and N
      if (t >= at('drops')) {
        const k = ease.back(win(t, at('drops') + 1.0, 0.4));
        [M, N].forEach((f) => {
          const q = 20 * k;
          ctx.lineWidth = 3.5; ctx.strokeStyle = PAL.ink;
          ctx.beginPath(); ctx.moveTo(f.x - q, f.y); ctx.lineTo(f.x - q, f.y - q); ctx.lineTo(f.x, f.y - q); ctx.stroke();
        });
      }

      // the level line the balloon flies along (dashed), and d on it
      if (t >= at('drift')) {
        const x2 = balloonX(t);
        ctx.save(); ctx.setLineDash([10, 10]); ctx.lineWidth = 3; ctx.strokeStyle = rgba(PAL.ink, 0.55);
        ctx.beginPath(); ctx.moveTo(Pp.x, yB); ctx.lineTo(x2, yB); ctx.stroke(); ctx.restore();
      }
      if (t >= at('d')) dOnPath(ctx, t);

      // lines of sight and the angles at her eyes
      sightAndAngles(ctx, t, hl);

      // the balloon: a ghost stays at P once it drifts; the balloon itself floats on
      if (t >= at('P')) {
        const k = ease.back(win(t, at('P'), 0.5));
        if (t >= at('drift')) balloon(ctx, Pp.x, Pp.y, t, BSC * k, true, win(t, at('drift'), 0.4));
        const x = t >= at('drift') ? balloonX(t) : Pp.x;
        balloon(ctx, x, yB, t, BSC * k, false, 1);
      }

      // the 88.2 m arrow (ground → balloon line), dimmed once the solution uses 87 m
      const hk = pop(t, 'P');
      if (hk > 0) {
        const top = yB + 6, bot = G.ground - 6, x = H88.x;
        const dim = 1 - 0.55 * win(t, at('h87'), 0.5);
        ctx.save(); ctx.globalAlpha *= clamp(hk) * dim;
        ctx.strokeStyle = COL.h; ctx.fillStyle = COL.h; ctx.lineWidth = 4;
        const y1 = lerp(bot, top, ease.out(win(t, at('P'), 0.6)));
        ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, y1); ctx.stroke();
        arrowHead(ctx, x, bot, Math.PI / 2); arrowHead(ctx, x, y1, -Math.PI / 2);
        if (hl.h88 > 0) { ctx.lineWidth = 14; ctx.strokeStyle = rgba(COL.h, 0.35 * hl.h88); ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top); ctx.stroke(); }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= dim;
        tag(ctx, `${S.height} m`, x, (top + bot) / 2, COL.h, PAL.paper, hk * (1 + 0.12 * hl.h88), 'center', 28);
        ctx.restore();
      }
      // 87 m on both heights (solution step 1)
      if (t >= at('h87')) {
        const k = ease.back(win(t, at('h87') + 0.4, 0.45));
        tag(ctx, `${hEff} m`, Pp.x + 12, 700, COL.h, PAL.paper, k * (1 + 0.1 * Math.max(hl.PM, hl.tri1)), 'left', 26);
        tag(ctx, `${hEff} m`, Qp.x + 12, 680, COL.h, PAL.paper, k * (1 + 0.1 * Math.max(hl.QN, hl.tri2)), 'left', 26);
      }

      // measuring lines under the ground: EM (teal) and MN = d (plum); EN as a tag by N
      if (t >= at('EMv')) {
        const k = ease.back(win(t, at('EMv') + 0.5, 0.45));
        dimLine(ctx, E.x, M.x, DIM_Y, COL.g, clamp(k));
        tag(ctx, ansOn ? `EM ≈ ${fmt2(run1)} m` : `EM = ${S.run1} m`, (E.x + M.x) / 2, DIM_Y, COL.g, PAL.paper, k, 'center', 24);
      }
      if (t >= at('mn')) {
        const k = ease.back(win(t, at('mn') + 0.3, 0.45));
        dimLine(ctx, M.x, N.x, DIM_Y, COL.d, clamp(k));
        const lab = t >= at('dval') ? `MN = d = ${S.dExact} m` : 'MN = d';
        tag(ctx, lab, (M.x + N.x) / 2, DIM_Y, COL.d, PAL.paper, k * (1 + 0.1 * hl.MN), 'center', 24);
      }
      if (t >= at('ENv')) {
        const k = ease.back(win(t, at('ENv') + 0.5, 0.45));
        tag(ctx, ansOn ? `EN ≈ ${fmt2(run2)} m` : `EN = ${S.run2} m`, N.x - 30, 738, COL.g, PAL.paper, k * (1 + 0.1 * hl.EN), 'right', 24);
      }

      // the girl, tiny at this scale, and the zoom bubble that shows her eye height
      if (t >= at('girl')) {
        const k = ease.back(win(t, at('girl'), 0.45));
        tinyGirl(ctx, E.x, G.ground, k);
        const rk = win(t, at('girl'), 0.3) * (1 - win(t, at('girl') + 2.4, 0.4));
        if (rk > 0) {
          ctx.save(); ctx.globalAlpha *= rk; ctx.lineWidth = 4; ctx.strokeStyle = PAL.coral;
          ctx.beginPath(); ctx.arc(E.x, E.y, 16 + 6 * Math.sin((t - at('girl')) * 7), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
        zoomBubble(ctx, t, hl);
      }

      // point labels
      if (t >= at('girl')) pointLabel(ctx, 'E', E.x - 32, DIM_Y, pop(t, 'girl'));
      if (t >= at('P')) pointLabel(ctx, 'P', Pp.x - 36, yB - 8, pop(t, 'P'));
      if (t >= at('drift')) pointLabel(ctx, 'Q', Qp.x + 36, yB - 8, ease.back(win(t, at('drift') + 0.35 + DRIFT - 0.3, 0.45)));
      if (t >= at('drops')) {
        pointLabel(ctx, 'M', M.x + 26, E.y - 26, ease.back(win(t, at('drops') + 0.6, 0.45)));
        pointLabel(ctx, 'N', N.x + 26, E.y - 26, ease.back(win(t, at('drops') + 0.95, 0.45)));
      }
      // scale chip, on the top edge of the frame
      const sk = pop(t, 'ground');
      if (sk > 0) {
        const str = `Scale: 1 m = ${s} px`;
        ctx.font = font(26, 700); const tw = ctx.measureText(str).width;
        const w = tw + 124;
        ctx.save(); ctx.translate(G.bx + 24, G.by); ctx.scale(sk, sk);
        pill(ctx, 0, -21, w, 42, PAL.paper, PAL.ink, 3);
        text(ctx, str, 18, 1, 26, PAL.ink, { weight: 700 });
        const rx = 28 + tw, len = 10 * s;
        ctx.strokeStyle = PAL.ink; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(rx, 6); ctx.lineTo(rx + len, 6); ctx.moveTo(rx, -2); ctx.lineTo(rx, 10); ctx.moveTo(rx + len, -2); ctx.lineTo(rx + len, 10); ctx.stroke();
        text(ctx, '10 m', rx + len / 2, -8, 15, PAL.ink, { align: 'center', weight: 700 });
        ctx.restore();
      }
    }

    // lines of sight E → balloon, and the angle arcs + tags at E
    function sightAndAngles(ctx, t, hl) {
      if (t < at('sight1')) return;
      const k1 = ease.out(win(t, at('sight1'), 0.6));
      const drifting = t >= at('drift');
      // first line of sight E → P (stays, lighter, once the balloon has moved on)
      const faded = drifting ? 1 - 0.45 * win(t, at('drift') + 0.4, 0.8) : 1;
      ctx.save(); ctx.globalAlpha *= faded; ctx.lineWidth = 4; ctx.strokeStyle = COL.sight;
      ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(lerp(E.x, Pp.x, k1), lerp(E.y, Pp.y, k1)); ctx.stroke(); ctx.restore();
      // the moving line of sight and its live angle
      let a2 = S.a1;
      if (drifting) {
        const x = balloonX(t);
        a2 = angleNow(x);
        ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = COL.sight;
        ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(x, yB); ctx.stroke(); ctx.restore();
        // the outer arc follows the angle down to a2 (it becomes the a2 arc)
        const ak = ease.out(win(t, at('drift') + 0.2, 0.4));
        sector(ctx, R2 * ak, a2, rgba(PAL.sun, 0.42 + 0.4 * Math.max(hl.a30, hl.angles, hl.tri2)));
      }
      // the a1 arc (inner, stronger)
      const ak1 = pop(t, 'sight1');
      if (ak1 > 0) sector(ctx, R1 * clamp(ak1, 0, 1.15), S.a1, rgba(PAL.sun, 0.8 + 0.2 * Math.max(hl.a60, hl.angles, hl.tri1)));
      // a1 tag: in the middle of the angle while it is alone, then up in the gap between the
      // two lines of sight, tied to its arc by a dotted leader
      if (ak1 > 0) {
        const lift = drifting ? ease.inOut(win(t, at('drift') + 0.1, 0.8)) : 0;
        const pA = polar(158, S.a1 / 2), pB = polar(205, 46);
        const p = { x: lerp(pA.x, pB.x, lift), y: lerp(pA.y, pB.y, lift) };
        if (lift > 0) {
          const q = polar(R1 - 6, 45);
          ctx.save(); ctx.globalAlpha *= lift; ctx.setLineDash([3, 6]); ctx.lineCap = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink;
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x - 24, p.y + 16); ctx.stroke(); ctx.restore();
        }
        angleTag(ctx, `${S.a1}°`, p.x, p.y, ak1 * (1 + 0.14 * Math.max(hl.a60, hl.tri1)));
      }
      // the live angle, then a2
      if (drifting) {
        const tk = ease.back(win(t, at('drift') + 0.3, 0.45));
        const p = polar(158, a2 / 2);
        const done = driftK(t) >= 1;
        angleTag(ctx, done ? `${S.a2}°` : `${Math.round(a2)}°`, p.x, p.y, tk * (1 + 0.14 * Math.max(hl.a30, hl.tri2) + (t >= at('sight2') ? 0.12 * (1 - win(t, at('sight2') + 0.5, 0.5)) : 0)));
      }
    }
    const polar = (r, deg) => ({ x: E.x + r * Math.cos(deg * DEG), y: E.y - r * Math.sin(deg * DEG) });
    function sector(ctx, r, deg, fill) {
      if (r <= 0) return;
      ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.arc(E.x, E.y, r, -deg * DEG, 0); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
    }
    function angleTag(ctx, str, x, y, k) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(28, 700); const w = ctx.measureText(str).width + 24;
      pill(ctx, -w / 2, -19, w, 38, PAL.sun, PAL.ink, 3);
      text(ctx, str, 0, 1, 28, PAL.ink, { align: 'center', weight: 700 });
      ctx.restore();
    }

    // d on the balloon's path: "d = ?" until it is worked out
    function dOnPath(ctx, t) {
      const k = ease.back(win(t, at('d'), 0.45));
      const ak = ease.out(win(t, at('d'), 0.6));
      ctx.save(); ctx.globalAlpha *= clamp(ak);
      ctx.strokeStyle = COL.d; ctx.fillStyle = COL.d; ctx.lineWidth = 5;
      const x1 = Pp.x + 20, x2 = lerp(Pp.x + 20, Qp.x - 20, ak), y = yB - 16;
      ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
      arrowHead(ctx, x1, y, Math.PI); if (ak >= 1) arrowHead(ctx, x2, y, 0);
      ctx.restore();
      const solved = t >= at('solved') + 0.6;
      const lab = solved ? `d ≈ ${S.dApprox} m` : t >= at('dval') + 0.4 ? `d = ${S.dExact} m` : 'd = ?';
      const kk = solved ? ease.back(win(t, at('solved') + 0.6, 0.45)) : t >= at('dval') + 0.4 ? ease.back(win(t, at('dval') + 0.4, 0.45)) : k;
      const pulse = solved ? 1 : 1 + 0.05 * Math.sin(t * 6);
      ctx.save(); ctx.translate((Pp.x + Qp.x) / 2, yB - 50); ctx.scale(kk * pulse, kk * pulse);
      ctx.font = font(30, 700); const w = mathWidth(ctx, parseMath(lab, PAL.paper), 30, 700) + 36;
      pill(ctx, -w / 2, -24, w, 48, COL.d, PAL.ink, 3);
      math(ctx, lab, 0, 1, 30, { align: 'center', color: PAL.paper, weight: 700, sym: PAL.paper });
      ctx.restore();
    }

    function zoomBubble(ctx, t, hl) {
      const k = ease.back(win(t, Math.min(at('zoom'), at('girl') + 1.9), 0.5));
      if (k <= 0) return;
      const fade = 1 - win(t, beat.answer.start - 0.3, 0.4);
      if (fade <= 0) return;
      const Z = ZOOM, gy = Z.y + 52;                  // the ground inside the bubble
      ctx.save(); ctx.globalAlpha *= fade;
      // the cone from the tiny girl up to the bubble
      ctx.save(); ctx.globalAlpha *= clamp(k) * 0.45; ctx.lineWidth = 2.5; ctx.strokeStyle = PAL.ink; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(E.x - 3, E.y); ctx.lineTo(Z.x - Z.r * 0.72, Z.y + Z.r * 0.69); ctx.moveTo(E.x + 3, E.y); ctx.lineTo(Z.x + Z.r * 0.72, Z.y + Z.r * 0.69); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(Z.x, Z.y); ctx.scale(k, k); ctx.translate(-Z.x, -Z.y);
      ctx.beginPath(); ctx.arc(Z.x, Z.y + 6, Z.r, 0, Math.PI * 2); ctx.fillStyle = rgba(PAL.ink, 0.14); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(Z.x, Z.y, Z.r, 0, Math.PI * 2); ctx.fillStyle = mix(PAL.teal, PAL.paper, 0.86); ctx.fill(); ctx.clip();
      ctx.fillStyle = rgba(PAL.teal, 0.55); ctx.fillRect(Z.x - Z.r, gy, Z.r * 2, Z.r);
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(Z.x - Z.r, gy); ctx.lineTo(Z.x + Z.r, gy); ctx.stroke();
      const eyeY = gy - S.eye * Z.z, gx = Z.x - 22, gs = (S.eye * Z.z) / GIRL_EYE.y;
      // eye level (teal, dashed) through her eyes
      ctx.save(); ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = COL.g;
      ctx.beginPath(); ctx.moveTo(gx + GIRL_EYE.x * gs, eyeY); ctx.lineTo(Z.x + Z.r, eyeY); ctx.stroke(); ctx.restore();
      girl(ctx, gx, gy, gs, t);
      // 1.2 m: ground → eyes
      const ax = Z.x + 24;
      ctx.strokeStyle = COL.h; ctx.fillStyle = COL.h; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ax, gy - 3); ctx.lineTo(ax, eyeY + 3); ctx.stroke();
      arrowHead(ctx, ax, gy - 3, Math.PI / 2, 0.7); arrowHead(ctx, ax, eyeY + 3, -Math.PI / 2, 0.7);
      ctx.restore();
      ctx.beginPath(); ctx.arc(Z.x, Z.y, Z.r, 0, Math.PI * 2); ctx.lineWidth = 4 + 3 * hl.eye; ctx.strokeStyle = hl.eye > 0 ? mix(PAL.ink, PAL.coral, hl.eye) : PAL.ink; ctx.stroke();
      tag(ctx, `${S.eye} m`, ax + 6, (gy + eyeY) / 2, COL.h, PAL.paper, 1 + 0.12 * hl.eye, 'left', 22);
      // zoom chip
      ctx.font = font(18, 700); const zw = ctx.measureText(`zoom ×${Math.round(Z.z / s)}`).width + 20;
      pill(ctx, Z.x - zw / 2, Z.y - Z.r - 13, zw, 26, PAL.ink);
      text(ctx, `zoom ×${Math.round(Z.z / s)}`, Z.x, Z.y - Z.r, 18, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
      ctx.restore();
    }

    // how strongly each part glows for the current line (0..1)
    function highlight(t, cur) {
      const z = { PM: 0, QN: 0, EM: 0, EN: 0, MN: 0, PQ: 0, EP: 0, h88: 0, eye: 0, angles: 0, a60: 0, a30: 0, tri1: 0, tri2: 0, Opp: 0, Adj: 0, Hyp: 0, theta: 0 };
      if (!cur || !cur.l || !cur.l.hl || cur.l.hl === 'none') return z;
      const L = cur.l;
      const endT = cur.next ? cur.next.start - 0.1 : cur.b.end - 0.2;
      const k = ease.out(win(t, L.start - 0.1, 0.3)) * (1 - win(t, endT - 0.2, 0.25)) * (0.8 + 0.2 * Math.sin((t - L.start) * 6));
      for (const part of L.hl.split('+')) if (part in z) z[part] = k;
      return z;
    }
    function glow(ctx, p, q, col, k) {
      if (k <= 0) return;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = rgba(col, 0.45 * k);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
    }
    function tri(ctx, a, b, c, fill) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
    }
    function dimLine(ctx, x1, x2, y, col, k) {
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = col; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x1 + 3, y); ctx.lineTo(x2 - 3, y); ctx.moveTo(x1 + 3, y - 11); ctx.lineTo(x1 + 3, y + 11); ctx.moveTo(x2 - 3, y - 11); ctx.lineTo(x2 - 3, y + 11); ctx.stroke();
      ctx.restore();
    }
    function tag(ctx, str, x, y, bg, fg, k, align, size = 30) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font(size, 700); const w = ctx.measureText(str).width + 26, hgt = size + 14;
      const x0 = align === 'left' ? 0 : align === 'right' ? -w : -w / 2;
      pill(ctx, x0, -hgt / 2, w, hgt, bg, PAL.ink, 3);
      text(ctx, str, x0 + w / 2, 1, size, fg, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function pointLabel(ctx, str, x, y, k) {
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = PAL.ink; ctx.fill();
      text(ctx, str, 0, 1, 25, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
    }
    function arrowHead(ctx, x, y, ang, sc = 1) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -8); ctx.lineTo(-14, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    }

    // =============================================================================
    // IDEA PICTURE (know beat) — one clean right triangle
    // =============================================================================
    function ideaPicture(ctx, t, cur) {
      const hl = highlight(t, cur);
      const A = { x: 250, y: 700 }, B = { x: 770, y: 700 }, T = { x: 770, y: 385 };
      const th = Math.atan2(B.y - T.y, B.x - A.x);
      tri(ctx, A, B, T, rgba(PAL.sun, 0.14));
      glow(ctx, B, T, COL.h, hl.Opp); glow(ctx, A, B, COL.g, hl.Adj); glow(ctx, A, T, PAL.plum, hl.Hyp);
      ctx.lineCap = 'round';
      ctx.lineWidth = 7; ctx.strokeStyle = COL.h; ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(T.x, T.y); ctx.stroke();
      ctx.strokeStyle = COL.g; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      ctx.strokeStyle = COL.sight; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(T.x, T.y); ctx.stroke();
      ctx.lineCap = 'butt';
      // θ at the eye, the right angle below the balloon
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.arc(A.x, A.y, 92, -th, 0); ctx.closePath();
      ctx.fillStyle = rgba(PAL.sun, 0.75 + 0.25 * hl.theta); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, 'θ', A.x + 128 * Math.cos(th / 2), A.y - 128 * Math.sin(th / 2), 40, PAL.ink, { align: 'center', weight: 700 });
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink;
      ctx.beginPath(); ctx.moveTo(B.x - 30, B.y); ctx.lineTo(B.x - 30, B.y - 30); ctx.lineTo(B.x, B.y - 30); ctx.stroke();
      // an eye at θ and a balloon at the top, so the picture matches the story
      eyeIcon(ctx, A.x - 58, A.y - 6, t);
      balloon(ctx, T.x, T.y, t, 0.6, false, 1);
      // side names
      const nk = (k) => ease.back(win(t, at(k), 0.45));
      tag(ctx, 'Opposite', B.x + 22, (B.y + T.y) / 2, COL.h, PAL.paper, nk('opp') * (1 + 0.12 * hl.Opp), 'left', 28);
      tag(ctx, 'Adjacent', (A.x + B.x) / 2, B.y + 44, COL.g, PAL.paper, nk('adj') * (1 + 0.12 * hl.Adj), 'center', 28);
      const mid = { x: (A.x + T.x) / 2, y: (A.y + T.y) / 2 }, nrm = { x: -Math.sin(th), y: -Math.cos(th) };
      tag(ctx, 'Hypotenuse', mid.x + nrm.x * 52, mid.y + nrm.y * 52, COL.sight, PAL.paper, nk('hyp') * (1 + 0.12 * hl.Hyp), 'center', 28);
      // chip
      ctx.font = font(24, 700); const cw = ctx.measureText('Idea picture').width + 32;
      pill(ctx, G.bx + G.bw - 24 - cw, G.by + G.bh - 21, cw, 42, PAL.paper, PAL.ink, 3);
      text(ctx, 'Idea picture', G.bx + G.bw - 24 - cw / 2, G.by + G.bh, 24, PAL.ink, { align: 'center', weight: 700 });
    }
    function eyeIcon(ctx, x, y, t) {
      const blink = (t % 4) > 3.85 ? 0.2 : 1;
      ctx.save(); ctx.translate(x, y);
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.quadraticCurveTo(0, -24 * blink, 30, 0); ctx.quadraticCurveTo(0, 24 * blink, -30, 0); ctx.closePath();
      ctx.fillStyle = PAL.paper; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.stroke();
      if (blink > 0.5) {
        ctx.beginPath(); ctx.arc(6, -3, 10, 0, Math.PI * 2); ctx.fillStyle = PAL.plum; ctx.fill();
        ctx.beginPath(); ctx.arc(8, -5, 4.5, 0, Math.PI * 2); ctx.fillStyle = PAL.ink; ctx.fill();
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
        if (l.legend === 'scale') rows.push({ at: l.start, icon: 'ruler', s: `Scale: 1 m = ${s} px (drawn to scale)` });
        if (l.legend === 'E') rows.push({ at: l.start, icon: 'girl', s: `E = her eyes, ${S.eye} m up` });
        if (l.legend === 'P') rows.push({ at: l.start, icon: 'P', s: `P = the balloon at first (${S.a1}°)` });
        if (l.legend === 'Q') rows.push({ at: l.start, icon: 'Q', s: `Q = the balloon later (${S.a2}°)` });
        if (l.legend === 'tri') rows.push({ at: l.start, icon: 'tri', s: '△EMP, △ENQ: right angles at M, N' });
      }
      const rh = 62;
      rows.forEach((r, i) => {
        const k = C.rowIn(t, r.at);
        if (k <= 0) return;
        const y = BY + 56 + rh * (i + 0.5);
        ctx.save(); ctx.globalAlpha *= k; ctx.translate((1 - k) * 30, 0);
        legendIcon(ctx, r.icon, BX + 58, y, t);
        math(ctx, r.s, BX + 104, y, 40, { maxW: BW - 140 });
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
      } else if (kind === 'girl') {
        girl(ctx, x - 4, y + 26, 0.42, t);
      } else {
        balloon(ctx, x - 8, y + 24, t, 0.36, kind === 'P', 1);
        pointLabel(ctx, kind, x + 16, y + 12, 0.72);
      }
      ctx.restore();
    }

    // =============================================================================
    // shared drawings: balloon, girl, sun, cloud, wind
    // =============================================================================
    // (x, y) is the bottom of the basket: that point is the balloon in the maths
    function balloon(ctx, x, y, t, sc, ghost, alpha) {
      ctx.save(); ctx.globalAlpha *= ghost ? 0.38 * alpha : alpha;
      ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(Math.sin(t * 1.6 + (ghost ? 1 : 0)) * 0.025);
      const env = () => {
        ctx.beginPath(); ctx.moveTo(-16, -40);
        ctx.bezierCurveTo(-70, -72, -60, -142, 0, -142);
        ctx.bezierCurveTo(60, -142, 70, -72, 16, -40); ctx.closePath();
      };
      // ropes + basket
      ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink;
      ctx.beginPath(); ctx.moveTo(-15, -40); ctx.lineTo(-11, -22); ctx.moveTo(15, -40); ctx.lineTo(11, -22); ctx.stroke();
      ctx.beginPath(); rrect(ctx, -14, -22, 28, 22, 4); ctx.fillStyle = mix(PAL.coral, PAL.ink, 0.5); ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, -15); ctx.lineTo(14, -15); ctx.stroke();
      // envelope with gores
      ctx.save(); env(); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.clip();
      [[-66, -34], [-12, 12], [34, 66]].forEach(([a, b]) => { ctx.beginPath(); ctx.ellipse((a + b) / 2, -86, (b - a) / 2, 70, 0, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill(); });
      ctx.fillStyle = rgba(PAL.paper, 0.35); ctx.beginPath(); ctx.ellipse(-22, -112, 10, 18, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      env(); ctx.lineWidth = 4.5; ctx.strokeStyle = PAL.ink;
      if (ghost) ctx.setLineDash([8, 7]);
      ctx.stroke();
      ctx.restore();
    }
    const GIRL_EYE = { x: 8.4, y: 103.9 }; // her eye (head tilted up), from her feet, at scale 1
    function girl(ctx, x, y, sc, t) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.lineCap = 'round'; ctx.strokeStyle = PAL.ink;
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -30); ctx.moveTo(8, 0); ctx.lineTo(6, -30); ctx.stroke(); // legs
      // dress
      ctx.beginPath(); ctx.moveTo(-15, -78); ctx.lineTo(15, -78); ctx.lineTo(28, -28); ctx.lineTo(-28, -28); ctx.closePath();
      ctx.fillStyle = PAL.plum; ctx.fill(); ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();
      // arms: one points up at the balloon
      const wave = Math.sin(t * 3) * 0.08;
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(12, -72); ctx.lineTo(38 + wave * 20, -106); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -70); ctx.lineTo(-24, -44); ctx.stroke();
      // head, tilted up
      ctx.save(); ctx.translate(0, -100); ctx.rotate(-0.22);
      ctx.beginPath(); ctx.ellipse(-24, -2, 9, 14, 0.5, 0, Math.PI * 2); ctx.fillStyle = PAL.ink; ctx.fill();         // ponytail
      ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = mix(PAL.sun, PAL.paper, 0.55); ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -5, 21, Math.PI * 1.02, Math.PI * 1.98); ctx.fillStyle = PAL.ink; ctx.fill();          // hair
      ctx.beginPath(); ctx.moveTo(-19, -12); ctx.lineTo(-30, -20); ctx.lineTo(-28, -6); ctx.closePath(); ctx.fillStyle = PAL.sun; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); // bow
      ctx.fillStyle = PAL.ink; ctx.beginPath(); ctx.arc(9, -2, 2.8, 0, Math.PI * 2); ctx.fill();                        // eye
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(8, 7, 5, 0.2, Math.PI * 0.8); ctx.stroke();                         // smile
      ctx.restore();
      ctx.restore();
    }
    function tinyGirl(ctx, x, y, k) {
      // at 1 m = 4 px she is 4.8 px tall: a small mark, with a coral dot at her eyes
      if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.fillStyle = PAL.plum; ctx.fillRect(-2, -S.eye * s, 4, S.eye * s);
      ctx.beginPath(); ctx.arc(0, -S.eye * s, 5, 0, Math.PI * 2); ctx.fillStyle = PAL.coral; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PAL.ink; ctx.stroke();
      ctx.restore();
    }
    function sun(ctx, x, y, t, sc = 1) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(t * 0.3);
      ctx.strokeStyle = PAL.sun; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(0, 64); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fillStyle = PAL.sun; ctx.fill();
      ctx.restore();
    }
    function cloud(ctx, x, y, sc) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      ctx.fillStyle = rgba(PAL.paper, 0.95); ctx.strokeStyle = rgba(PAL.ink, 0.18); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(-40, 10, 26, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-10, -12, 32, Math.PI, Math.PI * 1.9);
      ctx.arc(30, -2, 26, Math.PI * 1.3, Math.PI * 0.2); ctx.lineTo(-40, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    function wind(ctx, x, y, t, k) {
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha *= k; ctx.translate(x, y);
      ctx.lineCap = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = rgba(PAL.ink, 0.3);
      const wob = Math.sin(t * 2) * 3;
      ctx.beginPath(); ctx.moveTo(-70, wob); ctx.bezierCurveTo(-30, wob - 10, 0, 10, 30, 0);
      ctx.arc(30, -12, 12, Math.PI / 2, Math.PI * 1.9, true); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-54, 20 + wob); ctx.lineTo(4, 20); ctx.stroke();
      ctx.restore();
    }

    // =============================================================================
    // HOOK ART — the girl, the balloon drifting away, the two angles and the "?"
    // =============================================================================
    function art(ctx, t, R) {
      const ground = R.y + 575;
      const gsc = 1.45, gx = R.x + 130;
      const eye = { x: gx + GIRL_EYE.x * gsc, y: ground - GIRL_EYE.y * gsc };
      const hh = 250, p1 = { x: eye.x + hh / Math.tan(S.a1 * DEG), y: eye.y - hh }, p2 = { x: eye.x + hh / Math.tan(S.a2 * DEG), y: eye.y - hh };
      const drift = 0.5 + 0.5 * Math.sin(t * 0.9);        // the balloon bobs a little along its path
      const bx = lerp(p2.x - 16, p2.x + 6, drift);
      ctx.save();
      ctx.beginPath(); rrect(ctx, R.x, R.y + 10, R.w, R.h - 30, 30); ctx.fillStyle = rgba(PAL.teal, 0.13); ctx.fill();
      ctx.save(); ctx.clip();
      sun(ctx, R.x + R.w - 100, R.y + 120, t, 0.9);
      cloud(ctx, R.x + ((t * 14 + 260) % (R.w + 200)) - 100, R.y + 120, 1.0);
      cloud(ctx, R.x + ((t * 10 + 700) % (R.w + 200)) - 100, R.y + 250, 0.75);
      for (let i = 0; i < 3; i++) wind(ctx, R.x + ((t * 60 + i * 300) % (R.w + 200)) - 60, [R.y + 190, R.y + 330, R.y + 60][i], t + i, 0.9);
      ctx.fillStyle = rgba(PAL.teal, 0.45); ctx.fillRect(R.x, ground, R.w, R.h);
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = PAL.ink; ctx.beginPath(); ctx.moveTo(R.x, ground); ctx.lineTo(R.x + R.w, ground); ctx.stroke();
      // the path, the drop and the lines of sight
      ctx.save(); ctx.setLineDash([12, 10]); ctx.lineWidth = 4; ctx.strokeStyle = rgba(PAL.ink, 0.5);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(bx, p2.y); ctx.stroke();
      ctx.setLineDash([12, 9]); ctx.lineWidth = 5; ctx.strokeStyle = COL.h;
      ctx.beginPath(); ctx.moveTo(bx, p2.y + 4); ctx.lineTo(bx, ground); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = rgba(PAL.ink, 0.5);
      ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.restore();
      ctx.lineWidth = 5; ctx.strokeStyle = PAL.ink;
      ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.lineTo(bx, p2.y); ctx.stroke();
      // angles at her eyes
      [[150, S.a2, 0.5], [88, S.a1, 0.85]].forEach(([r, deg, a]) => {
        ctx.beginPath(); ctx.moveTo(eye.x, eye.y); ctx.arc(eye.x, eye.y, r, -deg * DEG, 0); ctx.closePath();
        ctx.fillStyle = rgba(PAL.sun, a); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PAL.ink; ctx.stroke();
      });
      const hookTag = (str, r, deg) => {
        const p = { x: eye.x + r * Math.cos(deg * DEG), y: eye.y - r * Math.sin(deg * DEG) };
        tag(ctx, str, p.x, p.y, PAL.sun, PAL.ink, 1, 'center', 38);
      };
      hookTag(`${S.a2}°`, 212, 13);
      hookTag(`${S.a1}°`, 238, 47);
      // balloons: the first spot (ghost) and where it is now
      balloon(ctx, p1.x, p1.y, t, 1.05, true, 1);
      balloon(ctx, bx, p2.y, t, 1.05, false, 1);
      girl(ctx, gx, ground, gsc, t);
      tag(ctx, `${S.height} m`, bx + 18, (p2.y + ground) / 2 + 30, COL.h, PAL.paper, 1, 'left', 36);
      // the big "?" on the path
      const m = { x: (p1.x + p2.x) / 2, y: p2.y - 58 };
      const q = 1 + 0.08 * Math.sin(t * 5);
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(q, q);
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fillStyle = COL.d; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = PAL.ink; ctx.stroke();
      text(ctx, '?', 0, 4, 62, PAL.paper, { align: 'center', weight: 700 });
      ctx.restore();
      ctx.restore();
    }

    const draw = C.compose({ art, stage: drawStage, scene: boardScene });
    return { W, H, FPS, duration: C.D, draw, beats, P, TL };
  }

  root.VideoEngine = { createVideo, PAL, W, H, FPS };
})(typeof window !== 'undefined' ? window : globalThis);
