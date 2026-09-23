/** Exploration-only animation. Combat keeps its existing frame selection. */
export class CharacterMotion {
  private facing = 1;
  private turn = 0;
  private previousTag = '';
  private clock = 0;
  private previousSpeed = 0;
  private settle = 0;
  update(
    dt: number,
    facing: number,
    speed: number,
    examining: boolean,
    speaking: boolean,
    reduced: boolean,
  ) {
    if (Math.abs(this.previousSpeed) > 8 && Math.abs(speed) <= 8) this.settle = 0.45;
    this.previousSpeed = speed;
    this.settle = Math.max(0, this.settle - Math.max(0, dt));
    const lean = reduced
      ? 0
      : Math.sin((this.settle / 0.45) * Math.PI) * 0.016 * facing -
        (examining || speaking ? 0 : Math.max(-1, Math.min(1, speed / 290)) * 0.045);
    if (facing !== this.facing) {
      this.facing = facing;
      this.turn = 0.16;
    }
    const tag = examining
      ? 'examine'
      : speaking
        ? 'listen'
        : this.turn > 0 && !reduced
          ? 'turn'
          : Math.abs(speed) > 200
            ? 'sprint'
            : Math.abs(speed) > 8
              ? 'stride'
              : 'breathe';
    if (tag !== this.previousTag) {
      if (!(['stride', 'sprint'].includes(tag) && ['stride', 'sprint'].includes(this.previousTag)))
        this.clock = 0;
      this.previousTag = tag;
    }
    const moving = tag === 'stride' || tag === 'sprint';
    if (!reduced || moving)
      this.clock += Math.max(0, dt) * (moving ? Math.min(2, Math.abs(speed) / 145) : 1);
    this.turn = Math.max(0, this.turn - Math.max(0, dt));
    return { lean, tag, time: reduced && !moving ? 0 : this.clock };
  }
}

/** Motion-clock seconds per stride or sprint loop; the sprite picks frames over the same span. */
export const MOTION_LOOP = 0.8;
/**
 * Where a foot lands, as fractions of each loop. Measured off Gravity's
 * frames: the walk strikes on its two widest strides (frames 1 and 9 of 16),
 * the run on the frame after each airborne stretch (3 and 7 of 8).
 */
export const FOOTFALLS: Record<string, number[]> = {
  stride: [0, 0.5],
  sprint: [0.25, 0.75],
};
/** True when the motion clock passed a footfall between two samples. */
export function footfallBetween(tag: string, from: number, to: number) {
  const marks = FOOTFALLS[tag];
  if (!marks || to <= from) return false;
  // A clock that restarts at zero lands the first foot straight away.
  if (from === 0 && marks.includes(0)) return true;
  const a = from / MOTION_LOOP,
    b = to / MOTION_LOOP;
  return marks.some((m) => Math.floor(a - m) !== Math.floor(b - m));
}

/** Authored frame timing; holds an examination's settled pose rather than waving forever. */
export function storyFrameIndex(tag: string, seconds: number, count: number) {
  if (count <= 1) return 0;
  const rate =
    tag === 'breathe' || tag === 'idle' ? 2 : tag === 'examine' ? 7 : tag === 'listen' ? 3 : 10;
  const frame = Math.floor(Math.max(0, seconds) * rate);
  return tag === 'examine' || tag === 'turn' ? Math.min(count - 1, frame) : frame % count;
}
