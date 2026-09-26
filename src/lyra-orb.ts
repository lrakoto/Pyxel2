import type { AreaId } from './content.ts';

/**
 * Lyra's drone: a small floating shell with a single eye. She is an AI who lives in the city's
 * machines, and the shell is how she travels with Gravity when she wants to be seen. She can
 * leave it: her light hops into a camera, a screen or a lock, and comes home.
 *
 * Everything here is pure: the pixel design as palette indices, and poses, hops and placement as
 * functions of time and story state. `lyra-orb-draw.ts` turns them into pixels for the game and
 * the motion study alike.
 */

export const ORB_SIZE = 17;
export const ORB_PALETTE = [
  'transparent',
  '#0a1016', // 1 outline
  '#1a2530', // 2 shell, shadow side
  '#2e3d4c', // 3 shell, gunmetal
  '#4d6072', // 4 shell, lit
  '#8aa2b5', // 5 specular
  '#111a22', // 6 panel seam
  '#081419', // 7 eye socket
  '#2aa9bd', // 8 eye ring
  '#5ef0ea', // 9 eye, bright
  '#d8fffb', // 10 eye core
  '#3fb7c4', // 11 running light
] as const;
export type OrbEye = 'open' | 'half' | 'closed';

/** Row-major palette indices for one frame of the shell. Gaze moves the eye a pixel either way. */
export function orbPixels(gaze: -1 | 0 | 1, eye: OrbEye): number[] {
  const out: number[] = [];
  const c = (ORB_SIZE - 1) / 2,
    r = 7.6;
  const light = [-0.55, -0.7, 0.45];
  const norm = Math.hypot(light[0], light[1], light[2]);
  for (let y = 0; y < ORB_SIZE; y++)
    for (let x = 0; x < ORB_SIZE; x++) {
      const dx = x - c,
        dy = y - c,
        d = Math.hypot(dx, dy);
      if (d > r + 0.5) {
        out.push(0);
        continue;
      }
      if (d > r - 0.6) {
        out.push(1);
        continue;
      }
      const nz = Math.sqrt(Math.max(0, 1 - (dx * dx + dy * dy) / (r * r)));
      const lit = ((dx / r) * light[0] + (dy / r) * light[1] + nz * light[2]) / norm;
      let index = lit > 0.8 ? 5 : lit > 0.45 ? 4 : lit > 0.1 ? 3 : 2;
      // Two plate seams, above and below the eye band.
      if (y === c - 4 || y === c + 4) index = 6;
      // Running lights on the lower hemisphere.
      if (y === c + 3 && Math.abs(dx) === 4) index = 11;
      const ex = x - (c + gaze),
        ey = y - c,
        e = Math.hypot(ex, ey);
      if (e < 3.6) {
        index = 7;
        const visible = eye === 'open' || (eye === 'half' && Math.abs(ey) <= 1);
        if (visible) index = e < 0.8 ? 10 : e < 1.6 ? 9 : e < 2.8 ? 8 : 7;
      }
      out.push(index);
    }
  return out;
}

export type OrbMode = 'idle' | 'listen' | 'speak' | 'project' | 'away';
export interface OrbPose {
  /** Vertical float, in source pixels. */
  bob: number;
  gaze: -1 | 0 | 1;
  eye: OrbEye;
  /** Eye light, 0 (dark) to about 1.1 (speaking peak). */
  glow: number;
  /** A speaking ring's progress from 0 to 1, or null. */
  ring: number | null;
}

/** `look` is the direction of whatever holds her attention: negative is left. */
export function orbPose(
  mode: OrbMode,
  time: number,
  modeTime: number,
  look: number,
  reducedMotion: boolean,
): OrbPose {
  const toward: -1 | 0 | 1 = look < 0 ? -1 : look > 0 ? 1 : 0;
  const bob = reducedMotion ? 0 : Math.sin(time * 1.6) * 1.5 + Math.sin(time * 0.7) * 0.5;
  if (mode === 'away') return { bob, gaze: 0, eye: 'closed', glow: 0.12, ring: null };
  let gaze = toward;
  if (mode === 'idle' && !reducedMotion) {
    // Now and then she checks the rest of the room.
    const phase = time % 7;
    if (phase > 3.2 && phase < 4.4) gaze = 0;
    else if (phase >= 4.4 && phase < 5) gaze = toward === 0 ? 1 : toward === 1 ? -1 : 1;
  }
  let eye: OrbEye = 'open';
  if (!reducedMotion && mode !== 'project') {
    const blink = time % 5.3;
    eye = blink < 0.05 ? 'half' : blink < 0.1 ? 'closed' : blink < 0.15 ? 'half' : 'open';
  }
  const syllables = Math.max(0, Math.sin(modeTime * 9)) * (0.6 + 0.4 * Math.sin(modeTime * 2.3));
  const glow =
    mode === 'project'
      ? 1
      : mode === 'speak'
        ? reducedMotion
          ? 0.9
          : 0.8 + 0.3 * syllables
        : mode === 'listen'
          ? 0.85
          : 0.75 + (reducedMotion ? 0 : 0.1 * Math.sin(time * 1.3));
  const ring = mode === 'speak' && !reducedMotion ? (modeTime * 1.2) % 1 : null;
  return { bob, gaze, eye, glow, ring };
}

export interface OrbPoint {
  x: number;
  y: number;
}
/** She leaves the shell for a machine at `start`; `end` is when she heads home, if known. */
export interface LyraHop {
  to: OrbPoint;
  start: number;
  end: number | null;
}
export const HOP_TRAVEL = 0.45;
export interface HopState {
  phase: 'out' | 'inside' | 'back' | 'done';
  /** Where her light is while it travels; null when it is in the shell or the machine. */
  spark: OrbPoint | null;
  /** How much of her is still in the shell, 0 to 1. */
  shell: number;
  /** How strongly the machine she occupies glows, 0 to 1. */
  machine: number;
}

const ease = (t: number) => t * t * (3 - 2 * t);
/** A raised arc between the shell and the machine, so the hop reads as a leap. */
export function hopPoint(from: OrbPoint, to: OrbPoint, t: number): OrbPoint {
  const lift = Math.max(20, Math.hypot(to.x - from.x, to.y - from.y) * 0.3);
  const cx = (from.x + to.x) / 2,
    cy = Math.min(from.y, to.y) - lift;
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
    y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
  };
}
export function hopState(
  hop: LyraHop,
  time: number,
  from: OrbPoint,
  reducedMotion: boolean,
): HopState {
  const since = time - hop.start;
  const travel = reducedMotion ? 0 : HOP_TRAVEL;
  if (since < 0) return { phase: 'done', spark: null, shell: 1, machine: 0 };
  if (since < travel) {
    const t = ease(since / travel);
    return { phase: 'out', spark: hopPoint(from, hop.to, t), shell: 1 - t, machine: t * 0.5 };
  }
  if (hop.end === null || time < hop.end)
    return { phase: 'inside', spark: null, shell: 0, machine: 1 };
  const back = time - hop.end;
  if (back < travel) {
    const t = ease(back / travel);
    return {
      phase: 'back',
      spark: hopPoint(hop.to, from, t),
      shell: t,
      machine: (1 - t) * 0.5,
    };
  }
  return { phase: 'done', spark: null, shell: 1, machine: 0 };
}

/** Machines she can occupy, measured off each plate. */
export const ORB_SOCKETS: Record<AreaId, OrbPoint[]> = {
  street: [
    { x: 420, y: 345 }, // vending machines
    { x: 550, y: 300 }, // the street camera
    { x: 1008, y: 312 }, // GRAVES sign
    { x: 1259, y: 205 }, // the failing kanji tube
    { x: 1547, y: 274 }, // MEMORY DEN sign
  ],
  studio: [
    { x: 227, y: 213 }, // terminal screen
    { x: 1251, y: 236 }, // neural receiver
  ],
  den: [
    { x: 823, y: 201 }, // memory column
    { x: 1196, y: 195 }, // monitor wall
  ],
};
/** Machine evidence she steps into while Gravity examines it. */
export const MACHINE_CLUES = ['camera', 'device', 'transfer', 'chime'];

const AMBIENT_WINDOW = 34;
const AMBIENT_OFFSET = 20;
const AMBIENT_STAY = 2.2;
/**
 * A companion's idle habit: every half-minute or so she slips into a nearby machine and back.
 * Sampled from time, so a pause, restore or area change never leaves her half-hopped.
 */
export function ambientHop(area: AreaId, time: number, playerX: number): LyraHop | null {
  const window = Math.floor(time / AMBIENT_WINDOW);
  const start = window * AMBIENT_WINDOW + AMBIENT_OFFSET;
  if (time < start || time > start + AMBIENT_STAY + 2 * HOP_TRAVEL) return null;
  const near = ORB_SOCKETS[area].filter((s) => Math.abs(s.x - playerX) < 420);
  if (!near.length) return null;
  const pick = near[Math.abs(Math.imul(window + 1, 2654435761)) % near.length];
  return { to: pick, start, end: start + HOP_TRAVEL + AMBIENT_STAY };
}

export type LyraPresence = { kind: 'none' } | { kind: 'post'; x: number } | { kind: 'follow' };
/**
 * Where her shell is. Before she joins Gravity she keeps a post: the street once she's been
 * noticed, and her terminal in the Den. As a companion she travels with Gravity, except in the
 * Den, where the shell docks at the archive.
 */
export function lyraPresence(area: AreaId, deduced: boolean, companion: boolean): LyraPresence {
  if (area === 'den') return { kind: 'post', x: 1150 };
  if (companion) return { kind: 'follow' };
  if (area === 'street' && deduced) return { kind: 'post', x: 1280 };
  return { kind: 'none' };
}
/** Height of the shell above the floor, in figure units (Gravity stands about 73 tall). */
export const ORB_HOVER = 52;
/** Where the shell settles beside Gravity: just behind her shoulder. */
export function companionAnchor(playerX: number, facing: number, figure: number) {
  return { x: playerX - facing * 24 * figure, lift: 62 * figure };
}
