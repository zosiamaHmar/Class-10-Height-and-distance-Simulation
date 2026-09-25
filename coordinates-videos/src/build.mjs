#!/usr/bin/env node
// Maths by Zosiama · Coordinate Geometry explainers — build (uses ../../video-kit).
//
//   node build.mjs script        storyboard (beats + lines) → build/script.json + manifest.json
//   node build.mjs audio [ids]   offline TTS + music + SFX → build/<id>/{timeline.json,mix.wav,mix.mp3}
//   node build.mjs html  [ids]   one self-contained HTML page per video → ../<slug>/index.html
//   node build.mjs docs          STORYBOARD.md from the timelines
//   node build.mjs lint          what the voice will say, and captions that are too long
//   node build.mjs all   [ids]   script → audio → html → docs
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
const { PROBLEMS, buildBeats } = require('./problems.js');

const [cmd = 'all', ...ids] = process.argv.slice(2);
const pick = (id) => !ids.length || ids.includes(id);
const plainQ = (p) => p.question.replace(/[⟦⟧]/g, '');
const plainM = (s) => s.replace(/\(\(([^/]+)\/([^)]+)\)\)/g, '$1/$2').replace(/[{}]/g, '');

function meta(p) {
  return {
    title: `Coordinate Geometry Q${p.num}: ${p.title} · Maths by Zosiama`,
    description: `Question ${p.num}: ${plainQ(p)} Answer: ${plainM(p.answer.card.join(', '))}.`,
  };
}

function script() {
  writeScript(ROOT, PROBLEMS.map((p) => ({ id: p.id, slug: p.slug, title: p.title, beats: buildBeats(p), meta: meta(p), fileDescription: plainQ(p) })));
}

function html() {
  buildPages(ROOT, {
    fonts: ['fredoka', 'symbols'],
    engine: [path.join(SRC, 'engine.js')],
    videos: PROBLEMS.filter((p) => pick(p.id)).map((p) => ({ id: p.id, slug: p.slug, P: p, pageTitle: `Coordinates Q${p.num}: ${p.title}`, meta: meta(p) })),
  });
}

function lint() {
  for (const p of PROBLEMS.filter((q) => pick(q.id))) {
    console.log(`\n== ${p.id} · Q${p.num} · ${p.title}`);
    for (const b of buildBeats(p)) {
      for (const l of b.lines) {
        const warn = l.cap.length > 92 ? `  ⚠ caption ${l.cap.length} chars` : '';
        console.log(`${b.type.padEnd(8)} ${String(l.min || '').padEnd(5)} ${l.say}${warn}`);
      }
    }
  }
}

const SHOWS = {
  hook: 'The question’s own points on a coordinate plane: the segment cut into coloured pieces, the line, the parallelogram or the triangle, with a bouncing “?” pin at the unknown; big question, “Pause & try it first!” sticker, progress bar',
  question: 'Maths by Zosiama badge, full question card; key facts highlighted as they are read',
  scene: 'The coordinate plane to scale (grid, numbered axes, scale chip): each point plotted with its dashed feet on the axes (so many right, so many up), joined, and the unknown shown as a “?” pin',
  given: '“What we know” card; the matching points glow',
  know: '“Know first!”: the formula (section, midpoint, centroid or distance) with an idea picture, and the magic rule',
  solve: 'Solution board, one step per line with real fractions; the answer point lands on the plane',
  answer: 'Big answer card and a quick check that the numbers agree (step arrows, or putting the point back into the equation)',
  outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
};

function docs() {
  let md = '# Storyboard — Coordinate Geometry explainers (Maths by Zosiama)\n\n'
    + 'Vertical 1080×1920, 60 fps, flat-vector style, one video per question. Timings come from the offline narration: every line is spoken first, then the beats are laid out around it (a line that draws on the plane keeps the floor until its drawing is done).\n\n'
    + 'Palette: Midnight Navy `#1F2544` · Cream `#FFF8EC` · Sea Teal `#17B3A3` (given points and segments) · Coral `#FF6F59` (the unknown point, the answer, the first share of a ratio) · Plum `#7B5EA7` (lines, diagonals, medians) · Sunflower `#FFC23D` (step arrows, highlights).\n\n';
  for (const p of PROBLEMS) {
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

if (cmd === 'lint') lint();
if (cmd === 'script' || cmd === 'all') script();
if (cmd === 'audio' || cmd === 'all') runAudio(ROOT, ids);
if (cmd === 'html' || cmd === 'all') html();
if (cmd === 'docs' || cmd === 'all') docs();

