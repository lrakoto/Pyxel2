import type { AreaId } from './content.ts';
/** One persistent ambience graph. The browser's audio clock handles fades. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private hum: GainNode | null = null;
  volume = 0.5;
  muted = false;
  async init() {
    if (this.ctx) {
      await this.ctx.resume();
      return;
    }
    const c = (this.ctx = new AudioContext());
    const master = (this.master = c.createGain());
    master.gain.value = this.muted ? 0 : this.volume * 0.45;
    master.connect(c.destination);
    const buffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < samples.length; i++) {
      last = (last + Math.random() * 0.08 - 0.04) / 1.02;
      samples[i] = last * 3;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = (this.lowpass = c.createBiquadFilter());
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    const rain = (this.rain = c.createGain());
    rain.gain.value = 0.22;
    noise.connect(filter);
    filter.connect(rain);
    rain.connect(master);
    noise.start();
    const hum = (this.hum = c.createGain());
    hum.gain.value = 0.05;
    hum.connect(master);
    for (const frequency of [55, 82.41, 110.15]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = frequency;
      o.connect(hum);
      o.start();
    }
    await c.resume();
  }
  setVolume(value: number) {
    this.volume = value;
    this.apply();
  }
  toggle() {
    this.muted = !this.muted;
    this.apply();
  }
  private apply() {
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume * 0.45,
        this.ctx.currentTime,
        0.1,
      );
  }
  area(area: AreaId) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.rain?.gain.setTargetAtTime(area === 'street' ? 0.24 : 0.07, t, 0.6);
    this.lowpass?.frequency.setTargetAtTime(area === 'street' ? 1900 : 250, t, 0.6);
    this.hum?.gain.setTargetAtTime(area === 'den' ? 0.08 : 0.04, t, 0.6);
  }
  tone(frequency: number, duration = 0.12, gain = 0.08, type: OscillatorType = 'sine', delay = 0) {
    if (!this.ctx || !this.master) return;
    const c = this.ctx,
      t = c.currentTime + delay;
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.009);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  clue() {
    this.tone(523.25, 0.22, 0.12);
    this.tone(783.99, 0.35, 0.08, 'sine', 0.13);
  }
  deduction() {
    [261.63, 329.63, 392, 523.25].forEach((f, i) => this.tone(f, 0.7, 0.08, 'sine', i * 0.12));
  }
  step() {
    this.tone(70 + Math.random() * 25, 0.055, 0.06, 'triangle');
  }
  shot() {
    this.tone(100, 0.09, 0.18, 'sawtooth');
    this.tone(48, 0.13, 0.16, 'triangle');
  }
  hit() {
    this.tone(185, 0.07, 0.11, 'square');
  }
  suspend() {
    void this.ctx?.suspend();
  }
  resume() {
    void this.ctx?.resume();
  }
}
