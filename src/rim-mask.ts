import type { RimLight } from './lighting.ts';
import { rimColor } from './lighting.ts';

/**
 * Silhouette edge masks and the additive pass that lights them.
 *
 * The original prototype did this per pixel in a fragment shader: a
 * camera-facing sprite has one flat normal, so fresnel can't find its edges,
 * and instead the shader sampled the sprite's alpha one texel to each side —
 * opaque pixels bordering transparency are the silhouette — and tinted them
 * with the neon falling on it. Here the sampling happens once per piece of
 * art on the CPU and the result is cached, so anything with an alpha
 * silhouette can take the same neon rim: characters, and the traffic.
 */
export interface RimMasks {
  left: HTMLCanvasElement;
  right: HTMLCanvasElement;
  up: HTMLCanvasElement;
  w: number;
  h: number;
}

/** Builds the three edge masks for a region of source art. */
export function buildRimMasks(
  src: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): RimMasks {
  const read = document.createElement('canvas');
  read.width = sw;
  read.height = sh;
  const rc = read.getContext('2d')!;
  rc.imageSmoothingEnabled = false;
  rc.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  const alpha = rc.getImageData(0, 0, sw, sh).data;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= sw || y >= sh ? 0 : alpha[(y * sw + x) * 4 + 3] / 255;

  const build = (dx: number, dy: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d')!;
    const out = ctx.createImageData(sw, sh);
    for (let y = 0; y < sh; y++)
      for (let x = 0; x < sw; x++) {
        // The CPU equivalent of `1.0 - texture2D(map, uv - texel).a`, gated
        // by the pixel's own alpha so only opaque edges light up.
        const edge = at(x, y) * (1 - at(x + dx, y + dy));
        const i = (y * sw + x) * 4;
        out.data[i] = out.data[i + 1] = out.data[i + 2] = 255;
        out.data[i + 3] = Math.round(edge * 255);
      }
    ctx.putImageData(out, 0, 0);
    return canvas;
  };
  // 'up' lights the edges that face the sky, so it samples the pixel above.
  return { left: build(-1, 0), right: build(1, 0), up: build(0, -1), w: sw, h: sh };
}

/** Reused so tinting a silhouette doesn't allocate a canvas per frame. */
const scratch = document.createElement('canvas');

/** Composites the lit silhouette additively over art already drawn. */
export function paintRim(
  ctx: CanvasRenderingContext2D,
  masks: RimMasks,
  rim: RimLight,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const weights: [HTMLCanvasElement, number][] = [
    [masks.right, Math.max(rim.dirX, 0)],
    [masks.left, Math.max(-rim.dirX, 0)],
    [masks.up, rim.up],
  ];
  if (scratch.width !== masks.w || scratch.height !== masks.h) {
    scratch.width = masks.w;
    scratch.height = masks.h;
  }
  const sc = scratch.getContext('2d')!;
  sc.globalCompositeOperation = 'source-over';
  sc.clearRect(0, 0, masks.w, masks.h);
  sc.globalCompositeOperation = 'lighter';
  for (const [mask, weight] of weights) {
    if (weight <= 0.001) continue;
    sc.globalAlpha = Math.min(1, weight);
    sc.drawImage(mask, 0, 0);
  }
  sc.globalAlpha = 1;
  sc.globalCompositeOperation = 'source-in';
  sc.fillStyle = rimColor(rim);
  sc.fillRect(0, 0, masks.w, masks.h);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingEnabled = false;
  let left = rim.strength;
  while (left > 0.001) {
    ctx.globalAlpha = Math.min(1, left);
    ctx.drawImage(scratch, dx, dy, dw, dh);
    left -= 1;
  }
  ctx.restore();
}
