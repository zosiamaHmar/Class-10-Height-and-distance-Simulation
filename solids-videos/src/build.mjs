#!/usr/bin/env node
// Maths by Zosiama · Surface Areas & Volumes explainers — build (uses ../../video-kit).
//
//   node build.mjs script        storyboard (beats + lines) → build/script.json + manifest.json
//   node build.mjs audio [ids]   offline TTS + music + SFX → build/<id>/{timeline.json,mix.wav,mix.mp3}
//   node build.mjs html  [ids]   one self-contained HTML page per video → ../<slug>/index.html
//   node build.mjs docs          STORYBOARD.md from the timelines
//   node build.mjs all   [ids]   everything above
//
// MP4 masters: node ../../video-kit/render.mjs .. [ids]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeScript, runAudio, buildPages, timeline, fmt } from '../../video-kit/kit.mjs';

const require = createRequire(import.meta.url);
const SRC = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SRC, '..');
const { PROBLEMS: SIMS, buildBeats } = require('./solids.js');

const [cmd = 'all', ...ids] = process.argv.slice(2);
const pick = (id) => !ids.length || ids.includes(id);
const plainQ = (p) => p.question.replace(/[⟦⟧]/g, '');
const plainM = (s) => s.replace(/\(\(([^/]+)\/([^)]+)\)\)/g, '$1/$2').replace(/[{}]/g, '').replace(/\[x\]/g, 'x');

function meta(p) {
  return {
    title: `Surface Areas & Volumes Q${p.num}: ${p.title} · Maths by Zosiama`,
    description: `Question ${p.num}: ${plainQ(p)} Answer: ${plainM(p.answer.card.join(', '))}.`,
  };
}

function script() {
  writeScript(ROOT, SIMS.map((p) => ({ id: p.id, slug: p.slug, title: p.title, beats: buildBeats(p), meta: meta(p), fileDescription: plainQ(p) })));
}

function html() {
  buildPages(ROOT, {
    fonts: ['fredoka', 'symbols'],
    engine: [path.join(SRC, 'engine.js')],
    videos: SIMS.filter((p) => pick(p.id)).map((p) => ({ id: p.id, slug: p.slug, P: p, pageTitle: `Solids Q${p.num}: ${p.title}`, meta: meta(p) })),
  });
}

const SHOWS = {
  hook: 'The object itself (toy, capsule, ice-cream, shed, wooden block…) drawn in 3D, big question, “Pause & try it first!” sticker, progress bar',
  question: 'Maths by Zosiama badge, full question card; key facts highlighted as they are read',
  scene: 'The solid drawn to scale in 3D: parts pulled apart and joined, cavities cut out, sizes labelled',
  given: '“What we know” card with units; the matching part glows',
  know: '“Know first!”: every formula needed and the magic rule; hidden joining faces shown',
  solve: 'Solution board, one line per step with real fractions; the part used glows',
  answer: 'Big answer card and a quick check that the numbers agree',
  outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
};

function docs() {
  let md = '# Storyboard — Surface Areas & Volumes explainers (Maths by Zosiama)\n\n'
    + 'Vertical 1080×1920, 60 fps, flat-vector style, one video per question. Timings come from the offline narration: every line is spoken first, then the beats are laid out around it.\n\n'
    + 'Palette: Midnight Navy `#1F2544` · Cream `#FFF8EC` · Coral `#FF6F59` (radius r) · Sea Teal `#17B3A3` (height h) · Sunflower `#FFC23D` (highlights, answer) · Plum `#7B5EA7` (slant height l, the unknown); wood is a Sunflower–Coral tint.\n\n';
  for (const p of SIMS) {
    if (!fs.existsSync(path.join(ROOT, 'build', p.id, 'timeline.json'))) continue;
    const tl = timeline(ROOT, p.id);
    md += `## Q${p.num} · ${p.title} — ${fmt(tl.duration)}\n\n> ${plainQ(p)}\n\n`;
    md += '| # | Beat | Time | On screen | Narration |\n|---|---|---|---|---|\n';
    tl.beats.forEach((b, i) => {
      const said = b.lines.map((l) => l.cap.replace(/\|/g, '/')).join(' ');
      md += `| ${i + 1} | ${b.type} | ${fmt(b.start)}–${fmt(b.end)} | ${SHOWS[b.type]} | ${said} |\n`;
    });
    md += '\n';
  }
  fs.writeFileSync(path.join(ROOT, 'STORYBOARD.md'), md);
  console.log('docs: STORYBOARD.md');
}

if (cmd === 'script' || cmd === 'all') script();
if (cmd === 'audio' || cmd === 'all') runAudio(ROOT, ids);
if (cmd === 'html' || cmd === 'all') html();
if (cmd === 'docs' || cmd === 'all') docs();
