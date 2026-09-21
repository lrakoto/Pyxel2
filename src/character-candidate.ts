/** CC0 source art by Luis Zuno (Ansimuz), palette-adapted as Gravity at load time. */
import { applyGravityPalette } from './gravity-palette.ts';
export const CANDIDATE_CLIPS = {
  idle: { source: 'idle', count: 4, duration: 0.8 },
  walk: { source: 'walk', count: 16, duration: 0.8 },
  sprint: { source: 'run', count: 8, duration: 0.4 },
  jump: { source: 'jump', count: 4, duration: 0.6 },
} as const;
export type CandidateMotion = keyof typeof CANDIDATE_CLIPS;
export type CandidateFrames = Record<CandidateMotion, (HTMLImageElement | HTMLCanvasElement)[]>;
export async function loadCandidate(
  palette: 'gravity' | 'original' = 'gravity',
): Promise<CandidateFrames> {
  const entries = await Promise.all(
    Object.entries(CANDIDATE_CLIPS).map(async ([name, clip]) => [
      name,
      await Promise.all(
        Array.from({ length: clip.count }, async (_, i) => {
          const image = new Image();
          image.src = `${import.meta.env.BASE_URL}character-lab/warped/${clip.source}-${i + 1}.png`;
          await image.decode();
          if (palette === 'original') return image;
          const canvas = document.createElement('canvas');
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          applyGravityPalette(pixels.data, canvas.width);
          context.putImageData(pixels, 0, 0);
          return canvas;
        }),
      ),
    ]),
  );
  return Object.fromEntries(entries) as CandidateFrames;
}
export function candidateIndex(time: number, count: number, duration: number) {
  return Math.floor(((Math.max(0, time) % duration) / duration) * count) % count;
}
// Every frame shares its original canvas. A fixed crop/pivot prevents foot jitter.
export const CANDIDATE_CROP = { x: 0, y: 12, width: 71, height: 55, cellHeight: 58, pivotX: 38 };
