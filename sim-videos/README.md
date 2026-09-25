# Heights & Distances explainers · Maths by Zosiama

These are the repo's interactive simulations turned into animated explainer videos for YouTube Shorts and Instagram Reels. Each one is vertical 1080×1920 at 60 fps, in a flat-vector style, with the same format as the [set videos](../set-videos/README.md).

| Sim | Video | Answer |
|---|---|---|
| [sim1 · Kite Flying](../sim1/index.html) | [The Kite String](sim01-kite-string/index.html) · [MP4](sim01-kite-string/sim01-kite-string.mp4) | String AC = 40√3 m ≈ 69.28 m |

The folder `sim01-kite-string/` contains three files:

- `index.html` is the whole video in one self-contained page. It has a single `<canvas>`, with the narration, music and fonts embedded. You get Play/Seek, **CC**, **● Record .webm** and **⇩ Export MP4**.
- `sim01-kite-string.mp4` is the upload-ready master: H.264 High, yuv420p, 60 fps, AAC 48 kHz, `+faststart`, with "Maths by Zosiama" in the metadata.
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

## Rebuilding

```bash
(cd video-kit && npm install)             # once (see video-kit/README.md for the voice files)
cd sim-videos/src
node build.mjs all                        # storyboard → voice + music + SFX → page → STORYBOARD.md
node ../../video-kit/render.mjs ..        # MP4 master
node ../../video-kit/render.mjs .. --thumbs
```

- `src/sims.js` holds the problem data and narration. To add another sim, add an entry here.
- `src/engine.js` is the right-triangle engine: the sky scene to scale, the kite, peg and child, the side tags, the angle and right-angle marks, and the check animation.
- The shared parts live in [`../video-kit/`](../video-kit/README.md).
