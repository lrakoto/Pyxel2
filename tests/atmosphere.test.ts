import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHELTERS, underShelter, eventEnvelope } from '../src/atmosphere.ts';
test('roof shelter affects only the covered pavement plane', () => {
  for (const s of SHELTERS) {
    const x = (s.left + s.right) / 2;
    assert.equal(underShelter(x, s.roof + 20), true);
    assert.equal(underShelter(x, s.roof - 1), false);
    assert.equal(underShelter(x, s.floor + 10), false);
  }
  assert.equal(underShelter(850, 400), false);
});
test('ambient events have smooth bounded peaks and long quiet intervals', () => {
  assert.equal(eventEnvelope(0, 20, 4), 0);
  assert.equal(eventEnvelope(2, 20, 4), 1);
  assert.equal(eventEnvelope(4, 20, 4), 0);
  assert.equal(eventEnvelope(19, 20, 4), 0);
  for (let t = -30; t < 80; t += 0.07) {
    const v = eventEnvelope(t, 20, 4);
    assert.ok(v >= 0 && v <= 1);
    assert.ok(Math.abs(v - eventEnvelope(t + 20, 20, 4)) < 1e-10);
  }
});
