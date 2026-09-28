import type { Area } from './content.ts';

interface Landmark {
  /** The visual subject on the plate, which need not be its clue marker. */
  x: number;
  radius: number;
}

// A few subjects per area, leaving ordinary tracking between them. These are
// physical fixtures, not clue state: an unrevealed record must not move the camera.
const LANDMARKS: Record<Area['id'], readonly Landmark[]> = {
  street: [
    { x: 180, radius: 260 }, // Mei's occupied noodle-bar window
    { x: 988, radius: 320 }, // Graves doorway and its sign, taken together
    { x: 1530, radius: 280 }, // Memory Den entrance beneath the cyan sign
  ],
  studio: [
    { x: 788, radius: 360 }, // painting beneath the work bulb
    { x: 1251, radius: 250 }, // receiver's glass cylinder
  ],
  den: [
    { x: 450, radius: 220 }, // paper register and archive drawers
    { x: 823, radius: 370 }, // memory column, the room's principal subject
  ],
  clinic: [
    { x: 410, radius: 260 }, // warm intake desk: paperwork before machinery
    { x: 930, radius: 310 }, // cold-storage cabinet and its labelled cartridges
  ],
};

/** Stateless exploration framing: no facing flips, timers, or previous-room memory. */
export function explorationCamera(
  area: Pick<Area, 'id' | 'width'>,
  playerX: number,
  viewWidth: number,
  reducedMotion = false,
): number {
  const base = playerX - viewWidth * 0.48;
  let bias = 0;
  if (!reducedMotion) {
    let weightSum = 0;
    for (const landmark of LANDMARKS[area.id]) {
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
