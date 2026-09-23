import test from 'node:test';
import assert from 'node:assert/strict';
import { stepBody, type Body } from '../src/model.ts';
import { CharacterMotion } from '../src/character-motion.ts';
import { AREAS } from '../src/content.ts';

test('outdoor sprint retains its original pace, returns to walking, brakes and respects bounds', () => {
  const make = (): Body => ({ x: 500, y: 438, vx: 0, vy: 0, grounded: true, facing: 1 });
  const walk = make(),
    run = make();
  for (let i = 0; i < 60; i++) {
    stepBody(walk, 1, false, 1 / 60, 3000);
    stepBody(run, 1, false, 1 / 60, 3000, true);
  }
  assert.ok(Math.abs((run.x - 500) / (walk.x - 500) - 290 / 145) < 0.01);
  for (let i = 0; i < 60; i++) stepBody(run, 1, false, 1 / 60, 3000);
  assert.ok(Math.abs(run.vx - 145) < 0.01);
  for (let i = 0; i < 60; i++) stepBody(run, 0, false, 1 / 60, 3000, true);
  assert.ok(Math.abs(run.vx) < 0.01);
  for (let i = 0; i < 600; i++) stepBody(run, 1, false, 1 / 60, 3000, true);
  assert.equal(run.x, 2968);
});

test('interior sprint keeps the same boosted pace and floor contact; combat keeps its old pace', () => {
  for (const area of [AREAS.studio, AREAS.den]) {
    const run: Body = { x: 100, y: area.ground, vx: 0, vy: 0, grounded: true, facing: 1 };
    for (let i = 0; i < 120; i++)
      stepBody(run, 1, false, 1 / 60, area.width, true, area.ground, 330);
    assert.ok(Math.abs(run.vx - 330) < 0.01);
    assert.ok(run.x > 740 && run.x < 760);
    assert.equal(run.y, area.ground);
    assert.equal(run.grounded, true);
  }
  const combat: Body = { x: 100, y: 434, vx: 0, vy: 0, grounded: true, facing: 1 };
  for (let i = 0; i < 120; i++) stepBody(combat, 1, false, 1 / 60, 1800, true, 434, 290);
  assert.ok(Math.abs(combat.vx - 290) < 0.01);
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

test('faster sprint animation tracks its increased travel speed', () => {
  const normal = new CharacterMotion().update(0.2, 1, 290, false, false, false);
  const faster = new CharacterMotion().update(0.2, 1, 330, false, false, false);
  assert.equal(faster.tag, 'sprint');
  assert.ok(Math.abs(faster.time / normal.time - 330 / 290) < 0.001);
});
