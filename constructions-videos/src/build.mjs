#!/usr/bin/env node
// Maths by Zosiama · Constructions explainers — build (uses ../../video-kit).
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
    title: `Constructions Set ${p.set} Q${p.num}: ${p.title} · Maths by Zosiama`,
    description: `Set ${p.set}, question ${p.num}: ${plainQ(p)} Answer: ${plainM(p.answer.card.join(', '))}.`,
  };
}

function script() {
  writeScript(ROOT, PROBLEMS.map((p) => ({ id: p.id, slug: p.slug, title: p.title, beats: buildBeats(p), meta: meta(p), fileDescription: plainQ(p) })));
}

function html() {
  buildPages(ROOT, {
    fonts: ['fredoka', 'symbols'],
    engine: [path.join(SRC, 'engine.js')],
    videos: PROBLEMS.filter((p) => pick(p.id)).map((p) => ({ id: p.id, slug: p.slug, P: p, pageTitle: `Constructions Set ${p.set} Q${p.num}: ${p.title}`, meta: meta(p) })),
  });
}

function lint() {
  for (const p of PROBLEMS.filter((q) => pick(q.id))) {
    console.log(`\n== ${p.id} · Set ${p.set} Q${p.num} · ${p.title}`);
    for (const b of buildBeats(p)) {
      for (const l of b.lines) {
        const warn = l.cap.length > 92 ? `  ⚠ caption ${l.cap.length} chars` : '';
        console.log(`${b.type.padEnd(8)} ${String(l.min || '').padEnd(5)} ${l.say}${warn}`);
      }
    }
  }
}

const SHOWS = {
  hook: 'The triangle itself on a drawing sheet: a copy growing or shrinking by the scale factor with a compass swinging, or the top corner sliding along its path with its angle changing; big question, “Pause & try it first!” sticker, progress bar',
  question: 'Maths by Zosiama badge, full question card; key facts highlighted as they are read',
  scene: 'The drawing sheet to scale (1 cm grid, scale chip): the first triangle constructed with ruler and compass, or the base with the top corner searching for its place',
  given: '“What we know” card with units; the matching part of the drawing glows',
  know: '“Know first!”: the ideas behind the construction with an idea picture (equal parts, parallel lines copying steps, same angles = same shape; or the arc of equal angles, the tangent rule, the line or circle for the height or median) and the magic rule',
  solve: 'Construction board, one step per line; the compass, ruler and set square draw each step on the sheet',
  answer: 'Big answer card; ruler or protractor checks on the drawing that the numbers agree',
  outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
};

function docs() {
  let md = '# Storyboard — Constructions explainers (Maths by Zosiama)\n\n'
    + 'Vertical 1080×1920, 60 fps, flat-vector style, one video per question. Timings come from the offline narration: every line is spoken first, then the beats are laid out around it (a line that draws on the sheet keeps the floor until its drawing is done).\n\n'
    + 'Palette: Midnight Navy `#1F2544` · Cream `#FFF8EC` · Sea Teal `#17B3A3` (the first triangle, the base) · Coral `#FF6F59` (the new triangle, the answer) · Plum `#7B5EA7` (helper rays, equal steps, the arc) · Sunflower `#FFC23D` (angles, highlights, tools).\n\n';
  for (const p of PROBLEMS) {
    if (!fs.existsSync(path.join(ROOT, 'build', p.id, 'timeline.json'))) continue;
    const tl = timeline(ROOT, p.id);
    md += `## Set ${p.set} · Q${p.num} · ${p.title} — ${fmt(tl.duration)}\n\n> ${plainQ(p)}\n\n`;
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

// fit: the largest scale that keeps each drawing inside the sheet (px per cm)
if (cmd === 'fit') {
  globalThis.window = globalThis;
  require('../../video-kit/core.js'); require('./engine.js');
  const { bboxOf, CONTENT } = globalThis.VideoEngine;
  for (const p of PROBLEMS) {
    const beats = buildBeats(p);
    const ops = (types) => beats.filter((b) => types.includes(b.type)).flatMap((b) => b.lines.flatMap((l) => (l.draw || []).filter((o) => b.type !== 'answer' || o.k === 'fill')));
    const fit = (bb) => Math.min(CONTENT.w / (bb[2] - bb[0]), CONTENT.h / (bb[3] - bb[1]));
    const bm = bboxOf(ops(['scene', 'given', 'solve', 'answer'])), bk = bboxOf(ops(['know']));
    console.log(`${p.id}  main ${(bm[2] - bm[0]).toFixed(2)}×${(bm[3] - bm[1]).toFixed(2)} cm → max ${fit(bm).toFixed(1)} px/cm (using ${p.view.s})   know max ${fit(bk).toFixed(1)} (using ${(p.knowView || p.view).s})`);
  }
}
