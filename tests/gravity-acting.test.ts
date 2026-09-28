import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { applyGravityPalette } from '../src/gravity-palette.ts';
import { CANDIDATE_CROP, candidateIndex, resolveGravityPose } from '../src/character-candidate.ts';
import { AREAS } from '../src/content.ts';
import { interactionPosition } from '../src/interaction-staging.ts';
import {
  GRAVITY_ACTIONS,
  PoseRecovery,
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

test('action recovery retraces held poses, pauses cleanly and yields immediately to movement', () => {
  const recovery = new PoseRecovery();
  recovery.sample('crouch', 9, 0.016, false, false);
  const start = recovery.sample(null, 0, 0, false, false)!;
  assert.ok(Math.abs(start.time - GRAVITY_ACTIONS.crouch.duration) < 1e-9);
  assert.equal(recovery.sample(null, 0, 0.15, false, false)!.time, start.time / 2);
  assert.equal(recovery.sample(null, 0, 0.15, false, false)!.time, 0);
  assert.equal(recovery.sample(null, 0, 0.01, false, false), null);
  for (const [moving, reduced] of [
    [true, false],
    [false, true],
  ]) {
    recovery.sample('study', 1, 0, false, false);
    assert.equal(recovery.sample(null, 0, 0.016, moving, reduced), null);
    assert.equal(recovery.sample(null, 0, 0.016, false, false), null);
  }
  recovery.sample('terminal', 1, 0, false, false);
  recovery.reset();
  assert.equal(recovery.sample(null, 0, 0.016, false, false), null);
});

test('raised console contact preserves the standing body and reaches the keys from either side', () => {
  const acting = makeGravityActingFrames(idle, 71, 67);
  for (const pose of acting['terminal-high']) {
    for (let y = 0; y < 67; y++)
      for (let x = 0; x < 71; x++) {
        if (x >= 38 && x <= 55 && y >= 24 && y <= 37) continue;
        const at = (y * 71 + x) * 4;
        assert.deepEqual(pose.data.slice(at, at + 4), idle[1].slice(at, at + 4));
      }
  }
  const area = AREAS.clinic;
  const console = area.hotspots.find((h) => h.id === 'sale')!;
  const pose = acting['terminal-high'][2].data;
  const scale = (73 * area.figureScale) / CANDIDATE_CROP.cellHeight;
  // The plate's key strip is below the screen, around y295, not at the clue marker y262.
  for (const facing of [-1, 1]) {
    const stand = interactionPosition(console, area, console.x - facing * 180, facing);
    let touchesKeys = false;
    for (let y = 0; y < 67; y++)
      for (let x = 50; x < 71; x++) {
        const at = (y * 71 + x) * 4;
        if (pose[at] !== 255 || pose[at + 1] !== 177 || pose[at + 2] !== 100) continue;
        const handX = stand + facing * (x - CANDIDATE_CROP.pivotX) * scale;
        const handY = area.ground + (y - 67) * scale;
        if (handX >= 1344 && handX <= 1376 && handY >= 285 && handY <= 304) touchesKeys = true;
      }
    assert.ok(touchesKeys, `held fingertips meet the key strip facing ${facing}`);
  }
  const recovery = new PoseRecovery();
  recovery.sample('terminal-high', 5, 0, false, false);
  assert.equal(recovery.sample(null, 0, 0.15, false, false)?.tag, 'terminal-high');
  assert.equal(recovery.sample(null, 0, 0.01, true, false), null);
});
