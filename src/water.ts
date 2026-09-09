import type { SignLight } from './content.ts';
import { flickerOf } from './lighting.ts';

/**
 * Standing and falling water inside a room.
 *
 * The street sells its weather with rain, puddles and reflections. Interiors
 * had none of that, so a room read as sealed and dry however good the plate
 * was. These four features put the same weather indoors without repainting
 * anything: rain seen through an opening, water running down glass, a leak
 * from the ceiling, and puddles that catch whatever light is above them.
 *
 * Every feature is a deterministic function of time, so nothing accumulates
 * state and a scene cut cannot leave a drip half-fallen.
 */
export interface WaterRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Leak {
  x: number;
  /** The y it falls from, and the y it lands at. */
  from: number;
  to: number;
}

export interface Puddle {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface AreaWater {
  /** Openings onto the outside, where the rain is visible falling past. */
  openings?: WaterRect[];
  /** Glass with the weather running down it. */
  panes?: WaterRect[];
  leaks?: Leak[];
  puddles?: Puddle[];
}

/** Rain seen through a doorway: harder and brighter than the interior air. */
export function drawOpenings(
  c: CanvasRenderingContext2D,
  cam: number,
  t: number,
  openings: WaterRect[],
) {
  for (const o of openings) {
    const x = o.x - cam;
    if (x + o.w < -20 || x > c.canvas.width + 20) continue;
    c.save();
    c.beginPath();
    c.rect(x, o.y, o.w, o.h);
    c.clip();
    // A cool wash, so the outside reads colder than the room.
    c.fillStyle = '#7fa8c022';
    c.fillRect(x, o.y, o.w, o.h);
    c.strokeStyle = '#cfe4f0';
    c.lineWidth = 0.9;
    c.globalAlpha = 0.34;
    c.beginPath();
    for (let i = 0; i < 46; i++) {
      const speed = 300 + (i % 5) * 90;
      const sx = x + ((i * 53.7) % o.w);
      const sy = o.y + (((i * 37.1 + t * speed) % (o.h + 40)) - 20);
      c.moveTo(sx, sy);
      c.lineTo(sx - 4, sy + 15);
    }
    c.stroke();
    c.globalAlpha = 1;
    c.restore();
  }
}

/**
 * Droplets running down the inside of glass. They accelerate as they go and
 * leave a thin trail, which is what separates running water from falling
 * rain — the drop is stuck to the pane, not passing it.
 */
export function drawPanes(c: CanvasRenderingContext2D, cam: number, t: number, panes: WaterRect[]) {
  for (const p of panes) {
    const x = p.x - cam;
    if (x + p.w < -20 || x > c.canvas.width + 20) continue;
    c.save();
    c.beginPath();
    c.rect(x, p.y, p.w, p.h);
    c.clip();
    c.globalCompositeOperation = 'lighter';
    // Most drops cling and barely move; a few break loose and run. All of
    // them moving at once reads as rain behind glass rather than on it.
    const trailLength = Math.max(8, p.h * 0.16);
    for (let i = 0; i < 16; i++) {
      const seed = i * 127.3 + p.x * 0.31;
      const runner = i % 4 === 0;
      const period = runner ? 6 + (seed % 5) : 26 + (seed % 17);
      const phase = (((t + seed) % period) + period) % period;
      const progress = (phase / period) ** (runner ? 2 : 1.2);
      const dx = x + ((seed * 37.7) % p.w);
      const dy = p.y + progress * p.h;
      const size = runner ? 1.5 : 1;
      if (runner) {
        const trail = c.createLinearGradient(0, dy - trailLength, 0, dy);
        trail.addColorStop(0, '#bcd8e800');
        trail.addColorStop(1, '#bcd8e83a');
        c.fillStyle = trail;
        c.fillRect(dx - size * 0.4, dy - trailLength, size * 0.8, trailLength);
      }
      c.fillStyle = '#dcecf6';
      c.globalAlpha = runner ? 0.42 : 0.24;
      c.fillRect(dx - size / 2, dy, size, size * 1.5);
      c.globalAlpha = 1;
    }
    c.restore();
  }
}

/**
 * A ceiling leak. Returns the leaks that landed this frame so the caller can
 * sound them; the fall itself is a pure function of time.
 */
export function drawLeaks(
  c: CanvasRenderingContext2D,
  cam: number,
  t: number,
  dt: number,
  leaks: Leak[],
): number {
  let landed = 0;
  for (const leak of leaks) {
    const x = leak.x - cam;
    if (x < -20 || x > c.canvas.width + 20) continue;
    const period = 2.4 + (leak.x % 13) * 0.1;
    const offset = leak.x * 0.017;
    const now = (t + offset) / period;
    if (Math.floor(now) !== Math.floor((t - dt + offset) / period)) landed++;
    const progress = now - Math.floor(now);
    const drop = leak.from + (leak.to - leak.from) * progress * progress;

    c.save();
    c.globalCompositeOperation = 'lighter';
    // The drop, stretched by how fast it is going.
    const stretch = 2 + progress * 6;
    c.fillStyle = '#cfe4f0';
    c.globalAlpha = 0.65;
    c.fillRect(Math.round(x), Math.round(drop), 1, stretch);
    // Water gathering at the ceiling before it goes.
    c.globalAlpha = 0.4 * (1 - progress);
    c.fillRect(Math.round(x) - 1, leak.from - 2, 3, 3);
    // The ring where the last one landed.
    const ring = progress < 0.35 ? progress / 0.35 : 0;
    if (ring > 0) {
      c.globalAlpha = 0.3 * (1 - ring);
      c.strokeStyle = '#cfe4f0';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(x, leak.to, 2 + ring * 13, 1 + ring * 4, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
  }
  return landed;
}

/**
 * Standing water. A puddle is only interesting because of what is above it,
 * so each one smears the colour of every light within reach down its length
 * and lets the ripples break it up.
 */
export function drawPuddles(
  c: CanvasRenderingContext2D,
  cam: number,
  t: number,
  puddles: Puddle[],
  lights: SignLight[],
) {
  for (const p of puddles) {
    const x = p.x - cam;
    if (x + p.rx < -20 || x - p.rx > c.canvas.width + 20) continue;

    // Nothing here is clipped to the puddle's outline. An ellipse clip — or a
    // stroked rim — gives the water a crisp edge, and a crisp edge on a floor
    // reads as a circle drawn on it. The puddle is defined by where the sheen
    // fades out instead.
    const oval = (radius: number, paint: (g: CanvasGradient) => void, alpha: number) => {
      c.save();
      c.globalAlpha = alpha;
      c.translate(x, p.y);
      c.scale(1, p.ry / p.rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, radius);
      paint(g);
      c.fillStyle = g;
      c.fillRect(-radius, -radius, radius * 2, radius * 2);
      c.restore();
    };

    // Standing water is darker than the floor it sits on, and it fades out.
    oval(
      p.rx,
      (g) => {
        g.addColorStop(0, 'rgba(9,18,22,0.46)');
        g.addColorStop(0.7, 'rgba(9,18,22,0.2)');
        g.addColorStop(1, 'rgba(9,18,22,0)');
      },
      1,
    );

    c.globalCompositeOperation = 'lighter';
    for (const light of lights) {
      const lx = light.x - cam;
      const gap = Math.abs(lx - x);
      if (gap > p.rx + 150) continue;
      const power = light.intensity * flickerOf(light, t) * (1 - gap / (p.rx + 150));
      if (power < 0.05) continue;
      const wobble = Math.sin(t * 1.7 + light.x) * 2;
      const reach = Math.min(p.rx * 0.8, 44);
      c.save();
      c.globalAlpha = Math.min(0.4, power * 0.28);
      c.translate(lx + wobble, p.y);
      c.scale(0.55, p.ry / p.rx);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, reach);
      g.addColorStop(0, light.color);
      g.addColorStop(0.45, `${light.color}5c`);
      g.addColorStop(1, `${light.color}00`);
      c.fillStyle = g;
      c.fillRect(-reach, -reach, reach * 2, reach * 2);
      c.restore();
    }

    // A single faint ring travelling out, fading before it reaches the edge,
    // so the ripple never draws the puddle's boundary for it.
    const life = (((t * 0.42 + p.x * 0.01) % 1) + 1) % 1;
    c.save();
    c.globalAlpha = 0.09 * (1 - life) * (1 - life);
    c.strokeStyle = '#9fc4d4';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(x, p.y, life * p.rx * 0.62, life * p.ry * 0.62, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    c.globalCompositeOperation = 'source-over';
  }
}
