# Constructions explainers · Maths by Zosiama

Eleven animated explainers for triangle constructions with a ruler, compass and set square. They are vertical 1080×1920 at 60 fps, in a flat-vector style, for YouTube Shorts and Instagram Reels. They use the same format as the [set](../set-videos/README.md), [Heights & Distances](../sim-videos/README.md) and [Surface Areas & Volumes](../solids-videos/README.md) videos.

The questions keep your numbering: Set 1 has Q1–Q3 and Set 2 has Q1–Q8.

| Set · Q | Video | Length | Answer |
|---|---|---|---|
| 1 · Q1 | [Shrink a triangle to 3/4](set1-q1-triangle-6-5-60-scaled-3-4/index.html) · [MP4](set1-q1-triangle-6-5-60-scaled-3-4/set1-q1-triangle-6-5-60-scaled-3-4.mp4) | 2:36 | △A′BC′: BC′ = 4.5 cm, A′B = 3.75 cm, ∠B = 60° |
| 1 · Q2 | [A copy 2/3 as big](set1-q2-triangle-4-5-6-scaled-2-3/index.html) · [MP4](set1-q2-triangle-4-5-6-scaled-2-3/set1-q2-triangle-4-5-6-scaled-2-3.mp4) | 2:32 | BC′ = 4 cm, A′B ≈ 3.33 cm, A′C′ ≈ 2.67 cm |
| 1 · Q3 | [Grow a triangle to 7/5](set1-q3-triangle-5-6-7-scaled-7-5/index.html) · [MP4](set1-q3-triangle-5-6-7-scaled-7-5/set1-q3-triangle-5-6-7-scaled-7-5.mp4) | 2:42 | BC′ = 9.8 cm, A′B = 7 cm, A′C′ = 8.4 cm |
| 2 · Q1 | [Isosceles triangle, 1½ times](set2-q1-isosceles-triangle-scaled-1-5/index.html) · [MP4](set2-q1-isosceles-triangle-scaled-1-5/set2-q1-isosceles-triangle-scaled-1-5.mp4) | 2:34 | BC′ = 12 cm, A′B = A′C′ ≈ 8.49 cm, height 6 cm |
| 2 · Q2 | [Angles 45° and 105°, 4/3 as big](set2-q2-triangle-7-45-105-scaled-4-3/index.html) · [MP4](set2-q2-triangle-7-45-105-scaled-4-3/set2-q2-triangle-7-45-105-scaled-4-3.mp4) | 2:48 | BC′ ≈ 9.33 cm, A′B ≈ 4.83 cm, A′C′ ≈ 6.83 cm |
| 2 · Q3 | [Right triangle, 5/3 as big](set2-q3-right-triangle-5-4-scaled-5-3/index.html) · [MP4](set2-q3-right-triangle-5-4-scaled-5-3/set2-q3-right-triangle-5-4-scaled-5-3.mp4) | 2:39 | BC′ ≈ 8.33 cm, BA′ ≈ 6.67 cm, A′C′ ≈ 10.67 cm |
| 2 · Q4 | [Right triangle, 3/4 as big](set2-q4-right-triangle-8-6-scaled-3-4/index.html) · [MP4](set2-q4-right-triangle-8-6-scaled-3-4/set2-q4-right-triangle-8-6-scaled-3-4.mp4) | 2:33 | BC′ = 6 cm, BA′ = 4.5 cm, A′C′ = 7.5 cm |
| 2 · Q5 | [Base, top angle and height](set2-q5-triangle-base-5-angle-45-altitude-4-2/index.html) · [MP4](set2-q5-triangle-base-5-angle-45-altitude-4-2/set2-q5-triangle-base-5-angle-45-altitude-4-2.mp4) | 2:23 | △ABC with AB = 7 cm, AC ≈ 4.24 cm |
| 2 · Q6 | [Triangle PQR from base, angle and height](set2-q6-triangle-pqr-base-6-angle-30-altitude-4-7/index.html) · [MP4](set2-q6-triangle-pqr-base-6-angle-30-altitude-4-7/set2-q6-triangle-pqr-base-6-angle-30-altitude-4-7.mp4) | 2:26 | △PQR with PQ ≈ 10.1 cm, PR ≈ 5.6 cm |
| 2 · Q7 | [Base, top angle and median: how many?](set2-q7-triangle-base-7-angle-60-median-5-3/index.html) · [MP4](set2-q7-triangle-base-7-angle-60-median-5-3/set2-q7-triangle-base-7-angle-60-median-5-3.mp4) | 2:18 | 2 triangles (ABC and A′BC, mirror images): AB ≈ 8.1 cm, AC ≈ 3.9 cm |
| 2 · Q8 | [Triangle PQR from base, angle and median: how many?](set2-q8-triangle-pqr-base-5-5-angle-45-median-5/index.html) · [MP4](set2-q8-triangle-pqr-base-5-5-angle-45-median-5/set2-q8-triangle-pqr-base-5-5-angle-45-median-5.mp4) | 2:21 | 2 triangles (PQR and P′QR, mirror images): PQ ≈ 7.3 cm, PR ≈ 3.4 cm |

Every video is under the 3-minute Shorts limit. The longest is Set 2 Q2, at 2:48.

Each folder contains three files:

- `index.html` is the whole video in one self-contained page. It has a single `<canvas>`, and the fonts, narration, music and code are all embedded, so it plays offline. You get Play/Pause, seek, **CC**, **● Record .webm** (real-time MediaRecorder capture) and **⇩ Export MP4** (offline, frame by frame, with WebCodecs: H.264 + AAC, falling back to VP9 + Opus).
- `<slug>.mp4` is the upload-ready master: H.264 High, yuv420p, 60 fps, AAC 48 kHz, `+faststart`, with "Maths by Zosiama" as artist and author in the metadata.
- `poster.png` is the thumbnail.

[STORYBOARD.md](STORYBOARD.md) lists every beat of every video with its real timings and narration.

## What each video shows

Every frame is drawn in code as a pure function of time. The videos use no video models, stock footage, photos or AI images. The drawing sheet has a 1 cm grid and a scale chip (for example 1 cm = 60 px), so every length on screen is to scale.

1. **Hook, first 3 s.** The triangle itself on a drawing sheet. In the scaling questions, a copy grows or shrinks by the scale factor while a compass swings. In Set 2 Q5–Q8, the top corner slides around and its angle changes live. A big question sits on top, with a spoken hook ("Can you shrink this triangle to three quarters…?"), a "Pause & try it first!" sticker and a thin progress bar.
2. **Question.** The full question with its key numbers highlighted as they are read out. The creator badge is on screen; the narration only says "Maths by Zosiama" at the end, as the updated prompt asks.
3. **The scene, drawn to scale.**
   - *Scaling questions:* step 1 constructs △ABC with a ruler and compass, for example BC = 6 cm, then a 60° angle at B, then BA = 5 cm.
   - *Set 2 Q5–Q8:* the base is drawn, and a "ghost" top corner slides along the height line or the median circle. Its angle reading changes, showing that we need exactly one spot.
4. **What we know and what we must find**, with units.
5. **Know first.**
   - *Scaling questions:* an idea picture of three facts. First, m/n means n equal parts, taking m of them. Second, parallel lines copy equal steps from one line to another. Third, parallel sides give the same angles, so the shape stays the same. Magic rule: new side = m/n × old side.
   - *Set 2 Q5–Q8:* every point on an arc sees the base at the same angle. The tangent rule says the angle between the base and the tangent equals that angle. The radius is at right angles to the tangent, and the centre is on the middle line of the base. The height puts the corner on a line parallel to the base; the median puts it on a circle round the midpoint M. Magic rule: the corner is where they meet.
6. **Construction board.** One step per line, with real fractions such as BC′/BC = BB₃/BB₄ = 3/4. The compass, ruler and set square draw each step on the sheet as it is spoken: equal compass steps B₁, B₂…, the set square sliding to make parallel lines, the arc through B and C, and so on.
7. **Answer card and check.** A ruler measures the new sides (4.5/6 = 3/4 ✓), or a protractor measures the top angle (45° ✓) and the height or median is checked.
8. **End card.** "Follow Maths by Zosiama" is shown on screen and spoken. The last 0.4 s dissolves into the first frame, so the video loops without a jump.

The colours are the same six used everywhere: Sea Teal is the first triangle and the base, Coral the new triangle and the answer, Plum the helper rays, equal steps and arcs, and Sunflower the angles and highlights, on Cream and Midnight Navy. The creator tag stays on screen for the whole video. All captions, numbers and answers stay inside the Shorts/Reels safe zone.

## Rebuilding

```bash
(cd video-kit && npm install)             # once (see video-kit/README.md for the voice files)
cd constructions-videos/src
node build.mjs lint                       # what the voice will say; flags long captions
node build.mjs fit                        # the largest scale that fits each drawing on the sheet
node build.mjs all                        # storyboard → voice + music + SFX → pages → STORYBOARD.md
node ../../video-kit/render.mjs ..        # MP4 masters (or name ids: c01 c08 …)
node ../../video-kit/render.mjs .. --thumbs
```

- `src/problems.js` holds the questions, the narration and the drawing steps. Two builders write most of each script. `scaled()` covers "draw a triangle, then one m/n as big" (NCERT method: a ray with equal steps, then parallels). `locus()` covers "base, angle at the top, and a height or a median" (the arc of equal angles).
- `src/engine.js` is the construction engine. It holds the to-scale sheet, and the animated ruler, compass, set square, pencil and protractor. It also draws arcs, rays, equal steps, parallel and angle marks, labels, measurements, the know-first pictures and the hook illustrations.
- The shared parts live in [`../video-kit/`](../video-kit/README.md). For this project the kit gained drawing sounds (pencil, compass, compass steps) and a `min` line length, so the voice waits for a drawing to finish. The symbol font also gained ′, ₁…₉ and ∥.
