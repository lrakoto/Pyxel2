import type { AreaId } from './content.ts';

export interface FootRipple {
  x: number;
  y: number;
  age: number;
}
/** Distance-based emission stays independent of refresh rate; bounded transient storage. */
export class FootWater {
  ripples: FootRipple[] = [];
  footprints: FootRipple[] = [];
  private foot = 1;
  private previous: number | null = null;
  private distance = 0;
  reset() {
    this.ripples = [];
    this.footprints = [];
    this.previous = null;
    this.distance = 0;
  }
  step(dt: number, x: number, ground: number, wet: boolean, moving: boolean, reduced: boolean) {
    this.footprints = this.footprints.filter((r) => (r.age += Math.max(0, dt)) < 3.2);
    this.ripples = this.ripples.filter((r) => (r.age += Math.max(0, dt)) < 0.85);
    if (reduced) {
      this.reset();
      return;
    }
    const delta = this.previous === null ? 0 : Math.abs(x - this.previous);
    this.previous = x;
    if (!moving || !wet || delta > 80) {
      this.distance = 0;
      return;
    }
    this.distance += delta;
    if (this.distance >= 25) {
      this.distance %= 25;
      this.ripples.push({ x, y: ground + 5, age: 0 });
      this.foot *= -1;
      this.footprints.push({ x, y: ground - 5 + this.foot * 2, age: 0 });
      if (this.footprints.length > 20) this.footprints.shift();
      if (this.ripples.length > 12) this.ripples.shift();
    }
  }
  draw(c: CanvasRenderingContext2D, cam: number) {
    c.save();
    c.fillStyle = '#0b1b1b';
    for (const f of this.footprints) {
      c.globalAlpha = 0.22 * (1 - f.age / 3.2);
      c.fillRect(f.x - cam - 3, f.y, 6, 2);
    }
    c.strokeStyle = '#a3c9c0';
    c.lineWidth = 1;
    for (const r of this.ripples) {
      c.globalAlpha = (1 - r.age / 0.85) * 0.36;
      c.beginPath();
      c.ellipse(r.x - cam, r.y, 3 + r.age * 30, 1 + r.age * 6, 0, 0, Math.PI * 2);
      c.stroke();
      if (r.age < 0.28) {
        c.fillStyle = '#b7d3c5';
        for (let i = 0; i < 4; i++)
          c.fillRect(
            r.x - cam + (i - 1.5) * r.age * 48,
            r.y - Math.sin((r.age / 0.28) * Math.PI) * (3 + (i % 2) * 4),
            1,
            2,
          );
      }
    }
    c.restore();
  }
}

/**
 * Near-plane props thin out over a figure standing behind them, as the street poles do, so an
 * examination or an arrival never happens behind solid furniture. `clear` is in screen space.
 */
export function foregroundAlpha(left: number, width: number, clear?: { x: number; half: number }) {
  if (!clear) return 1;
  const gap = Math.abs(left + width / 2 - clear.x) - width / 2 - clear.half;
  return 0.3 + 0.7 * Math.min(1, Math.max(0, gap) / 24);
}

/** Foreground objects are deliberately at the edges of evidence compositions. */
export function drawInteriorForeground(
  c: CanvasRenderingContext2D,
  area: AreaId,
  cam: number,
  time: number,
  plate?: HTMLCanvasElement,
  clear?: { x: number; half: number },
) {
  if (area === 'street') return;
  c.save();
  const offset = cam * 1.075;
  c.strokeStyle = '#0b1518';
  c.lineWidth = 5;
  for (const anchor of [180, 1010]) {
    const x = anchor - offset;
    c.beginPath();
    c.moveTo(x, 0);
    c.bezierCurveTo(x - 15, 65, x + 22, 90, x + 9, 158);
    c.stroke();
    c.fillStyle = '#243333';
    c.fillRect(x + 5, 154, 8, 14);
  }
  if (area === 'studio') {
    for (const anchor of [480, 1390]) {
      const x = anchor - offset;
      c.globalAlpha = foregroundAlpha(x, 96, clear);
      c.fillStyle = '#101818';
      c.beginPath();
      c.moveTo(x, 510);
      c.lineTo(x + 40, 326);
      c.lineTo(x + 50, 326);
      c.lineTo(x + 84, 516);
      c.lineTo(x + 75, 516);
      c.lineTo(x + 45, 355);
      c.lineTo(x + 9, 514);
      c.fill();
      c.fillStyle = '#30332c';
      c.fillRect(x + 8, 341, 78, 102);
      c.fillStyle = '#151e1d';
      c.fillRect(x + 13, 346, 68, 90);
      // Reuse a painted canvas from the authored studio plate so texture density,
      // brushwork and palette stay consistent across depth planes.
      if (plate) {
        c.drawImage(
          plate,
          plate.width * 0.394,
          plate.height * 0.535,
          plate.width * 0.027,
          plate.height * 0.2,
          x + 13,
          346,
          68,
          90,
        );
        c.fillStyle = '#08141280';
        c.fillRect(x + 13, 346, 68, 90);
      }
      c.fillStyle = '#494636';
      c.fillRect(x + 10, 345, 1, 95);
      c.fillRect(x + 81, 352, 1, 75);
      c.fillStyle = '#4b4938';
      c.fillRect(x + 8, 341, 78, 2);
      c.fillStyle = '#151d1c';
      c.fillRect(x, 443, 96, 7);
    }
  } else {
    for (const anchor of [70, 1390]) {
      const x = anchor - offset;
      const alpha = foregroundAlpha(x, 80, clear);
      c.globalAlpha = alpha;
      c.fillStyle = '#0b171b';
      c.fillRect(x, 310, 80, 218);
      c.fillStyle = '#2b3b3e';
      c.fillRect(x, 310, 3, 218);
      for (let row = 0; row < 5; row++) {
        const y = 329 + row * 34;
        c.fillStyle = '#17282c';
        c.fillRect(x + 9, y, 61, 25);
        c.fillStyle = '#536354';
        c.fillRect(x + 14, y + 5, 24, 3);
        c.fillStyle = '#79b9a0';
        c.globalAlpha = alpha * (0.5 + Math.sin(time * 0.7 + row) * 0.15);
        c.fillRect(x + 58, y + 8, 2, 2);
        c.globalAlpha = alpha;
      }
    }
  }
  c.restore();
}

/** Mei occupies the serving window, with the counter masking her lower body. */
export function drawMei(c: CanvasRenderingContext2D, cam: number, time: number, speaking: boolean) {
  c.save();
  c.translate(Math.round(180 - cam), 347);
  const bob = Math.sin(time * 1.4) > 0.6 ? 1 : 0;
  c.scale(0.9, 0.9);
  c.translate(0, bob);
  c.fillStyle = '#202c2c';
  c.fillRect(-10, 13, 20, 22);
  c.fillStyle = '#765d49';
  c.fillRect(-6, 0, 12, 14);
  c.fillStyle = '#b58a64';
  c.fillRect(-3, 3, 8, 10);
  c.fillStyle = '#172021';
  c.fillRect(-7, -3, 13, 6);
  c.fillRect(-9, 0, 4, 10);
  c.fillRect(-11, 4, 4, 5);
  c.fillStyle = '#22292a';
  c.fillRect(-2, 6, 2, 1);
  c.fillRect(3, 6, 2, 1);
  c.fillStyle = '#c4a17c';
  c.fillRect(1, 8, 2, 2);
  c.fillStyle = '#593c34';
  c.fillRect(0, 11, speaking ? 4 : 3, speaking && Math.sin(time * 9) > 0 ? 2 : 1);
  c.fillStyle = '#9c987b';
  c.fillRect(-5, 17, 11, 18);
  c.fillStyle = '#c6b28d';
  c.fillRect(-4, 17, 1, 17);
  c.fillRect(5, 17, 1, 17);
  c.fillStyle = '#34403b';
  c.fillRect(-12, 20, 5, 13);
  const wipe = !speaking && time % 17 < 4 ? Math.sin(time * 3) * 5 : 0;
  c.beginPath();
  c.moveTo(8, 20);
  c.lineTo(13, 20);
  c.lineTo(12 + wipe, 33);
  c.lineTo(7 + wipe, 33);
  c.closePath();
  c.fill();
  c.fillStyle = '#ad8663';
  c.fillRect(-10, 31, 7, 3);
  c.fillRect(5 + wipe, 31, 7, 3);
  c.fillStyle = '#c5b793';
  if (wipe) c.fillRect(5 + wipe, 33, 9, 2);
  else {
    c.fillRect(-1, 29, 7, 4);
    c.fillStyle = '#39322b';
    c.fillRect(-2, 28, 9, 2);
  }
  c.fillStyle = '#1b2524';
  c.fillRect(-23, 35, 48, 6);
  c.fillStyle = '#6c634a';
  c.fillRect(-23, 35, 48, 1);
  c.restore();
}
