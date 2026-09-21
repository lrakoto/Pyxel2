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
