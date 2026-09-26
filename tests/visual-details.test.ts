import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FootWater, foregroundAlpha } from '../src/visual-details.ts';
import { AREAS } from '../src/content.ts';
import { evidenceArt } from '../src/evidence-art.ts';

test('footfall ripples are distance-driven at different refresh rates', () => {
  for (const fps of [30, 60, 120]) {
    const water = new FootWater();
    water.step(0, 0, 438, true, true, false);
    for (let i = 1; i <= fps / 2; i++) water.step(1 / fps, (i / fps) * 150, 438, true, true, false);
    assert.equal(water.ripples.length, 3);
    assert.ok(Math.abs(water.ripples[2].x - 75) < 1);
  }
});
test('dry ground, stopped movement, teleporting and reduced motion do not create splashes', () => {
  const water = new FootWater();
  water.step(0, 0, 438, true, true, false);
  water.step(0.1, 30, 438, false, true, false);
  water.step(0.1, 60, 438, true, false, false);
  water.step(0.1, 500, 438, true, true, false);
  assert.equal(water.ripples.length, 0);
  water.step(0.1, 530, 438, true, true, false);
  assert.equal(water.ripples.length, 1);
  water.step(0.1, 560, 438, true, true, true);
  assert.equal(water.ripples.length, 0);
});
test('ripples expire and an area reset drops all previous footfall state', () => {
  const water = new FootWater();
  water.step(0, 0, 438, true, true, false);
  water.step(0.1, 30, 438, true, true, false);
  water.step(1, 30, 438, true, false, false);
  assert.equal(water.ripples.length, 0);
  water.step(0.1, 60, 438, true, true, false);
  water.reset();
  water.step(0.1, 1000, 438, true, true, false);
  assert.equal(water.ripples.length, 0);
});
test('physical records and the archive share locally authored illustrations', () => {
  for (const id of ['sketch', 'register', 'witness', 'transfer', 'chime', 'fragment'] as const) {
    const art = evidenceArt(id);
    assert.match(art, /<svg/);
    assert.doesNotMatch(art, /<script|https?:\/\/(?!www.w3.org)/);
  }
  assert.match(evidenceArt('register'), /Ada Vale/);
  assert.match(evidenceArt('witness'), /V-17/);
  assert.match(evidenceArt('camera'), /SIGNAL ABSENT/);
});

test('near-plane props thin out over Gravity and stay solid elsewhere', () => {
  assert.equal(foregroundAlpha(100, 80), 1);
  // Overlapping the figure: the prop becomes a veil, never a wall.
  assert.equal(foregroundAlpha(100, 80, { x: 140, half: 45 }), 0.3);
  // Well clear of her: fully solid, so walking past still reads as depth.
  assert.equal(foregroundAlpha(100, 80, { x: 400, half: 45 }), 1);
  const partial = foregroundAlpha(100, 80, { x: 237, half: 45 });
  assert.ok(partial > 0.3 && partial < 1);
});

test('arriving in the Den starts clear of the stair-foot cabinet', () => {
  const den = AREAS.den;
  // At the left camera stop the cabinet spans 70–150; Gravity is 16 × figure either side.
  assert.equal(foregroundAlpha(70, 80, { x: den.spawn, half: 16 * den.figureScale }), 1);
});
