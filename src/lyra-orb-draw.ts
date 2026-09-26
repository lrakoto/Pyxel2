import {
  ORB_PALETTE,
  ORB_SIZE,
  orbPixels,
  type HopState,
  type OrbEye,
  type OrbPoint,
  type OrbPose,
} from './lyra-orb.ts';

/** Shell frames are tiny and fixed, so each gaze and eye state is painted once. */
const frames = new Map<string, HTMLCanvasElement>();
function frame(gaze: -1 | 0 | 1, eye: OrbEye) {
  const key = `${gaze}:${eye}`;
  let canvas = frames.get(key);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = ORB_SIZE;
    const c = canvas.getContext('2d')!;
    orbPixels(gaze, eye).forEach((index, i) => {
      if (!index) return;
      c.fillStyle = ORB_PALETTE[index];
      c.fillRect(i % ORB_SIZE, Math.floor(i / ORB_SIZE), 1, 1);
    });
    frames.set(key, canvas);
  }
  return canvas;
}

const cyan = (alpha: number) => `rgba(94,240,234,${Math.max(0, alpha).toFixed(3)})`;

/**
 * Lyra's shell centred on (x, y) in screen space. `scale` is screen pixels per source pixel.
 * `shell` is how much of her is home: at 0 the eye is dark and only the casing floats.
 */
export function drawLyraOrb(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  pose: OrbPose,
  shell = 1,
) {
  const cy = y + pose.bob * scale;
  const size = Math.round(ORB_SIZE * scale);
  const light = pose.glow * shell;
  const eye: OrbEye = shell < 0.5 ? 'closed' : pose.eye;
  c.save();
  c.globalCompositeOperation = 'screen';
  const halo = c.createRadialGradient(x, cy, 0, x, cy, 18 * scale);
  halo.addColorStop(0, cyan(0.3 * light));
  halo.addColorStop(0.4, cyan(0.1 * light));
  halo.addColorStop(1, cyan(0));
  c.fillStyle = halo;
  c.fillRect(x - 18 * scale, cy - 18 * scale, 36 * scale, 36 * scale);
  c.globalCompositeOperation = 'source-over';
  c.imageSmoothingEnabled = false;
  c.drawImage(
    frame(pose.gaze, eye),
    Math.round(x - size / 2),
    Math.round(cy - size / 2),
    size,
    size,
  );
  c.globalCompositeOperation = 'screen';
  if (eye !== 'closed' && light > 0.05) {
    const ex = x + pose.gaze * scale;
    const bloom = c.createRadialGradient(ex, cy, 0, ex, cy, 5 * scale);
    bloom.addColorStop(0, cyan(0.55 * light));
    bloom.addColorStop(1, cyan(0));
    c.fillStyle = bloom;
    c.fillRect(ex - 5 * scale, cy - 5 * scale, 10 * scale, 10 * scale);
  }
  if (pose.ring !== null && shell > 0.5) {
    c.strokeStyle = cyan((1 - pose.ring) * 0.35);
    c.lineWidth = Math.max(1, scale * 0.6);
    c.beginPath();
    c.arc(x, cy, (9 + pose.ring * 12) * scale, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** The archive projection: a widening cone from her eye to the memory. */
export function drawLyraBeam(
  c: CanvasRenderingContext2D,
  from: OrbPoint,
  to: OrbPoint,
  scale: number,
  time: number,
  reducedMotion: boolean,
) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length < 1) return;
  const flicker = reducedMotion ? 1 : 0.85 + 0.15 * Math.sin(time * 23);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.translate(from.x, from.y);
  c.rotate(Math.atan2(to.y - from.y, to.x - from.x));
  const cone = c.createLinearGradient(0, 0, length, 0);
  cone.addColorStop(0, cyan(0.32 * flicker));
  cone.addColorStop(1, cyan(0.06 * flicker));
  c.fillStyle = cone;
  c.beginPath();
  c.moveTo(0, -1.5 * scale);
  c.lineTo(length, -14 * scale);
  c.lineTo(length, 14 * scale);
  c.lineTo(0, 1.5 * scale);
  c.fill();
  c.fillStyle = `rgba(216,255,251,${(0.3 * flicker).toFixed(3)})`;
  c.fillRect(0, -0.5 * scale, length, Math.max(1, scale));
  c.restore();
}

/** Her light between machines, and the machine she is occupying. Screen-space points. */
export function drawLyraHop(
  c: CanvasRenderingContext2D,
  state: HopState,
  machine: OrbPoint,
  spark: OrbPoint | null,
  scale: number,
  time: number,
) {
  c.save();
  c.globalCompositeOperation = 'screen';
  if (state.machine > 0) {
    const pulse = 0.85 + 0.15 * Math.sin(time * 12);
    const glow = c.createRadialGradient(machine.x, machine.y, 0, machine.x, machine.y, 24 * scale);
    glow.addColorStop(0, cyan(0.5 * state.machine * pulse));
    glow.addColorStop(0.5, cyan(0.14 * state.machine * pulse));
    glow.addColorStop(1, cyan(0));
    c.fillStyle = glow;
    c.fillRect(machine.x - 24 * scale, machine.y - 24 * scale, 48 * scale, 48 * scale);
  }
  if (spark) {
    const glow = c.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, 7 * scale);
    glow.addColorStop(0, cyan(0.9));
    glow.addColorStop(1, cyan(0));
    c.fillStyle = glow;
    c.fillRect(spark.x - 7 * scale, spark.y - 7 * scale, 14 * scale, 14 * scale);
    c.fillStyle = '#e8fffd';
    const core = Math.max(1, Math.round(scale * 1.5));
    c.fillRect(Math.round(spark.x - core / 2), Math.round(spark.y - core / 2), core, core);
  }
  c.restore();
}
