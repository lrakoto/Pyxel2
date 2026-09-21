/** Covered torso study, composited at native sprite resolution. */
export class BodyMotion {
  offset = 0;
  private velocity = 0;
  private previousSpeed = 0;
  update(dt: number, speed: number, phase: number, reduced = false) {
    if (reduced) {
      this.offset = this.velocity = 0;
      this.previousSpeed = speed;
      return 0;
    }
    const step = Math.min(0.05, Math.max(0, dt));
    const moving = Math.abs(speed) > 8;
    const target = moving ? Math.sin(phase * Math.PI * 4 - 0.7) * 0.9 : 0;
    // A small inertial response on acceleration and braking, then damped settling.
    this.velocity +=
      Math.max(-1, Math.min(1, (Math.abs(speed) - Math.abs(this.previousSpeed)) / 145)) * 2;
    this.previousSpeed = speed;
    const count = Math.max(1, Math.ceil(step / 0.008));
    for (let i = 0; i < count; i++) {
      const h = step / count;
      this.velocity += ((target - this.offset) * 600 - this.velocity * 20) * h;
      this.offset = Math.max(-1, Math.min(1, this.offset + this.velocity * h));
    }
    return Math.round(this.offset);
  }
}
const cache = new WeakMap<CanvasImageSource, Map<string, HTMLCanvasElement>>();
export function bodyStudyFrame(
  source: HTMLImageElement | HTMLCanvasElement,
  motion: string,
  offset: number,
) {
  // Tumbling jump silhouettes need a separate authored pass.
  if (motion === 'jump') return source;
  const key = `${motion}:${offset}`;
  let variants = cache.get(source);
  if (!variants) {
    variants = new Map();
    cache.set(source, variants);
  }
  const existing = variants.get(key);
  if (existing) return existing;
  const result = document.createElement('canvas');
  result.width = source.width;
  result.height = source.height;
  const c = result.getContext('2d')!;
  c.drawImage(source, 0, 0);
  const original = c.getImageData(0, 0, result.width, result.height);
  let right = 0,
    bottom = 0;
  for (let y = 0; y < result.height; y++)
    for (let x = 0; x < result.width; x++) {
      const i = (y * result.width + x) * 4;
      if (
        original.data[i] === 216 &&
        original.data[i + 1] === 181 &&
        original.data[i + 2] === 104
      ) {
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  if (!right) return source;
  const x = right - (motion === 'sprint' ? 5 : 2);
  const y = bottom + 4;
  // The fixed shoulder attachment stays still; the lower contour moves one pixel.
  c.fillStyle = '#242c38';
  c.fillRect(x - 2, y, 5, 6);
  c.fillStyle = '#343d4a';
  c.fillRect(x, y + 1 + offset, 5, 4);
  c.fillStyle = '#242c38';
  c.fillRect(x + 4, y + 2 + offset, 2, 3);
  c.fillStyle = '#161d29';
  c.fillRect(x, y + 5 + offset, 5, 1);
  c.fillStyle = '#48515d';
  c.fillRect(x + 1, y + 1 + offset, 3, 1);
  // Forearms/hands stay in front of clothing, preserving the original arm swing.
  const edited = c.getImageData(0, 0, result.width, result.height);
  for (let i = 0; i < original.data.length; i += 4) {
    const color = (original.data[i] << 16) | (original.data[i + 1] << 8) | original.data[i + 2];
    if (color === 0xffb164 || color === 0xb15c51)
      edited.data.set(original.data.subarray(i, i + 4), i);
  }
  c.putImageData(edited, 0, 0);
  variants.set(key, result);
  return result;
}
