# Heights & Distances explainers · Maths by Zosiama

These are the repo's interactive simulations turned into animated explainer videos for YouTube Shorts and Instagram Reels. Each one is vertical 1080×1920 at 60 fps, in a flat-vector style, with the same format as the [set videos](../set-videos/README.md).

| Sim | Video | Length | Answer |
|---|---|---|---|
| [sim1 · Kite Flying](../sim1/index.html) | [The Kite String](sim01-kite-string/index.html) · [MP4](sim01-kite-string/sim01-kite-string.mp4) | 2:15 | String AC = 40√3 m ≈ 69.28 m |
| [sim15 · Balloon Elevation](../sim15/index.html) | [The Drifting Balloon](sim15-drifting-balloon/index.html) · [MP4](sim15-drifting-balloon/sim15-drifting-balloon.mp4) | 2:37 | Distance flown d = 58√3 m ≈ 100.46 m |

Each video folder contains three files:

- `index.html` is the whole video in one self-contained page. It has a single `<canvas>`, with the narration, music and fonts embedded. You get Play/Seek, **CC**, **● Record .webm** and **⇩ Export MP4**.
- `<slug>.mp4` is the upload-ready master: H.264 High, yuv420p, 60 fps, AAC 48 kHz, `+faststart`, with "Maths by Zosiama" in the metadata.
- `poster.png` is the thumbnail.

[STORYBOARD.md](STORYBOARD.md) lists every beat with its real timings.

## What the kite video shows

1. **Hook.** The kite high in the sky, its string down to a peg, with 60 m and 60° marked. A big "?" asks "Is the string longer than 60 m?" A "Pause & try it first!" sticker is on screen.
2. **Intro and question.** "Hi! This is Maths by Zosiama", then the NCERT question with its key facts highlighted.
3. **The scene, drawn to scale (1 m = 6 px).** A is the peg, the kite C flies in, and B drops straight below it. Together they form the right triangle ABC.
4. **What we know.** BC = 60 m, ∠A = 60°, ∠B = 90°. Find AC = x.
5. **Know first.** The sides are tagged Opposite, Hypotenuse and Adjacent on the triangle. Then comes the rule sin θ = Opposite ÷ Hypotenuse, with sin 60° = √3/2 and √3 ≈ 1.732. Finally, why tan is the wrong choice here: it gives the ground distance, not the string.
6. **Solution board.** sin 60° = BC/AC = 60/x, so √3/2 = 60/x, so x = 120/√3 = 40√3 ≈ 69.28 m. Each step is written as real fractions, and the sides used glow on the triangle.
7. **Answer and check.** 60 ÷ 69.28 ≈ 0.866 = √3/2. The 60 m height is laid along the string and falls 9.28 m short of the kite, because the hypotenuse is the longest side.
8. **End card.** "Follow Maths by Zosiama", then it loops back into the hook.

Colours are the same six used everywhere: Coral is the opposite side (the height), Sea Teal the adjacent side (the ground), Plum the hypotenuse (the unknown string x), Sunflower the angle and the answer, on Cream and Midnight Navy.

## What the balloon video shows

The question comes from the Class 10 Heights & Distances exercise (its figure is Fig. 14.14 in the source book; the video draws its own). A 1.2 m tall girl watches a balloon that drifts along a level line 88.2 m above the ground. From her eyes it is first at 60°, later at 30°. How far did it travel?

1. **Hook.** The girl pointing up at a hot-air balloon, with a faded balloon where it started and the real one where it is now. Her two lines of sight make 60° and 30°, 88.2 m is marked, and a big "?" sits on the balloon's path. The title reads "A balloon: 60° → 30°. How far did it fly?"
2. **Question.** "Let's solve it together, step by step!", then the full question with 1.2 m, the horizontal line, 88.2 m, her eyes, 60° and 30° highlighted as they are read. The name "Maths by Zosiama" is only said in the outro.
3. **The scene, drawn to scale (1 m = 4 px).** At this scale the girl is only 4.8 px tall, so a pulsing ring finds her and a ×20 zoom bubble shows her eyes E, 1.2 m above the ground. The balloon P floats 88.2 m up, and her line of sight makes 60°. Then the wind carries the balloon to Q, and a live readout counts the angle down from 60° to 30°. Dropping P and Q to her eye level gives M and N, and the right triangles EMP and ENQ.
4. **What we know.** Balloon 88.2 m up, her eyes 1.2 m up, ∠PEM = 60° and ∠QEN = 30°. Find d = PQ, shown as "d = ?" on the balloon's path.
5. **Know first.** An idea picture replaces the scene: one right triangle with Opposite (the height), Adjacent (along the ground), Hypotenuse (the line of sight), θ at an eye, the right-angle mark and a balloon on top. Then the magic rule tan θ = Opposite ÷ Adjacent, tan 60° = √3, tan 30° = 1/√3 and √3 ≈ 1.732. Back on the scene: the balloon flies level, so PQ = MN.
6. **Solution board**, over three pages with real fractions. The triangle each step uses glows, and each new length appears on the scene.
   - PM = QN = 88.2 − 1.2 = 87 m.
   - In △EMP, tan 60° = 87/EM, so EM = 87/√3 = 87√3/3 = 29√3 m.
   - In △ENQ, tan 30° = 87/EN, so EN = 87√3 m.
   - d = MN = EN − EM = 87√3 − 29√3 = 58√3 m ≈ 58 × 1.732 ≈ 100.46 m.
7. **Answer and check.** The answer card shows d = 58√3 m ≈ 100.46 m. The check: 87 ÷ 50.23 ≈ 1.732 = tan 60° and 87 ÷ 150.69 ≈ 0.577 = tan 30°.
8. **End card.** "Follow Maths by Zosiama", then it loops back into the hook.

Colours: Coral for the heights PM and QN (the opposite sides), Sea Teal for EM and EN along her eye level (the adjacent sides), Midnight Navy for her lines of sight (the hypotenuses), Plum for the unknown distance d, and Sunflower for the angles and the answer, on Cream.

## Rebuilding

```bash
(cd video-kit && npm install)             # once (see video-kit/README.md for the voice files)
cd sim-videos/src
node build.mjs all                        # storyboard → voice + music + SFX → pages → STORYBOARD.md
node ../../video-kit/render.mjs ..        # MP4 masters (or name ids: sim01 sim15)
node ../../video-kit/render.mjs .. --thumbs
```

- `src/sims.js` holds the problem data and narration. To add another sim, add an entry here. `scene.engine` picks the stage for that video.
- `src/engine.js` is the right-triangle engine: the sky scene to scale, the kite, peg and child, the side tags, the angle and right-angle marks, and the check animation.
- `src/balloon.js` is the two-triangle engine for the balloon. It draws the girl and the zoom bubble for her eye height, the drifting hot-air balloon with a live angle readout, the drops to her eye level, the measuring lines under the ground, the idea picture for "Know first", and the hook illustration.
- The shared parts live in [`../video-kit/`](../video-kit/README.md).
