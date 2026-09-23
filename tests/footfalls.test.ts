import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterMotion, MOTION_LOOP, footfallBetween } from '../src/character-motion.ts';

/** Footfalls counted over a run of frames at a steady speed. */
function count(speed: number, seconds: number, dt = 1 / 60) {
  const motion = new CharacterMotion();
  let last = 0,
    steps = 0;
  for (let t = 0; t < seconds; t += dt) {
    const m = motion.update(dt, 1, speed, false, false, false);
    if (footfallBetween(m.tag, last, m.time)) steps++;
    last = m.time;
  }
  return steps;
}

test('a walk lands two feet per loop and the first on the first frame', () => {
  assert.equal(footfallBetween('stride', 0, 0.01), true);
  assert.equal(footfallBetween('stride', 0.01, MOTION_LOOP * 0.49), false);
  assert.equal(footfallBetween('stride', MOTION_LOOP * 0.49, MOTION_LOOP * 0.51), true);
  // 145 px/s runs the clock at 1×: a step every 0.4 s, so ten in just under four seconds.
  assert.equal(count(145, 3.9), 10);
});

test('a sprint steps twice as often, landing after each airborne frame', () => {
  assert.equal(footfallBetween('sprint', 0.1, 0.21), true);
  assert.equal(footfallBetween('sprint', 0.21, 0.59), false);
  // 290 px/s doubles the clock: a step every 0.2 s.
  assert.equal(count(290, 4), 20);
});

test('standing still, turning or talking makes no footfalls', () => {
  assert.equal(count(0, 3), 0);
  for (const tag of ['breathe', 'turn', 'listen', 'examine'])
    assert.equal(footfallBetween(tag, 0, 5), false);
});

test('a dropped frame still sounds the step it skipped over, once', () => {
  assert.equal(footfallBetween('stride', 0.35, 0.45), true);
  assert.equal(count(145, 3.9, 1 / 20), 10);
});

test('walking after an idle or turn uses the restarted animation clock', () => {
  assert.equal(footfallBetween('stride', 8.2, 0.016, 'breathe'), true);
  assert.equal(footfallBetween('stride', 0.15, 0.016, 'turn'), true);
  assert.equal(footfallBetween('sprint', 0.4, 0.41, 'stride'), false);
  assert.equal(footfallBetween('stride', 8.2, 0, 'breathe'), false);
});
