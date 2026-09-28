import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../src/content.ts';
import { explorationCamera } from '../src/exploration-camera.ts';
import { interactionPosition } from '../src/interaction-staging.ts';

test('studio framing shares attention with the painting and receiver from either side', () => {
  for (const subject of [788, 1251]) {
    for (const offset of [-40, 40]) {
      const player = subject + offset;
      const base = explorationCamera(AREAS.studio, player, 390, true);
      const camera = explorationCamera(AREAS.studio, player, 390);
      assert.ok((camera - base) * offset < 0, 'bias looks toward the visual subject');
      assert.ok(Math.abs(camera - base) < 390 * 0.08);
      assert.ok(subject - camera > 390 * 0.1 && subject - camera < 390 * 0.9);
    }
  }
});

test('walking through zone edges and overlaps never reverses or jumps the camera', () => {
  for (const width of [300, 390, 620, 960, 1280]) {
    let previous = explorationCamera(AREAS.studio, 32, width);
    for (let x = 32.25; x <= AREAS.studio.width - 32; x += 0.25) {
      const next = explorationCamera(AREAS.studio, x, width);
      assert.ok(next >= previous, `camera reverses at ${x}, width ${width}`);
      assert.ok(next - previous < 0.5, `camera jumps at ${x}, width ${width}`);
      const base = explorationCamera(AREAS.studio, x, width, true);
      assert.ok(Math.abs(next - base) <= Math.min(64, width * 0.08) + 1e-8);
      previous = next;
    }
  }
});

test('every studio clue stays in view with Gravity at its examination stop on phone and desktop', () => {
  for (const width of [300, 390, 620, 960, 1280]) {
    for (const h of AREAS.studio.hotspots.filter((h) => h.kind === 'clue')) {
      for (const side of [-1, 1]) {
        const x = interactionPosition(h, AREAS.studio, h.x - side * 200, side);
        const camera = explorationCamera(AREAS.studio, x, width);
        for (const subject of [x, h.x]) {
          assert.ok(subject - camera > 24 && subject - camera < width - 24);
        }
      }
    }
  }
});

test('reduced motion and unauthored areas preserve the established exploration camera', () => {
  for (const area of Object.values(AREAS)) {
    for (const width of [300, 960, 1280, 2000]) {
      for (let x = 0; x <= area.width; x += 25) {
        const original = Math.max(0, Math.min(area.width - width, x - width * 0.48));
        assert.equal(explorationCamera(area, x, width, true), original);
        if (area.id !== 'studio') assert.equal(explorationCamera(area, x, width), original);
      }
    }
  }
});

test('room bounds hold at narrow and oversized viewports without retained framing state', () => {
  for (const area of Object.values(AREAS)) {
    for (const width of [300, 390, 960, 1280, 2000]) {
      for (const x of [-10, 32, area.spawn, 664, area.width - 32, area.width + 10]) {
        const first = explorationCamera(area, x, width);
        assert.ok(first >= 0 && first <= Math.max(0, area.width - width));
        explorationCamera(AREAS.studio, 888, 390);
        assert.equal(explorationCamera(area, x, width), first, 'rest and room re-entry are stable');
      }
    }
  }
});
