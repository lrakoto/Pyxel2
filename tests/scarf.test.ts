import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scarf } from '../src/scarf.ts';

/** Capture the public ribbon path without depending on the chain's internals. */
function ribbon(scarf: Scarf) {
  const points: { x: number; y: number }[] = [];
  const context = {
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    fill() {},
    moveTo(x: number, y: number) {
      points.push({ x, y });
    },
    lineTo(x: number, y: number) {
      points.push({ x, y });
    },
  };
  scarf.draw(context as unknown as CanvasRenderingContext2D, 0, null);
  return points;
}

test('same-area teleports rebuild the scarf at its new anchor', () => {
  const height = 73;
  for (const destination of [
    { x: 400, y: 0 },
    { x: 0, y: -240 },
  ]) {
    const scarf = new Scarf();
    for (let i = 0; i < 120; i++) scarf.step(1 / 60, 0, 0, 0, height, 0.84);
    scarf.step(1 / 60, destination.x, destination.y, 0, height);
    const points = ribbon(scarf);
    assert.ok(points.length > 12);
    for (const point of points) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(Math.abs(point.x - destination.x) < height * 0.1);
      assert.ok(point.y >= destination.y - 2);
      assert.ok(point.y < destination.y + height * 0.65);
    }
  }
});

test('ordinary movement preserves the trailing cloth instead of resetting it', () => {
  const height = 73;
  for (const direction of [-1, 1]) {
    const scarf = new Scarf();
    scarf.step(0, 0, 0, 0, height);
    let anchorX = 0;
    for (let i = 0; i < 120; i++) {
      anchorX += (direction * 110) / 60;
      scarf.step(1 / 60, anchorX, 0, direction * 110, height);
    }
    const points = ribbon(scarf);
    const middle = points.length / 2;
    const tipX = (points[middle - 1].x + points[middle].x) / 2;
    assert.ok((anchorX - tipX) * direction > height * 0.25);
    assert.ok((anchorX - tipX) * direction < height * 0.75);
  }
});
