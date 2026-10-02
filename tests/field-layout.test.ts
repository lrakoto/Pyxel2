import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionLift, labelPlacement } from '../src/field-layout.ts';

test('near-body captions face away from the figure and turn inward at viewport edges', () => {
  assert.equal(labelPlacement(520, 310, 480, 438, 2.8, 0, 1000), 'right');
  assert.equal(labelPlacement(480, 310, 520, 438, 2.8, 0, 1000), 'left');
  assert.equal(labelPlacement(100, 310, 140, 438, 2.8, 0, 1000), 'right');
  assert.equal(labelPlacement(900, 310, 850, 438, 2.8, 0, 1000), 'left');
  assert.equal(labelPlacement(500, 50, 500, 438, 2.8, 0, 1000), 'below');
  assert.equal(labelPlacement(100, 310, 800, 438, 2.8, 0, 1000), 'below');
  assert.equal(labelPlacement(720, 310, 680, 438, 2.8, 200, 1000), 'right');
});

test('a companion inside either side caption lifts it above the actors', () => {
  const left = { x: 420, y: 262, scale: 0.86 };
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, left), 'above');
  assert.equal(labelPlacement(520, 262, 480, 438, 2.85, 0, 1000, { ...left, x: 580 }), 'above');
  // The actual shell can lag behind the shoulder: do not lift merely because she exists.
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, { ...left, x: 750 }), 'left');
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, { ...left, y: 350 }), 'left');
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, null), 'left');
});

test('caption collision uses CSS scale and respects inward edge placement', () => {
  // A distant shell falls inside the caption only when the CSS stage shrinks.
  const shell = { x: 200, y: 262, scale: 1 };
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, shell), 'left');
  assert.equal(
    labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, { ...shell, scale: 0.5 }),
    'above',
  );
  assert.equal(labelPlacement(100, 262, 140, 438, 2.85, 0, 1000, { ...shell, x: 160 }), 'above');
  assert.equal(labelPlacement(900, 262, 850, 438, 2.85, 0, 1000, { ...shell, x: 840 }), 'above');
  // Distant/high markers keep their existing layout, even beside a docked terminal.
  assert.equal(labelPlacement(480, 262, 800, 438, 2.85, 0, 1000, shell), 'below');
  assert.equal(labelPlacement(480, 50, 520, 438, 2.85, 0, 1000, shell), 'below');
  assert.equal(labelPlacement(480, 262, 520, 438, 2.85, 0, 1000, { ...shell, scale: 0 }), 'left');
});

test('lifted captions clear the hair at every stage scale without moving the marker', () => {
  for (const scale of [0.45, 0.86, 1.4]) {
    for (const figure of [1, 2.8, 2.85]) {
      const bottom = 310 * scale - captionLift(310, 438, figure, scale);
      assert.ok(bottom <= (438 - 86 * figure) * scale + 1e-9);
    }
  }
  assert.equal(captionLift(50, 438, 2.85, 0.86), 24);
});

test('portrait captions reserve their full width before choosing a side', () => {
  const bounds = { scale: 0.8, width: 132.6 };
  // The old percentage cutoff put these labels beyond the stage; turning inward would
  // cross the actor, so the label belongs above her while its marker stays on the clue.
  assert.equal(labelPlacement(325, 310, 170, 438, 2.85, 0, 460), 'right');
  assert.equal(labelPlacement(325, 310, 170, 438, 2.85, 0, 460, null, bounds), 'above');
  assert.equal(labelPlacement(135, 310, 290, 438, 2.85, 0, 460, null, bounds), 'above');
  assert.equal(labelPlacement(75, 310, 100, 438, 2.85, 0, 150, null, bounds), 'above');
});

test('fitting side captions keep their direction, including at a shifted camera', () => {
  const bounds = { scale: 0.8, width: 132.6 };
  assert.equal(labelPlacement(200, 310, 140, 438, 2.85, 0, 600, null, bounds), 'right');
  assert.equal(labelPlacement(400, 310, 460, 438, 2.85, 0, 600, null, bounds), 'left');
  assert.equal(labelPlacement(900, 310, 960, 438, 2.85, 500, 600, null, bounds), 'left');
  assert.equal(
    labelPlacement(400, 310, 190, 438, 2.85, 0, 460, null, { scale: 0.8, width: 60 }),
    'left',
  );
});

test('viewport fit retains companion clearance and existing distant marker layout', () => {
  const bounds = { scale: 0.86, width: 132.6 };
  assert.equal(
    labelPlacement(520, 262, 480, 438, 2.85, 0, 1000, { x: 580, y: 262, scale: 0.86 }, bounds),
    'above',
  );
  assert.equal(
    labelPlacement(520, 262, 480, 438, 2.85, 0, 1000, { x: 750, y: 262, scale: 0.86 }, bounds),
    'right',
  );
  assert.equal(labelPlacement(325, 50, 170, 438, 2.85, 0, 460, null, bounds), 'below');
  assert.equal(labelPlacement(325, 310, 20, 438, 2.85, 0, 460, null, bounds), 'below');
});
