/**
 * Scripted camera and caption timelines.
 *
 * A script is data: keyframed tracks for the continuous values (where the
 * camera looks, how close it is, how far down the crane has come, the fade
 * and the letterbox), timed captions, and one-shot cues. Sampling is a pure
 * function of time, so a skipped, paused or resized cinematic always lands on
 * the same frame, and the whole thing can be tested without a browser.
 */

export type Ease = 'linear' | 'in-out' | 'out';
export interface Key {
  at: number;
  value: number;
  /** Shapes the segment arriving at this key. */
  ease?: Ease;
}
export type TrackId = 'focus' | 'zoom' | 'lift' | 'fade' | 'bars';
export type Voice = 'dispatch' | 'gravity' | 'card';
export interface Caption {
  from: number;
  to: number;
  voice: Voice;
  kicker: string;
  text: string;
}
export type Cue =
  | { at: number; kind: 'place'; x: number; facing: 1 | -1 }
  | { at: number; kind: 'walk'; x: number }
  | { at: number; kind: 'sound'; sound: 'dispatch' | 'sting' };
export interface Script {
  duration: number;
  tracks: Record<TrackId, Key[]>;
  captions: Caption[];
  cues: Cue[];
}
export interface Shot {
  /** World x the camera centres on. */
  focus: number;
  /** Display scale over the native canvas; 1 is the play framing. */
  zoom: number;
  /** Vertical framing while zoomed, 0 at the rooftops and 1 at the pavement. */
  lift: number;
  /** Black over the scene, 0–1. */
  fade: number;
  /** Letterbox, 0–1. */
  bars: number;
  caption: (Caption & { alpha: number; shown: number }) | null;
}

/** Characters per second for typed dispatch text. */
const TYPE_RATE = 42;
/** Seconds a caption takes to fade in and out. */
const CAPTION_FADE = 0.45;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
function shape(u: number, ease: Ease = 'in-out') {
  if (ease === 'linear') return u;
  if (ease === 'out') return 1 - (1 - u) ** 3;
  return u * u * (3 - 2 * u);
}
export function sampleTrack(keys: Key[], t: number) {
  if (t <= keys[0].at) return keys[0].value;
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t < b.at) {
      const a = keys[i - 1];
      return a.value + (b.value - a.value) * shape((t - a.at) / (b.at - a.at), b.ease);
    }
  }
  return keys[keys.length - 1].value;
}
export function sample(script: Script, t: number): Shot {
  const tr = script.tracks;
  const active = script.captions.find((c) => t >= c.from && t < c.to);
  return {
    focus: sampleTrack(tr.focus, t),
    zoom: sampleTrack(tr.zoom, t),
    lift: sampleTrack(tr.lift, t),
    fade: sampleTrack(tr.fade, t),
    bars: sampleTrack(tr.bars, t),
    caption: active
      ? {
          ...active,
          alpha: Math.min(
            clamp01((t - active.from) / CAPTION_FADE),
            clamp01((active.to - t) / CAPTION_FADE),
          ),
          // Dispatch reads off a terminal; the detective's thoughts arrive whole.
          shown:
            active.voice === 'dispatch'
              ? Math.min(active.text.length, Math.floor((t - active.from) * TYPE_RATE))
              : active.text.length,
        }
      : null,
  };
}
/** Cues whose time falls in (from, to]; a cue at exactly 0 fires on the first step. */
export function cuesBetween(script: Script, from: number, to: number) {
  return script.cues.filter((c) => (c.at > from || (from === 0 && c.at === 0)) && c.at <= to);
}

/** Playback state for one run of a script. */
export class Cinematic {
  time = 0;
  constructor(readonly script: Script) {}
  get done() {
    return this.time >= this.script.duration;
  }
  /** Advances the clock and returns the cues that fired during the step. */
  step(dt: number) {
    const from = this.time;
    this.time = Math.min(this.script.duration, this.time + dt);
    return cuesBetween(this.script, from, this.time);
  }
  get shot() {
    return sample(this.script, this.time);
  }
  /** Every walk or placement the skipped remainder would have made, in order. */
  remainder() {
    return cuesBetween(this.script, this.time, this.script.duration).filter(
      (c) => c.kind !== 'sound',
    );
  }
}

/** Where Gravity stands when the player takes over; also a fresh save's spawn. */
export const INTRO_MARK = 440;

/**
 * Issue 01 opening. Dispatch over black, a crane down through the signs to
 * the studio, then the camera finds Gravity already walking in and follows
 * her gaze back to Marlon's door.
 */
export const INTRO: Script = {
  duration: 35.5,
  tracks: {
    focus: [
      { at: 0, value: 1040 },
      { at: 11, value: 1040 },
      { at: 16, value: 470 },
      { at: 22, value: 450 },
      { at: 27, value: 900 },
      { at: 33.8, value: 900 },
      { at: 35.2, value: INTRO_MARK },
    ],
    zoom: [
      { at: 0, value: 1.45 },
      { at: 11, value: 1.12, ease: 'out' },
      { at: 16, value: 1 },
      { at: 17, value: 1 },
      { at: 22, value: 1.6 },
      { at: 27, value: 1.12 },
      { at: 33.8, value: 1.12 },
      { at: 35.2, value: 1 },
    ],
    lift: [
      { at: 0, value: 0 },
      { at: 3, value: 0 },
      { at: 11, value: 1, ease: 'out' },
      { at: 17, value: 1 },
      { at: 22, value: 0.95 },
      { at: 27, value: 0.6 },
      { at: 35.2, value: 0.6 },
    ],
    fade: [
      { at: 0, value: 1 },
      { at: 3, value: 1 },
      { at: 5.5, value: 0 },
      { at: 30.4, value: 0 },
      { at: 31.4, value: 0.85 },
      { at: 33.8, value: 0.85 },
      { at: 35.2, value: 0 },
    ],
    bars: [
      { at: 0, value: 1 },
      { at: 33.8, value: 1 },
      { at: 35.2, value: 0 },
    ],
  },
  captions: [
    {
      from: 0.6,
      to: 4.8,
      voice: 'dispatch',
      kicker: 'DISPATCH · 02:31',
      text: 'Unit Gravity. Sector 7, Fremont Avenue. One deceased.',
    },
    {
      from: 5.8,
      to: 10,
      voice: 'dispatch',
      kicker: 'DISPATCH · 02:31',
      text: 'Artist. Augmented. No cause of death on file.',
    },
    {
      from: 16.4,
      to: 20.8,
      voice: 'gravity',
      kicker: 'GRAVITY',
      text: 'Rain again. This city washes itself every night and never comes clean.',
    },
    {
      from: 21.2,
      to: 25.6,
      voice: 'gravity',
      kicker: 'GRAVITY',
      text: 'Marlon Graves. Painter. Half his mind on loan to a machine.',
    },
    {
      from: 26,
      to: 30.4,
      voice: 'gravity',
      kicker: 'GRAVITY',
      text: 'Whatever killed him didn’t leave a mark. It took something out.',
    },
    {
      from: 30.8,
      to: 34.6,
      voice: 'card',
      kicker: 'ISSUE 01 · FRAGMENTS',
      text: 'The last work',
    },
  ],
  cues: [
    { at: 0, kind: 'place', x: 32, facing: 1 },
    { at: 0.5, kind: 'sound', sound: 'dispatch' },
    { at: 5.6, kind: 'sound', sound: 'dispatch' },
    { at: 12.4, kind: 'walk', x: INTRO_MARK },
    { at: 30.8, kind: 'sound', sound: 'sting' },
  ],
};
