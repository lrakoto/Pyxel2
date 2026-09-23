import { makeLyraReactionPixels } from './lyra-acting.ts';
export {
  LYRA_REACTION_TIMING,
  lyraReactionFrame,
  lyraProjectionSocket,
  type LyraReaction,
} from './lyra-acting.ts';

/** CC0 Warped Caves character by Luis Zuno (Ansimuz), adapted as Lyra. */
export const LYRA_CROP = { x: 0, y: 20, width: 80, height: 44, pivotX: 40, cellHeight: 44 };
const COLORS: Record<number, number> = {
  0x550c5e: 0x173b62,
  0x850f73: 0x286c94,
  0xcc2485: 0x58b8d2,
  0xfc83aa: 0xc5fff2,
  0x2a6091: 0x203259,
  0x3d83b3: 0x395d91,
  0x51b9db: 0x809ed0,
  0x68eef2: 0xdbfff8,
};
export function applyLyraPalette(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const color = COLORS[(data[i] << 16) | (data[i + 1] << 8) | data[i + 2]];
    if (color === undefined) continue;
    data[i] = color >> 16;
    data[i + 1] = (color >> 8) & 255;
    data[i + 2] = color & 255;
  }
}
export async function loadLyraCandidate(original = false) {
  async function clip(name: string, count: number) {
    return Promise.all(
      Array.from({ length: count }, async (_, i) => {
        const image = new Image();
        image.src = `${import.meta.env.BASE_URL}character-lab/lyra-warped/player-${name}-${i + 1}.png`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const c = canvas.getContext('2d')!;
        c.drawImage(image, 0, 0);
        if (!original) {
          const pixels = c.getImageData(0, 0, 80, 80);
          applyLyraPalette(pixels.data);
          c.putImageData(pixels, 0, 0);
        }
        return canvas;
      }),
    );
  }
  return { idle: await clip('idle', 4), run: await clip('run', 10) };
}
export type LyraCandidate = Awaited<ReturnType<typeof loadLyraCandidate>>;

/** Current Lyra model: MoikMellah's CC0 MV Platformer Female. */
export const LYRA_HUMAN_CROP = { x: 0, y: 16, width: 32, height: 48, pivotX: 16, cellHeight: 48 };
export type LyraHumanoidStyle = 'cyber' | 'projection';
const HUMAN_PROJECTION_COLORS: Record<number, number> = {
  0x4c0000: 0x153a52, // shared contour
  0xd9c9b8: 0xc4ffff, // face and hands
  0xd9b3ab: 0x82c8dc,
  0x474747: 0x477e9f, // cropped bob
  0x2f2f2f: 0x285570,
  0x121240: 0x163d61, // fitted blue clothing
  0x46467d: 0x347f9d,
  0x645d96: 0x69bfd1,
};
const HUMAN_CYBER_COLORS: Record<number, number> = {
  0x4c0000: 0x0a1725, // crisp contours, shared by the face and hands
  0xd9c9b8: 0x8fb7bc, // restrained cool skin, distinct from the hardware
  0xd9b3ab: 0x60868f,
  0x474747: 0x293d52, // dark bob with a readable crown highlight
  0x2f2f2f: 0x182839,
  0x121240: 0x101f35, // navy suit and boot outlines
  0x46467d: 0x263c51,
  0x645d96: 0x3f5867, // gunmetal panels
};
// Points measured on each authored pose: two pixels at the eye/temple, then
// a chest trace, sleeve seam, belt contact and knee trace. No geometry is added.
// Pose 0 is idle; poses 1–6 are the six walking frames in source order.
const CYBER_DETAILS = [
  { eye: 16, chest: 17, wrist: [11, 39], knee: [17, 50], belt: 16 },
  { eye: 18, chest: 18, wrist: [12, 39], knee: [18, 50], belt: 17 },
  { eye: 17, chest: 18, wrist: [13, 40], knee: [17, 50], belt: 17 },
  { eye: 17, chest: 18, wrist: [18, 39], knee: [14, 50], belt: 16 },
  { eye: 18, chest: 19, wrist: [21, 39], knee: [12, 50], belt: 17 },
  { eye: 17, chest: 18, wrist: [18, 39], knee: [14, 50], belt: 16 },
  { eye: 17, chest: 18, wrist: [13, 40], knee: [16, 50], belt: 17 },
] as const;
export function applyLyraHumanoidPalette(
  data: Uint8ClampedArray,
  style: LyraHumanoidStyle = 'cyber',
  frame: number | 'listen' | 'speak-low' | 'speak-high' | 'project' = 0,
) {
  const colors = style === 'projection' ? HUMAN_PROJECTION_COLORS : HUMAN_CYBER_COLORS;
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const color = colors[(data[i] << 16) | (data[i + 1] << 8) | data[i + 2]];
    if (color === undefined) continue;
    data[i] = color >> 16;
    data[i + 1] = (color >> 8) & 255;
    data[i + 2] = color & 255;
  }
  if (style !== 'cyber' || data.length !== 32 * 64 * 4) return;
  const detail =
    typeof frame === 'number'
      ? CYBER_DETAILS[Math.max(0, Math.min(6, Math.floor(frame)))]
      : {
          ...CYBER_DETAILS[0],
          eye: frame === 'listen' ? 17 : 16,
          wrist:
            frame === 'project'
              ? [25, 29]
              : frame === 'speak-high'
                ? [20, 34]
                : frame === 'speak-low'
                  ? [20, 35]
                  : [11, 39],
        };
  const suit = [0x101f35, 0x263c51, 0x3f5867];
  const accent = (x: number, y: number, color: number, material: readonly number[]) => {
    const at = (y * 32 + x) * 4;
    const existing = (data[at] << 16) | (data[at + 1] << 8) | data[at + 2];
    if (!data[at + 3] || !material.includes(existing)) return;
    data[at] = color >> 16;
    data[at + 1] = (color >> 8) & 255;
    data[at + 2] = color & 255;
  };
  accent(detail.eye - 1, 23, 0x72fbe8, [0x182839]);
  accent(detail.eye, 23, 0xa6fff0, [0x8fb7bc]);
  accent(detail.chest - 1, 30, 0x299cab, suit);
  accent(detail.chest, 31, 0x72fbe8, suit);
  accent(detail.chest, 32, 0x299cab, suit);
  accent(detail.chest, 33, 0x299cab, suit);
  accent(detail.wrist[0], detail.wrist[1], 0x72fbe8, suit);
  accent(detail.wrist[0], detail.wrist[1] + 1, 0x299cab, suit);
  accent(detail.belt, 37, 0x72fbe8, suit);
  accent(detail.knee[0], detail.knee[1], 0x299cab, suit);
  accent(detail.knee[0], detail.knee[1] + 1, 0x72fbe8, suit);
}
export async function loadLyraHumanoid(original = false, style: LyraHumanoidStyle = 'cyber') {
  const layers = await Promise.all(
    ['base', 'suit', 'hair'].map(async (name) => {
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}character-lab/lyra-human/${name}.png`;
      await image.decode();
      return image;
    }),
  );
  const cell = (column: number, row = 0) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    for (const layer of layers)
      context.drawImage(layer, column * 32, row * 64, 32, 64, 0, 0, 32, 64);
    return canvas;
  };
  const pixelsOf = (canvas: HTMLCanvasElement) =>
    canvas.getContext('2d')!.getImageData(0, 0, 32, 64).data;
  const raw = Array.from({ length: 7 }, (_, index) => cell(index));
  const acting = makeLyraReactionPixels(
    pixelsOf(raw[0]),
    pixelsOf(cell(0, 1)),
    pixelsOf(cell(2, 2)),
  );
  const finish = (
    canvas: HTMLCanvasElement,
    index: Parameters<typeof applyLyraHumanoidPalette>[2],
  ) => {
    const context = canvas.getContext('2d')!;
    if (!original) {
      const pixels = context.getImageData(0, 0, 32, 64);
      applyLyraHumanoidPalette(pixels.data, style, index);
      context.putImageData(pixels, 0, 0);
    }
    return canvas;
  };
  const actingFrame = (
    pixels: Uint8ClampedArray,
    detail: Parameters<typeof applyLyraHumanoidPalette>[2],
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;
    const image = context.createImageData(32, 64);
    image.data.set(pixels);
    context.putImageData(image, 0, 0);
    return finish(canvas, detail);
  };
  const frames = raw.map((canvas, index) => finish(canvas, index));
  return {
    idle: frames.slice(0, 1),
    walk: frames.slice(1),
    listen: acting.listen.map((pixels, index) => actingFrame(pixels, index ? 'listen' : 0)),
    speak: acting.speak.map((pixels, index) =>
      actingFrame(pixels, index === 2 ? 'speak-high' : index ? 'speak-low' : 0),
    ),
    project: acting.project.map((pixels, index) =>
      actingFrame(pixels, index === 2 ? 'project' : index ? 'speak-high' : 0),
    ),
  };
}
