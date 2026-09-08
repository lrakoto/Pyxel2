import type { SignLight } from './content.ts';

/**
 * The neon rim, ported from the original prototype's wet-rim shader.
 *
 * There the effect was a fragment shader on Cole's sprite: a camera-facing
 * quad has one flat normal, so fresnel can't find its edges, and instead the
 * shader sampled the sprite's alpha one texel to each side — opaque pixels
 * bordering transparency are the silhouette — and tinted them with the colour
 * of the neon currently hitting him, weighted toward the side the light comes
 * from. This module is the 2D half of that: it works out what colour is
 * falling on a point and from which side. `Sprites` does the alpha-neighbour
 * sampling on the CPU instead, once per frame of art rather than per pixel.
 */
export interface RimLight {
  /** Rim colour normalised so its brightest channel is 1. */
  r: number;
  g: number;
  b: number;
  /** How much of that colour the edge takes, 0–1 or a little above. */
  strength: number;
  /** -1..1, which side the light falls from, already in sprite (flipped) space. */
  dirX: number;
  /** Constant share of the glow that spills onto upward-facing edges. */
  up: number;
}

/**
 * A failing tube's output over time, 0 to a little above 1.
 *
 * Two components: a fast shimmer that never quite settles, and rare deep
 * stutters where the tube drops out for a beat. Seeded from the light's own
 * position so every sign flickers on its own schedule and the street never
 * pulses in unison.
 */
export function flickerOf(light: SignLight, time: number): number {
  const amount = light.flicker ?? 0;
  if (amount <= 0) return 1;
  const seed = light.x * 0.013 + light.y * 0.007;
  const shimmer = Math.sin(time * 13.1 + seed) * 0.5 + Math.sin(time * 31.7 + seed * 3) * 0.25;
  const stutter = Math.sin(time * 2.3 + seed * 5) > 0.93 ? 1 : 0;
  const dip = stutter * (0.55 + 0.35 * Math.sin(time * 47 + seed));
  return Math.max(0.08, 1 - amount * (0.14 + 0.14 * shimmer + dip));
}

/** Distance unit for the inverse-square falloff, in world pixels. */
const FALLOFF = 120;
/** uRimUp in the original shader: light always spills a little from above. */
const RIM_UP = 0.3;

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

const cache = new Map<string, [number, number, number]>();
function rgb(hex: string): [number, number, number] {
  let c = cache.get(hex);
  if (!c) cache.set(hex, (c = channels(hex)));
  return c;
}

/**
 * Accumulates every sign's contribution at a world point, inverse-square by
 * distance, and normalises the result the way the original did: hue from the
 * summed colour, brightness from the summed weight.
 */
export function rimAt(
  lights: SignLight[],
  x: number,
  y: number,
  facing: number,
  time = 0,
): RimLight | null {
  let r = 0,
    g = 0,
    b = 0,
    dir = 0,
    total = 0;
  for (const light of lights) {
    const dx = light.x - x;
    const dy = light.y - y;
    const distance = Math.hypot(dx, dy) || 1;
    const falloff = (dx * dx + dy * dy) / (FALLOFF * FALLOFF);
    const w = (light.intensity * flickerOf(light, time)) / Math.max(falloff, 1);
    const [lr, lg, lb] = rgb(light.color);
    r += lr * w;
    g += lg * w;
    b += lb * w;
    dir += (dx / distance) * w;
    total += w;
  }
  const peak = Math.max(r, g, b);
  if (total <= 0.001 || peak <= 0) return null;
  return {
    r: r / peak,
    g: g / peak,
    b: b / peak,
    // The original capped this at 2.4, but three.js tone-mapped the result.
    // Canvas does not, so an unclamped add at that level saturates the whole
    // silhouette and the figure reads as neon-coloured rather than rim-lit.
    strength: Math.min(total * 0.55, 0.85),
    dirX: Math.max(-1, Math.min(1, dir / total)) * facing,
    up: RIM_UP,
  };
}

/** The rim colour as a CSS string, at full normalised brightness. */
export function rimColor(rim: RimLight): string {
  const c = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${c(rim.r)}${c(rim.g)}${c(rim.b)}`;
}
