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

test('walking through every area’s zone edges and overlaps never reverses or jumps the camera', () => {
  for (const area of Object.values(AREAS)) {
    for (const width of [300, 390, 460, 620, 960, 1280]) {
      let previous = explorationCamera(area, 32, width);
      for (let x = 32.25; x <= area.width - 32; x += 0.25) {
        const next = explorationCamera(area, x, width);
        assert.ok(next >= previous, `camera reverses at ${x}, width ${width}`);
        assert.ok(next - previous < 0.5, `camera jumps at ${x}, width ${width}`);
        const base = explorationCamera(area, x, width, true);
        assert.ok(Math.abs(next - base) <= Math.min(64, width * 0.08) + 1e-8);
        previous = next;
      }
    }
  }
});

test('every clue stays in view with Gravity at its examination stop on phone and desktop', () => {
  for (const area of Object.values(AREAS)) {
    for (const width of [300, 390, 460, 620, 960, 1280]) {
      for (const h of area.hotspots.filter((h) => h.kind === 'clue')) {
        for (const side of [-1, 1]) {
          const x = interactionPosition(h, area, h.x - side * 200, side);
          const camera = explorationCamera(area, x, width);
          for (const subject of [x, h.x]) {
            assert.ok(subject - camera > 24 && subject - camera < width - 24);
          }
        }
      }
    }
  }
});

test('reduced motion preserves the established exploration camera in every area', () => {
  for (const area of Object.values(AREAS)) {
    for (const width of [300, 960, 1280, 2000]) {
      for (let x = 0; x <= area.width; x += 25) {
        const original = Math.max(0, Math.min(area.width - width, x - width * 0.48));
        assert.equal(explorationCamera(area, x, width, true), original);
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

test('street, archive and clinic landmarks attract attention without pulling past room boundaries', () => {
  for (const [area, subjects] of [
    [AREAS.street, [180, 988, 1530]],
    [AREAS.den, [450, 823]],
    [AREAS.clinic, [410, 930]],
  ] as const) {
    for (const subject of subjects) {
      let influenced = false;
      for (const offset of [-40, 40]) {
        const x = subject + offset;
        const base = explorationCamera(area, x, 300, true);
        const camera = explorationCamera(area, x, 300);
        assert.ok((camera - base) * offset <= 0);
        if (camera !== base) influenced = true;
        assert.ok(subject - camera > 30 && subject - camera < 270);
      }
      assert.ok(influenced, `${area.id} landmark ${subject} has an authored view`);
    }
  }
});

test('conversation approach positions retain their subjects even at the minimum viewport', () => {
  for (const area of Object.values(AREAS)) {
    for (const h of area.hotspots.filter((h) => h.kind === 'talk')) {
      for (const width of [300, 390, 460, 960]) {
        for (const side of [-1, 1]) {
          const x = interactionPosition(h, area, h.x - side * 220, side);
          const camera = explorationCamera(area, x, width);
          assert.ok(h.x - camera > 0 && h.x - camera < width, `${area.id}/${h.id}, width ${width}`);
        }
      }
    }
  }
});

test('quiet stretches preserve tracking and studio composition remains unchanged', () => {
  for (const [area, x] of [
    [AREAS.street, 550],
    [AREAS.clinic, 690],
  ] as const) {
    assert.equal(explorationCamera(area, x, 300), explorationCamera(area, x, 300, true));
  }
  // The previous studio checkpoint's same-position desktop and phone targets.
  assert.ok(Math.abs(explorationCamera(AREAS.studio, 664, 960) - 243.699931) < 0.01);
  assert.ok(Math.abs(explorationCamera(AREAS.studio, 664, 460) - 459.547846) < 0.01);
});
