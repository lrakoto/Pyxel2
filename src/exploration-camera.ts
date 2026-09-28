import type { Area } from './content.ts';

interface Landmark {
  /** The visual subject on the plate, which need not be its clue marker. */
  x: number;
  radius: number;
}

// Prove the composition in the studio before authoring the other rooms.
// The painting hangs below the work bulb; the receiver is the lit glass cylinder.
const STUDIO_LANDMARKS: readonly Landmark[] = [
  { x: 788, radius: 360 },
  { x: 1251, radius: 250 },
];

/** Stateless exploration framing: no facing flips, timers, or previous-room memory. */
export function explorationCamera(
  area: Pick<Area, 'id' | 'width'>,
  playerX: number,
  viewWidth: number,
  reducedMotion = false,
): number {
  const base = playerX - viewWidth * 0.48;
  let bias = 0;
  if (!reducedMotion && area.id === 'studio') {
    let weightSum = 0;
    for (const landmark of STUDIO_LANDMARKS) {
      const distance = landmark.x - playerX;
      // Only invite a subject already within this view. A narrow screen must not
      // get pulled toward a distant landmark at the expense of the detective.
      const radius = Math.min(landmark.radius, viewWidth * 0.42);
      const t = Math.max(0, 1 - Math.abs(distance) / radius);
      const weight = t * t * (3 - 2 * t);
      bias += distance * 0.45 * weight;
      weightSum += weight;
    }
    bias /= Math.max(1, weightSum);
    const limit = Math.min(64, viewWidth * 0.08);
    bias = Math.max(-limit, Math.min(limit, bias));
  }
  return Math.max(0, Math.min(Math.max(0, area.width - viewWidth), base + bias));
}
