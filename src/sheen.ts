import type { SignLight } from './content.ts';

/**
 * The scene's edge sheen: the plate equivalent of the rim glow on characters.
 *
 * In the original prototype the props were real geometry, so the neon point
 * lights caught their edges for free. A painted plate has no geometry to
 * light, so the silhouettes are recovered from the art itself: a luminance
 * gradient finds where one surface ends and another begins, and each edge
 * pixel is tinted with whatever sign is nearest to it. The result is baked
 * once at load; the frame loop only has to composite it and breathe its
 * brightness, which is what reads as the shimmer.
 */

/** Distance unit for a sign's reach across the plate, in world pixels. */
const REACH = 200;
/**
 * Gradient strengths mapped to no sheen and to full sheen. The floor is high
 * on purpose: a low one picks up brush texture and mortar lines as well as
 * silhouettes, and lighting every one of those reads as a sharpen filter
 * rather than as light.
 */
const EDGE_LO = 55;
const EDGE_HI = 150;
/** Edges brighter than this are already a highlight and are left alone. */
const HIGHLIGHT = 150;
/** Softening pass, so an edge reads as a glow rather than an outline. */
const BLUR = 1.5;

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * Builds the tinted edge mask for one plate. `offsetX` is the plate's world x,
 * so lights authored in world coordinates land in the right place.
 */
export function buildSheen(
  plate: HTMLCanvasElement,
  lights: SignLight[],
  offsetX = 0,
): HTMLCanvasElement {
  const w = plate.width,
    h = plate.height;
  const source = plate.getContext('2d')!.getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d')!;
  const image = ctx.createImageData(w, h);

  const luma = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    luma[i] = source[i * 4] * 0.299 + source[i * 4 + 1] * 0.587 + source[i * 4 + 2] * 0.114;

  const tints = lights.map((l) => channels(l.color));
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      const gx = Math.abs(luma[p + 1] - luma[p - 1]);
      const gy = Math.abs(luma[p + w] - luma[p - w]);
      const g = gx + gy;
      if (g < EDGE_LO) continue;
      // A sheen sits on the darker side of a boundary; already-bright pixels
      // are the light source itself and must not be pushed further.
      if (luma[p] > HIGHLIGHT) continue;
      const edge = Math.min(1, (g - EDGE_LO) / (EDGE_HI - EDGE_LO));

      let r = 0,
        gg = 0,
        b = 0,
        total = 0;
      for (let i = 0; i < lights.length; i++) {
        const dx = lights[i].x - (x + offsetX);
        const dy = lights[i].y - y;
        const falloff = (dx * dx + dy * dy) / (REACH * REACH);
        const weight = lights[i].intensity / Math.max(falloff, 1);
        r += tints[i][0] * weight;
        gg += tints[i][1] * weight;
        b += tints[i][2] * weight;
        total += weight;
      }
      if (total <= 0.001) continue;
      const peak = Math.max(r, gg, b) || 1;
      const alpha = edge * Math.min(1, total * 0.55);
      const j = p * 4;
      image.data[j] = (r / peak) * 255;
      image.data[j + 1] = (gg / peak) * 255;
      image.data[j + 2] = (b / peak) * 255;
      image.data[j + 3] = Math.round(alpha * 255);
    }
  ctx.putImageData(image, 0, 0);

  const soft = document.createElement('canvas');
  soft.width = w;
  soft.height = h;
  const sc = soft.getContext('2d')!;
  sc.filter = `blur(${BLUR}px)`;
  sc.drawImage(out, 0, 0);
  return soft;
}
