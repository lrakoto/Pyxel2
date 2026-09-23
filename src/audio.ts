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
  /**
   * Flat noise for transients. The shared buffer is a random walk, dark by
   * design for rain and rumble, with almost nothing up where a tap lives.
   */
  private white: AudioBuffer | null = null;
  private dripBuffers: AudioBuffer[] = [];
  private dripIndex = 0;
  private lastDripAt = -Infinity;
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
    const white = (this.white = c.createBuffer(1, c.sampleRate, c.sampleRate));
    const flat = white.getChannelData(0);
    for (let i = 0; i < flat.length; i++) flat[i] = Math.random() * 2 - 1;
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

    // Optional foley must not hold up entering the game on a slow connection.
    void this.loadDrips(c);
    await c.resume();
  }
  private async loadDrips(context: AudioContext) {
    // Bundled CC0 field recordings: no runtime third-party requests.
    await Promise.allSettled(
      ['a', 'b', 'c'].map(async (variant) => {
        const response = await fetch(`${import.meta.env.BASE_URL}audio/drip-${variant}.wav?v=2`);
        if (!response.ok) throw new Error('Drip sample unavailable');
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        this.dripBuffers.push(buffer);
      }),
    );
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

  /** Recorded faucet impacts with the tub rumble removed, varied between landings. */
  drip(strength = 1) {
    if (!this.ctx || !this.master || this.muted || this.ctx.state !== 'running') return;
    const c = this.ctx;
    const t = c.currentTime;
    const level = Math.max(0, Math.min(1, strength)) * (0.8 + Math.random() * 0.2);
    if (!level) return;
    // Two leaks landing in one frame should not double the foreground volume.
    if (t - this.lastDripAt < 0.075) return;
    this.lastDripAt = t;
    const buffer = this.dripBuffers.length
      ? this.dripBuffers[this.dripIndex++ % this.dripBuffers.length]
      : null;
    if (!buffer) {
      // A failed asset request should leave a soft wet tap, not a UI chime.
      this.burst(0.045, 0.1 * level, 2800, 0.65);
      return;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.96 + Math.random() * 0.08;
    const gain = c.createGain();
    // These are short, high-crest-factor transients. Leave their peak intact so
    // the actual splash is audible above the much longer interior hum/rain bed.
    gain.gain.value = 0.22 * level;
    source.connect(gain);
    gain.connect(this.master);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(t);
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
  /** A police radio opening: squelch, then the two-tone call. */
  dispatch() {
    this.sweep(0.22, 0.09, 3200, 900, 'bandpass', 2.2);
    this.tone(1175, 0.08, 0.05, 'square', 0.18);
    this.tone(880, 0.1, 0.05, 'square', 0.3);
  }
  /** Under the chapter card: a low fifth that decays with the rain. */
  sting() {
    this.tone(55, 2.8, 0.14, 'sine');
    this.tone(82.41, 2.4, 0.07, 'sine', 0.06);
    this.tone(659.25, 1.6, 0.025, 'triangle', 0.1);
  }
  clue() {
    this.tone(523.25, 0.22, 0.12);
    this.tone(783.99, 0.35, 0.08, 'sine', 0.13);
  }
  deduction() {
    [261.63, 329.63, 392, 523.25].forEach((f, i) => this.tone(f, 0.7, 0.08, 'sine', i * 0.12));
  }
  /** A short, sharp-edged burst of the shared noise through a band. */
  private burst(duration: number, gain: number, frequency: number, q: number, delay = 0) {
    if (!this.ctx || !this.master || !this.white) return;
    const c = this.ctx;
    const t = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = this.white;
    // Start somewhere different in the buffer so no two taps are identical.
    const offset = Math.random() * (this.white.duration - duration - 0.05);
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t, offset);
    src.stop(t + duration + 0.02);
    src.onended = () => {
      src.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }
  /**
   * A light footfall: a bright heel tick with a little body under it, pitched
   * high enough to read on laptop speakers. Indoors it knocks on board; on the
   * street the tick lands in water and throws a small splash after it.
   */
  step(strength = 1) {
    const vary = 0.8 + Math.random() * 0.4;
    this.burst(0.035, 0.6 * strength * vary, 2600 + Math.random() * 900, 1.4);
    this.tone(140 + Math.random() * 40, 0.05, 0.09 * strength, 'triangle');
    if (this.interior) {
      this.tone(260 + Math.random() * 60, 0.03, 0.03 * strength, 'square');
    } else {
      this.burst(0.08, 0.22 * strength * vary, 4200 + Math.random() * 1200, 0.9, 0.012);
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
