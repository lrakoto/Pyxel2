/** A room changes only under full cover; controls resume after the arrival is visible. */
export class AreaTransition {
  private elapsed = 0;
  private swapped = false;
  private finished = false;
  readonly fade: number;
  readonly hold: number;
  constructor(ride: boolean, reducedMotion: boolean) {
    this.fade = reducedMotion ? 0 : 0.35;
    this.hold = ride ? 1.1 : 0.08;
  }
  step(dt: number) {
    if (this.finished) return { opacity: 0, swap: false, done: false };
    this.elapsed += Number.isFinite(dt) ? Math.max(0, dt) : 0;
    const swap = !this.swapped && this.elapsed >= this.fade;
    if (swap) this.swapped = true;
    const uncover = this.fade + this.hold;
    // Always expose at least one covered frame, including after a delayed frame.
    const done = !swap && this.elapsed >= uncover + this.fade;
    if (done) this.finished = true;
    const opacity = swap
      ? 1
      : this.elapsed < this.fade
        ? this.elapsed / this.fade
        : this.elapsed < uncover
          ? 1
          : this.fade
            ? Math.max(0, 1 - (this.elapsed - uncover) / this.fade)
            : 0;
    return { opacity, swap, done };
  }
}
