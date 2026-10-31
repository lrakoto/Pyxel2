import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analog, justPressed, readController, type GamepadSnapshot } from '../src/gamepad.ts';

const pad = (): GamepadSnapshot => ({
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
});

test('analog sticks ignore drift, rescale beyond the dead zone, and clamp invalid input', () => {
  assert.equal(analog(0.1), 0);
  assert.equal(analog(-0.22), 0);
  assert.ok(Math.abs(analog(0.61) - 0.5) < 1e-10);
  assert.equal(analog(-1), -1);
  assert.equal(analog(4), 1);
  assert.equal(analog(Number.NaN), 0);
  assert.equal(analog(undefined), 0);
});

test('standard controller buttons and twin-stick axes map to game actions', () => {
  const input = pad();
  input.axes = [0.8, 0, -0.7, 0.5];
  for (const index of [0, 1, 2, 3, 4, 5, 6, 8, 9]) input.buttons[index].pressed = true;
  input.buttons[7].value = 0.75;
  const frame = readController(input);
  assert.ok(frame.moveX > 0.7);
  assert.ok(frame.aimX < -0.6);
  assert.ok(frame.aimY > 0.3);
  assert.equal(frame.confirm, true);
  assert.equal(frame.back, true);
  assert.equal(frame.focus, true);
  assert.equal(frame.board, true);
  assert.equal(frame.previous, true);
  assert.equal(frame.next, true);
  assert.equal(frame.sprint, true);
  assert.equal(frame.fire, true);
  assert.equal(frame.map, true);
  assert.equal(frame.pause, true);
  assert.equal(frame.active, true);
});

test('D-pad movement overrides analog horizontal movement and supports menu directions', () => {
  const input = pad();
  input.axes = [1, -1, 0, 0];
  input.buttons[14].pressed = true;
  const frame = readController(input);
  assert.equal(frame.moveX, -1);
  assert.equal(frame.left, true);
  assert.equal(frame.right, false);
  assert.equal(frame.up, true);
  assert.equal(frame.down, false);
});

test('press edges fire once until the button is released', () => {
  const input = pad();
  const released = readController(input);
  input.buttons[0].pressed = true;
  const pressed = readController(input);
  assert.equal(justPressed(pressed, released, 'confirm'), true);
  assert.equal(justPressed(pressed, pressed, 'confirm'), false);
  assert.equal(justPressed(released, pressed, 'confirm'), false);
});

test('an idle or missing controller produces no actions', () => {
  assert.equal(readController(null).active, false);
  const input = pad();
  input.axes = [0.05, -0.08, 0.12, -0.1];
  const frame = readController(input);
  assert.equal(frame.active, false);
  assert.equal(frame.moveX, 0);
  assert.equal(frame.aimX, 0);
  assert.equal(frame.aimY, 0);
});
