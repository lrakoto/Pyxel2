/** CC0 source art by Luis Zuno (Ansimuz), palette-adapted as Gravity at load time. */
import { applyGravityPalette } from './gravity-palette.ts';
import {
  GRAVITY_ACTIONS,
  gravityActionIndex,
  gravityIdleIndex,
  makeGravityActingFrames,
  type GravityAction,
} from './gravity-acting.ts';
export { GRAVITY_ACTIONS, GRAVITY_IDLE_DURATION } from './gravity-acting.ts';
export const CANDIDATE_CLIPS = {
  idle: { source: 'idle', count: 4, duration: 0.8 },
  walk: { source: 'walk', count: 16, duration: 0.8 },
  sprint: { source: 'run', count: 8, duration: 0.4 },
  jump: { source: 'jump', count: 4, duration: 0.6 },
} as const;
export type CandidateMotion = keyof typeof CANDIDATE_CLIPS | GravityAction;
export type CandidateFrames = Record<CandidateMotion, (HTMLImageElement | HTMLCanvasElement)[]>;
const neckSockets = new WeakMap<CanvasImageSource, { x: number; y: number }>();
export function scarfSocket(frame: CanvasImageSource) {
  return neckSockets.get(frame) ?? { x: 35, y: 29 };
}
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
          applyGravityPalette(pixels.data, canvas.width, `${clip.source}-${i + 1}`);
          context.putImageData(pixels, 0, 0);
          let right = 0,
            bottom = 0;
          for (let y = 0; y < canvas.height; y++)
            for (let x = 0; x < canvas.width; x++) {
              const at = (y * canvas.width + x) * 4;
              if (
                pixels.data[at] === 216 &&
                pixels.data[at + 1] === 181 &&
                pixels.data[at + 2] === 104
              ) {
                right = Math.max(right, x);
                bottom = Math.max(bottom, y);
              }
            }
          const jumpSockets = [
            { x: 40, y: 30 },
            { x: 43, y: 37 },
            { x: 31, y: 29 },
            { x: 35, y: 25 },
          ];
          const socket = name === 'jump' ? jumpSockets[i] : { x: right - 6, y: bottom + 3 };
          neckSockets.set(canvas, socket);
          context.fillStyle = '#812421';
          context.fillRect(socket.x - 1, socket.y, 7, 3);
          context.fillStyle = '#c8382f';
          context.fillRect(socket.x - 1, socket.y, 7, 2);
          context.fillStyle = '#e46245';
          context.fillRect(socket.x, socket.y, 4, 1);
          return canvas;
        }),
      ),
    ]),
  );
  const frames = Object.fromEntries(entries) as CandidateFrames;
  const idlePixels = frames.idle.map((frame) => {
    const canvas = document.createElement('canvas');
    canvas.width = 71;
    canvas.height = 67;
    const context = canvas.getContext('2d')!;
    context.drawImage(frame, 0, 0);
    return context.getImageData(0, 0, 71, 67).data;
  });
  const acting = makeGravityActingFrames(idlePixels, 71, 67, palette);
  for (const action of Object.keys(GRAVITY_ACTIONS) as GravityAction[]) {
    frames[action] = acting[action].map((pose) => {
      const canvas = document.createElement('canvas');
      canvas.width = 71;
      canvas.height = 67;
      canvas.getContext('2d')!.putImageData(new ImageData(pose.data, 71, 67), 0, 0);
      neckSockets.set(canvas, pose.neck);
      return canvas;
    });
  }
  return frames;
}
export function candidateIndex(time: number, count: number, duration: number) {
  return Math.floor(((Math.max(0, time) % duration) / duration) * count) % count;
}
/** Same pose selection for the game, scarf/shadows, and the character study. */
export function resolveGravityPose(
  tag: string,
  time: number,
): { clip: CandidateMotion; index: number } {
  const action = tag === 'examine' ? 'inspect' : tag;
  if (Object.hasOwn(GRAVITY_ACTIONS, action)) {
    const clip = action as GravityAction;
    return { clip, index: gravityActionIndex(clip, time) };
  }
  const clip =
    tag === 'stride' || tag === 'walk'
      ? 'walk'
      : tag === 'sprint'
        ? 'sprint'
        : tag === 'jump'
          ? 'jump'
          : 'idle';
  // Plain idle is combat's existing tag; exploration uses breathe/quiet-idle.
  // Leave legacy movement and combat timing intact.
  if (clip === 'idle' && tag !== 'idle') return { clip, index: gravityIdleIndex(time) };
  return { clip, index: candidateIndex(time, CANDIDATE_CLIPS[clip].count, 0.8) };
}
// Every frame shares its original canvas. A fixed crop/pivot prevents foot jitter.
export const CANDIDATE_CROP = { x: 0, y: 12, width: 71, height: 55, cellHeight: 58, pivotX: 38 };

/** Convert the presentation pivot to the authored soles without resizing the art. */
export function candidateFloorOffset(height: number) {
  return ((CANDIDATE_CROP.cellHeight - CANDIDATE_CROP.height) * height) / CANDIDATE_CROP.cellHeight;
}
