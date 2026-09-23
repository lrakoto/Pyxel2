import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../src/content.ts';
import { leakImpacts, leakPhase } from '../src/water-events.ts';

test('water impacts follow visual landings once each at different frame rates', () => {
  const leaks = AREAS.den.water!.leaks!;
  const endTime = 20;
  const expected = leaks.reduce(
    (count, leak) => count + leakPhase(endTime, leak.x).cycle - leakPhase(0, leak.x).cycle,
    0,
  );
  for (const fps of [30, 60, 144]) {
    let count = 0;
    for (let frame = 1; frame <= endTime * fps; frame++)
      count += leakImpacts(leaks, frame / fps, 1 / fps, 800).length;
    assert.equal(count, expected, `${fps} fps`);
  }
});

test('paused redraws and invalid timing cannot replay water impacts', () => {
  const leaks = AREAS.studio.water!.leaks!;
  assert.deepEqual(leakImpacts(leaks, 20, 0, 700), []);
  assert.deepEqual(leakImpacts(leaks, 20, -1, 700), []);
  assert.deepEqual(leakImpacts(leaks, NaN, 0.016, 700), []);
  assert.deepEqual(leakImpacts(leaks, 20, Infinity, 700), []);
  assert.ok(leakImpacts(leaks, 20, 30, 700).length <= leaks.length);
});

test('off-screen leaks remain audible and fade continuously with listener distance', () => {
  const leak = AREAS.den.water!.leaks![0];
  let landing = 0;
  for (let frame = 1; frame < 180; frame++) {
    const time = frame / 60;
    if (leakImpacts([leak], time, 1 / 60, leak.x).length) {
      landing = time;
      break;
    }
  }
  assert.ok(landing > 0);
  const gain = (distance: number) =>
    leakImpacts([leak], landing, 1 / 60, leak.x + distance)[0].strength;
  assert.equal(gain(0), 1);
  assert.ok(gain(480) < gain(100));
  assert.ok(gain(1000) > 0 && gain(1000) < gain(480));
  assert.ok(Math.abs(gain(480) - gain(481)) < 0.002);
});
