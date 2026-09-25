# Coordinate Geometry explainers · Maths by Zosiama

Nineteen animated explainers for the section formula chapter: dividing a line in a ratio, midpoints, points of trisection, where a line or an axis cuts a segment, parallelograms, and the centroid. They are vertical 1080×1920 at 60 fps, in a flat-vector style, for YouTube Shorts and Instagram Reels, in the same format as the other Maths by Zosiama videos in this repo.

| Q | Video | Length | Answer |
|---|---|---|---|
<!-- TABLE -->

Every video is under the 3-minute Shorts limit.

Each folder contains three files:

- `index.html` is the whole video in one self-contained page. It has a single `<canvas>`, and the fonts, narration, music and code are all embedded, so it plays offline. You get Play/Pause, seek, **CC**, **● Record .webm** (real-time MediaRecorder capture) and **⇩ Export MP4** (offline, frame by frame, with WebCodecs: H.264 + AAC, falling back to VP9 + Opus).
- `<slug>.mp4` is the upload-ready master: H.264 High, yuv420p, 60 fps, AAC 48 kHz, `+faststart`, with "Maths by Zosiama" as artist and author in the metadata.
- `poster.png` is the thumbnail.

[STORYBOARD.md](STORYBOARD.md) lists every beat of every video with its real timings and narration.

## What each video shows

Every frame is drawn in code as a pure function of time. The videos use no video models, stock footage, photos or AI images.

1. **Hook, first 3 s.** The question's own points on a coordinate plane. That might be a segment cut into coloured pieces, a line slicing through it, a parallelogram, a circle or a triangle. A bouncing "?" pin marks the unknown point. A big question sits on top, with a spoken hook ("Can you find the point that cuts this line in the ratio 3 to 1?"), a "Pause & try it first!" sticker and a thin progress bar.
2. **Question.** The full question with its key numbers highlighted as they are read out. The creator badge is on screen; the narration says "Maths by Zosiama" only in the outro.
3. **The plane, drawn to scale.** Grid, numbered axes and a scale chip, for example 1 unit = 42 px. Each point is plotted with its dashed feet on the axes ("5 right, and 2 down"). The segment is joined, and the unknown point is a "?" pin sliding along it.
4. **What we know and what we must find.**
5. **Know first.** The formula the question needs, with an idea picture:
   - the section formula (m : n means m + n equal pieces)
   - an unknown ratio written as k : 1
   - a point on the y-axis has x = 0
   - a point on a line makes its equation true
   - the midpoint formula
   - a parallelogram's diagonals cut each other in half
   - the centroid is the average of the corners
   - the distance formula

   Each one ends with a magic rule.
6. **Solution board.** One step per line, with real stacked fractions. The answer point lands on the plane with its coordinates.
7. **Answer card and check.** For example, step arrows show that A → P is 3 times P → B, or the point is put back into the line's equation, or the midpoints are recomputed.
8. **End card.** "Follow Maths by Zosiama" is shown on screen and spoken. The last 0.4 s dissolves into the first frame, so the video loops without a jump.

The colours are the same six used everywhere: Sea Teal for the given points and segments, Coral for the unknown point and the answer (and the first share of a ratio), Plum for lines, diagonals and medians, and Sunflower for step arrows and highlights, on Cream and Midnight Navy.

## Rebuilding

```bash
(cd video-kit && npm install)             # once (see video-kit/README.md for the voice files)
cd coordinates-videos/src
node build.mjs lint                       # what the voice will say; flags long captions
node build.mjs all                        # storyboard → voice + music + SFX → pages → STORYBOARD.md
node ../../video-kit/render.mjs ..        # MP4 masters (or name ids: q01 q06 …)
node ../../video-kit/render.mjs .. --thumbs
```

- `src/problems.js` holds the questions, the narration and the drawing steps, with shared "Know first" blocks for each formula.
- `src/engine.js` is the coordinate-plane engine. It draws the grid and numbered axes to scale, and points with coordinate tags and dashed feet. It also draws segments, lines from their equations, equal pieces, "?" pins, step arrows, polygons, circles, equal-length ticks, sliding points, the idea pictures and the hook illustrations.
- The shared parts live in [`../video-kit/`](../video-kit/README.md). For this project, the maths text learned stacked fractions whose top or bottom holds its own brackets, such as (3 × 6 + 1 × (−2)) over (3 + 1).
