# Surface Areas & Volumes explainers · Maths by Zosiama

Twelve animated explainers for the "combination of solids" problems: cubes, cylinders, cones and hemispheres joined together or cut out of each other. They are made for YouTube Shorts and Instagram Reels: vertical 1080×1920, 60 fps, flat-vector style, in the same format as the [set videos](../set-videos/README.md) and the [Heights & Distances videos](../sim-videos/README.md).

| # | Video | Length | Answer |
|---|---|---|---|
| 1 | [Cube with a bowl cut out](q01-cube-with-hemisphere-cut-out/index.html) · [MP4](q01-cube-with-hemisphere-cut-out/q01-cube-with-hemisphere-cut-out.mp4) | 1:59 | S = l²/4 (π + 24) sq. units |
| 2 | [Cone out of a cylinder](q02-cone-removed-from-cylinder/index.html) · [MP4](q02-cone-removed-from-cylinder/q02-cone-removed-from-cylinder.mp4) | 2:46 | V ≈ 754.29 cm³, whole area ≈ 710.2 cm² |
| 3 | [Polishing a round-ended solid](q03-polishing-cylinder-with-hemispherical-ends/index.html) · [MP4](q03-polishing-cylinder-with-hemispherical-ends/q03-polishing-cylinder-with-hemispherical-ends.mp4) | 2:23 | cost = ₹457.60 |
| 4 | [Scooped-out wooden article](q04-cylinder-with-hemispheres-scooped-out/index.html) · [MP4](q04-cylinder-with-hemispheres-scooped-out/q04-cylinder-with-hemispheres-scooped-out.mp4) | 1:52 | total surface area = 594 cm² |
| 5 | [Medicine capsule](q05-medicine-capsule/index.html) · [MP4](q05-medicine-capsule/q05-medicine-capsule.mp4) | 1:56 | surface area = 220 mm² |
| 6 | [Cone in a full vessel](q06-cone-in-a-vessel-of-water/index.html) · [MP4](q06-cone-in-a-vessel-of-water/q06-cone-in-a-vessel-of-water.mp4) | 2:18 | (i) spilled = 77 cm³, (ii) left = 748 cm³ |
| 7 | [Wobbly toy](q07-toy-cone-on-hemisphere/index.html) · [MP4](q07-toy-cone-on-hemisphere/q07-toy-cone-on-hemisphere.mp4) | 2:02 | total surface area = 858 cm² |
| 8 | [Wooden cube with a bowl](q08-cube-21cm-with-hemisphere-cut-out/index.html) · [MP4](q08-cube-21cm-with-hemisphere-cut-out/q08-cube-21cm-with-hemisphere-cut-out.mp4) | 2:38 | V = 6835.5 cm³, A = 2992.5 cm² |
| 9 | [Ice-cream cone](q09-ice-cream-cone/index.html) · [MP4](q09-ice-cream-cone/q09-ice-cream-cone.mp4) | 2:09 | ice-cream ≈ 436.51 cm³ |
| 10 | [Toy with a party-hat cone](q10-toy-cone-two-thirds-of-hemisphere/index.html) · [MP4](q10-toy-cone-two-thirds-of-hemisphere/q10-toy-cone-two-thirds-of-hemisphere.mp4) | 2:29 | cone height = 28 cm, surface area = 5082 cm² |
| 11 | [Cone on a hemisphere: volume](q11-cone-on-hemisphere-volume/index.html) · [MP4](q11-cone-on-hemisphere-volume/q11-cone-on-hemisphere-volume.mp4) | 2:04 | volume ≈ 166.83 cm³ |
| 12 | [The shed](q12-shed-cuboid-with-half-cylinder-roof/index.html) · [MP4](q12-shed-cuboid-with-half-cylinder-roof/q12-shed-cuboid-with-half-cylinder-roof.mp4) | 2:54 | air = 1128.75 m³, inside area = 555.5 m² |

All answers use π = 22/7, as the textbook does. Q12 is the longest at 2:54, which is still under the 3-minute Shorts limit.

Each folder contains three files:

- `index.html` is the whole video in one self-contained page. It has a single `<canvas>`, and the fonts, narration, music and code are all embedded, so it plays offline. You get Play/Pause, seek, **CC**, **● Record .webm** (real-time MediaRecorder capture) and **⇩ Export MP4** (offline, frame by frame, with WebCodecs: H.264 + AAC, falling back to VP9 + Opus).
- `<slug>.mp4` is the upload-ready master: H.264 High, yuv420p, 60 fps, AAC 48 kHz, `+faststart`, with "Maths by Zosiama" as artist and author in the metadata.
- `poster.png` is the thumbnail.

[STORYBOARD.md](STORYBOARD.md) lists every beat of every video with its real timings and narration.

## What each video shows

Every frame is drawn in code as a pure function of time. The solids are real 3D meshes (cylinders, cones, hemispheres, boxes, half-cylinders) drawn with a fixed camera and flat three-tone shading. The videos use no video models, stock footage, photos or AI images.

1. **Hook, first 3 s.** The object from the question, drawn in 3D: the spinning wooden block, the cone lifting out of the cylinder, the polished rod, the scooped wooden article, the capsule, the vessel of water, the rocking toy, the ice-cream, the shed. A big question sits on top, with the spoken hook, a "Pause & try it first!" sticker and a thin progress bar.
2. **Intro and question.** "Hi! This is Maths by Zosiama", then the full question with its key numbers highlighted as they are read out.
3. **The scene, drawn to scale.** The scale is on screen (for example 1 cm = 30 px). Q1 has no numbers, so it says "Not to scale: l is any length". The parts drop in one by one, or the cavity is carved out, and every radius, height and slant height is labelled with its unit. Where two solids join, the hidden circle is shown with a "hidden inside: not counted" tag.
4. **What we know and what we must find.** Every given value with its unit, and the unknown with a letter (S, V, A, h = ?).
5. **Know first.** Every formula the question needs: cylinder side 2πrh, cone πrl, hemisphere 2πr², sphere volumes, l = √(r² + h²), 1 dm² = 100 cm² and so on. It ends with the "magic rule" for that solid, such as "surface = cylinder side + 2 hemispheres".
6. **Solution board.** One line per step, with real stacked fractions. The part of the solid used in each step glows. Long solutions turn to a second page.
7. **Answer card and check.** The answer in a big card, then a quick check that the numbers agree. For example the side and the two ends add back up to the total, or the removed cone is exactly ⅓ of the cylinder.
8. **End card.** "Follow Maths by Zosiama" is shown on screen and spoken. The last 0.4 s dissolves into the first frame, so the video loops without a jump.

The colours are the same six used everywhere: Coral is the radius r, Sea Teal the height h, Plum the slant height l and the unknown, Sunflower the highlights and answer, on Cream and Midnight Navy. Wood is a Sunflower–Coral tint.

The creator tag "Maths by Zosiama" stays on screen for the whole video. All captions, numbers and answers stay inside the Shorts/Reels safe zone: clear of the top 150 px and the bottom 25 %, with nothing important at x > 950 below the stage.

## Rebuilding

```bash
(cd video-kit && npm install)             # once (see video-kit/README.md for the voice files)
cd solids-videos/src
node build.mjs all                        # storyboard → voice + music + SFX → pages → STORYBOARD.md
node ../../video-kit/render.mjs ..        # MP4 masters (or name ids: q01 q06 …)
node ../../video-kit/render.mjs .. --thumbs
```

- `src/solids.js` holds the problem data and narration: the scene, dimensions, hook, "what we know", "know first" and the solution steps.
- `src/engine.js` is the 3D solids engine. It holds the mesh builders, the orthographic camera, shading, cavities, the exploded view and drop-in parts, the glass vessel and water, the hidden-joint marks, dimension labels and the hook illustrations.
- The shared parts live in [`../video-kit/`](../video-kit/README.md).
