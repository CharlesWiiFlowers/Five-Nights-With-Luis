// Procedural sound effects synthesized with WebAudio, routed through their own gain node
// so they are fully independent from the background music volume.
import { settings, saveSettings } from '../game/settings.js';

export class Sfx {
  constructor(game) {
    this.game = game;
    this.master = null;
  }

  get ctx() {
    return this.game.sound.context ?? null;
  }

  ensure() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return null;
    if (!this.master) {
      this.master = ctx.createGain();
      this.master.connect(ctx.destination);
    }
    this.master.gain.value = settings.sfxVolume * 0.5;
    return ctx;
  }

  setVolume(v) {
    settings.sfxVolume = Math.max(0, Math.min(1, v));
    saveSettings();
    if (this.master) this.master.gain.value = settings.sfxVolume * 0.5;
  }

  tone({ type = 'sine', from = 440, to = from, dur = 0.15, vol = 0.3, delay = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.3, vol = 0.3, filter = 1200, delay = 0 }) {
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bq = ctx.createBiquadFilter();
    bq.type = 'lowpass';
    bq.frequency.value = filter;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(bq).connect(g).connect(this.master);
    src.start(t0);
  }

  play(name) {
    switch (name) {
      case 'shoot': return this.tone({ type: 'square', from: 900, to: 300, dur: 0.08, vol: 0.12 });
      case 'bossHit': return this.tone({ type: 'sawtooth', from: 200, to: 90, dur: 0.12, vol: 0.18 });
      case 'playerHit': this.noise({ dur: 0.25, vol: 0.4, filter: 900 }); return this.tone({ type: 'square', from: 180, to: 60, dur: 0.25, vol: 0.2 });
      case 'explosion': return this.noise({ dur: 0.9, vol: 0.6, filter: 600 });
      case 'lever': this.noise({ dur: 0.07, vol: 0.4, filter: 2500 }); return this.tone({ type: 'triangle', from: 140, to: 70, dur: 0.12, vol: 0.35 });
      case 'click': return this.tone({ type: 'square', from: 1200, to: 1100, dur: 0.03, vol: 0.1 });
      case 'error': this.tone({ type: 'square', from: 220, to: 200, dur: 0.18, vol: 0.18 }); return this.tone({ type: 'square', from: 160, to: 150, dur: 0.25, vol: 0.18, delay: 0.18 });
      case 'success': [523, 659, 784].forEach((f, i) => this.tone({ type: 'triangle', from: f, dur: 0.16, vol: 0.2, delay: i * 0.09 })); return;
      case 'alarm': for (let i = 0; i < 4; i++) this.tone({ type: 'sawtooth', from: 880, to: 440, dur: 0.35, vol: 0.18, delay: i * 0.42 }); return;
      case 'emp': this.noise({ dur: 1.4, vol: 0.5, filter: 300 }); return this.tone({ type: 'sine', from: 60, to: 900, dur: 1.2, vol: 0.25 });
      case 'warp': this.noise({ dur: 2.4, vol: 0.3, filter: 1800 }); return this.tone({ type: 'sawtooth', from: 80, to: 1600, dur: 2.2, vol: 0.12 });
      case 'pickup': return this.tone({ type: 'sine', from: 600, to: 1400, dur: 0.2, vol: 0.25 });
      case 'telegraph': return this.tone({ type: 'sine', from: 300, to: 340, dur: 0.3, vol: 0.08 });
      case 'denied': return this.tone({ type: 'square', from: 140, to: 120, dur: 0.15, vol: 0.15 });
      default: return undefined;
    }
  }
}
