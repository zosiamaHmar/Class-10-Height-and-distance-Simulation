# Sets explainers · Maths by Zosiama

Ten animated explainers for the "n(A ∪ B) = n(A) + n(B) − n(A ∩ B)" problems. They are made for YouTube Shorts and Instagram Reels: vertical 1080×1920, 60 fps, flat-vector style.

| # | Video | Answer |
|---|---|---|
| 1 | [Find n(A∩B)](q01-find-n-A-intersection-B/index.html) | n(A∩B) = 2 elements |
| 2 | [Find n(X∩Y)](q02-find-n-X-intersection-Y/index.html) | n(X∩Y) = 5 elements |
| 3 | [Football & Tennis](q03-football-and-tennis/index.html) | 9 students like both |
| 4 | [English & Hindi](q04-english-and-hindi/index.html) | 25 people speak both |
| 5 | [Apple & Orange Juice](q05-apple-and-orange-juice/index.html) | 220 students take neither |
| 6 | [Find n(S∪T)](q06-find-n-S-union-T/index.html) | n(S∪T) = 42 elements |
| 7 | [Find n(B)](q07-find-n-B/index.html) | n(B) = 30 elements |
| 8 | [Coffee & Tea](q08-coffee-and-tea/index.html) | (i) 70 people, (ii) 10 people |
| 9 | [Exam: English & ICT](q09-exam-english-and-ict/index.html) | 20% passed both |
| 10 | [Badminton & Chess](q10-badminton-and-chess/index.html) | chess only 25, chess 35 people |

Each folder contains:

- `index.html`: the whole video in one self-contained page. It has a single `<canvas>`, and the fonts, narration, music and code are all embedded, so it plays offline. The page has Play/Pause, seek, a **CC** toggle for the burned-in captions, **● Record .webm** (real-time MediaRecorder capture) and **⇩ Export MP4**. Export MP4 renders offline, frame by frame, with WebCodecs. It uses H.264 + AAC and falls back to VP9 + Opus.
- `<slug>.mp4`: the finished master, ready to upload. It is H.264 High, yuv420p, 60 fps, with AAC at 48 kHz and `+faststart`. The file metadata names "Maths by Zosiama" as artist and author.
- `poster.png`: the first frame, usable as a thumbnail.

[STORYBOARD.md](STORYBOARD.md) lists every beat of every video with its real timings.

## How each video is built

Every frame is drawn in code as a pure function of time: `draw(ctx, t)`. Nothing depends on the previous frame, so any frame can be rendered exactly. The videos use no video models, stock footage, photos or AI images.

1. **Hook, first 3 s.** The video opens on the question's own subject, drawn in code. That is a football and tennis racket, speech bubbles saying "Hello!" and "नमस्ते!", juice glasses, a coffee mug and tea cup, an exam paper and ICT laptop, a badminton racket and chess king, or the two sets themselves for the abstract questions. A big question sits on top, with the spoken hook, a "Pause & try it first!" sticker and a thin progress bar.
2. **Intro and question.** A "Maths by Zosiama" badge appears, then the full question with its key numbers highlighted as they are read out.
3. **The scene.** A Venn diagram draws itself. The box is U, the coral circle is the first set, the teal circle is the second and the overlap is "both". The scale is stated on screen, for example 1 dot = 5 people.
4. **What we know and what we must find.** Every given value is shown with its unit, and the unknown is called x.
5. **Know first.** This covers what n( ), ∪ and ∩ mean, why the middle gets counted two times, the magic rule, and any extra fact the problem needs. The regions of the diagram are labelled.
6. **Solution board.** It shows one line per step, with fractions written as real stacked fractions. The matching region of the diagram is highlighted for each step.
7. **Answer card and check.** The dots fill every region to scale, and the parts are added up to show they match the total.
8. **End card.** "Follow Maths by Zosiama" is shown on screen and spoken. The last 0.4 s dissolves into the first frame, so the video loops without a jump.

The creator tag "Maths by Zosiama" stays on screen for the whole video. All captions, numbers and answers stay inside the Shorts/Reels safe zone. That means they are clear of the top 150 px and the bottom 25 %, and nothing important sits at x > 950 below the stage, where the like and comment buttons are.

**Palette.** Midnight Navy `#1F2544`, Cream `#FFF8EC`, Coral `#FF6F59` (first set), Sea Teal `#17B3A3` (second set), Sunflower `#FFC23D` (both / answer), Plum `#7B5EA7` (the unknown / neither).

## Rebuilding

Requirements: Node 20+, Python 3.10+, ffmpeg with libx264, and the [Kokoro-82M](https://github.com/thewh1teagle/kokoro-onnx) ONNX voice files `kokoro-v1.0.onnx` and `voices-v1.0.bin` in `/opt/tts` (or set `KOKORO_DIR`).

```bash
cd set-videos/src
npm install                                   # playwright, mediabunny, fonts
pip install kokoro-onnx soundfile scipy numpy pyloudnorm
node build.mjs all                            # storyboard → voice + music + SFX → HTML pages → docs
node render.mjs                               # master MP4s (headless Chromium → ffmpeg)
node render.mjs --thumbs                      # poster.png for each video
```

- `src/problems.js` holds the 10 problems and their narration. `say` is what the voice reads and `cap` is the caption.
- `src/audio.py` handles the offline TTS, the timeline, the synthesised music bed and sound effects, the ducking, and loudness at −14 LUFS.
- `src/engine.js` is the canvas engine: layout, Venn diagram, board, captions, hook art and end card.
- `src/player.js` is the page player and its Record/Export buttons.
- `src/build.mjs` and `src/render.mjs` are the build and render pipeline.

## Credits

- **Created by Maths by Zosiama.**
- Narration: Kokoro-82M voice `af_heart` (Apache-2.0), generated offline.
- Music and sound effects: synthesised in code (numpy).
- Fonts: Fredoka and Noto Sans Devanagari (SIL Open Font License 1.1), and a small DejaVu Sans subset for ∪ ∩ ✓ (Bitstream Vera licence).
- MP4/WebM muxing in the page: [Mediabunny](https://github.com/Vanilagy/mediabunny) (MPL-2.0), bundled unmodified in `src/vendor/`.
