/**
 * The anamorphic flare that bright points throw in this scene.
 *
 * Three things stacked, in the order a real lens produces them:
 *
 *  - a long horizontal streak, cool blue-white, tapering to nothing at both
 *    ends. This belongs to the lens rather than to the light, so it is the
 *    same colour whatever is glinting;
 *  - a golden burst with rays, the warm accent that gives the whole thing its
 *    golden-hour cast;
 *  - a white-hot core, small and hard, so the centre reads as a point of
 *    light rather than a blob.
 *
 * The whole thing is baked once into a sprite and composited additively, so
 * lighting a dozen points in a frame costs a dozen draws. A caller can pass a
 * `tint` to push the burst toward the colour of the thing that is glinting,
 * while the streak and core stay lens-coloured.
 *
 * Where this belongs, and where it does not: a flare is a specular catch off
 * metal, glass or a mirror — the train's roof line, a car's bodywork — or a
 * lamp aimed near the lens, like an oncoming headlight or a muzzle flash. A
 * neon sign facing the street is a diffuse emitter and gets a halo instead.
 * Putting one on every bright thing is what makes the effect stop landing.
 */

/** Sprite dimensions. The core sits at the centre; the streak runs the width. */
const W = 512;
const H = 256;

/** The lens's own streak colour, and the warm accent through the burst. */
const STREAK = [150, 200, 255] as const;
const GOLD = [255, 198, 112] as const;

function rgba([r, g, b]: readonly number[], a: number): string {
  return `rgba(${r},${g},${b},${a})`;
}

function build(): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d')!;
  const cx = W / 2;
  const cy = H / 2;
  c.globalCompositeOperation = 'lighter';

  // --- Horizontal streak -------------------------------------------------
  // Three stacked bands: a wide soft one for the haze, a mid one for body,
  // and a hot hairline down the middle. Each fades out toward the ends so the
  // streak tapers instead of running to the sprite edge.
  const band = (halfHeight: number, alpha: number, blur: string) => {
    const g = c.createLinearGradient(0, 0, W, 0);
    // The taper runs almost the full width: a streak that fades early reads
    // as a smear, where a long shallow falloff reads as a lens.
    g.addColorStop(0, rgba(STREAK, 0));
    g.addColorStop(0.08, rgba(STREAK, 0.03 * alpha));
    g.addColorStop(0.28, rgba(STREAK, 0.2 * alpha));
    g.addColorStop(0.44, rgba(STREAK, 0.62 * alpha));
    g.addColorStop(0.5, rgba(STREAK, alpha));
    g.addColorStop(0.56, rgba(STREAK, 0.62 * alpha));
    g.addColorStop(0.72, rgba(STREAK, 0.2 * alpha));
    g.addColorStop(0.92, rgba(STREAK, 0.03 * alpha));
    g.addColorStop(1, rgba(STREAK, 0));
    c.filter = blur;
    c.fillStyle = g;
    c.fillRect(0, cy - halfHeight, W, halfHeight * 2);
    c.filter = 'none';
  };
  band(15, 0.22, 'blur(6px)');
  band(5, 0.5, 'blur(2px)');
  band(1, 0.95, 'none');

  // --- Vertical streak ---------------------------------------------------
  // Shorter than the horizontal one and warm, which is what keeps the cross
  // reading as gold rather than as a second lens streak.
  const vertical = c.createLinearGradient(0, 0, 0, H);
  vertical.addColorStop(0, rgba(GOLD, 0));
  vertical.addColorStop(0.12, rgba(GOLD, 0.04));
  vertical.addColorStop(0.34, rgba(GOLD, 0.24));
  vertical.addColorStop(0.5, rgba(GOLD, 0.9));
  vertical.addColorStop(0.66, rgba(GOLD, 0.24));
  vertical.addColorStop(0.88, rgba(GOLD, 0.04));
  vertical.addColorStop(1, rgba(GOLD, 0));
  c.filter = 'blur(2px)';
  c.fillStyle = vertical;
  c.fillRect(cx - 2, 0, 4, H);
  c.filter = 'none';

  // --- Golden burst ------------------------------------------------------
  const bloom = c.createRadialGradient(cx, cy, 0, cx, cy, 96);
  bloom.addColorStop(0, rgba(GOLD, 0.9));
  bloom.addColorStop(0.22, rgba(GOLD, 0.34));
  bloom.addColorStop(0.55, rgba(GOLD, 0.1));
  bloom.addColorStop(1, rgba(GOLD, 0));
  c.fillStyle = bloom;
  c.fillRect(cx - 96, cy - 96, 192, 192);

  // Rays of uneven length, so the star looks optical rather than drawn.
  c.filter = 'blur(1px)';
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + 0.19;
    const len = 42 + ((i * 37) % 5) * 22;
    const ray = c.createLinearGradient(0, 0, len, 0);
    ray.addColorStop(0, rgba(GOLD, 0.75));
    ray.addColorStop(1, rgba(GOLD, 0));
    c.save();
    c.translate(cx, cy);
    c.rotate(angle);
    c.fillStyle = ray;
    c.fillRect(0, -1, len, 2);
    c.restore();
  }
  c.filter = 'none';

  // --- Core --------------------------------------------------------------
  const core = c.createRadialGradient(cx, cy, 0, cx, cy, 22);
  core.addColorStop(0, 'rgba(255,255,255,1)');
  core.addColorStop(0.3, 'rgba(255,244,222,0.75)');
  core.addColorStop(1, 'rgba(255,226,180,0)');
  c.fillStyle = core;
  c.fillRect(cx - 22, cy - 22, 44, 44);
  return cv;
}

let sprite: HTMLCanvasElement | null = null;

/**
 * Draws a flare centred on (x, y). `scale` sets the streak's reach — the
 * sprite is 512 wide, so 0.5 gives a streak about 256px across. `intensity`
 * is the additive strength, and values above 1 are laid down in repeated
 * passes for the very brightest points.
 */
export function drawFlare(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  intensity: number,
  tint?: string,
) {
  if (intensity <= 0.004 || scale <= 0) return;
  if (!sprite) sprite = build();
  const w = W * scale;
  const h = H * scale;
  c.save();
  c.globalCompositeOperation = 'lighter';
  let left = intensity;
  while (left > 0.004) {
    c.globalAlpha = Math.min(1, left);
    c.drawImage(sprite, x - w / 2, y - h / 2, w, h);
    left -= 1;
  }
  if (tint) {
    // A wash of the source's own colour through the burst, so a red sign
    // flares red without losing the gold and white at its centre.
    const r = 60 * scale;
    const wash = c.createRadialGradient(x, y, 0, x, y, r);
    wash.addColorStop(0, tint);
    wash.addColorStop(1, `${tint}00`);
    c.globalAlpha = Math.min(0.55, intensity * 0.45);
    c.fillStyle = wash;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.restore();
}
