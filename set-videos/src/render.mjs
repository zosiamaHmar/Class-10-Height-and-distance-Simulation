#!/usr/bin/env node
// Maths by Zosiama · Sets explainers — master MP4 renderer.
//
// Loads each video's own HTML page in headless Chromium (?render), calls draw(t) for
// every frame t = i/60, grabs the exact pixels as lossless PNG and pipes them, in order,
// to ffmpeg together with the offline audio mix:  H.264 High, yuv420p, 60 fps,
// AAC 48 kHz, +faststart, "Maths by Zosiama" in the file metadata.
//
//   node render.mjs [ids…]                      render MP4s  → ../<slug>/<slug>.mp4
//   node render.mjs --stills 0,5.5,40 q01       PNG stills   → ../build/<id>/still-<t>.png
//   node render.mjs --thumbs [ids…]             poster.png (frame 0) per video
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const SRC = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SRC, '..');
const BUILD = path.join(ROOT, 'build');
const { PROBLEMS } = require('./problems.js');
const W = 1080, H = 1920, FPS = 60;

const args = process.argv.slice(2);
let stills = null, thumbs = false;
if (args[0] === '--stills') { stills = args[1].split(',').map(Number); args.splice(0, 2); }
if (args[0] === '--thumbs') { thumbs = true; args.shift(); }
const ids = args;
const todo = PROBLEMS.filter((p) => !ids.length || ids.includes(p.id));

let sink = null; // current frame consumer: (index, pngBuffer) => Promise
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/frame')) {
    const i = +new URL(req.url, 'http://x').searchParams.get('i');
    const parts = [];
    req.on('data', (c) => parts.push(c));
    req.on('end', async () => {
      try { await sink(i, Buffer.concat(parts)); res.end('ok'); } catch (e) { res.statusCode = 500; res.end(String(e)); }
    });
    return;
  }
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

const browser = await chromium.launch({ args: ['--disable-gpu', '--force-color-profile=srgb', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });

async function openPage(p) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') console.error(`[page] ${m.text()}`); });
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  await page.goto(`http://127.0.0.1:${PORT}/${p.slug}/index.html?render`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}

async function png(page, t, file) {
  const data = await page.evaluate((tt) => { window.__frame(tt); return document.getElementById('c').toDataURL('image/png'); }, t);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
}

async function renderMp4(p) {
  const tl = JSON.parse(fs.readFileSync(path.join(BUILD, p.id, 'timeline.json'), 'utf8'));
  const N = Math.round(tl.duration * FPS);
  const out = path.join(ROOT, p.slug, `${p.slug}.mp4`);
  const title = `Sets Q${p.num}: ${p.title} · Maths by Zosiama`;
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error', '-stats_period', '5',
    '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(FPS), '-i', 'pipe:0',
    '-i', path.join(BUILD, p.id, 'mix.wav'),
    '-map', '0:v', '-map', '1:a',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '18', '-tune', 'animation',
    '-g', '120', '-bf', '2', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-t', String(N / FPS),
    '-movflags', '+faststart',
    '-metadata', `title=${title}`,
    '-metadata', 'artist=Maths by Zosiama',
    '-metadata', 'album_artist=Maths by Zosiama',
    '-metadata', 'author=Maths by Zosiama',
    '-metadata', 'composer=Maths by Zosiama',
    '-metadata', 'copyright=© Maths by Zosiama',
    '-metadata', 'comment=Created by Maths by Zosiama. Follow Maths by Zosiama for more easy maths!',
    '-metadata', `description=${p.question.replace(/[⟦⟧]/g, '')}`,
    '-metadata', 'genre=Education',
    out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  // frames arrive a few at a time and possibly out of order: write them strictly in order
  const pending = new Map();
  let next = 0, flushing = Promise.resolve();
  const write = (buf) => new Promise((res) => { if (ff.stdin.write(buf)) res(); else ff.stdin.once('drain', res); });
  sink = (i, buf) => {
    pending.set(i, buf);
    flushing = flushing.then(async () => {
      while (pending.has(next)) { const b = pending.get(next); pending.delete(next); next++; await write(b); }
    });
    return flushing;
  };
  const page = await openPage(p);
  const t0 = Date.now();
  const CHUNK = 600;
  for (let a = 0; a < N; a += CHUNK) {
    const b = Math.min(N, a + CHUNK);
    await page.evaluate(async ({ a, b, fps }) => {
      const c = document.getElementById('c');
      const inflight = new Set();
      for (let i = a; i < b; i++) {
        window.__frame(i / fps);
        const blob = new Promise((r) => c.toBlob(r, 'image/png')); // bitmap is copied now, encoded async
        const job = blob.then((bl) => fetch(`/frame?i=${i}`, { method: 'POST', body: bl })).then(async (r) => { if (!r.ok) throw new Error(await r.text()); });
        inflight.add(job); job.finally(() => inflight.delete(job));
        if (inflight.size >= 6) await Promise.race(inflight);
      }
      await Promise.all(inflight);
    }, { a, b, fps: FPS });
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`\r${p.id}: ${b}/${N} frames · ${(b / el).toFixed(1)} fps · ${el.toFixed(0)} s`);
  }
  await page.close();
  await sink(-1, null).catch(() => {});
  if (next !== N) throw new Error(`only ${next}/${N} frames reached ffmpeg`);
  ff.stdin.end();
  await done;
  const mb = fs.statSync(out).size / 1e6;
  console.log(`\n${p.id}: ${path.relative(ROOT, out)} (${mb.toFixed(1)} MB, ${N} frames)`);
}

try {
  for (const p of todo) {
    if (stills) {
      const page = await openPage(p);
      for (const t of stills) await png(page, t, path.join(BUILD, p.id, `still-${t}.png`));
      await page.close();
      console.log(`${p.id}: ${stills.length} stills`);
    } else if (thumbs) {
      const page = await openPage(p);
      await png(page, 0.5, path.join(ROOT, p.slug, 'poster.png'));
      await page.close();
      console.log(`${p.id}: poster.png`);
    } else {
      await renderMp4(p);
    }
  }
} finally {
  await browser.close();
  server.close();
}
