/** Deliberate conversation gestures; the idle body and soles stay where the artist put them. */
export type LyraReaction = 'idle' | 'walk' | 'listen' | 'speak' | 'project';
export interface LyraReactionTiming {
  loop: boolean;
  poses: readonly { frame: number; duration: number }[];
}
export const LYRA_REACTION_TIMING: Record<LyraReaction, LyraReactionTiming> = {
  idle: { loop: true, poses: [{ frame: 0, duration: 1 }] },
  walk: {
    loop: true,
    poses: Array.from({ length: 6 }, (_, frame) => ({ frame, duration: 0.125 })),
  },
  listen: {
    loop: false,
    poses: [
      { frame: 0, duration: 0.18 },
      { frame: 1, duration: 1 },
    ],
  },
  speak: {
    loop: true,
    poses: [
      { frame: 0, duration: 0.24 },
      { frame: 1, duration: 0.45 },
      { frame: 2, duration: 0.55 },
      { frame: 1, duration: 0.5 },
      { frame: 0, duration: 1.15 },
    ],
  },
  project: {
    loop: false,
    poses: [
      { frame: 0, duration: 0.16 },
      { frame: 1, duration: 0.24 },
      { frame: 2, duration: 1 },
    ],
  },
};

/** Supply seconds since entering this reaction, rather than the world clock. */
export function lyraReactionFrame(reaction: LyraReaction, time: number): number {
  const clip = LYRA_REACTION_TIMING[reaction];
  const duration = clip.poses.reduce((sum, pose) => sum + pose.duration, 0);
  let phase = Number.isFinite(time) ? Math.max(0, time) : 0;
  if (clip.loop) phase %= duration;
  for (const pose of clip.poses) {
    if (phase < pose.duration) return pose.frame;
    phase -= pose.duration;
  }
  return clip.poses.at(-1)!.frame;
}

type Span = readonly [y: number, start: number, end: number];
const BENT_ARM: readonly Span[] = [
  [31, 18, 19],
  [32, 18, 19],
  [33, 18, 23],
  [34, 18, 24],
  [35, 18, 24],
  [36, 18, 23],
  [37, 20, 21],
];
const PRESENTING_ARM: readonly Span[] = [
  [27, 28, 29],
  [28, 27, 30],
  [29, 27, 30],
  [30, 26, 29],
  [31, 25, 28],
  [32, 20, 27],
  [33, 20, 26],
  [34, 20, 25],
];

function copyPixel(
  source: Uint8ClampedArray,
  target: Uint8ClampedArray,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
) {
  const from = (sy * 32 + sx) * 4;
  const to = (dy * 32 + dx) * 4;
  if (source[from + 3]) target.set(source.subarray(from, from + 4), to);
}

/** Source inputs are the composited, unmodified 32×64 MV cells: idle, row1/col0, row2/col2. */
export function makeLyraReactionPixels(
  idle: Uint8ClampedArray,
  bentArm: Uint8ClampedArray,
  presentingArm: Uint8ClampedArray,
) {
  if ([idle, bentArm, presentingArm].some((pixels) => pixels.length !== 32 * 64 * 4))
    throw new Error('Lyra acting requires 32×64 source cells.');

  const attention = idle.slice();
  // A single-pixel head inclination; the neck still overlaps the authored shoulders.
  for (let y = 20; y <= 27; y++) attention.fill(0, (y * 32 + 12) * 4, (y * 32 + 21) * 4);
  for (let y = 20; y <= 27; y++)
    for (let x = 12; x <= 19; x++) copyPixel(idle, attention, x, y, x + 1, y);

  function gesture(
    source: Uint8ClampedArray,
    spans: readonly Span[],
    offsetX: number,
    offsetY: number,
  ) {
    const pixels = idle.slice();
    // The old sleeve's outside edge would otherwise hang below the raised elbow.
    // Its inner contour belongs to the torso and remains connected to the waist.
    for (let y = 31; y <= 36; y++) pixels.fill(0, (y * 32 + 19) * 4, (y * 32 + 21) * 4);
    for (const [y, first, last] of spans)
      for (let x = first; x <= last; x++) copyPixel(source, pixels, x, y, x + offsetX, y + offsetY);
    return pixels;
  }
  const lowered = gesture(bentArm, BENT_ARM, 0, 0);
  const raised = gesture(bentArm, BENT_ARM, 0, -1);
  const presenting = gesture(presentingArm, PRESENTING_ARM, -2, -1);
  return {
    listen: [idle.slice(), attention],
    speak: [idle.slice(), lowered, raised],
    project: [idle.slice(), raised.slice(), presenting],
  };
}

/** Optional emitter attachment in source-cell coordinates; only the held presenting pose emits. */
export function lyraProjectionSocket(time: number) {
  return lyraReactionFrame('project', time) === 2 ? { x: 26.5, y: 26 } : null;
}
