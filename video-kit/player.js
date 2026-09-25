/* Maths by Zosiama · video kit — page player, captions toggle and exports.
 *  ▶ Play/Pause · seek · CC (burned-in captions on/off)
 *  ● Record  → real-time MediaRecorder capture of canvas + audio → .webm (tagged with metadata)
 *  ⇩ MP4     → offline, frame-by-frame WebCodecs render (H.264 + AAC, falling back to VP9 + Opus)
 */
(async function () {
  'use strict';
  const { P, TL, AUDIO, META } = window.VIDEO_DATA;
  const { createVideo, W, H, FPS } = window.VideoEngine;
  const video = createVideo(P, TL);
  const D = video.duration;
  const canvas = document.getElementById('c');
  const Q = new URLSearchParams(location.search);
  const RENDER = Q.has('render');
  const LIMIT = Math.min(D, +Q.get('limit') || D); // ?limit=3 exports/records only the first 3 s (testing)
  const ctx = canvas.getContext('2d', RENDER ? { willReadFrequently: true } : {});
  const opts = { cc: true };

  await Promise.all([
    document.fonts.load('600 40px Fredoka'), document.fonts.load('700 40px Fredoka'),
    document.fonts.load('700 40px SetSym', '∪∩✓→×−'), document.fonts.load('700 40px Deva', 'नमस्ते'),
  ]).catch(() => {});

  // headless renderer hook (used by render.mjs to make the master MP4)
  window.__frame = (t, cc = true) => { opts.cc = cc; video.draw(ctx, t, opts); };
  window.__duration = D;
  window.__ready = true;
  video.draw(ctx, 0, opts);
  if (RENDER) { document.body.classList.add('render'); return; }

  // ---------------------------------------------------------------- audio
  // decoded in the background; every button waits for it, so an early click is never lost
  let abuf = null;
  const audioReady = (async () => {
    const bytes = Uint8Array.from(atob(AUDIO), (c) => c.charCodeAt(0));
    const decodeCtx = new OfflineAudioContext(2, Math.ceil(48000 * (D + 1)), 48000);
    abuf = await decodeCtx.decodeAudioData(bytes.buffer.slice(0));
    return abuf;
  })();
  let actx = null, gain = null, src = null, playing = false, startAt = 0, offset = 0, rec = null, busy = false;
  function ensureCtx() {
    if (!actx) { actx = new AudioContext({ latencyHint: 'playback' }); gain = actx.createGain(); gain.connect(actx.destination); }
    return actx;
  }
  const now = () => (playing ? actx.currentTime - startAt : offset);
  function stopSrc() { if (src) { src.onended = null; try { src.stop(); } catch (e) { /* already stopped */ } src.disconnect(); src = null; } }
  async function play(from) {
    ensureCtx(); await actx.resume();
    await audioReady;
    stopSrc();
    if (from !== undefined) offset = from;
    if (offset >= D - 0.02) offset = 0;
    src = actx.createBufferSource(); src.buffer = abuf; src.connect(gain);
    src.start(0, offset); startAt = actx.currentTime - offset; playing = true;
    ui();
  }
  function pause() { if (!playing) return; offset = now(); stopSrc(); playing = false; ui(); }
  function seek(t) { const was = playing; if (was) { stopSrc(); playing = false; } offset = Math.max(0, Math.min(D, t)); if (was) play(); else ui(); }

  // ---------------------------------------------------------------- UI
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const status = (s) => { $('status').textContent = s; };
  $('dur').textContent = fmt(D);
  $('seek').max = String(D);
  function ui() {
    $('play').textContent = playing ? '❚❚' : '▶';
    $('play').setAttribute('aria-label', playing ? 'Pause' : 'Play');
    $('big').hidden = playing || busy;
    $('cc').setAttribute('aria-pressed', String(opts.cc));
    for (const id of ['rec', 'mp4', 'play', 'seek']) $(id).disabled = busy && !(id === 'rec' && rec);
  }
  $('play').onclick = () => (playing ? pause() : play());
  $('big').onclick = () => play();
  canvas.onclick = () => { if (!busy) (playing ? pause() : play()); };
  $('seek').oninput = (e) => seek(+e.target.value);
  $('cc').onclick = () => { opts.cc = !opts.cc; ui(); };
  document.addEventListener('keydown', (e) => {
    if (busy || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    if (e.key === 'c') { opts.cc = !opts.cc; ui(); }
    if (e.key === 'ArrowRight') seek(now() + 5);
    if (e.key === 'ArrowLeft') seek(now() - 5);
  });

  function loop() {
    let t = now();
    if (rec && t >= LIMIT) { finishRecord(); t = LIMIT; }
    else if (playing && t >= D) { play(0); t = 0; } // the outro loops back to the hook
    if (!busy || rec) video.draw(ctx, Math.min(t, D), opts);
    if (!busy) { $('seek').value = String(t); $('now').textContent = fmt(t); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  ui();

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  }
  const tags = () => ({ title: META.title, artist: META.author, albumArtist: META.author, comment: META.comment, description: META.description, date: new Date() });

  // ---------------------------------------------------------------- ● Record (.webm, real time)
  $('rec').onclick = async () => {
    if (rec) { finishRecord(true); return; }
    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) { status('Recording needs MediaRecorder + canvas.captureStream (Chrome, Edge or Firefox).'); return; }
    ensureCtx(); await actx.resume();
    await audioReady;
    const stream = canvas.captureStream(FPS);
    const dest = actx.createMediaStreamDestination();
    gain.connect(dest);
    stream.addTrack(dest.stream.getAudioTracks()[0]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const mr = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12e6, audioBitsPerSecond: 192000 });
    const chunks = [];
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec = { mr, chunks, dest, stream };
    busy = true;
    $('rec').textContent = '■ Stop';
    status(`Recording in real time (${fmt(LIMIT)}). Keep this tab visible…`);
    mr.start(1000);
    await play(0);
  };
  function finishRecord(cancelled) {
    const r = rec; if (!r) return;
    rec = null; pause();
    r.mr.onstop = async () => {
      gain.disconnect(r.dest);
      r.stream.getTracks().forEach((tr) => tr.stop());
      busy = false; $('rec').textContent = '● Record .webm'; ui();
      if (cancelled) { status('Recording stopped.'); return; }
      status('Adding “Maths by Zosiama” metadata…');
      let blob = new Blob(r.chunks, { type: 'video/webm' });
      try {
        const input = new MB.Input({ source: new MB.BlobSource(blob), formats: [MB.WEBM] });
        const output = new MB.Output({ format: new MB.WebMOutputFormat(), target: new MB.BufferTarget() });
        const conv = await MB.Conversion.init({ input, output, tags: tags() });
        if (conv.isValid) { await conv.execute(); blob = new Blob([output.target.buffer], { type: 'video/webm' }); }
      } catch (e) { console.warn('metadata tagging skipped', e); }
      download(blob, `${P.slug}.webm`);
      status('Saved .webm ✓');
    };
    r.mr.stop();
  }

  // ---------------------------------------------------------------- ⇩ Export MP4 (offline, frame by frame)
  $('mp4').onclick = async () => {
    if (typeof VideoEncoder === 'undefined') { status('MP4 export needs WebCodecs (Chrome, Edge, Safari 17+ or Firefox 130+).'); return; }
    pause(); busy = true; ui();
    try {
      await audioReady;
      const vcodec = await MB.getFirstEncodableVideoCodec(['avc', 'vp9'], { width: W, height: H });
      const acodec = await MB.getFirstEncodableAudioCodec(['aac', 'opus'], { numberOfChannels: 2, sampleRate: 48000 });
      if (!vcodec) throw new Error('this browser cannot encode H.264 or VP9 video');
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const octx = off.getContext('2d');
      const output = new MB.Output({ format: new MB.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new MB.BufferTarget() });
      const vs = new MB.CanvasSource(off, { codec: vcodec, bitrate: 10e6, keyFrameInterval: 2 });
      output.addVideoTrack(vs, { frameRate: FPS });
      let as = null;
      if (acodec) { as = new MB.AudioBufferSource({ codec: acodec, bitrate: 192e3 }); output.addAudioTrack(as); }
      output.setMetadataTags(tags());
      await output.start();
      // audio and video are fed interleaved, one second of sound ahead of the frames
      const sr = abuf.sampleRate;
      const slice = (a, b) => {
        const i0 = Math.round(a * sr), i1 = Math.min(abuf.length, Math.round(b * sr));
        const ab = new AudioBuffer({ length: Math.max(1, i1 - i0), numberOfChannels: abuf.numberOfChannels, sampleRate: sr });
        for (let c = 0; c < abuf.numberOfChannels; c++) ab.copyToChannel(abuf.getChannelData(c).subarray(i0, i1), c);
        return ab;
      };
      const N = Math.round(LIMIT * FPS), t0 = performance.now();
      for (let i = 0; i < N; i++) {
        if (as && i % FPS === 0) await as.add(slice(i / FPS, Math.min(LIMIT, i / FPS + 1)));
        video.draw(octx, i / FPS, opts);
        await vs.add(i / FPS, 1 / FPS);
        if (i % 30 === 0) {
          const el = (performance.now() - t0) / 1000, eta = el / (i + 1) * (N - i - 1);
          status(`Rendering MP4 (${vcodec.toUpperCase()} + ${(acodec || 'no audio').toUpperCase()}): frame ${i + 1}/${N} · ${Math.round((i + 1) / N * 100)}% · about ${fmt(eta)} left`);
          ctx.drawImage(off, 0, 0);
        }
      }
      if (as) as.close();
      vs.close();
      await output.finalize();
      download(new Blob([output.target.buffer], { type: 'video/mp4' }), `${P.slug}.mp4`);
      status(`Saved MP4 ✓ (${vcodec.toUpperCase()} + ${(acodec || 'no audio').toUpperCase()}, ${FPS} fps)`);
    } catch (e) {
      console.error(e); status(`MP4 export failed: ${e.message}`);
    } finally { busy = false; ui(); }
  };
})();
