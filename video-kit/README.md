# video-kit · Maths by Zosiama

This is the shared pipeline behind every Maths by Zosiama explainer video. A video project keeps only its problem scripts and a small topic engine; everything else lives here.

- [`../set-videos/`](../set-videos/README.md): 10 set-theory videos (Venn diagrams)
- [`../sim-videos/`](../sim-videos/README.md): the Heights & Distances simulations turned into videos (right triangles)
- [`../solids-videos/`](../solids-videos/README.md): 12 Surface Areas & Volumes videos (combinations of solids, in 3D)

| File | What it does |
|---|---|
| `core.js` | The shared canvas code. It holds the palette and fonts, maths text with stacked fractions, the progress bar, creator tag and chapter chip, captions, the hook sticker and question, the intro and question card, and the *What we know*, *Know first*, *Solution* and *Answer* cards. It also draws the "Follow Maths by Zosiama" end card, the swipe transitions and the seamless loop. Every frame is a pure function of time. |
| `audio.py` | Handles the audio. It speaks every line offline with Kokoro and lays the lines out on a timeline, which is where every timing comes from. It also synthesises the music bed and sound effects, ducks the music under the voice and normalises to −14 LUFS. |
| `player.js`, `template.html` | Produce the self-contained page: one `<canvas>`, Play/Seek, the **CC** toggle, **● Record .webm** and **⇩ Export MP4** (WebCodecs, H.264 + AAC falling back to VP9 + Opus). |
| `kit.mjs` | Build helpers for projects: `writeScript`, `runAudio` and `buildPages`. |
| `render.mjs` | Renders the MP4 master. Headless Chromium draws each frame of the page, and ffmpeg encodes it as H.264 High, yuv420p, 60 fps, with AAC at 48 kHz, `+faststart`, and "Maths by Zosiama" in the metadata. |
| `fonts/`, `vendor/` | Fredoka, a DejaVu Sans symbol subset (∪ ∩ √ θ ∠ △ ✓ …) and Noto Sans Devanagari, plus Mediabunny (MPL-2.0). |

## Setup

- Node 20+, Python 3.10+, and ffmpeg with libx264.
- Python packages: `pip install kokoro-onnx soundfile scipy numpy pyloudnorm`.
- Kokoro-82M voice files `kokoro-v1.0.onnx` and `voices-v1.0.bin` in `/opt/tts` (or set `KOKORO_DIR`). They are on the [kokoro-onnx releases page](https://github.com/thewh1teagle/kokoro-onnx/releases).
- Run `npm install` in this folder once (Playwright, Mediabunny and the fonts).

## Making a video

```bash
cd <project>/src
node build.mjs all                      # storyboard → voice + music + SFX → page → STORYBOARD.md
node ../../video-kit/render.mjs .. --stills 0,30,60 <id>   # PNG frames to check the layout
node ../../video-kit/render.mjs .. <id>                     # the MP4 master
node ../../video-kit/render.mjs .. --thumbs <id>            # poster.png
```

A topic engine registers `window.VideoEngine = { createVideo, W, H, FPS }`. Its `createVideo(P, TL)` calls `VideoCore.createCore(P, TL, { tokens, chapter, label })`. It then passes three things to `core.compose()`:

- `art(ctx, t, R)`: the hook illustration.
- `stage(ctx, t, { l, next, b })`: the diagram.
- `scene(ctx, t, b)`: the scene card.
