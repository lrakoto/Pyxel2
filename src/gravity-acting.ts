/** Pixel-authored investigation poses built from Gravity's unchanged source body. */
export const GRAVITY_ACTIONS = {
  inspect: { count: 3, duration: 0.72, label: 'Inspect / standing reach' },
  crouch: { count: 3, duration: 0.9, label: 'Floor evidence / crouch' },
  terminal: { count: 3, duration: 0.68, label: 'Terminal / reach' },
  listen: { count: 3, duration: 0.8, label: 'Listen / hand to earpiece' },
  speak: { count: 3, duration: 0.78, label: 'Speak / open-hand gesture' },
} as const;
export type GravityAction = keyof typeof GRAVITY_ACTIONS;
export interface GravityActingFrame {
  data: Uint8ClampedArray;
  neck: { x: number; y: number };
}
export const GRAVITY_IDLE_DURATION = 2.4;
export const GRAVITY_IDLE_FRAMES = [1, 2, 3] as const;

/** Complete authored idle frames, excluding the source's deep bouncing crouch. */
export function gravityIdleIndex(time: number) {
  const phase = (Math.max(0, time) % GRAVITY_IDLE_DURATION) / GRAVITY_IDLE_DURATION;
  return GRAVITY_IDLE_FRAMES[Math.min(2, Math.floor(phase * 3))];
}

export function gravityActionIndex(action: GravityAction, time: number) {
  const clip = GRAVITY_ACTIONS[action];
  return Math.min(clip.count - 1, Math.floor((Math.max(0, time) / clip.duration) * clip.count));
}

type Point = readonly [number, number];

/** Integer pixel strokes only. The body is never stretched, blended, or rotated. */
export function makeGravityActingFrames(
  idle: readonly Uint8ClampedArray[],
  width: number,
  height: number,
  palette: 'gravity' | 'original' = 'gravity',
): Record<GravityAction, GravityActingFrame[]> {
  const ink = 0x050912;
  const cloth = palette === 'gravity' ? 0x343d4a : 0xffd800;
  const seam = palette === 'gravity' ? 0x161d29 : 0xec7809;
  const skin = 0xffb164,
    skinShade = 0xb15c51;
  const pixel = (data: Uint8ClampedArray, x: number, y: number, color: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const at = (y * width + x) * 4;
    data[at] = color >> 16;
    data[at + 1] = (color >> 8) & 255;
    data[at + 2] = color & 255;
    data[at + 3] = 255;
  };
  const stroke = (data: Uint8ClampedArray, a: Point, b: Point, color: number, radius: number) => {
    let [x, y] = a;
    const dx = Math.abs(b[0] - x),
      dy = -Math.abs(b[1] - y);
    const sx = x < b[0] ? 1 : -1,
      sy = y < b[1] ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      for (let oy = -radius; oy <= radius; oy++)
        for (let ox = -radius; ox <= radius; ox++)
          if (Math.abs(ox) + Math.abs(oy) <= radius + 1) pixel(data, x + ox, y + oy, color);
      if (x === b[0] && y === b[1]) break;
      const e = 2 * error;
      if (e >= dy) {
        error += dy;
        x += sx;
      }
      if (e <= dx) {
        error += dx;
        y += sy;
      }
    }
  };
  const eraseArm = (data: Uint8ClampedArray, drop = 0) => {
    for (let y = 25 + drop; y <= 35 + drop; y++)
      for (let x = y <= 26 + drop ? 40 : 42; x <= 51; x++)
        data.fill(0, (y * width + x) * 4, (y * width + x + 1) * 4);
  };
  const arm = (
    data: Uint8ClampedArray,
    shoulder: Point,
    elbow: Point,
    hand: Point,
    palm = false,
  ) => {
    stroke(data, shoulder, elbow, ink, 2);
    stroke(data, elbow, hand, ink, 2);
    stroke(data, shoulder, elbow, cloth, 1);
    stroke(data, elbow, hand, skinShade, 1);
    stroke(data, [elbow[0], elbow[1] - 1], [hand[0], hand[1] - 1], skin, 0);
    pixel(data, shoulder[0], shoulder[1] + 1, seam);
    pixel(data, hand[0] + 1, hand[1], skin);
    if (palm) {
      pixel(data, hand[0] + 2, hand[1] - 1, skin);
      pixel(data, hand[0] + 2, hand[1] + 1, skin);
    }
  };
  const standing = (elbow: Point, hand: Point, palm = false): GravityActingFrame => {
    const data = idle[1].slice();
    eraseArm(data);
    arm(data, [40, 29], elbow, hand, palm);
    return { data, neck: { x: 34, y: 27 } };
  };
  const rest = (): GravityActingFrame => ({ data: idle[1].slice(), neck: { x: 34, y: 27 } });
  const crouch = (): GravityActingFrame => {
    const data = new Uint8ClampedArray(width * height * 4);
    // Bent thighs meet the original boot shafts. Paint behind the shorts so
    // every knee stays connected, then retain the exact boots and sole baseline.
    for (const [hip, knee, ankle] of [
      [
        [35, 51],
        [30, 54],
        [33, 59],
      ],
      [
        [43, 51],
        [48, 54],
        [43, 59],
      ],
    ] as const) {
      stroke(data, hip, knee, ink, 2);
      stroke(data, knee, ankle, ink, 2);
      stroke(data, hip, knee, skinShade, 1);
      stroke(data, knee, ankle, skinShade, 1);
      stroke(data, hip, knee, skin, 0);
      stroke(data, knee, ankle, skin, 0);
    }
    // The low source pose's intact head, torso and shorts move down six pixels.
    // This is a discrete drawing step, not a per-frame body bob or affine warp.
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < width; x++) {
        const from = (y * width + x) * 4;
        if (idle[0][from + 3])
          data.set(idle[0].subarray(from, from + 4), ((y + 6) * width + x) * 4);
      }
    for (let y = 59; y < height; y++)
      for (let x = 0; x < width; x++) {
        const at = (y * width + x) * 4;
        data.set(idle[0].subarray(at, at + 4), at);
      }
    eraseArm(data, 9);
    arm(data, [40, 39], [46, 46], [48, 56]);
    return { data, neck: { x: 35, y: 37 } };
  };
  return {
    inspect: [rest(), standing([44, 31], [47, 28]), standing([45, 31], [51, 28], true)],
    crouch: [rest(), { data: idle[0].slice(), neck: { x: 35, y: 31 } }, crouch()],
    terminal: [rest(), standing([44, 33], [48, 35]), standing([44, 35], [51, 36], true)],
    listen: [rest(), standing([44, 31], [44, 27]), standing([43, 30], [41, 25])],
    speak: [rest(), standing([44, 33], [47, 33]), standing([44, 34], [49, 31], true)],
  };
}
