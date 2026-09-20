import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reliefOffset, shelterShade } from '../src/spatial.ts';
test('architectural relief reverses at the sightline and remains attached across viewport sizes', () => {
  for (const width of [300, 390, 960, 1280]) {
    assert.equal(Math.abs(reliefOffset(400 + width / 2, 400, width, -0.024)), 0);
    assert.ok(reliefOffset(400, 400, width, -0.024) > 0);
    assert.ok(reliefOffset(400 + width, 400, width, -0.024) < 0);
    for (let camera = 0; camera < 1800; camera += 10)
      assert.ok(Math.abs(reliefOffset(1008, camera, width, 0.025)) <= 14);
  }
});
test('shelter lighting fades smoothly at edges and leaves open pavement unchanged', () => {
  assert.equal(shelterShade(850), 0);
  assert.equal(shelterShade(43), 0);
  assert.equal(shelterShade(100), 0.24);
  assert.ok(shelterShade(50) < shelterShade(60));
  for (let x = 0; x < 1800; x++)
    assert.ok(Math.abs(shelterShade(x + 1) - shelterShade(x)) <= 0.011);
});
