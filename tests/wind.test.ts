import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streetWind, streetWindDisplacement } from '../src/wind.ts';

test('street gusts are bounded and leave most of the scene time calm', () => {
  let calm = 0;
  let positive = 0;
  let negative = 0;
  for (let i = 0; i < 4400; i++) {
    const time = i / 100;
    const wind = streetWind(time);
    assert.ok(wind >= -1 && wind <= 1);
    assert.equal(wind, streetWind(time), 'same game time must give every layer the same gust');
    if (wind === 0) calm++;
    if (wind > 0.5) positive++;
    if (wind < -0.2) negative++;
  }
  assert.ok(calm / 4400 > 0.7);
  assert.ok(positive > 100);
  assert.ok(negative > 100);
});

test('gust boundaries and cycle seams remain smooth', () => {
  const epsilon = 0.0001;
  for (const seam of [7, 14, 30, 35, 44, 51, 58, 74, 79, 88]) {
    assert.equal(streetWind(seam), 0);
    assert.ok(Math.abs(streetWind(seam - epsilon)) < 1e-8);
    assert.ok(Math.abs(streetWind(seam + epsilon)) < 1e-8);
  }
  for (let time = 1; time < 180; time += 0.1) {
    assert.ok(Math.abs(streetWind(time + epsilon) - streetWind(time)) < epsilon);
  }
});

test('rain displacement integrates wind continuously without cycle resets', () => {
  const epsilon = 0.0001;
  for (let time = 1; time < 500; time += 0.17) {
    const velocity =
      (streetWindDisplacement(time + epsilon) - streetWindDisplacement(time - epsilon)) /
      (epsilon * 2);
    assert.ok(Math.abs(velocity - streetWind(time)) < 1e-7);
  }
  for (const seam of [44, 88, 132]) {
    assert.ok(streetWindDisplacement(seam) > 0);
    assert.equal(streetWindDisplacement(seam - 1), streetWindDisplacement(seam + 1));
  }
});

test('reduced motion and invalid clocks have no ambient wind or drift', () => {
  for (const time of [0, 10.5, 32.5, 55, 1000]) {
    assert.equal(streetWind(time, true), 0);
    assert.equal(streetWindDisplacement(time, true), 0);
  }
  for (const time of [-10, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(streetWind(time), 0);
    assert.equal(streetWindDisplacement(time), 0);
  }
});
