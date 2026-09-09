import type { SignLight } from './content.ts';
import { flickerOf } from './lighting.ts';

/** Deterministic per-index noise, so nothing has to carry state. */
function hash(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/** Reused for the soft-edged puddle reflections. */
const mirror = document.createElement('canvas');

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

/**
 * Rain seen through a doorway.
 *
 * The hard part is that it must not read as a sheet of water. Evenly spaced
 * streaks of equal length and brightness are exactly what a sheet looks like,
 * and a flat wash over the opening gives the whole thing a rectangle. So the
 * streaks are scattered by hash rather than by index, their length, speed and
 * opacity all vary, a few near ones fall much brighter and faster than the
 * rest, and the wash is a gradient that fades out at the edges of the opening.
 */
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

    // Cold air in the gap, fading at both ends so the opening has no edge of
    // its own — the doorway's own frame is already in the plate.
    const wash = c.createLinearGradient(0, o.y, 0, o.y + o.h);
    wash.addColorStop(0, '#7fa8c000');
    wash.addColorStop(0.35, '#7fa8c016');
    wash.addColorStop(1, '#8fb2c604');
    c.fillStyle = wash;
    c.fillRect(x, o.y, o.w, o.h);

    c.lineCap = 'round';
    // Fine droplets rather than streaks: seen through a doorway across a
    // street, rain is a spatter of small marks, and long strokes read as a
    // downpour running down the glass of the camera instead.
    for (let i = 0; i < 54; i++) {
      const near = hash(i, 3) > 0.86;
      const speed = near ? 560 + hash(i, 4) * 200 : 250 + hash(i, 5) * 160;
      const length = near ? 7 + hash(i, 6) * 4 : 2.5 + hash(i, 7) * 3;
      const sx = x + hash(i, 1) * o.w;
      const span = o.h + length + 30;
      const sy = o.y - length + ((hash(i, 2) * span + t * speed) % span);
      c.strokeStyle = '#cfe4f0';
      c.globalAlpha = (near ? 0.34 : 0.12) + hash(i, 8) * 0.09;
      c.lineWidth = near ? 0.85 : 0.5;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx - length * 0.26, sy + length);
      c.stroke();
    }
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
      const period = runner ? 3.2 + (seed % 3) : 22 + (seed % 15);
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
    // Water falls fast. A drop crossing a room-height gap over two and a half
    // seconds averages well under walking pace, which is what reads as floaty
    // however hard the easing works.
    const period = 1.05 + (leak.x % 13) * 0.055;
    const offset = leak.x * 0.017;
    const now = (t + offset) / period;
    if (Math.floor(now) !== Math.floor((t - dt + offset) / period)) landed++;
    const progress = now - Math.floor(now);
    const drop = leak.from + (leak.to - leak.from) * progress * progress;

    c.save();
    c.globalCompositeOperation = 'lighter';
    // The drop, stretched by how fast it is going.
    const stretch = 2 + progress * 9;
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
        g.addColorStop(0, 'rgba(9,18,22,0.4)');
        g.addColorStop(0.7, 'rgba(9,18,22,0.18)');
        g.addColorStop(1, 'rgba(9,18,22,0)');
      },
      1,
    );

    // What actually makes a puddle read as one: the room standing in it.
    //
    // The slice sampled is deliberately tall — most of the wall above the
    // water, not the strip directly over it. Sampling just above the surface
    // only ever finds more floor, which is dark and featureless, and the
    // reflection disappears. Squashing a tall slice into a shallow band is
    // also what a real puddle does at this grazing an angle.
    // Compression is a balance: too little and the reflection is a mirror,
    // too much and whatever is standing in it is squashed into a smear. A
    // shallow band holding most of the wall was doing the latter, so the band
    // is deeper and the slice it samples is shorter.
    const band = Math.max(8, Math.round(p.ry * 3.4));
    const width = Math.round(p.rx * 2);
    const source = Math.round(Math.min(p.y, 210));
    if (width > 4 && source > 20) {
      if (mirror.width !== width || mirror.height !== band) {
        mirror.width = width;
        mirror.height = band;
      }
      const m = mirror.getContext('2d')!;
      m.globalCompositeOperation = 'source-over';
      m.clearRect(0, 0, width, band);
      m.save();
      m.translate(0, band);
      m.scale(1, -1);
      m.drawImage(
        c.canvas,
        Math.round(x - p.rx),
        Math.round(p.y - source),
        width,
        source,
        Math.round(Math.sin(t * 1.3 + p.x) * 1.5),
        0,
        width,
        band,
      );
      m.restore();
      // Fade on both axes so nothing draws the puddle's boundary. A radial
      // alone leaves a hard cut across a band this wide and shallow, because
      // its falloff is set by the width and never reaches the top or bottom.
      m.globalCompositeOperation = 'destination-in';
      const across = m.createLinearGradient(0, 0, width, 0);
      across.addColorStop(0, 'rgba(0,0,0,0)');
      across.addColorStop(0.35, 'rgba(0,0,0,0.95)');
      across.addColorStop(0.65, 'rgba(0,0,0,0.95)');
      across.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = across;
      m.fillRect(0, 0, width, band);
      // Strongest at the water line and fading with distance from it.
      const down = m.createLinearGradient(0, 0, 0, band);
      down.addColorStop(0, 'rgba(0,0,0,0.95)');
      down.addColorStop(0.55, 'rgba(0,0,0,0.6)');
      down.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = down;
      m.fillRect(0, 0, width, band);
      // Composited additively: a reflection of a dark room drawn normally is
      // just more dark, and vanishes. Adding it keeps only what is actually
      // bright up there — the bulb, the lit canvas, the receiver — which is
      // the part a wet floor would show anyway.
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.72;
      c.drawImage(mirror, Math.round(x - p.rx), Math.round(p.y - band * 0.22));
      c.restore();
    }

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
      c.globalAlpha = Math.min(0.55, power * 0.42);
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
