import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 24000;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MUSIC_DIR = join(ROOT, 'public', 'audio', 'music');
const SFX_DIR = join(ROOT, 'public', 'audio', 'sfx');

const musicTracks = [
  {
    file: 'lobby_loop.wav',
    duration: 64,
    bpm: 96,
    base: 196,
    scale: [0, 2, 4, 7, 9, 12],
    chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [4, 7, 12]],
    melody: [0, 2, 4, 2, 5, 4, 2, 0, 4, 5, 7, 5, 4, 2, 0, 2],
    padGain: 0.115,
    leadGain: 0.08,
    pulseGain: 0.024,
  },
  {
    file: 'room_loop.wav',
    duration: 48,
    bpm: 84,
    base: 174.61,
    scale: [0, 3, 5, 7, 10, 12],
    chords: [[0, 3, 7], [5, 8, 12], [7, 10, 14], [3, 7, 10]],
    melody: [0, 3, 5, 3, 7, 5, 3, 0, 5, 7, 10, 7, 5, 3, 0, 3],
    padGain: 0.105,
    leadGain: 0.065,
    pulseGain: 0.04,
  },
  {
    file: 'game_wolf_tension_loop.wav',
    duration: 48,
    bpm: 108,
    base: 130.81,
    scale: [0, 2, 3, 7, 10, 12],
    chords: [[0, 3, 7], [0, 5, 8], [2, 7, 10], [0, 3, 10]],
    melody: [0, 0, 3, 2, 0, 7, 3, 2, 0, 0, 10, 7, 3, 2, 0, 2],
    padGain: 0.13,
    leadGain: 0.055,
    pulseGain: 0.075,
  },
  {
    file: 'game_deer_stealth_loop.wav',
    duration: 48,
    bpm: 100,
    base: 220,
    scale: [0, 2, 3, 7, 9, 12],
    chords: [[0, 3, 7], [2, 5, 9], [3, 7, 10], [7, 9, 12]],
    melody: [0, 2, 3, 7, 3, 2, 0, 2, 7, 9, 7, 3, 2, 0, 2, 3],
    padGain: 0.08,
    leadGain: 0.095,
    pulseGain: 0.035,
  },
];

const stingers = [
  {
    file: 'match_start_stinger.wav',
    duration: 3.2,
    layers: [
      tone(164.81, 329.63, 0, 1.4, 0.2, 'saw'),
      tone(329.63, 659.26, 0.35, 1.1, 0.18, 'triangle'),
      tone(493.88, 987.77, 1.15, 1.2, 0.12, 'sine'),
      noise(0.05, 0.65, 0.055),
    ],
  },
  {
    file: 'victory_stinger.wav',
    duration: 5.2,
    layers: [
      tone(261.63, 261.63, 0, 1.4, 0.13, 'triangle'),
      tone(329.63, 329.63, 0.38, 1.4, 0.12, 'triangle'),
      tone(392, 392, 0.75, 1.5, 0.12, 'triangle'),
      tone(523.25, 783.99, 1.45, 2.8, 0.11, 'sine'),
      tone(1046.5, 1174.66, 2.2, 2.2, 0.055, 'sine'),
    ],
  },
  {
    file: 'defeat_stinger.wav',
    duration: 5.2,
    layers: [
      tone(220, 196, 0, 2.1, 0.14, 'triangle'),
      tone(174.61, 146.83, 0.8, 2.7, 0.11, 'sine'),
      tone(130.81, 123.47, 1.5, 2.8, 0.09, 'sine'),
      noise(0.25, 2.2, 0.025),
    ],
  },
];

const sfx = [
  ['ui_click.wav', 0.22, [tone(920, 640, 0, 0.16, 0.18, 'triangle'), noise(0, 0.04, 0.025)]],
  ['ui_confirm.wav', 0.34, [tone(620, 740, 0, 0.16, 0.13, 'sine'), tone(860, 980, 0.14, 0.18, 0.12, 'sine')]],
  ['notification.wav', 0.62, [tone(660, 660, 0, 0.18, 0.12, 'sine'), tone(880, 880, 0.2, 0.22, 0.1, 'sine')]],
  ['invite_received.wav', 0.72, [tone(523.25, 523.25, 0, 0.18, 0.1, 'triangle'), tone(659.26, 659.26, 0.16, 0.18, 0.1, 'triangle'), tone(783.99, 783.99, 0.32, 0.24, 0.095, 'triangle')]],
  ['match_found.wav', 0.82, [tone(392, 523.25, 0, 0.32, 0.12, 'triangle'), tone(783.99, 987.77, 0.18, 0.42, 0.09, 'sine'), noise(0.06, 0.22, 0.02)]],
  ['room_join.wav', 0.44, [tone(440, 660, 0, 0.32, 0.12, 'triangle')]],
  ['room_leave.wav', 0.44, [tone(660, 392, 0, 0.32, 0.11, 'triangle')]],
  ['ready_toggle.wav', 0.38, [tone(740, 880, 0, 0.14, 0.1, 'sine'), tone(980, 880, 0.14, 0.16, 0.1, 'sine')]],
  ['game_start.wav', 0.95, [tone(196, 392, 0, 0.45, 0.14, 'saw'), tone(523.25, 1046.5, 0.28, 0.48, 0.1, 'triangle'), noise(0, 0.32, 0.045)]],
  ['wolf_scent.wav', 0.7, [tone(220, 390, 0, 0.52, 0.09, 'sine'), noise(0.04, 0.58, 0.035)]],
  ['wolf_bite.wav', 0.48, [tone(120, 52, 0, 0.3, 0.18, 'saw'), noise(0, 0.22, 0.075)]],
  ['wrong_ai_deer.wav', 0.86, [tone(196, 123.47, 0, 0.66, 0.12, 'triangle'), noise(0.05, 0.36, 0.025)]],
  ['deer_eat.wav', 0.52, [noise(0, 0.28, 0.065), tone(180, 132, 0.08, 0.28, 0.045, 'triangle')]],
  ['deer_disguise.wav', 0.68, [tone(520, 310, 0, 0.46, 0.08, 'triangle'), tone(880, 660, 0.12, 0.36, 0.055, 'sine')]],
  ['level_up.wav', 0.92, [tone(523.25, 523.25, 0, 0.18, 0.1, 'triangle'), tone(659.26, 659.26, 0.16, 0.18, 0.1, 'triangle'), tone(783.99, 783.99, 0.32, 0.18, 0.1, 'triangle'), tone(1046.5, 1046.5, 0.5, 0.28, 0.1, 'sine')]],
  ['checkin_claim.wav', 0.72, [tone(784, 784, 0, 0.18, 0.1, 'sine'), tone(1046.5, 1046.5, 0.18, 0.22, 0.1, 'sine'), tone(1318.51, 1174.66, 0.36, 0.22, 0.08, 'sine')]],
  ['activity_claim.wav', 0.88, [tone(392, 523.25, 0, 0.24, 0.1, 'triangle'), tone(659.26, 783.99, 0.2, 0.26, 0.1, 'triangle'), tone(987.77, 1174.66, 0.42, 0.28, 0.085, 'sine')]],
];

await mkdir(MUSIC_DIR, { recursive: true });
await mkdir(SFX_DIR, { recursive: true });

for (const track of musicTracks) {
  await writeFile(join(MUSIC_DIR, track.file), encodeWav(renderMusic(track)));
  console.log(`generated public/audio/music/${track.file}`);
}

for (const track of stingers) {
  await writeFile(join(MUSIC_DIR, track.file), encodeWav(renderLayers(track.duration, track.layers)));
  console.log(`generated public/audio/music/${track.file}`);
}

for (const [file, duration, layers] of sfx) {
  await writeFile(join(SFX_DIR, file), encodeWav(renderLayers(duration, layers)));
  console.log(`generated public/audio/sfx/${file}`);
}

if (process.env.MINIMAX_API_KEY) {
  console.log('MINIMAX_API_KEY detected. Current script generated local draft assets; replace them with approved provider exports when available.');
}

function renderMusic(spec) {
  const length = Math.round(spec.duration * SAMPLE_RATE);
  const samples = new Float32Array(length);
  const beat = 60 / spec.bpm;
  const halfBeat = beat / 2;

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const barIndex = Math.floor(t / (beat * 4));
    const chord = spec.chords[barIndex % spec.chords.length];
    const step = Math.floor(t / halfBeat);
    const stepT = t - step * halfBeat;
    let value = 0;

    for (const interval of chord) {
      const frequency = spec.base * 2 ** (interval / 12);
      value += osc('triangle', frequency, t) * spec.padGain;
      value += osc('sine', frequency * 2, t) * spec.padGain * 0.24;
    }

    const bassFrequency = spec.base * 2 ** ((chord[0] - 12) / 12);
    value += osc('sine', bassFrequency, t) * (0.09 + spec.pulseGain * 0.5);

    const melodyDegree = spec.melody[step % spec.melody.length];
    const melodyFrequency = spec.base * 2 ** (spec.scale[melodyDegree % spec.scale.length] / 12) * (melodyDegree >= spec.scale.length ? 2 : 1);
    const pluck = Math.exp(-stepT * 7.5) * Math.min(1, stepT * 42);
    value += osc('triangle', melodyFrequency, t) * pluck * spec.leadGain;

    const beatT = t - Math.floor(t / beat) * beat;
    const pulse = Math.exp(-beatT * 16) * Math.min(1, beatT * 90);
    value += osc('sine', bassFrequency * 0.5, t) * pulse * spec.pulseGain;
    value += hashNoise(i) * pulse * spec.pulseGain * 0.32;

    samples[i] = value * loopFade(t, spec.duration, 0.75);
  }

  return normalize(samples);
}

function renderLayers(duration, layers) {
  const length = Math.round(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    for (const layer of layers) {
      if (t < layer.start || t > layer.start + layer.duration) continue;
      const localT = t - layer.start;
      const progress = localT / layer.duration;
      const env = Math.min(1, progress * 18) * (1 - progress) ** 1.65;
      if (layer.kind === 'noise') {
        value += hashNoise(i + Math.floor(layer.start * 1000)) * env * layer.gain;
      } else {
        const frequency = lerp(layer.from, layer.to, progress);
        value += osc(layer.wave, frequency, t) * env * layer.gain;
      }
    }
    samples[i] = value;
  }
  return normalize(samples);
}

function tone(from, to, start, duration, gain, wave = 'sine') {
  return { kind: 'tone', from, to, start, duration, gain, wave };
}

function noise(start, duration, gain) {
  return { kind: 'noise', start, duration, gain };
}

function osc(wave, frequency, t) {
  const phase = Math.PI * 2 * frequency * t;
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  if (wave === 'saw') return 2 * (frequency * t - Math.floor(0.5 + frequency * t));
  return Math.sin(phase);
}

function loopFade(t, duration, fade) {
  return Math.min(1, t / fade, (duration - t) / fade);
}

function normalize(samples) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const gain = peak > 0 ? Math.min(1, 0.86 / peak) : 1;
  for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
  return samples;
}

function encodeWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }
  return buffer;
}

function lerp(from, to, alpha) {
  return from + (to - from) * alpha;
}

function hashNoise(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}
