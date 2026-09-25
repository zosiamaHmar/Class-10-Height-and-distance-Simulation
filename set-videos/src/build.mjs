#!/usr/bin/env node
// Maths by Zosiama · Sets explainers — build (uses ../../video-kit).
//
//   node build.mjs script        storyboard (beats + lines) → build/script.json + manifest.json
//   node build.mjs audio [ids]   offline TTS + music + SFX → build/<id>/{timeline.json,mix.wav,mix.mp3}
//   node build.mjs html  [ids]   one self-contained HTML page per video → ../<slug>/index.html
//   node build.mjs docs          STORYBOARD.md + gallery index.html from the timelines
//   node build.mjs all   [ids]   everything above
//
// The master MP4s are rendered afterwards with `node ../../video-kit/render.mjs .. [ids]`.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeScript, runAudio, buildPages, timeline, fmt } from '../../video-kit/kit.mjs';

const require = createRequire(import.meta.url);
const SRC = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SRC, '..');
const BUILD = path.join(ROOT, 'build');
const { PROBLEMS, buildBeats } = require('./problems.js');

const [cmd = 'all', ...ids] = process.argv.slice(2);
const pick = (id) => !ids.length || ids.includes(id);
const plainQ = (p) => p.question.replace(/[⟦⟧]/g, '');

function meta(p) {
  return {
    title: `Sets Q${p.num}: ${p.title} · Maths by Zosiama`,
    description: `Question ${p.num}: ${plainQ(p)} Answer: ${p.answer.card.join(', ').replace(/\{A\}/g, p.A.s).replace(/\{B\}/g, p.B.s).replace(/\[x\]/g, 'x')}.`,
  };
}

function script() {
  writeScript(ROOT, PROBLEMS.map((p) => ({ id: p.id, slug: p.slug, title: p.title, beats: buildBeats(p), meta: meta(p), fileDescription: plainQ(p) })));
}

function html() {
  buildPages(ROOT, {
    fonts: ['fredoka', 'symbols', 'devanagari'],
    engine: [path.join(SRC, 'engine.js')],
    videos: PROBLEMS.filter((p) => pick(p.id)).map((p) => ({ id: p.id, slug: p.slug, P: p, pageTitle: `Sets Q${p.num}: ${p.title}`, meta: meta(p) })),
  });
}

const SHOWS = {
  hook: 'Subject illustration drawn in code, big question, “Pause & try it first!” sticker, progress bar',
  question: 'Maths by Zosiama badge, full question card; key numbers highlighted as they are read',
  scene: 'Venn diagram draws itself: box U, coral and teal circles, overlap; legend card; scale chip',
  given: '“What we know” card with units; the unknown x marked on the diagram',
  know: '“Know first!”: n( ), ∪, ∩, double counting (2×), the magic rule; labelled regions',
  solve: 'Solution board, one line per step, written on; matching region highlighted',
  answer: 'Big answer card, dots fill every region to scale, quick check that the parts add up',
  outro: '“Follow Maths by Zosiama” end card with tapping follow button; dissolves back into the hook to loop',
};

function docs() {
  const rows = [];
  let md = '# Storyboard — Sets explainers (Maths by Zosiama)\n\n'
    + 'Vertical 1080×1920, 60 fps, flat-vector style. Timings come from the offline narration: every line is spoken first, then the beats are laid out around it.\n\n'
    + 'Palette: Midnight Navy `#1F2544` · Cream `#FFF8EC` · Coral `#FF6F59` (first set) · Sea Teal `#17B3A3` (second set) · Sunflower `#FFC23D` (both / answer) · Plum `#7B5EA7` (unknown, neither).\n\n';
  for (const p of PROBLEMS) {
    const f = path.join(BUILD, p.id, 'timeline.json');
    if (!fs.existsSync(f)) continue;
    const tl = timeline(ROOT, p.id);
    rows.push({ p, tl });
    md += `## Q${p.num} · ${p.title} — ${fmt(tl.duration)}\n\n> ${p.question.replace(/[⟦⟧]/g, '')}\n\n`;
    md += '| # | Beat | Time | On screen | Narration |\n|---|---|---|---|---|\n';
    tl.beats.forEach((b, i) => {
      const said = b.lines.map((l) => l.cap.replace(/\|/g, '/')).join(' ');
      md += `| ${i + 1} | ${b.type} | ${fmt(b.start)}–${fmt(b.end)} | ${SHOWS[b.type]} | ${said} |\n`;
    });
    md += '\n';
  }
  fs.writeFileSync(path.join(ROOT, 'STORYBOARD.md'), md);

  const cards = rows.map(({ p, tl }) => {
    const mp4 = `${p.slug}/${p.slug}.mp4`;
    const hasMp4 = fs.existsSync(path.join(ROOT, mp4));
    return `  <li class="card">
    <div class="num">Q${p.num}</div>
    <div class="body">
      <h2>${p.title}</h2>
      <p>${p.question.replace(/[⟦⟧]/g, '')}</p>
      <div class="links"><a href="${p.slug}/index.html">Open player</a>${hasMp4 ? ` <a href="${mp4}" download>MP4</a>` : ''} <span>${fmt(tl.duration)}</span></div>
    </div>
  </li>`;
  }).join('\n');
  const gallery = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sets Explainers · Maths by Zosiama</title>
<meta name="author" content="Maths by Zosiama">
<style>
:root { --ink:#1F2544; --paper:#FFF8EC; --coral:#FF6F59; --teal:#17B3A3; --sun:#FFC23D; --plum:#7B5EA7; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
header { background: var(--ink); color: var(--paper); padding: 28px 16px; text-align: center; }
header h1 { margin: 0 0 6px; font-size: clamp(22px, 5vw, 34px); }
header p { margin: 0; opacity: .8; }
ul { list-style: none; padding: 16px; margin: 0 auto; max-width: 860px; display: grid; gap: 12px; }
.card { display: flex; gap: 14px; background: #fff; border: 2px solid var(--ink); border-radius: 16px; padding: 14px; }
.num { flex: none; width: 52px; height: 52px; border-radius: 50%; background: var(--coral); color: var(--paper); display: grid; place-items: center; font-weight: 700; }
.card:nth-child(3n+2) .num { background: var(--teal); } .card:nth-child(3n) .num { background: var(--plum); }
h2 { margin: 2px 0 4px; font-size: 18px; } p { margin: 0 0 8px; font-size: 14px; line-height: 1.4; }
.links { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 14px; }
.links a { background: var(--sun); color: var(--ink); padding: 5px 12px; border-radius: 999px; text-decoration: none; font-weight: 600; }
.links span { opacity: .7; }
footer { text-align: center; padding: 20px 16px 32px; font-size: 13px; opacity: .75; }
</style>
</head>
<body>
<header><h1>Sets: n(A ∪ B) = n(A) + n(B) − n(A ∩ B)</h1><p>10 animated explainers for Shorts &amp; Reels · by Maths by Zosiama</p></header>
<ul>
${cards}
</ul>
<footer>Created by <strong>Maths by Zosiama</strong> · Follow for more easy maths · <a href="STORYBOARD.md">Storyboard</a></footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), gallery);
  console.log('docs: STORYBOARD.md + index.html');
}

if (cmd === 'script' || cmd === 'all') script();
if (cmd === 'audio' || cmd === 'all') runAudio(ROOT, ids);
if (cmd === 'html' || cmd === 'all') html();
if (cmd === 'docs' || cmd === 'all') docs();
