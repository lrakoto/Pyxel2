import type { AreaId } from './content.ts';
/** One persistent ambience graph. The browser's audio clock handles fades. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private rain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private hum: GainNode | null = null;
  /** Distant voices and footfall on the pavement. */
  private city: GainNode | null = null;
  /** The low roll of traffic somewhere out of frame. */
  private rumble: GainNode | null = null;
  /** Shared noise, so every one-shot doesn't rebuild four seconds of it. */
  private noise: AudioBuffer | null = null;
  private interior = false;
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
    const buffer = (this.noise = c.createBuffer(1, c.sampleRate * 4, c.sampleRate));
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

    // The crowd: a band of noise around the voice register, slowly wandering
    // so it reads as a street full of people rather than a hiss.
    const city = (this.city = c.createGain());
    city.gain.value = 0;
    city.connect(master);
    const voices = c.createBufferSource();
    voices.buffer = buffer;
    voices.loop = true;
    voices.playbackRate.value = 0.7;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 620;
    band.Q.value = 0.9;
    voices.connect(band);
    band.connect(city);
    voices.start();
    // A slow wander on the band, which is what stops it sitting still.
    const wander = c.createOscillator();
    const wanderDepth = c.createGain();
    wander.frequency.value = 0.07;
    wanderDepth.gain.value = 180;
    wander.connect(wanderDepth);
    wanderDepth.connect(band.frequency);
    wander.start();

    // Traffic somewhere out of frame.
    const rumble = (this.rumble = c.createGain());
    rumble.gain.value = 0;
    rumble.connect(master);
    const roll = c.createBufferSource();
    roll.buffer = buffer;
    roll.loop = true;
    roll.playbackRate.value = 0.35;
    const low = c.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 110;
    roll.connect(low);
    low.connect(rumble);
    roll.start();

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
    const street = area === 'street';
    this.interior = !street;
    this.rain?.gain.setTargetAtTime(street ? 0.24 : 0.07, t, 0.6);
    this.lowpass?.frequency.setTargetAtTime(street ? 1900 : 250, t, 0.6);
    this.hum?.gain.setTargetAtTime(area === 'den' ? 0.08 : 0.04, t, 0.6);
    // Indoors the city is still out there, just through a wall.
    this.city?.gain.setTargetAtTime(street ? 0.075 : 0.012, t, 0.8);
    this.rumble?.gain.setTargetAtTime(street ? 0.09 : 0.03, t, 0.8);
  }

  /**
   * A shaped burst of the shared noise. Everything that moves past the camera
   * — traffic, the train — is a filter sweep on this rather than a sample.
   */
  private sweep(
    duration: number,
    gain: number,
    from: number,
    to: number,
    type: BiquadFilterType = 'bandpass',
    q = 1.1,
  ) {
    if (!this.ctx || !this.master || !this.noise) return;
    const c = this.ctx;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + duration);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + duration * 0.32);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + duration + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }

  /** A car crossing the frame: a band sweeping down as it goes by. */
  traffic(strength = 1) {
    const near = Math.min(1.4, Math.max(0.4, strength));
    this.sweep(0.85 / near, 0.16 * near, 1500 * near, 320, 'bandpass', 0.8);
    this.tone(46, 0.5, 0.05 * near, 'sine');
  }

  /** The elevated train crossing: a long roll with rail squeal over it. */
  train(duration = 3.4) {
    this.sweep(duration, 0.1, 240, 90, 'lowpass', 0.6);
    this.sweep(duration * 0.8, 0.035, 2600, 1500, 'bandpass', 3.5);
    for (let i = 0; i < 3; i++)
      this.tone(1850 + i * 420, 0.5, 0.012, 'sine', duration * (0.25 + i * 0.16));
  }

  /** Water landing in a puddle. */
  drip() {
    const f = 700 + Math.random() * 500;
    this.tone(f, 0.09, 0.035, 'sine');
    this.tone(f * 0.5, 0.14, 0.02, 'sine', 0.02);
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
  /**
   * A boot landing. Indoors it is a dry knock on board; on the street the
   * same knock lands in standing water, so it gets a wet slap over it.
   */
  step() {
    this.tone(70 + Math.random() * 25, 0.055, 0.055, 'triangle');
    if (this.interior) {
      this.tone(150 + Math.random() * 60, 0.035, 0.02, 'square');
    } else {
      this.sweep(0.09, 0.05, 2400 + Math.random() * 900, 900, 'bandpass', 1.4);
    }
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
