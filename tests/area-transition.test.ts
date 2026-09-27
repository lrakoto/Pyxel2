import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AreaTransition } from '../src/area-transition.ts';

for (const reduced of [false, true]) {
  test(`door and train swaps stay covered and release once (reduced=${reduced})`, () => {
    for (const ride of [false, true]) {
      for (const dt of [1 / 120, 1 / 30, 0.1]) {
        const sequence = new AreaTransition(ride, reduced);
        let swaps = 0,
          completions = 0,
          duration = 0;
        for (let i = 0; i < 400; i++) {
          const state = sequence.step(dt);
          duration += dt;
          assert.ok(state.opacity >= 0 && state.opacity <= 1);
          if (state.swap) {
            swaps++;
            assert.equal(state.opacity, 1);
            assert.equal(state.done, false);
          }
          if (state.done) {
            completions++;
            assert.equal(swaps, 1);
            assert.equal(state.opacity, 0);
            assert.ok(duration >= sequence.fade * 2 + sequence.hold);
          }
        }
        assert.equal(swaps, 1);
        assert.equal(completions, 1);
      }
    }
  });
}

test('a paused or invalid clock cannot advance a fade; a delayed frame still covers the swap', () => {
  const sequence = new AreaTransition(false, false);
  const start = sequence.step(0.1);
  for (const dt of [0, -1, NaN, Infinity]) assert.deepEqual(sequence.step(dt), start);
  assert.deepEqual(sequence.step(10), { opacity: 1, swap: true, done: false });
  assert.deepEqual(sequence.step(0), { opacity: 0, swap: false, done: true });
});
