# Reusable prompt: code-drawn maths explainer for YouTube, Shorts and Reels

Copy everything in the box, replace the `[[...]]` parts, and send it.

```text
Make a [[2]]-minute animated explainer for this problem:

[[PASTE THE FULL QUESTION HERE, e.g. "A boy standing on a horizontal plane finds a bird
flying at a distance of 100 m from him at an elevation of 30°. A girl standing on the roof of
a 20 m high building finds the angle of elevation of the same bird to be 45°. Boy and girl are
on opposite sides of the bird. Find the distance of the bird from the girl."]]

FORMAT
- One HTML file with a single <canvas>. Every frame is drawn by code, frame by frame, as a pure
  function of time (draw(t)), so any frame can be rendered exactly.
- No video models, no stock footage, no AI images. One real-life photo is allowed and should be
  used in the hook (a public-domain or openly licensed photo embedded in the file; credit it).
- Output size: [[VERTICAL 1080×1920 (9:16) for YouTube Shorts + Instagram Reels]]
  [[or HORIZONTAL 1920×1080 (16:9) for regular YouTube]], 60 fps.
- Keep captions, headline and answers inside the Shorts/Reels safe zone (clear of the top
  ~150 px, the bottom ~25 % and the right-hand buttons).

CREATOR BRANDING
- Always credit "Maths by Zosiama" as the creator:
  - a creator tag on screen for the whole video (small, clear of the captions)
  - "Maths by Zosiama" said in the intro or outro narration
  - the video always ends with "Follow Maths by Zosiama", both on screen and spoken
  - "Maths by Zosiama" as the author in the HTML page and in the exported file's metadata

STYLE
- Pick ONE: [[flat vector | hand-drawn brush strokes | paper cut-out]].
- One colour palette (5–6 named colours) used for everything.
- Show text and numbers on screen with units for every quantity (m, °, m², kg, N, s …):
  side lengths, angles, heights, distances, and the final answer.

AUDIENCE AND VOICE
- Explain like the audience is 5 years old: short sentences, friendly, concrete.
- Narration audio for the whole video, generated offline (no online TTS), embedded in the file.
- Auto captions synced line by line with the voice (toggle with a CC button).
- Soft background music and small sound effects, mixed under the voice.

HOOK (first 3 seconds)
- Open on a real photo with a big on-screen question and a spoken hook such as
  "Wait! Can you solve this with only two angles? Stay till the end!"
- Add "Pause & try it first!" and a thin progress bar at the top to hold attention.

TEACHING CONTENT (must all appear on screen AND in the narration)
1. The scene: who/what is where, drawn to scale (state the scale, e.g. 1 m = 7 px).
2. What we know (given values with units) and what we must find (with a letter, e.g. d = ?).
3. "Know first": every formula and fact needed, e.g. sin θ = Opposite ÷ Hypotenuse,
   tan θ = Opposite ÷ Adjacent, sin 30° = 1/2, tan 45° = 1, √3 ≈ 1.732, with a labelled
   right-triangle diagram (Opposite / Adjacent / Hypotenuse, θ, right-angle mark).
4. The solution step by step on a "solution board", one line per step, written as real
   fractions, with the matching triangle highlighted in the scene for each step.
5. The answer in a big highlighted card, plus a quick check that the numbers agree.
6. End every video with "Follow Maths by Zosiama": say it in the narration and show it as a
   big end card in the last few seconds, then let the outro loop nicely.

WORKFLOW
- First, storyboard it as a list of beats with timings (and show me the list), then build it.

EXPORTS
- A "Record" button that exports the canvas plus audio to a .webm at 60 fps (MediaRecorder).
- An "Export MP4" button that renders every frame offline with WebCodecs (H.264 + AAC, falling
  back to VP9 + Opus) into an .mp4.
- Also render and give me the finished MP4 file (H.264 High, yuv420p, 60 fps, AAC 48 kHz,
  +faststart) so I can upload it directly to YouTube / Shorts / Reels.
```

## Why each part is there

| Part of the prompt | What it prevents |
|---|---|
| "draw(t) as a pure function of time" | Skipped or uneven frames. It allows exact offline MP4 rendering at 60 fps. |
| "safe zone" | Captions or answers hidden under the Shorts/Reels UI. |
| "units for every quantity" | Bare numbers that a young viewer can't interpret. |
| "Know first" section | Jumping into the solution before the formula is introduced. |
| Storyboard first | Timing problems found only after the video is built. |
| "Maths by Zosiama" creator branding | Videos that get reposted without credit to the creator. |
| Both .webm and .mp4 exports | Instagram and some editors don't accept .webm. |
