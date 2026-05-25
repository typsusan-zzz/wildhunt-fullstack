export type MusicTrackId = 'lobby_loop' | 'room_loop' | 'game_wolf_tension_loop' | 'game_deer_stealth_loop';
export type StingerId = 'match_start_stinger' | 'victory_stinger' | 'defeat_stinger';
export type SfxId =
  | 'ui_click'
  | 'ui_confirm'
  | 'notification'
  | 'invite_received'
  | 'match_found'
  | 'room_join'
  | 'room_leave'
  | 'ready_toggle'
  | 'game_start'
  | 'wolf_scent'
  | 'wolf_bite'
  | 'wrong_ai_deer'
  | 'deer_eat'
  | 'deer_disguise'
  | 'level_up'
  | 'checkin_claim'
  | 'activity_claim';

export type AudioSettings = {
  mainVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  muted: boolean;
};

const DEFAULT_SETTINGS: AudioSettings = {
  mainVolume: 0.7,
  bgmVolume: 0.58,
  sfxVolume: 0.78,
  muted: false,
};

const MUSIC_TRACKS: Record<MusicTrackId, string> = {
  lobby_loop: '/audio/music/lobby_loop.wav',
  room_loop: '/audio/music/room_loop.wav',
  game_wolf_tension_loop: '/audio/music/game_wolf_tension_loop.wav',
  game_deer_stealth_loop: '/audio/music/game_deer_stealth_loop.wav',
};

const STINGERS: Record<StingerId, string> = {
  match_start_stinger: '/audio/music/match_start_stinger.wav',
  victory_stinger: '/audio/music/victory_stinger.wav',
  defeat_stinger: '/audio/music/defeat_stinger.wav',
};

const SFX: Record<SfxId, string> = {
  ui_click: '/audio/sfx/ui_click.wav',
  ui_confirm: '/audio/sfx/ui_confirm.wav',
  notification: '/audio/sfx/notification.wav',
  invite_received: '/audio/sfx/invite_received.wav',
  match_found: '/audio/sfx/match_found.wav',
  room_join: '/audio/sfx/room_join.wav',
  room_leave: '/audio/sfx/room_leave.wav',
  ready_toggle: '/audio/sfx/ready_toggle.wav',
  game_start: '/audio/sfx/game_start.wav',
  wolf_scent: '/audio/sfx/wolf_scent.wav',
  wolf_bite: '/audio/sfx/wolf_bite.wav',
  wrong_ai_deer: '/audio/sfx/wrong_ai_deer.wav',
  deer_eat: '/audio/sfx/deer_eat.wav',
  deer_disguise: '/audio/sfx/deer_disguise.wav',
  level_up: '/audio/sfx/level_up.wav',
  checkin_claim: '/audio/sfx/checkin_claim.wav',
  activity_claim: '/audio/sfx/activity_claim.wav',
};

const ALL_AUDIO_URLS = [...Object.values(MUSIC_TRACKS), ...Object.values(STINGERS), ...Object.values(SFX)];

class AudioManager {
  private settings = readAudioSettings();
  private bgm: HTMLAudioElement | null = null;
  private currentBgmId: MusicTrackId | null = null;
  private pendingBgmId: MusicTrackId | null = null;
  private unlockBound = false;
  private unlocked = false;
  private preloaded = false;

  unlockOnFirstGesture() {
    if (this.unlockBound) return;
    this.unlockBound = true;
    const unlock = () => void this.unlock();
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  async unlock() {
    this.unlocked = true;
    if (this.bgm && this.bgm.paused) {
      const played = await this.bgm.play().then(() => true).catch(() => false);
      if (played) this.pendingBgmId = null;
    } else if (this.pendingBgmId) {
      const id = this.pendingBgmId;
      this.pendingBgmId = null;
      await this.playBgm(id);
    }
  }

  async preloadAudioAssets() {
    if (this.preloaded) return;
    await Promise.allSettled(ALL_AUDIO_URLS.map((url) => preloadAudio(url)));
    this.preloaded = true;
  }

  async playBgm(id: MusicTrackId, fadeMs = 700) {
    this.unlockOnFirstGesture();
    if (this.currentBgmId === id && this.bgm) {
      this.bgm.loop = true;
      this.bgm.volume = this.bgmVolume();
      if (this.bgm.paused && this.unlocked) await this.bgm.play().catch(() => undefined);
      return;
    }

    const previous = this.bgm;
    const next = new Audio(MUSIC_TRACKS[id]);
    next.loop = true;
    next.preload = 'auto';
    next.volume = 0;
    this.bgm = next;
    this.currentBgmId = id;

    const played = await next.play().then(() => true).catch(() => false);
    if (!played) {
      this.pendingBgmId = id;
      next.volume = this.bgmVolume();
      if (previous) this.fadeOutAndStop(previous, fadeMs);
      return;
    }

    this.fadeTo(next, this.bgmVolume(), fadeMs);
    if (previous) this.fadeOutAndStop(previous, fadeMs);
  }

  stopBgm(fadeMs = 500) {
    this.pendingBgmId = null;
    if (!this.bgm) return;
    const previous = this.bgm;
    this.bgm = null;
    this.currentBgmId = null;
    this.fadeOutAndStop(previous, fadeMs);
  }

  playSfx(id: SfxId) {
    this.playOneShot(SFX[id], this.sfxVolume());
  }

  playStinger(id: StingerId) {
    this.playOneShot(STINGERS[id], this.sfxVolume());
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setSettings(next: Partial<AudioSettings>) {
    this.settings = {
      mainVolume: clampUnit(next.mainVolume ?? this.settings.mainVolume),
      bgmVolume: clampUnit(next.bgmVolume ?? this.settings.bgmVolume),
      sfxVolume: clampUnit(next.sfxVolume ?? this.settings.sfxVolume),
      muted: Boolean(next.muted ?? this.settings.muted),
    };
    persistAudioSettings(this.settings);
    if (this.bgm) this.bgm.volume = this.bgmVolume();
  }

  private playOneShot(src: string, volume: number) {
    this.unlockOnFirstGesture();
    if (volume <= 0) return;
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = volume;
    void audio.play().catch(() => undefined);
  }

  private bgmVolume() {
    if (this.settings.muted) return 0;
    return clampUnit(this.settings.mainVolume * this.settings.bgmVolume);
  }

  private sfxVolume() {
    if (this.settings.muted) return 0;
    return clampUnit(this.settings.mainVolume * this.settings.sfxVolume);
  }

  private fadeOutAndStop(audio: HTMLAudioElement, duration: number) {
    this.fadeTo(audio, 0, duration, () => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  private fadeTo(audio: HTMLAudioElement, target: number, duration: number, done?: () => void) {
    const from = audio.volume;
    const startedAt = performance.now();
    const tick = () => {
      const progress = duration <= 0 ? 1 : Math.min(1, (performance.now() - startedAt) / duration);
      audio.volume = from + (target - from) * progress;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        done?.();
      }
    };
    requestAnimationFrame(tick);
  }
}

export const audioManager = new AudioManager();

export function getAudioSettings() {
  return audioManager.getSettings();
}

export function setAudioSettings(settings: Partial<AudioSettings>) {
  audioManager.setSettings(settings);
}

function preloadAudio(url: string) {
  return new Promise<void>((resolve) => {
    const audio = new Audio(url);
    const finish = () => resolve();
    const timer = window.setTimeout(finish, 2200);
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => {
      window.clearTimeout(timer);
      finish();
    }, { once: true });
    audio.addEventListener('error', () => {
      window.clearTimeout(timer);
      finish();
    }, { once: true });
    audio.load();
  });
}

function readAudioSettings(): AudioSettings {
  try {
    const saved = JSON.parse(window.localStorage.getItem('wildhunt.audio.settings') || '{}') as Partial<AudioSettings>;
    const legacy = JSON.parse(window.localStorage.getItem('wildhunt.settings') || '{}') as Record<string, unknown>;
    const muted = saved.muted ?? legacy.muted;
    return {
      mainVolume: readVolume(saved.mainVolume ?? legacy.mainVolume ?? legacy.volume, DEFAULT_SETTINGS.mainVolume),
      bgmVolume: readVolume(saved.bgmVolume ?? legacy.bgmVolume, DEFAULT_SETTINGS.bgmVolume),
      sfxVolume: readVolume(saved.sfxVolume ?? legacy.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      muted: typeof muted === 'boolean' ? muted : muted === 'on' || muted === 'true',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistAudioSettings(settings: AudioSettings) {
  window.localStorage.setItem('wildhunt.audio.settings', JSON.stringify(settings));
  const saved = JSON.parse(window.localStorage.getItem('wildhunt.settings') || '{}') as Record<string, unknown>;
  window.localStorage.setItem('wildhunt.settings', JSON.stringify({
    ...saved,
    volume: String(Math.round(settings.mainVolume * 100)),
    mainVolume: String(Math.round(settings.mainVolume * 100)),
    bgmVolume: String(Math.round(settings.bgmVolume * 100)),
    sfxVolume: String(Math.round(settings.sfxVolume * 100)),
    muted: settings.muted ? 'on' : 'off',
  }));
}

function readVolume(value: unknown, fallback: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clampUnit(number > 1 ? number / 100 : number);
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}
