/** Transient reading position. Story effects remain owned by the conversation's close handler. */
export class DialogueReader {
  private lengths: number[] = [];
  private shown: number[] = [];
  index = 0;
  open(lines: readonly string[], instant = false) {
    this.lengths = lines.map((line) => line.length);
    this.shown = this.lengths.map((length) => (instant ? length : 0));
    this.index = 0;
  }
  get revealed() {
    return this.shown[this.index] ?? 0;
  }
  get complete() {
    return this.revealed >= (this.lengths[this.index] ?? 0);
  }
  get label() {
    return !this.complete
      ? 'Reveal line'
      : this.index < this.lengths.length - 1
        ? 'Continue'
        : 'Close';
  }
  tick(dt: number, instant: boolean) {
    if (!this.lengths.length) return;
    const length = this.lengths[this.index];
    this.shown[this.index] = instant
      ? length
      : Math.min(length, this.revealed + Math.max(0, dt) * 48);
  }
  advance(): 'reveal' | 'line' | 'close' | null {
    if (!this.lengths.length) return null;
    if (!this.complete) {
      this.shown[this.index] = this.lengths[this.index];
      return 'reveal';
    }
    if (this.index === this.lengths.length - 1) return 'close';
    this.index++;
    return 'line';
  }
  previous() {
    if (this.index === 0) return false;
    this.index--;
    return true;
  }
}

/** Native controls own Enter/Space; the game must not also consume their activation. */
export function nativeActivation(code: string, tag: string, role: string | null) {
  if (code !== 'Enter' && code !== 'Space') return false;
  return (
    ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(tag) ||
    ['button', 'link', 'checkbox', 'switch'].includes(role ?? '')
  );
}
