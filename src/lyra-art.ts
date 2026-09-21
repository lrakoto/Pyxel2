import { LYRA_STORY_FRAMES } from './character-art.ts';

/** Pose changes stay above the hips so Lyra's projection never hops or splits at the knee. */
function frame(index: number, speaking: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const c = canvas.getContext('2d')!;
  c.imageSmoothingEnabled = false;
  const gesture = speaking ? [0, 0, 1, 1, 2, 2, 3, 3, 1, 1, 0, 0][index] : 0;
  const source = LYRA_STORY_FRAMES[speaking ? 'listen' : 'idle'][gesture];
  const lift = index >= 4 && index <= 7 ? -1 : 0;
  // Overlap at the waist hides the join through the one-pixel breathing motion.
  c.drawImage(source, 0, 33, 32, 31, 0, 33, 32, 31);
  c.drawImage(source, 0, 0, 32, 36, 0, lift, 32, 36);
  const rect = (color: string, x: number, y: number, w: number, h: number) => {
    c.fillStyle = color;
    c.fillRect(x, y + lift, w, h);
  };
  // Readable facial planes, a deliberate blink, and restrained speech shapes.
  if (index === 10) {
    rect('#6caacf', 13, 12, 7, 1);
    rect('#294f78', 13, 12, 2, 1);
    rect('#294f78', 18, 12, 2, 1);
  }
  rect('#abdadd', 16, 16, 3, 2);
  rect('#447897', 16, 16, 3, 1);
  if (speaking && [2, 4, 5, 8].includes(index)) rect('#315d7c', 16, 16, 2, 2);
  // Continuous suit seams read at game scale; memory nodes pulse without flicker.
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = 0.45;
  rect('#b3f4ed', 13, 24, 1, 8);
  rect('#8dcddd', 19, 26, 1, 7);
  c.globalAlpha = 0.35 + Math.sin((index / 12) * Math.PI * 2) * 0.12;
  rect('#e0fff6', 15, 24, 2, 2);
  c.restore();
  return canvas;
}
export const LYRA_REFINED_FRAMES = {
  idle: Array.from({ length: 12 }, (_, i) => frame(i, false)),
  listen: Array.from({ length: 12 }, (_, i) => frame(i, true)),
};
export function lyraFrameIndex(time: number, speaking: boolean) {
  return Math.floor(Math.max(0, time) * (speaking ? 6 : 3)) % 12;
}
