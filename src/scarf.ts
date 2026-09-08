import type { RimLight } from './lighting.ts';
import { rimColor } from './lighting.ts';

/**
 * Cole's scarf tail, ported from the original prototype's cloth ribbon.
 *
 * A thin ribbon simulated as a verlet chain of point masses pinned at his
 * neck. Gravity pulls it down, air drag damps it, and a wind force
 * proportional to his velocity — plus turbulent gusts — pushes it back and
 * aloft. Distance constraints keep the segments together. Because each point
 * carries its own momentum the motion propagates down the cloth: the tip lags
 * and overshoots, a wave runs through it when he starts or stops, and the
 * gusts make it flutter, rather than the whole thing swinging as one rigid
 * flap. At rest it simply hangs.
 *
 * The original ran in three.js world units with Cole 1.92 units tall. Here the
 * chain lives in world pixels, so every length is expressed as a fraction of
 * his on-screen height and multiplied up. Speed-proportional forces (wind,
 * loft) need no conversion: the height cancels out of `loft * speed`.
 */
const TUNING = {
  /**
   * Ribbon length, as a fraction of Cole's height. The original prototype
   * used 1.15 / 1.92 = 0.6, which hangs to the ankles; the character sheet
   * this sprite follows drapes only to the hip, so the tail is shortened to
   * match. Everything else about the cloth is the original's tuning.
   */
  length: 0.38,
  /** Half-width, same fraction (0.045 / 1.92). */
  halfWidth: 0.045 / 1.92,
  /** Downward pull, in Cole-heights per second squared. */
  gravity: 4.5 / 1.92,
  /** Verlet velocity retained per step. */
  damping: 0.8,
  /** Backward drag proportional to his speed. */
  wind: 0,
  /** How far his speed lifts the tail toward horizontal. */
  loft: 1.6,
  /** Gust strength, in Cole-heights per second squared. */
  flutter: 3 / 1.92,
  /** Constraint relaxation passes: more passes read as cloth, not rope. */
  stiffness: 14,
  /** Multiplier on the neon edge glow along the lit side. */
  glow: 2,
} as const;

/** Segment length as a fraction of height, from the original's 0.062 world units. */
const SEGMENT = 0.062 / 1.92;
const BODY = '#c8382f';

export class Scarf {
  private x: number[] = [];
  private y: number[] = [];
  private ox: number[] = [];
  private oy: number[] = [];
  private rows = 0;
  private segLen = 0;
  private height = 0;
  private t = 0;

  /** Rebuilds the chain hanging straight down from the anchor. */
  private build(anchorX: number, anchorY: number, height: number) {
    const segs = Math.max(6, Math.min(28, Math.round(TUNING.length / SEGMENT)));
    this.rows = segs + 1;
    this.height = height;
    this.segLen = (TUNING.length * height) / segs;
    this.x = [];
    this.y = [];
    this.ox = [];
    this.oy = [];
    for (let i = 0; i < this.rows; i++) {
      this.x[i] = anchorX;
      this.y[i] = anchorY + i * this.segLen;
      this.ox[i] = this.x[i];
      this.oy[i] = this.y[i];
    }
  }

  /** Drops the chain — call when the scene cuts, so it doesn't whip across. */
  reset() {
    this.rows = 0;
  }

  /**
   * Advances the cloth. `anchor` is the neck in world pixels, `vx` his
   * velocity in pixels per second, `height` his current on-screen height.
   */
  step(dt: number, anchorX: number, anchorY: number, vx: number, height: number) {
    if (!this.rows || this.height !== height) this.build(anchorX, anchorY, height);
    this.t += dt;
    const h = Math.min(dt, 1 / 30); // a stall must not explode the sim

    this.x[0] = anchorX;
    this.y[0] = anchorY;
    this.ox[0] = anchorX;
    this.oy[0] = anchorY;

    const speed = Math.abs(vx);
    const gravity = TUNING.gravity * height;
    const windX = -Math.sign(vx) * speed * TUNING.wind;
    const loft = speed * TUNING.loft;
    const flutter = TUNING.flutter * height;
    for (let i = 1; i < this.rows; i++) {
      const tip = i / (this.rows - 1);
      const gust =
        (Math.sin(this.t * 3.2 + i * 0.7) * 0.6 + Math.sin(this.t * 6.4 + i * 1.3) * 0.35) *
        flutter;
      const breeze = Math.sin(this.t * 1.3 + i * 0.45) * 0.25 * flutter;
      const fx = windX * tip + (gust + breeze) * (0.35 + 0.55 * tip);
      // Canvas y grows downward, so gravity adds and loft subtracts.
      const fy = gravity - loft * tip - gust * 0.35;
      const vX = (this.x[i] - this.ox[i]) * TUNING.damping;
      const vY = (this.y[i] - this.oy[i]) * TUNING.damping;
      this.ox[i] = this.x[i];
      this.oy[i] = this.y[i];
      this.x[i] += vX + fx * h * h;
      this.y[i] += vY + fy * h * h;
    }

    for (let pass = 0; pass < TUNING.stiffness; pass++) {
      for (let i = 0; i < this.rows - 1; i++) {
        const dx = this.x[i + 1] - this.x[i];
        const dy = this.y[i + 1] - this.y[i];
        const dist = Math.hypot(dx, dy) || 1e-5;
        const diff = (dist - this.segLen) / dist;
        if (i === 0) {
          this.x[i + 1] -= dx * diff;
          this.y[i + 1] -= dy * diff;
        } else {
          this.x[i] += dx * diff * 0.5;
          this.y[i] += dy * diff * 0.5;
          this.x[i + 1] -= dx * diff * 0.5;
          this.y[i + 1] -= dy * diff * 0.5;
        }
      }
    }
  }

  /**
   * Lays the ribbon's two edges across each chain point along the local
   * perpendicular, so its width stays constant as the cloth bends.
   */
  private edges(): { lx: number[]; ly: number[]; rx: number[]; ry: number[] } {
    const half = TUNING.halfWidth * this.height;
    const lx: number[] = [],
      ly: number[] = [],
      rx: number[] = [],
      ry: number[] = [];
    for (let r = 0; r < this.rows; r++) {
      const a = Math.max(0, r - 1);
      const b = Math.min(this.rows - 1, r + 1);
      let tx = this.x[b] - this.x[a];
      let ty = this.y[b] - this.y[a];
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;
      lx[r] = this.x[r] - -ty * half;
      ly[r] = this.y[r] - tx * half;
      rx[r] = this.x[r] + -ty * half;
      ry[r] = this.y[r] + tx * half;
    }
    return { lx, ly, rx, ry };
  }

  /**
   * Draws the ribbon at `cam` offset. The neon edge glow lights only the side
   * facing the light, and a glint drifts along the cloth, both as in the
   * original's scarf shader.
   */
  draw(c: CanvasRenderingContext2D, cam: number, rim: RimLight | null) {
    if (!this.rows) return;
    const { lx, ly, rx, ry } = this.edges();
    c.save();
    c.beginPath();
    c.moveTo(lx[0] - cam, ly[0]);
    for (let r = 1; r < this.rows; r++) c.lineTo(lx[r] - cam, ly[r]);
    for (let r = this.rows - 1; r >= 0; r--) c.lineTo(rx[r] - cam, ry[r]);
    c.closePath();
    c.fillStyle = BODY;
    c.fill();

    if (rim) {
      const lit = rim.dirX >= 0 ? { ex: rx, ey: ry } : { ex: lx, ey: ly };
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rimColor(rim);
      c.lineWidth = Math.max(1, TUNING.halfWidth * this.height);
      c.lineJoin = 'round';
      c.globalAlpha = Math.min(1, (rim.strength * TUNING.glow * Math.abs(rim.dirX)) / 3);
      c.beginPath();
      c.moveTo(lit.ex[0] - cam, lit.ey[0]);
      for (let r = 1; r < this.rows; r++) c.lineTo(lit.ex[r] - cam, lit.ey[r]);
      c.stroke();

      // The glint catch: a short bright band drifting along the cloth.
      const at = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(this.t * 1.5));
      const i = Math.min(this.rows - 2, Math.max(0, Math.round(at * (this.rows - 1))));
      c.globalAlpha = Math.min(1, rim.strength * (0.2 + 0.15 * Math.abs(Math.sin(this.t * 2.1))));
      c.lineWidth = Math.max(1, TUNING.halfWidth * this.height * 1.6);
      c.beginPath();
      c.moveTo(this.x[i] - cam, this.y[i]);
      c.lineTo(this.x[i + 1] - cam, this.y[i + 1]);
      c.stroke();
    }
    c.restore();
  }
}
