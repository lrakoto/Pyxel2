/** Exploration-only animation. Combat keeps its existing frame selection. */
export class CharacterMotion {
  private facing = 1;
  private turn = 0;
  private previousTag = '';
  private clock = 0;
  update(
    dt: number,
    facing: number,
    speed: number,
    examining: boolean,
    speaking: boolean,
    reduced: boolean,
  ) {
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
          : Math.abs(speed) > 8
            ? 'stride'
            : 'breathe';
    if (tag !== this.previousTag) {
      this.clock = 0;
      this.previousTag = tag;
    }
    if (!reduced || tag === 'stride')
      this.clock += Math.max(0, dt) * (tag === 'stride' ? Math.min(1.4, Math.abs(speed) / 145) : 1);
    this.turn = Math.max(0, this.turn - Math.max(0, dt));
    return { tag, time: reduced && tag !== 'stride' ? 0 : this.clock };
  }
}

/** Authored frame timing; holds an examination's settled pose rather than waving forever. */
export function storyFrameIndex(tag: string, seconds: number, count: number) {
  if (count <= 1) return 0;
  const rate =
    tag === 'breathe' || tag === 'idle' ? 2 : tag === 'examine' ? 7 : tag === 'listen' ? 3 : 10;
  const frame = Math.floor(Math.max(0, seconds) * rate);
  return tag === 'examine' || tag === 'turn' ? Math.min(count - 1, frame) : frame % count;
}
