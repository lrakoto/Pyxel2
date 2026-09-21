import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BodyMotion } from '../src/gravity-body.ts';
test('torso motion stays bounded, moves at both gaits and settles after stopping', () => {
  for (const speed of [145, 290]) {
    const body = new BodyMotion();
    let peak = 0;
    for (let i = 0; i < 240; i++) {
      peak = Math.max(
        peak,
        Math.abs(body.update(1 / 60, speed, i / 60 / (speed === 145 ? 0.8 : 0.4))),
      );
      assert.ok(Math.abs(body.offset) <= 1);
    }
    assert.equal(peak, 1);
    for (let i = 0; i < 180; i++) body.update(1 / 60, 0, 0);
    assert.ok(Math.abs(body.offset) < 0.001);
    assert.equal(body.update(1 / 60, speed, 0.3, true), 0);
  }
});
