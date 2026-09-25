# Project notes

Static HTML trigonometry simulations (`sim1`–`sim26`) plus a Remotion video project in `remotion-video/`.

## Making videos

Whenever the task is making or editing a video (a Remotion composition, a scene, an animated explainer), load and apply these skills before writing code:

1. `remotion-best-practices` (and the Remotion skills it routes to) — the rules of the target medium.
2. Design direction: `paint`, `design-dna`, `ui-ux-pro-max`, `design-audit`.
3. Motion: `motion-design`, `motion-principles`, `cast`.
4. Animation technique, whichever the video needs:
   - `gsap`, `gsap-core`, `gsap-timeline`, `gsap-utils`, `gsap-plugins`, `gsap-performance`, `gsap-react`
   - `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-animation`, `threejs-shaders`, `threejs-postprocessing`, `threejs-textures`, `threejs-loaders`, `threejs-r3f`
   - `canvas-generative`, `framer-motion`, `css-native`

Skip `swiftui-*`, `compose-*`, `mobile-principles` and `desktop-principles`; they target native apps, not video.

Remotion renders each frame independently, so every animation must be a pure function of `useCurrentFrame()`:

- GSAP: build the timeline with `paused: true` and call `timeline.seek(frame / fps)` each frame. Never let GSAP run on its own ticker.
- Three.js: render through `@remotion/three` (`<ThreeCanvas>`) and derive all motion from the frame, not from `useFrame` or a clock.
- Framer Motion, CSS transitions/keyframes: don't use them in compositions; reproduce the easing/timing ideas with `interpolate()` / `Easing` / `spring()`.
- Canvas/generative: seed randomness (`random()` from `remotion`), never `Math.random()`.

## Skills setup

Skill files are gitignored. If the skills above are missing, restore them:

```bash
npx skills experimental_install              # repo root: GSAP, Three.js, design, motion skills
cd remotion-video && npx remotion skills add # Remotion skills
```
