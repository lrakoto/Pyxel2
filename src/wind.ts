/**
 * A shared street breeze: two soft gusts separated by long quiet intervals.
 * Sampling game time keeps the scarf, rain and vents in the same weather,
 * including after a pause. This is ambient motion, so reduced motion disables it.
 */
const PERIOD = 44;
const GUSTS = [
  { start: 7, duration: 7, strength: 0.84 },
  { start: 30, duration: 5, strength: -0.38 },
] as const;
const TAU = Math.PI * 2;

export function streetWind(time: number, reducedMotion = false): number {
  if (reducedMotion || !Number.isFinite(time) || time <= 0) return 0;
  const phase = time % PERIOD;
  let wind = 0;
  for (const gust of GUSTS) {
    const u = (phase - gust.start) / gust.duration;
    if (u > 0 && u < 1) wind += gust.strength * (0.5 - 0.5 * Math.cos(u * TAU));
  }
  return wind;
}

/**
 * Exact integral of streetWind, in normalized-wind seconds. Multiply by a
 * layer's pixels/second to advect particles continuously. Multiplying current
 * wind by time instead would teleport the whole rain sheet when a gust changes.
 */
export function streetWindDisplacement(time: number, reducedMotion = false): number {
  if (reducedMotion || !Number.isFinite(time) || time <= 0) return 0;
  const cycles = Math.floor(time / PERIOD);
  const phase = time % PERIOD;
  let displacement = 0;
  for (const gust of GUSTS) {
    const u = Math.max(0, Math.min(1, (phase - gust.start) / gust.duration));
    displacement +=
      gust.strength * gust.duration * (cycles * 0.5 + u * 0.5 - Math.sin(u * TAU) / (2 * TAU));
  }
  return displacement;
}
