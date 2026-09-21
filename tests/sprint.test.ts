import test from 'node:test';
import assert from 'node:assert/strict';
import { stepBody, type Body } from '../src/model.ts';
import { CharacterMotion } from '../src/character-motion.ts';

test('sprint doubles travel speed, returns to walking, brakes and respects bounds', () => {
  const make = (): Body => ({ x: 500, y: 438, vx: 0, vy: 0, grounded: true, facing: 1 });
  const walk = make(),
    run = make();
  for (let i = 0; i < 60; i++) {
    stepBody(walk, 1, false, 1 / 60, 3000);
    stepBody(run, 1, false, 1 / 60, 3000, true);
  }
  assert.ok(Math.abs((run.x - 500) / (walk.x - 500) - 2) < 0.01);
  for (let i = 0; i < 60; i++) stepBody(run, 1, false, 1 / 60, 3000);
  assert.ok(Math.abs(run.vx - 145) < 0.01);
  for (let i = 0; i < 60; i++) stepBody(run, 0, false, 1 / 60, 3000, true);
  assert.ok(Math.abs(run.vx) < 0.01);
  for (let i = 0; i < 600; i++) stepBody(run, 1, false, 1 / 60, 3000, true);
  assert.equal(run.x, 2968);
});

test('walk-run transitions preserve gait phase and reduced motion retains leg animation', () => {
  const motion = new CharacterMotion();
  const walk = motion.update(0.1, 1, 145, false, false, false);
  const run = motion.update(0.1, 1, 290, false, false, false);
  assert.equal(run.tag, 'sprint');
  assert.ok(run.time > walk.time);
  const slow = motion.update(0.1, 1, 145, false, false, false);
  assert.equal(slow.tag, 'stride');
  assert.ok(slow.time > run.time);
  const reduced = motion.update(0.1, 1, 290, false, false, true);
  assert.equal(reduced.lean, 0);
  assert.ok(reduced.time > slow.time);
  assert.equal(motion.update(0.1, 1, 290, true, false, false).tag, 'examine');
});
