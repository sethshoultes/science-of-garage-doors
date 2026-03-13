/**
 * audio.js — Procedural sound engine for garage door simulations.
 *
 * All sounds are generated in real-time using Web Audio API oscillators,
 * biquad filters, and gain nodes. No audio files required.
 *
 * AudioContext is lazily created on the first user interaction to comply
 * with browser autoplay policies.
 *
 * Usage:
 *   import { AudioEngine } from './audio.js';
 *
 *   const audio = new AudioEngine();
 *   audio.playSound('doorRumble', { duration: 2 });
 *   audio.toggleMute();
 */

export class AudioEngine {
  constructor() {
    /** @type {AudioContext|null} */
    this._ctx = null;

    /** @type {boolean} */
    this._muted = false;

    /** @type {GainNode|null} Master gain for global mute. */
    this._master = null;

    /** @type {boolean} Whether we've installed the lazy-init listener. */
    this._initPending = true;

    // Map of sound name -> generator function
    this._generators = {
      doorRumble: (opts) => this._doorRumble(opts),
      springClick: (opts) => this._springClick(opts),
      motorHum: (opts) => this._motorHum(opts),
      chainRattle: (opts) => this._chainRattle(opts),
      beltWhisper: (opts) => this._beltWhisper(opts),
    };

    // Install lazy AudioContext creation on first user gesture
    this._installLazyInit();
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Play a named procedural sound.
   *
   * @param {string} name    — one of: doorRumble, springClick, motorHum,
   *                           chainRattle, beltWhisper
   * @param {Object} [options]
   * @param {number} [options.duration=1] — length in seconds
   * @param {number} [options.volume=0.5] — 0..1
   */
  playSound(name, options = {}) {
    if (!this._ctx || this._muted) return;
    const gen = this._generators[name];
    if (gen) gen(options);
  }

  /** Toggle global mute on/off. Returns the new muted state. */
  toggleMute() {
    this._muted = !this._muted;
    if (this._master) {
      this._master.gain.value = this._muted ? 0 : 1;
    }
    return this._muted;
  }

  /** @returns {boolean} current mute state */
  get muted() {
    return this._muted;
  }

  // ── Lazy AudioContext ───────────────────────────────────────

  /** Attach a one-shot listener that creates the AudioContext on first gesture. */
  _installLazyInit() {
    const init = () => {
      if (!this._initPending) return;
      this._initPending = false;

      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._master = this._ctx.createGain();
      this._master.connect(this._ctx.destination);

      // Remove listeners after init
      for (const evt of ['click', 'touchstart', 'keydown']) {
        document.removeEventListener(evt, init, true);
      }
    };

    for (const evt of ['click', 'touchstart', 'keydown']) {
      document.addEventListener(evt, init, { capture: true, once: false });
    }
  }

  // ── Shared helpers ──────────────────────────────────────────

  /**
   * Create an oscillator -> filter -> gain chain connected to master.
   * Returns { osc, filter, gain } for further configuration.
   */
  _makeChain({ type = 'sine', freq = 440, filterType = 'lowpass', filterFreq = 1000, Q = 1, volume = 0.5 }) {
    const ctx = this._ctx;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = Q;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._master);

    return { osc, filter, gain };
  }

  // ── Sound generators ────────────────────────────────────────

  /**
   * Low rumbling vibration of a heavy door moving on tracks.
   * Uses a low-frequency sawtooth with heavy filtering.
   */
  _doorRumble({ duration = 2, volume = 0.4 } = {}) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const { osc, filter, gain } = this._makeChain({
      type: 'sawtooth',
      freq: 35,
      filterType: 'lowpass',
      filterFreq: 120,
      Q: 3,
      volume: 0,
    });

    // Fade in, sustain, fade out
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.15);
    gain.gain.setValueAtTime(volume, now + duration - 0.3);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    // Slight frequency wobble for realism
    osc.frequency.setValueAtTime(35, now);
    osc.frequency.linearRampToValueAtTime(42, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(35, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Short metallic click of a spring winding bar engaging.
   * High-frequency burst with fast decay.
   */
  _springClick({ duration = 0.15, volume = 0.5 } = {}) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const { osc, filter, gain } = this._makeChain({
      type: 'square',
      freq: 2200,
      filterType: 'bandpass',
      filterFreq: 3000,
      Q: 8,
      volume: 0,
    });

    // Sharp attack, fast decay
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Pitch drop for metallic character
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Continuous electric motor hum — fundamental + harmonics.
   * 60 Hz base with second and third harmonics.
   */
  _motorHum({ duration = 3, volume = 0.3 } = {}) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Fundamental 60 Hz
    const { osc: osc1, gain: g1 } = this._makeChain({
      type: 'sine',
      freq: 60,
      filterType: 'lowpass',
      filterFreq: 300,
      Q: 1,
      volume: 0,
    });

    // Second harmonic 120 Hz
    const { osc: osc2, gain: g2 } = this._makeChain({
      type: 'sine',
      freq: 120,
      filterType: 'lowpass',
      filterFreq: 400,
      Q: 1,
      volume: 0,
    });

    // Third harmonic 180 Hz (quieter)
    const { osc: osc3, gain: g3 } = this._makeChain({
      type: 'triangle',
      freq: 180,
      filterType: 'lowpass',
      filterFreq: 500,
      Q: 1,
      volume: 0,
    });

    const vols = [volume, volume * 0.4, volume * 0.15];
    [g1, g2, g3].forEach((g, i) => {
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vols[i], now + 0.3);
      g.gain.setValueAtTime(vols[i], now + duration - 0.5);
      g.gain.linearRampToValueAtTime(0, now + duration);
    });

    [osc1, osc2, osc3].forEach((o) => {
      o.start(now);
      o.stop(now + duration);
    });
  }

  /**
   * Chain rattling — rapid bursts of filtered noise-like oscillation.
   * Square wave with fast frequency modulation for clatter effect.
   */
  _chainRattle({ duration = 1.5, volume = 0.25 } = {}) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const { osc, filter, gain } = this._makeChain({
      type: 'square',
      freq: 80,
      filterType: 'bandpass',
      filterFreq: 800,
      Q: 5,
      volume: 0,
    });

    // LFO to modulate main oscillator frequency for rattle effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 25;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.05);
    gain.gain.setValueAtTime(volume, now + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
    lfo.start(now);
    lfo.stop(now + duration);
  }

  /**
   * Soft belt drive whisper — gentle low-frequency sine with slow filter sweep.
   * Much quieter and smoother than chain rattle.
   */
  _beltWhisper({ duration = 2, volume = 0.12 } = {}) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const { osc, filter, gain } = this._makeChain({
      type: 'sine',
      freq: 45,
      filterType: 'lowpass',
      filterFreq: 200,
      Q: 0.7,
      volume: 0,
    });

    // Slow filter sweep for movement feel
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.linearRampToValueAtTime(250, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(100, now + duration);

    // Gentle envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.4);
    gain.gain.setValueAtTime(volume, now + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.start(now);
    osc.stop(now + duration);
  }
}
