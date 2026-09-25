#!/usr/bin/env python3
"""Maths by Zosiama · Sets explainers — offline audio builder.

Reads the storyboard (beats + lines) exported by build.mjs, then for each video:
  1. speaks every line with Kokoro (offline neural TTS, no network),
  2. lays the lines out on a timeline (this is where every timing comes from),
  3. synthesises a soft music bed and small sound effects with numpy,
  4. mixes voice + ducked music + SFX, normalises to -14 LUFS,
  5. writes timeline.json, mix.wav (48 kHz stereo) and mix.mp3 (for the HTML page).

Usage: python3 audio.py build/script.json build/
"""
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

SR = 48000
VOICE = os.environ.get('SETS_VOICE', 'af_heart')
SPEED = float(os.environ.get('SETS_SPEED', '0.97'))
MODEL_DIR = os.environ.get('KOKORO_DIR', '/opt/tts')
CACHE = os.environ.get('SETS_TTS_CACHE', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'build', 'tts-cache'))

# timing rules (seconds)
HOOK_LEAD = 0.18      # voice starts almost immediately: the hook must land in 3 s
BEAT_PRE = 0.45       # room for the swipe transition at a beat change
BEAT_POST = 0.30
LINE_GAP = 0.30
OUTRO_HOLD = 2.4      # end card stays up after the last word

_kokoro = None


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(MODEL_DIR, 'kokoro-v1.0.onnx'), os.path.join(MODEL_DIR, 'voices-v1.0.bin'))
    return _kokoro


def speakable(text):
    # a lone capital A is the set name, not the article ("uh"); spell it so it is read "ay"
    text = re.sub(r'\bA\b', 'Eigh', text)
    text = text.replace('Namaste', 'Nuh-mus-tay')
    return text


def tts(text):
    os.makedirs(CACHE, exist_ok=True)
    key = hashlib.sha1(f'{VOICE}|{SPEED}|{text}'.encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + '.wav')
    if not os.path.exists(path):
        samples, sr = kokoro().create(speakable(text), voice=VOICE, speed=SPEED, lang='en-us')
        y = resample_poly(np.asarray(samples, dtype=np.float64), SR, sr)
        sf.write(path, y.astype(np.float32), SR)
    y, _ = sf.read(path, dtype='float64')
    return trim(y)


def trim(y, db=-42.0, pad=0.03):
    env = np.abs(y)
    thr = np.max(env) * 10 ** (db / 20)
    idx = np.where(env > thr)[0]
    if len(idx) == 0:
        return y
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(y), idx[-1] + int(pad * SR * 3))
    y = y[a:b].copy()
    f = int(0.008 * SR)
    y[:f] *= np.linspace(0, 1, f)
    y[-f:] *= np.linspace(1, 0, f)
    return y


# ------------------------------------------------------------------------------
# timeline
# ------------------------------------------------------------------------------
def layout(video):
    t = 0.0
    clips = []
    for bi, beat in enumerate(video['beats']):
        beat['start'] = round(t, 3)
        t += HOOK_LEAD if bi == 0 else BEAT_PRE
        for li, line in enumerate(beat['lines']):
            y = tts(line['say'])
            line['start'] = round(t, 3)
            line['end'] = round(t + len(y) / SR, 3)
            clips.append((line['start'], y))
            t = line['end'] + LINE_GAP
            if line.get('answer') or line.get('rule'):
                t += 0.45          # let the big moments land
            if line.get('solve'):
                t += 0.25
        t = t - LINE_GAP + BEAT_POST
        if beat['type'] == 'outro':
            t += OUTRO_HOLD
        beat['end'] = round(t, 3)
    # one frame boundary at 60 fps
    video['duration'] = round(np.ceil(t * 60) / 60, 4)
    video['beats'][-1]['end'] = video['duration']
    return clips


# ------------------------------------------------------------------------------
# synthesis helpers
# ------------------------------------------------------------------------------
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env_adsr(n, a, d, s, r, sustain_len):
    """sample envelope: attack a, decay d to level s, hold, release r (seconds)."""
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    S = max(0, n - A - D - R)
    e = np.concatenate([
        np.linspace(0, 1, A, endpoint=False) if A else np.zeros(0),
        np.linspace(1, s, D, endpoint=False) if D else np.zeros(0),
        np.full(S, s),
        np.linspace(s, 0, R) if R else np.zeros(0),
    ])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def add(buf, start, sig):
    i = int(round(start * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    if buf.ndim == 2:
        if sig.ndim == 1:
            sig = np.stack([sig, sig], axis=1)
        buf[i:j] += sig[: j - i]
    else:
        buf[i:j] += sig[: j - i]


def pluck(f, dur=0.9, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t * 4.0)
         + 0.35 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 7.0)
         + 0.12 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 11.0))
    atk = int(0.004 * SR)
    y[:atk] *= np.linspace(0, 1, atk)
    return y


def pad_note(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros((n, 2))
    for k, det in enumerate((-0.18, 0.18)):
        ff = f * 2 ** (det / 12)
        s = np.sin(2 * np.pi * ff * t) + 0.18 * np.sin(2 * np.pi * 2 * ff * t)
        y[:, k] = s
    y *= env_adsr(n, 0.35, 0.3, 0.8, 0.6, dur)[:, None]
    return y


def music(duration, voice_mask, outro_start):
    """Gentle I–vi–IV–V loop in C major, 100 BPM. Deterministic."""
    bpm = 100.0
    beat = 60.0 / bpm
    bar = 4 * beat
    total = duration + 2.0
    out = np.zeros((int(total * SR), 2))
    chords = [  # root, triad (midi)
        (48, [60, 64, 67]),   # C
        (45, [57, 60, 64]),   # Am
        (41, [53, 57, 60]),   # F
        (43, [55, 59, 62]),   # G
    ]
    rng = np.random.default_rng(7)
    patterns = [[0, 1, 2, 1, 0, 2, 1, 2], [0, 2, 1, 2, 0, 1, 2, 1], [2, 1, 0, 1, 2, 0, 1, 0]]
    nbars = int(np.ceil(total / bar))
    for b in range(nbars):
        t0 = b * bar
        final = t0 >= outro_start + 1.0
        root, triad = chords[0] if final else chords[b % 4]
        # pad
        for n in triad:
            add(out, t0, 0.055 * pad_note(midi(n), bar + 0.5))
        # bass on beats 1 and 3
        for k in (0, 2):
            add(out, t0 + k * beat, 0.16 * pluck(midi(root), 1.1, bright=0.3))
        # arpeggio, one octave up, alternating pan
        pat = patterns[(b // 4) % len(patterns)]
        for i, idx in enumerate(pat):
            if final and i > 3:
                break
            f = midi(triad[idx] + 12)
            s = 0.075 * pluck(f, 0.8)
            pan = 0.35 if i % 2 else -0.35
            st = np.stack([s * (1 - pan), s * (1 + pan)], axis=1)
            add(out, t0 + i * beat / 2, st)
        # soft shaker on the off-beats
        for i in range(8):
            if i % 2 == 1:
                n = int(0.05 * SR)
                nz = rng.standard_normal(n)
                nz = np.diff(np.concatenate([[0], nz]))  # tilt to highs
                nz *= np.exp(-np.arange(n) / (0.012 * SR))
                add(out, t0 + i * beat / 2, 0.012 * nz)
    out = out[: len(voice_mask)]
    # final 1.2 s fade so the loop restarts cleanly
    f = int(1.2 * SR)
    out[-f:] *= np.linspace(1, 0.35, f)[:, None]
    # ducking under the voice
    gain = 0.95 - 0.62 * voice_mask
    return out * gain[:, None]


def sfx_bank():
    rng = np.random.default_rng(3)
    B = {}

    def t_(d):
        return np.arange(int(d * SR)) / SR

    # soft pop
    t = t_(0.12)
    f = 900 * np.exp(-t * 18) + 300
    B['pop'] = 0.55 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)

    # marker tick for each written line
    t = t_(0.09)
    nz = rng.standard_normal(len(t))
    nz = nz - np.convolve(nz, np.ones(6) / 6, mode='same')
    B['write'] = 0.22 * nz * np.exp(-t * 55) + 0.2 * np.sin(2 * np.pi * 1400 * t) * np.exp(-t * 70)

    # whoosh: noise with a moving one-pole low-pass
    t = t_(0.55)
    nz = rng.standard_normal(len(t))
    cut = 300 + 5200 * np.sin(np.pi * t / t[-1]) ** 2
    y = np.zeros_like(nz)
    acc = 0.0
    for i in range(len(nz)):
        a = 1 - np.exp(-2 * np.pi * cut[i] / SR)
        acc += a * (nz[i] - acc)
        y[i] = acc
    B['whoosh'] = 0.5 * y * np.sin(np.pi * t / t[-1]) ** 1.5

    # bell ding
    t = t_(1.6)
    f0 = midi(84)
    y = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * d) for r, a, d in ((1, 1, 3.0), (2.0, 0.45, 4.5), (2.76, 0.3, 6), (5.4, 0.12, 9)))
    B['ding'] = 0.32 * y

    # sparkle: fast rising arpeggio
    y = np.zeros(int(1.2 * SR))
    for i, n in enumerate((84, 88, 91, 96, 100, 103)):
        s = np.sin(2 * np.pi * midi(n) * t_(0.5)) * np.exp(-t_(0.5) * 9)
        add(y, i * 0.06, 0.16 * s)
    B['sparkle'] = y

    # uh-oh: two falling tones
    y = np.zeros(int(0.6 * SR))
    for i, n in enumerate((79, 75)):
        tt = t_(0.24)
        s = (np.sin(2 * np.pi * midi(n) * tt) + 0.3 * np.sin(2 * np.pi * 3 * midi(n) * tt)) * env_adsr(len(tt), 0.01, 0.05, 0.7, 0.08, 0.24)
        add(y, i * 0.2, 0.22 * s)
    B['uhoh'] = y

    # hook hit: low boom + airy burst
    t = t_(0.7)
    f = 110 * np.exp(-t * 7) + 38
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    air = rng.standard_normal(len(t)) * np.exp(-t * 14) * 0.25
    B['hit'] = 0.6 * boom + 0.25 * air

    # ta-da: bright major chord + bell
    y = np.zeros(int(2.0 * SR))
    for i, n in enumerate((72, 76, 79, 84)):
        add(y, i * 0.07, 0.12 * pluck(midi(n), 1.6, bright=1.4))
    add(y, 0.3, 0.6 * B['ding'])
    B['tada'] = y
    return B


def soft_limit(x, ceiling=0.89):
    over = np.abs(x) > ceiling * 0.8
    if not over.any():
        return x
    k = ceiling * 0.8
    y = x.copy()
    s = np.sign(x[over])
    a = np.abs(x[over]) - k
    y[over] = s * (k + (ceiling - k) * np.tanh(a / (ceiling - k)))
    return y


def build(video, outdir):
    os.makedirs(outdir, exist_ok=True)
    clips = layout(video)
    dur = video['duration']
    n = int(round(dur * SR))
    voice = np.zeros(n)
    mask = np.zeros(n)
    for start, y in clips:
        add(voice, start, y)
        i, j = int(start * SR), min(n, int(start * SR) + len(y))
        mask[i:j] = 1
    # smooth the ducking mask (≈150 ms ramps)
    k = int(0.15 * SR)
    ker = np.ones(k) / k
    mask = np.clip(np.convolve(mask, ker, mode='same') * 1.2, 0, 1)
    peak = np.max(np.abs(voice)) or 1
    voice *= 0.7 / peak

    outro = next(b for b in video['beats'] if b['type'] == 'outro')['start']
    mus = music(dur, mask, outro)

    bank = sfx_bank()
    fx = np.zeros(n)
    sfx_list = []
    for b in video['beats']:
        for line in b['lines']:
            name = line.get('sfx')
            if name:
                at = max(0.0, line['start'] - (0.25 if name == 'whoosh' else 0.02))
                if b['type'] == 'hook' and name == 'hit':
                    at = 0.0
                add(fx, at, bank[name])
                sfx_list.append({'t': round(at, 3), 'name': name})
        if b['type'] in ('given', 'know', 'solve', 'answer') and b['lines']:
            add(fx, max(0, b['start'] + 0.05), 0.55 * bank['whoosh'])
            sfx_list.append({'t': round(b['start'] + 0.05, 3), 'name': 'whoosh'})
    # the answer card and the dots filling in get a sparkle when the dots land
    video['sfx'] = sorted(sfx_list, key=lambda s: s['t'])

    mix = mus + np.stack([voice, voice], axis=1) + 0.5 * np.stack([fx, fx], axis=1)
    meter = pyln.Meter(SR)
    loud = meter.integrated_loudness(mix)
    mix *= 10 ** ((-14.0 - loud) / 20)
    mix = soft_limit(mix)
    f = int(0.01 * SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]

    wav = os.path.join(outdir, 'mix.wav')
    sf.write(wav, mix.astype(np.float32), SR, subtype='PCM_16')
    mp3 = os.path.join(outdir, 'mix.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '96k', '-ar', '48000', mp3], check=True)
    with open(os.path.join(outdir, 'timeline.json'), 'w') as fh:
        json.dump(video, fh, ensure_ascii=False, indent=1)
    print(f"{video['id']}: {dur:6.2f}s  loudness {loud:.1f} → -14 LUFS  ({len(clips)} voice lines)")


def main():
    script_path, outroot = sys.argv[1], sys.argv[2]
    only = set(sys.argv[3:])
    data = json.load(open(script_path))
    for video in data['videos']:
        if only and video['id'] not in only:
            continue
        build(video, os.path.join(outroot, video['id']))


if __name__ == '__main__':
    main()
