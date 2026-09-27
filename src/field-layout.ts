/** Keep labels outside the figure while leaving the marker on its authored subject. */
export function labelPlacement(
  subjectX: number,
  subjectY: number,
  playerX: number,
  floor: number,
  figure: number,
  camera: number,
  viewWidth: number,
) {
  const nearBody =
    Math.abs(subjectX - playerX) < 75 * figure &&
    subjectY > floor - 78 * figure &&
    subjectY < floor + 20;
  if (!nearBody) return 'below';
  const screen = (subjectX - camera) / viewWidth;
  if (screen < 0.26) return 'right';
  if (screen > 0.74) return 'left';
  return subjectX >= playerX ? 'right' : 'left';
}
