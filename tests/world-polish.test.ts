import test from 'node:test';
import assert from 'node:assert/strict';
import { FootWater } from '../src/visual-details.ts';
import { CharacterMotion } from '../src/character-motion.ts';

test('wet prints are bounded, expire, and clear with reduced motion', () => {
  const water = new FootWater();
  for (let x = 0; x < 2000; x += 26) water.step(0.01, x, 438, true, true, false);
  assert.ok(water.footprints.length > 0 && water.footprints.length <= 20);
  water.step(4, 2000, 438, false, false, false);
  assert.equal(water.footprints.length, 0);
  water.step(0.1, 2026, 438, true, true, false);
  water.step(0.1, 2052, 438, true, true, true);
  assert.equal(water.footprints.length, 0);
});
test('stopping motion settles without shifting the feet and respects reduced motion', () => {
  const motion = new CharacterMotion();
  motion.update(0.1, 1, 140, false, false, false);
  assert.ok(motion.update(0.1, 1, 0, false, false, false).lean > 0);
  assert.equal(motion.update(1, 1, 0, false, false, false).lean, 0);
  motion.update(0.1, 1, 140, false, false, false);
  assert.equal(motion.update(0.1, 1, 0, false, false, true).lean, 0);
});
