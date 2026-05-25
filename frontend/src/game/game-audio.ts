import { audioManager, type SfxId, type StingerId } from '../audio/audio-manager';
import type { Role } from './game-scene-types';

export type GameAudioCue = 'pounce' | 'scent' | 'eat' | 'look' | 'camouflage' | 'hit' | 'result';

export type GameAudio = {
  ready: Promise<void>;
  resume: () => Promise<void>;
  playCue: (cue: GameAudioCue) => void;
  playStinger: (stinger: StingerId) => void;
  stop: () => void;
};

type AudioContextConstructor = new () => AudioContext;

export function createMutedGameAudio(): GameAudio {
  return {
    ready: Promise.resolve(),
    resume: () => Promise.resolve(),
    playCue: () => undefined,
    playStinger: () => undefined,
    stop: () => undefined,
  };
}

export async function loadGameAudio(role?: Role): Promise<GameAudio> {
  audioManager.unlockOnFirstGesture();
  const audioWindow = window as Window & { webkitAudioContext?: AudioContextConstructor };
  const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext;
  const ready = audioManager.preloadAudioAssets();

  if (!AudioContextClass) {
    await ready;
    await audioManager.playBgm(role === 'deer' ? 'game_deer_stealth_loop' : 'game_wolf_tension_loop');
    return {
      ready,
      resume: () => audioManager.unlock(),
      playCue: (cue) => audioManager.playSfx(CUE_TO_SFX[cue]),
      playStinger: (stinger) => audioManager.playStinger(stinger),
      stop: () => audioManager.stopBgm(),
    };
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0.025;
  master.connect(context.destination);

  const buffers = new Map<GameAudioCue, AudioBuffer>();
  for (const [cue, spec] of Object.entries(CUE_SPECS) as [GameAudioCue, CueSpec][]) {
    buffers.set(cue, synthesizeCue(context, spec));
  }

  const audio: GameAudio = {
    ready,
    resume: async () => {
      if (context.state === 'suspended') await context.resume();
      await audioManager.unlock();
    },
    playCue: (cue) => {
      audioManager.playSfx(CUE_TO_SFX[cue]);
      const buffer = buffers.get(cue);
      if (!buffer || context.state === 'closed') return;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(master);
      source.start();
    },
    playStinger: (stinger) => {
      audioManager.playStinger(stinger);
      if (stinger === 'match_start_stinger') audioManager.playSfx('game_start');
    },
    stop: () => audioManager.stopBgm(),
  };

  await audio.ready;
  await audioManager.playBgm(role === 'deer' ? 'game_deer_stealth_loop' : 'game_wolf_tension_loop');
  return audio;
}

type CueSpec = {
  frequency: number;
  endFrequency?: number;
  duration: number;
  gain: number;
};

const CUE_SPECS: Record<GameAudioCue, CueSpec> = {
  pounce: { frequency: 96, endFrequency: 54, duration: 0.18, gain: 0.55 },
  scent: { frequency: 260, endFrequency: 420, duration: 0.3, gain: 0.36 },
  eat: { frequency: 180, endFrequency: 132, duration: 0.16, gain: 0.28 },
  look: { frequency: 520, endFrequency: 700, duration: 0.14, gain: 0.24 },
  camouflage: { frequency: 310, endFrequency: 210, duration: 0.24, gain: 0.22 },
  hit: { frequency: 72, endFrequency: 48, duration: 0.26, gain: 0.65 },
  result: { frequency: 392, endFrequency: 523, duration: 0.34, gain: 0.3 },
};

const CUE_TO_SFX: Record<GameAudioCue, SfxId> = {
  pounce: 'wolf_bite',
  scent: 'wolf_scent',
  eat: 'deer_eat',
  look: 'notification',
  camouflage: 'deer_disguise',
  hit: 'wrong_ai_deer',
  result: 'ui_confirm',
};

function synthesizeCue(context: AudioContext, spec: CueSpec) {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * spec.duration));
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1);
    const frequency = lerp(spec.frequency, spec.endFrequency ?? spec.frequency, t);
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const envelope = Math.sin(Math.PI * t) * (1 - t * 0.55);
    data[i] = Math.sin(phase) * envelope * spec.gain;
  }
  return buffer;
}

function lerp(from: number, to: number, alpha: number) {
  return from + (to - from) * alpha;
}
