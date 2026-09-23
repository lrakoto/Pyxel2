import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { applyGravityPalette } from '../src/gravity-palette.ts';
import { candidateIndex, resolveGravityPose } from '../src/character-candidate.ts';
import {
  GRAVITY_ACTIONS,
  gravityIdleIndex,
  makeGravityActingFrames,
} from '../src/gravity-acting.ts';

const idle = Array.from({ length: 4 }, (_, index) => {
  const png = PNG.sync.read(
    readFileSync(new URL(`../public/character-lab/warped/idle-${index + 1}.png`, import.meta.url)),
  );
  const data = new Uint8ClampedArray(png.data);
  applyGravityPalette(data, 71, `idle-${index + 1}`);
  return data;
});

test('quiet idle uses intact poses with no deep crouch and only one pixel of head travel', () => {
  const seen = new Set<number>(),
    headHeights = new Set<number>();
  for (let t = 0; t < 4.8; t += 0.01) {
    const index = gravityIdleIndex(t);
    seen.add(index);
    assert.equal(resolveGravityPose('breathe', t).index, index);
    let top = 67;
    for (let i = 0; i < idle[index].length; i += 4)
      if (idle[index][i + 3]) top = Math.min(top, Math.floor(i / 4 / 71));
    headHeights.add(top);
  }
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
  assert.equal(Math.max(...headHeights) - Math.min(...headHeights), 1);
  assert.equal(gravityIdleIndex(0), gravityIdleIndex(2.4));
});

test('existing movement and combat idle retain the original motion-clock timing', () => {
  for (const [tag, count] of [
    ['walk', 16],
    ['stride', 16],
    ['sprint', 8],
    ['jump', 4],
    ['idle', 4],
  ] as const)
    for (const time of [0, 0.19, 0.42, 1.8, 21.37])
      assert.equal(resolveGravityPose(tag, time).index, candidateIndex(time, count, 0.8));
});

test('acting settles once, with connected limbs, preserved soles and anatomical scarf sockets', () => {
  const before = idle.map((data) => data.slice());
  const acting = makeGravityActingFrames(idle, 71, 67);
  for (const [action, frames] of Object.entries(acting)) {
    assert.equal(frames.length, 3);
    assert.equal(resolveGravityPose(action, 0).index, 0);
    assert.equal(resolveGravityPose(action, 5).index, 2);
    assert.equal(resolveGravityPose(action, 100).index, 2);
    for (const [index, pose] of frames.entries()) {
      for (let x = 0; x < 71; x++) {
        const at = (66 * 71 + x) * 4;
        assert.equal(pose.data[at + 3], idle[1][at + 3], `${action}/${index}: sole silhouette`);
        if (idle[1][at + 3])
          assert.deepEqual(
            pose.data.slice(at, at + 4),
            idle[1].slice(at, at + 4),
            `${action}/${index}: boot colors`,
          );
      }
      let hairRight = 0,
        hairBottom = 0,
        count = 0,
        first = -1;
      for (let pixel = 0; pixel < 71 * 67; pixel++) {
        const at = pixel * 4;
        if (!pose.data[at + 3]) continue;
        count++;
        if (first < 0) first = pixel;
        if (pose.data[at] === 216 && pose.data[at + 1] === 181 && pose.data[at + 2] === 104) {
          hairRight = Math.max(hairRight, pixel % 71);
          hairBottom = Math.max(hairBottom, Math.floor(pixel / 71));
        }
      }
      assert.deepEqual(
        pose.neck,
        { x: hairRight - 6, y: hairBottom + 3 },
        `${action}/${index}: actual neck`,
      );
      const visited = new Set([first]),
        pending = [first];
      while (pending.length) {
        const pixel = pending.pop()!,
          x = pixel % 71,
          y = Math.floor(pixel / 71);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx,
              ny = y + dy,
              next = ny * 71 + nx;
            if (
              nx < 0 ||
              nx >= 71 ||
              ny < 0 ||
              ny >= 67 ||
              visited.has(next) ||
              !pose.data[next * 4 + 3]
            )
              continue;
            visited.add(next);
            pending.push(next);
          }
      }
      assert.equal(
        visited.size,
        count,
        `${action}/${index}: no detached hand, knee or boot pixels`,
      );
    }
    assert.notDeepEqual(frames[0].data, frames[2].data, `${action}: distinct settled silhouette`);
  }
  assert.deepEqual(idle, before, 'source frames were not mutated');
  assert.equal(Object.keys(acting).length, Object.keys(GRAVITY_ACTIONS).length);
});
