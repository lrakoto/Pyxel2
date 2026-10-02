interface CompanionClearance {
  x: number;
  y: number;
  /** CSS pixels per world pixel, measured when the stage resizes. */
  scale: number;
}
interface CaptionBounds {
  scale: number;
  /** Existing CSS caption width cap, including padding. */
  width: number;
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
  bounds?: CaptionBounds,
) {
  const nearBody =
    Math.abs(subjectX - playerX) < 75 * figure &&
    subjectY > floor - 78 * figure &&
    subjectY < floor + 20;
  if (!nearBody) return 'below';
  const screen = (subjectX - camera) / viewWidth;
  let side =
    screen < 0.26 ? 'right' : screen > 0.74 ? 'left' : subjectX >= playerX ? 'right' : 'left';
  if (bounds && bounds.scale > 0) {
    const required = bounds.width + 24 + 4;
    const fitsLeft = (subjectX - camera) * bounds.scale >= required;
    const fitsRight = (camera + viewWidth - subjectX) * bounds.scale >= required;
    if (!(side === 'right' ? fitsRight : fitsLeft)) {
      if (!(side === 'right' ? fitsLeft : fitsRight)) return 'above';
      side = side === 'right' ? 'left' : 'right';
    }
    // Turning inward must not put a fitting caption across Gravity's body instead.
    const gap = 24 / bounds.scale;
    const width = bounds.width / bounds.scale;
    const left = side === 'right' ? subjectX + gap : subjectX - gap - width;
    if (playerX + 20 * figure > left && playerX - 20 * figure < left + width) return 'above';
  }
  if (companion && companion.scale > 0) {
    // Reserve the CSS width cap (190 by default), including
    // wrapping and a little breathing room around the 17-pixel shell's idle motion.
    const gap = 24 / companion.scale;
    const width = (bounds?.width ?? 190) / companion.scale;
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
