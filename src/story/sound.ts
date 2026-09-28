/**
 * Synthesised sound effects for the story. Nothing plays until the visitor turns sound on
 * (browsers only allow audio after a click), and every cue is a no-op while it's off.
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private subs = new Set<(on: boolean) => void>();
  on = false;

  subscribe(fn: (on: boolean) => void) {
    this.subs.add(fn);
    return () => void this.subs.delete(fn);
  }

  async set(on: boolean) {
    if (on) {
      if (!this.ctx) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctx();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        this.out = this.ctx.createGain();
        this.out.gain.value = 0.6;
        this.out.connect(comp).connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      await this.ctx.resume();
    } else {
      await this.ctx?.suspend();
    }
    this.on = on;
    this.subs.forEach((f) => f(on));
    if (on) this.ping();
  }

  private ready() {
    return this.on && this.ctx && this.out && this.ctx.state === "running" ? this.ctx : null;
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private tone(freq: number, t: number, decay: number, peak: number, type: OscillatorType = "sine", attack = 0.004, to?: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + attack + decay);
    this.env(g, t, peak, attack, decay);
    o.connect(g).connect(this.out!);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  private burst(t: number, dur: number, peak: number, filter: BiquadFilterType, freq: number, q = 1, sweepTo?: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, Math.min(0.02, dur * 0.3), dur);
    src.connect(f).connect(g).connect(this.out!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  /** A struck bell: inharmonic partials with a long decay. */
  private bell(freq: number, t: number, peak = 0.22, decay = 1.4) {
    [
      [1, 1],
      [2.0, 0.45],
      [2.76, 0.3],
      [5.4, 0.12],
    ].forEach(([m, a]) => this.tone(freq * m, t, decay / (m > 2 ? 1.8 : 1), peak * a));
  }

  ping() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(1320, t, 0.12, 0.05, "triangle");
    this.tone(1760, t + 0.06, 0.16, 0.04, "triangle");
  }

  /** Soft notification blip for the lock screen filling up. */
  notify(i: number) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [988, 1175, 1319, 1480];
    this.tone(notes[i % notes.length], t, 0.14, 0.05, "sine");
  }

  whoosh() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.burst(t, 0.9, 0.35, "bandpass", 250, 0.8, 3200);
    this.tone(90, t, 0.7, 0.18, "sine", 0.05, 40);
  }

  lever() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) this.burst(t + i * 0.045, 0.02, 0.18, "highpass", 2500, 1);
    this.tone(140, t + 0.3, 0.18, 0.3, "sine", 0.004, 60);
  }

  tick() {
    const ctx = this.ready();
    if (!ctx) return;
    this.burst(ctx.currentTime, 0.018, 0.07, "bandpass", 3200, 3);
  }

  clunk(heavy = false) {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(heavy ? 130 : 160, t, heavy ? 0.28 : 0.18, heavy ? 0.5 : 0.35, "sine", 0.003, 50);
    this.burst(t, 0.06, 0.2, "lowpass", 900, 1);
  }

  /** Ding ding ding, a rising fanfare and a shower of coins. */
  jackpot() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [0, 0.22, 0.44].forEach((d) => this.bell(1568, t + d, 0.24, 1.2));
    [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, t + 0.75 + i * 0.09, 0.5, 0.09, "triangle"));
    for (let i = 0; i < 22; i++) {
      const at = t + 0.8 + Math.random() * 1.4;
      this.tone(2400 + Math.random() * 2200, at, 0.09, 0.035, "sine");
    }
  }

  swell() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [220, 277.2, 329.6, 440].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.value = f * (1 + (i - 1.5) * 0.002);
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(2200, t + 1.2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(lp).connect(g).connect(this.out!);
      o.start(t);
      o.stop(t + 2.5);
    });
  }

  shimmer() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    [1760, 2217, 2637, 3520].forEach((f, i) => this.bell(f, t + i * 0.07, 0.06, 1.1));
  }

  powerUp() {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(160, t, 0.9, 0.16, "sine", 0.02, 640);
    this.tone(320, t + 0.05, 0.9, 0.06, "triangle", 0.02, 1280);
    [1319, 1760, 2093].forEach((f, i) => this.bell(f, t + 0.7 + i * 0.1, 0.07, 1.4));
  }
}

export const sfx = new Sfx();
