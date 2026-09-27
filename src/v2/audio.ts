export interface AudioSettings { music: boolean; musicVolume: number; effects: boolean; effectsVolume: number }
const KEY = 'nyang-v2-audio';
const defaults: AudioSettings = { music: true, musicVolume: 36, effects: true, effectsVolume: 42 };
type Scene = 'restaurant' | 'mart' | 'kitchen' | 'minigame' | 'wardrobe';
type FallbackScene = 'restaurant' | 'mart';
type Effect = 'tap' | 'slice' | 'stir' | 'catch' | 'cook' | 'serve' | 'reward' | 'error' | 'countdown';
const notes: Record<string, number> = { C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196, A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99 };
const tunes: Record<FallbackScene, (keyof typeof notes | null)[]> = {
  restaurant: ['E4', null, 'G4', 'A4', 'G4', null, 'E4', null, 'D4', null, 'E4', 'G4', 'E4', null, 'C4', null,
    'E4', null, 'G4', 'C5', 'B4', null, 'A4', null, 'G4', 'E4', 'D4', null, 'C4', null, null, null,
    'F4', null, 'A4', 'C5', 'A4', null, 'G4', null, 'E4', 'G4', 'A4', null, 'G4', null, 'E4', null,
    'D4', null, 'F4', 'A4', 'G4', 'F4', 'E4', null, 'G4', 'E4', 'D4', null, 'C4', null, null, null],
  mart: ['G4', 'B4', 'D5', null, 'B4', 'G4', 'E4', null, 'A4', 'C5', 'E5', null, 'C5', 'A4', 'G4', null,
    'G4', 'C5', 'D5', 'C5', 'B4', null, 'G4', null, 'A4', 'G4', 'E4', 'G4', 'D4', null, null, null,
    'A4', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4', null, 'B4', 'D5', 'G5', 'D5', 'B4', 'G4', 'E4', null,
    'G4', 'B4', 'D5', 'E5', 'D5', 'B4', 'A4', 'G4', 'C5', 'A4', 'G4', 'E4', 'D4', null, null, null],
};
const bass: Record<FallbackScene, (keyof typeof notes)[]> = {
  restaurant: ['C3', 'A3', 'F3', 'G3', 'C3', 'A3', 'F3', 'G3'],
  mart: ['G3', 'C3', 'D3', 'G3', 'A3', 'E3', 'G3', 'C3'],
};

class GameAudio {
  private ctx: AudioContext | null = null;
  private scene: Scene = 'restaurant';
  private activeScene: Scene | null = null;
  private musicBus: GainNode | null = null;
  private fallbackBus: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private tracks: Partial<Record<Scene, Promise<AudioBuffer | null>>> = {};
  private timer: number | null = null;
  private nextNote = 0;
  private nextAt = 0;
  private settings: AudioSettings = this.getSettings();
  private lastEffect = 0;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stopMusic();
      else if (this.ctx && !this.activeScene) this.startMusic(this.scene);
    });
  }

  getSettings(): AudioSettings {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '{}'); return { ...defaults, ...value }; }
    catch { return defaults; }
  }
  saveSettings(settings: AudioSettings) {
    this.settings = settings;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* private browsing */ }
    if (this.musicBus && this.ctx) this.musicBus.gain.setTargetAtTime(settings.music ? settings.musicVolume / 100 * .35 : 0, this.ctx.currentTime, .08);
  }
  unlock() {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (!this.activeScene) this.startMusic(this.scene);
  }
  setScene(scene: Scene) {
    this.scene = scene;
    if (this.ctx && this.activeScene !== scene) this.startMusic(scene);
  }
  stopMusic() {
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
    if (this.fallbackBus) {
      const oldFallback = this.fallbackBus;
      this.fallbackBus = null;
      window.setTimeout(() => oldFallback.disconnect(), 1400);
    }
    if (this.source) {
      const oldSource = this.source;
      this.source = null;
      window.setTimeout(() => { try { oldSource.stop(); } catch { /* Already stopped. */ } oldSource.disconnect(); }, 1400);
    }
    if (this.ctx && this.musicBus) {
      const oldBus = this.musicBus;
      oldBus.gain.setTargetAtTime(0, this.ctx.currentTime, .12);
      window.setTimeout(() => oldBus.disconnect(), 1400);
      this.musicBus = null;
    }
    this.activeScene = null;
  }
  private startMusic(scene: Scene) {
    if (!this.ctx) return;
    this.stopMusic();
    this.activeScene = scene;
    const bus = this.ctx.createGain();
    bus.gain.value = 0;
    bus.connect(this.ctx.destination);
    bus.gain.setTargetAtTime(this.settings.music ? this.settings.musicVolume / 100 * .35 : 0, this.ctx.currentTime, .12);
    this.musicBus = bus;
    const fallbackBus = this.ctx.createGain();
    fallbackBus.connect(bus);
    this.fallbackBus = fallbackBus;
    this.nextNote = 0;
    this.nextAt = this.ctx.currentTime + .06;
    const fallback: FallbackScene = scene === 'mart' || scene === 'minigame' ? 'mart' : 'restaurant';
    const beat = fallback === 'restaurant' ? .37 : .3;
    const schedule = () => {
      if (!this.ctx || this.activeScene !== scene) return;
      while (this.nextAt < this.ctx.currentTime + .8) {
        const key = tunes[fallback][this.nextNote % tunes[fallback].length];
        if (key) this.pluck(notes[key], this.nextAt, beat * .73, fallbackBus, fallback === 'mart' ? 'triangle' : 'sine', .78);
        if (this.nextNote % 8 === 0) this.pluck(notes[bass[fallback][Math.floor(this.nextNote / 8) % 8]], this.nextAt, beat * 3.3, fallbackBus, 'sine', .43);
        if (this.nextNote % 8 === 4) this.pluck(notes[bass[fallback][Math.floor(this.nextNote / 8) % 8]] * 1.5, this.nextAt, beat * 1.8, fallbackBus, 'triangle', .22);
        if (fallback === 'mart' && this.nextNote % 2 === 1) this.pluck(notes.C5 * 2, this.nextAt, beat * .13, fallbackBus, 'sine', .12);
        this.nextNote += 1; this.nextAt += beat;
      }
    };
    schedule(); this.timer = window.setInterval(schedule, 180);
    void this.loadTrack(scene).then(buffer => {
      if (!buffer || !this.ctx || this.musicBus !== bus || this.activeScene !== scene) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer; source.loop = true; source.connect(bus);
      source.start(); this.source = source;
      fallbackBus.gain.setTargetAtTime(0, this.ctx.currentTime, .18);
      if (this.fallbackBus === fallbackBus) this.fallbackBus = null;
      if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
      window.setTimeout(() => fallbackBus.disconnect(), 1400);
    });
  }
  private loadTrack(scene: Scene): Promise<AudioBuffer | null> {
    if (!this.ctx) return Promise.resolve(null);
    if (!this.tracks[scene]) {
      const ctx = this.ctx;
      this.tracks[scene] = fetch(`/game/music-${scene}.mp3`)
        .then(response => { if (!response.ok) throw new Error('music asset unavailable'); return response.arrayBuffer(); })
        .then(bytes => ctx.decodeAudioData(bytes))
        .catch(() => null);
    }
    return this.tracks[scene];
  }
  private pluck(frequency: number, when: number, duration: number, destination: AudioNode, type: OscillatorType = 'sine', volume = 1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, when);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(.09 * volume, when + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    osc.connect(gain).connect(destination);
    osc.start(when); osc.stop(when + duration + .03);
  }
  effect(effect: Effect) {
    if (!this.ctx || !this.settings.effects || this.settings.effectsVolume <= 0) return;
    if (Date.now() - this.lastEffect < 45) return;
    this.lastEffect = Date.now();
    const bus = this.ctx.createGain(); bus.gain.value = this.settings.effectsVolume / 100 * .55; bus.connect(this.ctx.destination);
    const at = this.ctx.currentTime;
    const tone = (note: string, delay: number, duration: number, type: OscillatorType = 'sine', volume = 1) => this.pluck(notes[note], at + delay, duration, bus, type, volume);
    switch (effect) {
      case 'tap': tone('G4', 0, .11, 'triangle', .65); break;
      case 'slice': tone('E5', 0, .08, 'triangle', .48); break;
      case 'stir': tone('C5', 0, .12, 'sine', .4); break;
      case 'catch': tone('E5', 0, .12); tone('G5', .08, .16); break;
      case 'cook': tone('C5', 0, .16); tone('E5', .12, .19); tone('G5', .24, .27); break;
      case 'serve': tone('G4', 0, .15); tone('C5', .11, .18); tone('E5', .22, .24); tone('G5', .33, .3); break;
      case 'reward': tone('C5', 0, .12); tone('G5', .1, .22); break;
      case 'error': tone('D4', 0, .13, 'triangle', .5); tone('C4', .1, .2, 'triangle', .4); break;
      case 'countdown': tone('C5', 0, .1, 'sine', .45); break;
    }
  }
}
export const audio = new GameAudio();
