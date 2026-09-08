import type { SignLight } from './content.ts';
import { rimAt, flickerOf } from './lighting.ts';
import { drawFlare } from './flare.ts';
import { buildRimMasks, paintRim, type RimMasks } from './rim-mask.ts';

/**
 * Traffic across the near lanes of the road.
 *
 * A car is a foreground pass, not scenery: it enters off-screen, crosses in
 * front of the whole scene, and leaves, with a long randomised gap before the
 * next one so it stays an event rather than a loop.
 *
 * At night on a wet street almost nothing of a car's body reads — what reads
 * is its lights. So the chassis stays a near-black silhouette with a single
 * rim highlight, and the work is done by additive passes: the headlight beam
 * thrown down the road ahead, the underglow, the tail wash, and the smeared
 * reflection below. Those are drawn before the frame's bottom vignette, so
 * they have to be bright enough to survive it.
 */
export interface Car {
  x: number;
  dir: 1 | -1;
  speed: number;
  lane: number;
  body: HTMLCanvasElement;
  masks: RimMasks;
  tint: string;
}

/** Seconds between passes, randomised in this range. */
const GAP_MIN = 3.5;
const GAP_MAX = 10;
/**
 * Road line, scale and pace per lane. The far lane is sized so its roof stays
 * below the kerb — anything taller would occlude the pavement and stop
 * reading as the far side of the road. The near lane is between the camera
 * and the kerb, so it is free to cross it.
 */
const LANES = [
  { y: 506, scale: 1.1, speed: 305 },
  { y: 528, scale: 1.85, speed: 430 },
];
const BODIES = ['#0e1319', '#141118', '#0d161a', '#181113'];
const TINTS = ['#ff5a3c', '#4fe6e0', '#ffb347', '#c65cff'];

/**
 * A sedan is about three and a half times longer than it is tall; drawing it
 * much flatter than that reads as squashed. The wheels touch the very bottom
 * of the frame, so the canvas bottom is the car's contact line with the road.
 */
const CAR_W = 220;
const CAR_H = 74;
/** How far either side of a sign the specular catch reaches, in world pixels. */
const GLINT_RANGE = 260;
/** How square to a light the bodywork must be before it catches a flare. */
const CAR_CATCH = 0.4;
/** Half-length of the moving highlight along the body, in car pixels. */
const GLINT_WIDTH = 34;

/** Scratch for masking the glint streak to the car's silhouette. */
const glintBuffer = document.createElement('canvas');
glintBuffer.width = CAR_W;
glintBuffer.height = CAR_H;

/**
 * A low cyberpunk sedan: cabin set well back over the rear axle, a long hood
 * running out to a dropped nose, and a short boot behind — the front half is
 * deliberately the longer one. Dark body, lit cabin, one wet highlight along
 * the top.
 */
function buildCar(body: string, tint: string): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = CAR_W;
  cv.height = CAR_H;
  const c = cv.getContext('2d')!;
  c.imageSmoothingEnabled = false;

  // Wheels first, so the arches cut into them rather than the other way
  // round. Full ellipses: a half-arc leaves them flat-bottomed and the car
  // reads as sliced off at the road.
  c.fillStyle = '#0a0d10';
  c.beginPath();
  c.ellipse(56, 57, 17, 17, 0, 0, Math.PI * 2);
  c.ellipse(152, 57, 17, 17, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#252c32';
  c.beginPath();
  c.ellipse(56, 56, 8, 7, 0, 0, Math.PI * 2);
  c.ellipse(152, 56, 8, 7, 0, 0, Math.PI * 2);
  c.fill();

  // Chassis: short boot, cabin over the rear axle, long hood to the nose.
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(12, 60);
  c.lineTo(16, 38);
  c.lineTo(52, 35);
  c.lineTo(70, 16);
  c.lineTo(112, 16);
  c.lineTo(142, 33);
  c.lineTo(200, 39);
  c.lineTo(206, 60);
  c.closePath();
  c.fill();

  // The wet highlight running along the roof and shoulder line.
  c.strokeStyle = '#4a5c66';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(16, 38);
  c.lineTo(52, 35);
  c.lineTo(70, 16);
  c.lineTo(112, 16);
  c.lineTo(142, 33);
  c.lineTo(200, 39);
  c.stroke();

  // Cabin glass, lit from the dash in the car's own tint.
  c.fillStyle = '#1e2a33';
  c.beginPath();
  c.moveTo(74, 19);
  c.lineTo(109, 19);
  c.lineTo(134, 32);
  c.lineTo(58, 32);
  c.closePath();
  c.fill();
  c.fillStyle = tint;
  c.globalAlpha = 0.22;
  c.fillRect(84, 27, 38, 3);
  c.globalAlpha = 1;

  // Sill shadow so the body sits down over the wheels.
  c.fillStyle = '#05070a';
  c.fillRect(18, 55, 186, 5);

  // Lamp clusters. The beam itself is additive and drawn in the scene.
  c.fillStyle = '#fff6de';
  c.fillRect(196, 41, 10, 8);
  c.fillStyle = '#ffd9a0';
  c.fillRect(194, 49, 12, 2);
  c.fillStyle = '#ff3a2a';
  c.fillRect(12, 42, 6, 7);
  return cv;
}

export class Traffic {
  private cars: Car[] = [];
  private next = 3 + Math.random() * 6;
  private glow = Traffic.radial('#ffe6b8');
  private red = Traffic.radial('#ff5540');

  private static radial(color: string): HTMLCanvasElement {
    const g = document.createElement('canvas');
    g.width = g.height = 64;
    const gc = g.getContext('2d')!;
    const r = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, color);
    r.addColorStop(1, color + '00');
    gc.fillStyle = r;
    gc.fillRect(0, 0, 64, 64);
    return g;
  }

  /** Cars live in screen space: a pass is over before the camera moves far. */
  step(dt: number, viewWidth: number) {
    this.next -= dt;
    if (this.next <= 0) {
      this.next = GAP_MIN + Math.random() * (GAP_MAX - GAP_MIN);
      const laneIndex = Math.random() < 0.45 ? 0 : 1;
      const lane = LANES[laneIndex];
      const dir: 1 | -1 = laneIndex === 0 ? 1 : -1;
      const tint = TINTS[(Math.random() * TINTS.length) | 0];
      const body = buildCar(BODIES[(Math.random() * BODIES.length) | 0], tint);
      this.cars.push({
        x: dir === 1 ? -360 : viewWidth + 360,
        dir,
        speed: lane.speed * (0.85 + Math.random() * 0.3),
        lane: laneIndex,
        body,
        masks: buildRimMasks(body, 0, 0, CAR_W, CAR_H),
        tint,
      });
    }
    for (const car of this.cars) car.x += car.dir * car.speed * dt;
    this.cars = this.cars.filter((car) => car.x > -460 && car.x < viewWidth + 460);
  }

  /**
   * The specular catch as a car passes a sign. The reflection point tracks
   * along the bodywork with the angle to the light — ahead of the car on the
   * approach, sweeping back along the flank as it passes — and peaks as it
   * draws level, which is what reads as a flash rather than a static shine.
   */
  private glint(
    c: CanvasRenderingContext2D,
    car: Car,
    worldX: number,
    y: number,
    lights: SignLight[],
    scale: number,
    time: number,
  ) {
    let best: SignLight | null = null;
    let bestWeight = 0;
    for (const light of lights) {
      const w =
        (light.intensity * flickerOf(light, time)) /
        Math.max(Math.abs(light.x - worldX) / GLINT_RANGE, 0.35);
      if (w > bestWeight) {
        bestWeight = w;
        best = light;
      }
    }
    if (!best) return;
    const offset = (best.x - worldX) / GLINT_RANGE;
    if (Math.abs(offset) > 1.6) return;
    // The rolling band still eases, because that is the light sliding along
    // the flank. The flare on top of it does not: it is a threshold, on only
    // while the bodywork is actually square to the light.
    const power = Math.max(0, 1 - Math.abs(offset) / 1.6) ** 2 * Math.min(1, best.intensity);
    if (power < 0.02) return;
    const caught = Math.abs(offset) < CAR_CATCH;
    const u = CAR_W * (0.5 + Math.max(-0.75, Math.min(0.75, offset * 0.85)) * car.dir);

    const sc = glintBuffer.getContext('2d')!;
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, CAR_W, CAR_H);
    sc.drawImage(car.body, 0, 0);
    // Kept only where the body is opaque, so the streak wraps the silhouette.
    sc.globalCompositeOperation = 'source-in';
    const band = sc.createLinearGradient(u - GLINT_WIDTH, 0, u + GLINT_WIDTH, 0);
    band.addColorStop(0, '#00000000');
    band.addColorStop(0.5, best.color);
    band.addColorStop(1, '#00000000');
    sc.fillStyle = band;
    sc.fillRect(0, 0, CAR_W, CAR_H);

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = Math.min(0.7, power * 0.75);
    c.imageSmoothingEnabled = false;
    c.drawImage(glintBuffer, -CAR_W / 2, -CAR_H);
    c.restore();
    // A brief flare off the bodywork at the peak of the pass.
    if (caught) {
      drawFlare(c, u - CAR_W / 2, -CAR_H * 0.8, 0.25 / scale, 0.9, best.color);
    }
  }

  /** `cam` converts a car's screen x to world x, so the signs light it. */
  draw(c: CanvasRenderingContext2D, cam: number, lights: SignLight[], time = 0) {
    for (const car of this.cars) {
      const lane = LANES[car.lane];
      const s = lane.scale;
      const w = CAR_W * s;
      const h = CAR_H * s;
      const x = Math.round(car.x);
      const y = Math.round(lane.y);
      const nose = x + car.dir * w * 0.47;
      const tail = x - car.dir * w * 0.47;

      // Reflection first, so the car and its lights sit on top of the smear.
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.15;
      c.translate(x, y);
      c.scale(car.dir * s, -s * 0.5);
      c.imageSmoothingEnabled = false;
      c.drawImage(car.body, -CAR_W / 2, -CAR_H);
      c.restore();

      c.save();
      c.globalCompositeOperation = 'lighter';
      // Headlight beam thrown down the road ahead.
      c.globalAlpha = 0.42;
      c.drawImage(this.glow, nose - w * 0.42, y - h * 0.8, w * 0.9, h * 1.3);
      c.globalAlpha = 0.26;
      c.drawImage(this.glow, nose + car.dir * w * 0.34 - w * 0.6, y - h * 0.34, w * 1.2, h * 0.9);
      // Underglow on the wet road.
      c.globalAlpha = 0.16;
      c.drawImage(this.glow, x - w * 0.5, y - h * 0.12, w, h * 0.55);
      // Tail wash.
      c.globalAlpha = 0.22;
      c.drawImage(this.red, tail - w * 0.22, y - h * 0.62, w * 0.44, h * 0.7);
      c.restore();

      // The lamp itself is a point source pointed near the camera, so it
      // flares; the tail lamp gets a much smaller one in its own red.
      drawFlare(c, nose, y - h * 0.28, 0.11 * s, 0.7);
      drawFlare(c, tail, y - h * 0.3, 0.05 * s, 0.26, '#ff5540');

      c.save();
      c.translate(x, y);
      c.scale(car.dir * s, s);
      c.imageSmoothingEnabled = false;
      c.drawImage(car.body, -CAR_W / 2, -CAR_H);
      // A wet roof catches the neon it is passing under, the same way the
      // characters do. Sampled at the cabin, not the road line, so a car
      // under a sign lights along its top edge rather than its sills.
      const rim = rimAt(lights, x + cam, y - h * 0.6, car.dir, time);
      if (rim) paintRim(c, car.masks, rim, -CAR_W / 2, -CAR_H, CAR_W, CAR_H);
      this.glint(c, car, x + cam, y, lights, s, time);
      c.restore();
    }
  }
}
