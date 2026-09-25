// Maths by Zosiama · video kit — shared build steps for every video project.
//
// A project (set-videos/, sim-videos/, …) keeps only its problem data, its topic engine
// and a small build.mjs that calls these helpers:
//
//   writeScript(project, videos)   storyboard → <project>/build/script.json + manifest.json
//   runAudio(project, ids)         offline voice + music + SFX → <project>/build/<id>/…
//   buildPages(project, opts)      one self-contained HTML page per video → <project>/<slug>/index.html
//
// MP4 masters: node video-kit/render.mjs <project> [ids…]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const KIT = path.dirname(fileURLToPath(import.meta.url));
export const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const b64 = (p) => fs.readFileSync(p).toString('base64');
const safeJs = (s) => s.replace(/<\/script/gi, '<\\/script');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export const FONTS = {
  fredoka: [['Fredoka', 600, 'fredoka-600.woff2'], ['Fredoka', 700, 'fredoka-700.woff2']],
  symbols: [['SetSym', 600, 'setsym.woff2'], ['SetSym', 700, 'setsym.woff2']],
  devanagari: [['Deva', 700, 'deva.woff2']],
};
export const FONT_CREDITS = {
  fredoka: 'Fredoka (SIL OFL 1.1)',
  symbols: 'a DejaVu Sans subset for maths symbols (Bitstream Vera licence)',
  devanagari: 'Noto Sans Devanagari (SIL OFL 1.1)',
};

/**
 * videos: [{ id, slug, title, beats, meta: { title, description }, fileDescription? }]
 * Writes the storyboard for audio.py and the manifest render.mjs reads (MP4 title and
 * description metadata; fileDescription overrides the page description there).
 */
export function writeScript(project, videos) {
  const build = path.join(project, 'build');
  fs.mkdirSync(build, { recursive: true });
  fs.writeFileSync(path.join(build, 'script.json'), JSON.stringify({ videos: videos.map(({ id, slug, title, beats }) => ({ id, slug, title, beats })) }, null, 1));
  fs.writeFileSync(path.join(build, 'manifest.json'), JSON.stringify(videos.map(({ id, slug, meta, fileDescription }) => ({ id, slug, title: meta.title, description: fileDescription || meta.description })), null, 1));
  console.log(`storyboard: ${videos.length} video(s) → ${path.relative(process.cwd(), path.join(build, 'script.json'))}`);
}

export function runAudio(project, ids = []) {
  const build = path.join(project, 'build');
  const r = spawnSync('python3', [path.join(KIT, 'audio.py'), path.join(build, 'script.json'), build, ...ids], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}

export const timeline = (project, id) => JSON.parse(fs.readFileSync(path.join(project, 'build', id, 'timeline.json'), 'utf8'));

/**
 * opts.videos   [{ id, slug, P, pageTitle, meta }]  (meta → META in the page: title, author, comment, description)
 * opts.engine   engine source files, loaded after core.js
 * opts.fonts    keys of FONTS to embed, e.g. ['fredoka', 'symbols']
 */
export function buildPages(project, opts) {
  const tpl = fs.readFileSync(path.join(KIT, 'template.html'), 'utf8');
  const fontsCss = opts.fonts.flatMap((k) => FONTS[k]).map(([fam, w, f]) =>
    `@font-face{font-family:"${fam}";font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${b64(path.join(KIT, 'fonts', f))}) format("woff2");}`).join('\n');
  const credits = opts.fonts.map((k) => FONT_CREDITS[k]);
  const fontCredits = credits.length > 1 ? `${credits.slice(0, -1).join(', ')} and ${credits[credits.length - 1]}` : credits[0];
  const mb = fs.readFileSync(path.join(KIT, 'vendor', 'mediabunny.min.js'), 'utf8');
  const engine = [path.join(KIT, 'core.js'), ...opts.engine].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const player = fs.readFileSync(path.join(KIT, 'player.js'), 'utf8');
  for (const v of opts.videos) {
    const tl = timeline(project, v.id);
    const meta = Object.assign({ author: 'Maths by Zosiama', comment: 'Created by Maths by Zosiama. Follow Maths by Zosiama for more easy maths!', duration: tl.duration }, v.meta);
    const data = { P: v.P, TL: tl, META: meta, AUDIO: b64(path.join(project, 'build', v.id, 'mix.mp3')) };
    const out = tpl
      .replace(/{{TITLE}}/g, esc(v.pageTitle))
      .replace(/{{DESCRIPTION}}/g, esc(meta.description))
      .replace('{{FONT_CREDITS}}', () => esc(fontCredits))
      .replace('{{FONTS_CSS}}', () => fontsCss)
      .replace('{{MEDIABUNNY}}', () => safeJs(mb))
      .replace('{{DATA}}', () => safeJs(JSON.stringify(data)))
      .replace('{{ENGINE}}', () => safeJs(engine))
      .replace('{{PLAYER}}', () => safeJs(player));
    const outDir = path.join(project, v.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), out);
    console.log(`${v.id}: ${v.slug}/index.html (${(out.length / 1024).toFixed(0)} KB, ${fmt(tl.duration)})`);
  }
}
