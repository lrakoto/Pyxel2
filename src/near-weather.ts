import type { SignLight } from './content.ts';

/** Cached, feathered vapor; fixed world sources avoid a screen-space fog overlay. */
export class NearWeather {
  private vapor = document.createElement('canvas');
  constructor() {
    this.vapor.width = 128;
    this.vapor.height = 64;
    const c = this.vapor.getContext('2d')!;
    const g = c.createRadialGradient(64, 32, 0, 64, 32, 60);
    g.addColorStop(0, '#a0bdbb70');
    g.addColorStop(0.45, '#698c8a30');
    g.addColorStop(1, '#698c8a00');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 64);
  }
  draw(
    c: CanvasRenderingContext2D,
    cam: number,
    time: number,
    lights: SignLight[],
    reduced: boolean,
    ambientWind = 0,
  ) {
    c.save();
    const wind =
      reduced || !Number.isFinite(ambientWind) ? 0 : Math.max(-1, Math.min(1, ambientWind));
    // Sparse vents occupy the bottom plane and move faster than the actors.
    for (const anchor of [590, 1510]) {
      const x = anchor - cam * 1.12;
      if (x < -220 || x > c.canvas.width + 160) continue;
      c.fillStyle = '#0c1719';
      c.fillRect(x - 23, 516, 46, 5);
      c.fillStyle = '#415351';
      for (let i = 0; i < 8; i++) c.fillRect(x - 20 + i * 5, 516, 2, 1);
      c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const life = reduced ? (i + 0.4) / 4 : (time * 0.14 + i * 0.25 + anchor * 0.001) % 1;
        c.globalAlpha = Math.sin(life * Math.PI) * 0.2;
        const width = 42 + life * 100;
        // New vapor remains pinned to its grate; the higher billows catch more
        // of the same gust that bends rain and Gravity's scarf.
        c.drawImage(
          this.vapor,
          x - width / 2 + life * 32 + wind * life * life * 60,
          507 - life * 44 - Math.abs(wind) * life * 7,
          width,
          25 + life * 25,
        );
      }
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
    }
    // Wet rims on the same near-plane railings used by drawNearArchitecture.
    for (const anchor of [85, 1630]) {
      const x = anchor - cam * 1.16;
      const illumination = lights.reduce(
        (sum, light) => sum + Math.max(0, 1 - Math.abs(light.x - anchor) / 250) * light.intensity,
        0,
      );
      c.fillStyle = '#9abdb6';
      c.globalAlpha = Math.min(0.32, 0.08 + illumination * 0.1);
      for (let i = 0; i < 9; i++) c.fillRect(x + 7 + i * 17, 477, 3 + (i % 3), 1);
      if (!reduced) {
        for (let i = 0; i < 3; i++) {
          const life = (time * 0.43 + i * 0.33) % 1;
          c.globalAlpha = (1 - life) * 0.22;
          c.fillRect(x + 12 + i * 58, 483 + life * 46, 1, 2 + life * 3);
        }
      }
    }
    c.restore();
  }
}
