import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  makeLyraReactionPixels,
  lyraReactionFrame,
  lyraProjectionSocket,
} from '../src/lyra-acting.ts';
import { applyLyraHumanoidPalette } from '../src/lyra-candidate.ts';

const layers = ['base', 'suit', 'hair'].map((name) =>
  PNG.sync.read(
    readFileSync(new URL(`../public/character-lab/lyra-human/${name}.png`, import.meta.url)),
  ),
);
function cell(column: number, row = 0) {
  const pixels = new Uint8ClampedArray(32 * 64 * 4);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 32; x++)
      for (const layer of layers) {
        const at = ((row * 64 + y) * layer.width + column * 32 + x) * 4;
        if (layer.data[at + 3]) pixels.set(layer.data.subarray(at, at + 4), (y * 32 + x) * 4);
      }
  return pixels;
}

test('conversation poses keep the approved planted legs and one connected silhouette', () => {
  const idle = cell(0),
    bend = cell(0, 1),
    project = cell(2, 2);
  const before = [idle.slice(), bend.slice(), project.slice()];
  const acting = makeLyraReactionPixels(idle, bend, project);
  for (const [name, frames] of Object.entries(acting))
    for (const [frame, pixels] of frames.entries()) {
      assert.deepEqual(
        pixels.slice(38 * 32 * 4),
        idle.slice(38 * 32 * 4),
        `${name}/${frame}: no leg, boot or ground motion`,
      );
      if (name !== 'listen')
        for (let y = 20; y < 28; y++)
          assert.deepEqual(
            pixels.slice((y * 32 + 12) * 4, (y * 32 + 21) * 4),
            idle.slice((y * 32 + 12) * 4, (y * 32 + 21) * 4),
            `${name}/${frame}: face stays intact`,
          );
      const opaque = new Set<number>();
      for (let i = 0; i < 32 * 64; i++) if (pixels[i * 4 + 3]) opaque.add(i);
      const visited = new Set<number>();
      const queue = [opaque.values().next().value!];
      while (queue.length) {
        const index = queue.pop()!;
        if (visited.has(index) || !opaque.has(index)) continue;
        visited.add(index);
        const x = index % 32,
          y = Math.floor(index / 32);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (x + dx >= 0 && x + dx < 32 && y + dy >= 0 && y + dy < 64)
              queue.push((y + dy) * 32 + x + dx);
      }
      assert.equal(
        visited.size,
        opaque.size,
        `${name}/${frame}: no detached hand, head or sleeve pixels`,
      );
    }
  assert.deepEqual([idle, bend, project], before, 'source pixels are unchanged');
  assert.notDeepEqual(acting.listen[0], acting.listen[1]);
  assert.notDeepEqual(acting.speak[1], acting.speak[2]);
  assert.notDeepEqual(acting.project[1], acting.project[2]);
});

test('attention visor follows the shifted head and all reactions keep dark cyber materials', () => {
  const frames = makeLyraReactionPixels(cell(0), cell(0, 1), cell(2, 2));
  const attention = frames.listen[1].slice();
  applyLyraHumanoidPalette(attention, 'cyber', 'listen');
  const color = (pixels: Uint8ClampedArray, x: number, y: number) =>
    Array.from(pixels.slice((y * 32 + x) * 4, (y * 32 + x) * 4 + 3));
  assert.deepEqual(color(attention, 17, 23), [0xa6, 0xff, 0xf0]);
  assert.deepEqual(color(attention, 17, 24), [0x8f, 0xb7, 0xbc]);
  for (const [pose, pixels] of [
    ['speak-high', frames.speak[2]],
    ['project', frames.project[2]],
  ] as const) {
    const before = pixels.slice();
    applyLyraHumanoidPalette(pixels, 'cyber', pose);
    for (let i = 3; i < pixels.length; i += 4)
      assert.equal(pixels[i], before[i], `${pose}: light details cannot add anatomy`);
    assert.deepEqual(color(pixels, 16, 23), [0xa6, 0xff, 0xf0]);
  }
});

test('listening and memory poses settle while speaking leaves pauses between gestures', () => {
  assert.equal(lyraReactionFrame('listen', 0), 0);
  assert.equal(lyraReactionFrame('listen', 0.19), 1);
  assert.equal(lyraReactionFrame('listen', 100), 1);
  assert.equal(lyraReactionFrame('project', 0.2), 1);
  assert.equal(lyraReactionFrame('project', 0.5), 2);
  assert.equal(lyraReactionFrame('project', 100), 2);
  assert.equal(lyraProjectionSocket(0.2), null);
  assert.deepEqual(lyraProjectionSocket(0.5), { x: 26.5, y: 26 });
  assert.equal(lyraReactionFrame('speak', 0.5), 1);
  assert.equal(lyraReactionFrame('speak', 0.9), 2);
  assert.equal(lyraReactionFrame('speak', 2), 0);
  assert.equal(lyraReactionFrame('walk', 0.5), 4);
  assert.equal(lyraReactionFrame('walk', 0.75), 0);
});
