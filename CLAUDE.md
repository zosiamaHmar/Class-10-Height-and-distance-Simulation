# Project notes

Static HTML trigonometry simulations (`sim1`–`sim26`) plus a Remotion video project in `remotion-video/`.

## Making videos

Whenever the task is making or editing a video (a Remotion composition, a scene, an animated explainer), load and apply these skills before writing code:

1. `remotion-best-practices` (and the Remotion skills it routes to) — the rules of the target medium.
2. Design direction: `paint`, `design-dna`, `ui-ux-pro-max`, `design-audit`, `design`, `design-system`, `brand`, `ui-styling`, `banner-design`, `slides`.
3. Motion: `motion-design`, `motion-principles`, `cast`.
4. Animation technique, whichever the video needs:
   - `gsap`, `gsap-core`, `gsap-timeline`, `gsap-utils`, `gsap-plugins`, `gsap-performance`, `gsap-react`, `gsap-frameworks`, `gsap-scrolltrigger`
   - `threejs-fundamentals`, `threejs-geometry`, `threejs-materials`, `threejs-lighting`, `threejs-animation`, `threejs-shaders`, `threejs-postprocessing`, `threejs-textures`, `threejs-loaders`, `threejs-interaction`, `threejs-r3f`
   - `canvas-generative`, `framer-motion`, `css-native`
5. Platform and app motion: `swiftui-motion`, `swiftui-graphics`, `compose-motion`, `compose-graphics`, `compose-multiplatform`, `mobile-principles`, `desktop-principles`. Use their timing, spring and effect ideas, and follow them fully when a video shows a phone or desktop app UI.

Remotion renders each frame independently, so every animation must be a pure function of `useCurrentFrame()`:

- GSAP: build the timeline with `paused: true` and call `timeline.seek(frame / fps)` each frame. Never let GSAP run on its own ticker.
- Three.js: render through `@remotion/three` (`<ThreeCanvas>`) and derive all motion from the frame, not from `useFrame` or a clock.
- Framer Motion, CSS transitions/keyframes: don't use them in compositions; reproduce the easing/timing ideas with `interpolate()` / `Easing` / `spring()`.
- SwiftUI, Jetpack Compose, Metal/AGSL shaders: they can't run in a web render; recreate the look in React, CSS, SVG, canvas or WebGL.
- Canvas/generative: seed randomness (`random()` from `remotion`), never `Math.random()`.

## Skills setup

Skill files are gitignored. If the skills above are missing, restore them:

```bash
npx skills experimental_install              # repo root: GSAP, Three.js, design, motion skills
cd remotion-video && npx remotion skills add # Remotion skills
```
