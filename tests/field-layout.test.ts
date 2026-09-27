import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labelPlacement } from '../src/field-layout.ts';

test('near-body captions face away from the figure and turn inward at viewport edges', () => {
  assert.equal(labelPlacement(520, 310, 480, 438, 2.8, 0, 1000), 'right');
  assert.equal(labelPlacement(480, 310, 520, 438, 2.8, 0, 1000), 'left');
  assert.equal(labelPlacement(100, 310, 140, 438, 2.8, 0, 1000), 'right');
  assert.equal(labelPlacement(900, 310, 850, 438, 2.8, 0, 1000), 'left');
  assert.equal(labelPlacement(500, 50, 500, 438, 2.8, 0, 1000), 'below');
  assert.equal(labelPlacement(100, 310, 800, 438, 2.8, 0, 1000), 'below');
  assert.equal(labelPlacement(720, 310, 680, 438, 2.8, 200, 1000), 'right');
});
