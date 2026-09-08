import { makePedFrames, mixHex, NIGHT_AIR } from './character-art.ts';

/**
 * Sidewalk foot traffic. The walkers stroll along x and wrap when they leave
 * the street, so it never reads as empty.
 *
 * Two things keep them grounded. They stand on the pavement line rather than
 * hovering above it, each with a soft contact shadow beneath — the original
 * prototype used the same trick, and without it a walking sprite reads as
 * floating no matter how good the animation is. And they are sorted into
 * depth lanes: a walker further back is drawn smaller, higher up the
 * pavement, and mixed further into the night air, so a crowd has depth
 * instead of being a row of identical cutouts at one height.
 */
export interface Walker {
  x: number;
  dir: 1 | -1;
  speed: number;
  /** 0 = back of the pavement, 1 = nearest the kerb. */
  depth: number;
  frames: HTMLCanvasElement[];
  umbrella: string | null;
  phase: number;
}

/** Coat tones, before the distance haze that each lane adds. */
const COATS = ['#2a2f3a', '#33303a', '#2b3530', '#3a2e2e', '#26303c', '#34343a', '#2d2a32'];
/** Rarer, slightly brighter coats so the crowd isn't uniform. */
const ACCENTS = ['#4a3550', '#3a4a55', '#534033'];
const UMBRELLAS = ['#1c222e', '#2a1f22', '#232a26'];

/** How far the back and front lanes sit into the night air. */
const HAZE_BACK = 0.62;
const HAZE_FRONT = 0.34;
/** Sprite height in pixels for the back and front lanes. */
const HEIGHT_BACK = 41;
const HEIGHT_FRONT = 55;
/** Pavement line for each lane, relative to the area's ground. */
const LIFT_BACK = 11;
const LIFT_FRONT = 1;

function pick<T>(list: T[], r: number): T {
  return list[Math.floor(r * list.length) % list.length];
}

/**
 * Deterministic per-index randomness, so a walker keeps its look across
 * reloads and the crowd doesn't reshuffle on every area change.
 */
function hash(i: number, salt: number): number {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export class Crowd {
  private walkers: Walker[] = [];
  private width = 0;

  /** Builds the crowd for a street of `width` pixels. */
  constructor(count: number, width: number) {
    this.width = width;
    for (let i = 0; i < count; i++) {
      const depth = hash(i, 1);
      const haze = HAZE_BACK + (HAZE_FRONT - HAZE_BACK) * depth;
      const coatRoll = hash(i, 2);
      const coat = coatRoll < 0.15 ? pick(ACCENTS, hash(i, 3)) : pick(COATS, hash(i, 3));
      this.walkers.push({
        x: (i / count) * width + hash(i, 4) * 40,
        dir: hash(i, 5) < 0.5 ? -1 : 1,
        speed: 15 + hash(i, 6) * 20,
        depth,
        frames: makePedFrames(hash(i, 7) < 0.5 ? 'coat' : 'hood', coat, haze),
        umbrella: hash(i, 8) < 0.45 ? mixHex(pick(UMBRELLAS, hash(i, 9)), NIGHT_AIR, haze) : null,
        phase: hash(i, 10) * 6,
      });
    }
  }

  step(dt: number) {
    for (const w of this.walkers) {
      w.x += w.dir * w.speed * dt;
      if (w.x < -60) w.x = this.width + 60;
      else if (w.x > this.width + 60) w.x = -60;
    }
  }

  /** `ground` is the pavement line the nearest lane stands on. */
  draw(c: CanvasRenderingContext2D, cam: number, time: number, ground: number) {
    for (const w of this.walkers) {
      const x = Math.round(w.x - cam);
      if (x < -70 || x > c.canvas.width + 70) continue;
      const height = HEIGHT_BACK + (HEIGHT_FRONT - HEIGHT_BACK) * w.depth;
      const y = Math.round(ground - (LIFT_BACK + (LIFT_FRONT - LIFT_BACK) * w.depth));

      // Contact shadow first: without it the walker reads as floating.
      c.save();
      c.globalAlpha = 0.28 + 0.12 * w.depth;
      c.fillStyle = '#000';
      c.beginPath();
      c.ellipse(x, y + 1, height * 0.2, height * 0.05, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();

      const frame = w.frames[Math.floor((time + w.phase) * 9) % w.frames.length];
      const fw = (height * frame.width) / frame.height;
      c.save();
      c.translate(x, y);
      c.scale(w.dir, 1);
      c.drawImage(frame, -fw / 2, -height, fw, height);
      c.restore();

      if (w.umbrella) {
        // The canopy sits just off the head and the shaft is drawn thick
        // enough to read: a thin one disappears against a dark coat and
        // leaves the canopy looking like it is floating on its own.
        const canopy = y - height * 1.0;
        const shaft = Math.max(1, Math.round(height * 0.035));
        c.fillStyle = w.umbrella;
        c.beginPath();
        c.ellipse(x, canopy, height * 0.34, height * 0.13, 0, Math.PI, Math.PI * 2);
        c.fill();
        c.fillRect(x - shaft / 2, canopy, shaft, height * 0.42);
      }
    }
  }
}
