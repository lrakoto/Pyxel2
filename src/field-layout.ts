interface CompanionClearance {
  x: number;
  y: number;
  /** CSS pixels per world pixel, measured when the stage resizes. */
  scale: number;
}

/** Keep labels outside the figures while leaving the marker on its authored subject. */
export function labelPlacement(
  subjectX: number,
  subjectY: number,
  playerX: number,
  floor: number,
  figure: number,
  camera: number,
  viewWidth: number,
  companion?: CompanionClearance | null,
) {
  const nearBody =
    Math.abs(subjectX - playerX) < 75 * figure &&
    subjectY > floor - 78 * figure &&
    subjectY < floor + 20;
  if (!nearBody) return 'below';
  const screen = (subjectX - camera) / viewWidth;
  const side =
    screen < 0.26 ? 'right' : screen > 0.74 ? 'left' : subjectX >= playerX ? 'right' : 'left';
  if (companion && companion.scale > 0) {
    // Side captions are capped at 190 CSS pixels. Reserve their full envelope, including
    // wrapping and a little breathing room around the 17-pixel shell's idle motion.
    const gap = 24 / companion.scale;
    const width = 190 / companion.scale;
    const halfHeight = 24 / companion.scale;
    const radius = 12 * figure;
    const left = side === 'right' ? subjectX + gap : subjectX - gap - width;
    if (
      companion.x + radius > left &&
      companion.x - radius < left + width &&
      Math.abs(companion.y - subjectY) < radius + halfHeight
    )
      return 'above';
  }
  return side;
}

/** Lift a colliding caption above Gravity's hair, retaining its authored marker below. */
export function captionLift(subjectY: number, floor: number, figure: number, scale: number) {
  return Math.max(24, (subjectY - (floor - 86 * figure)) * scale);
}
