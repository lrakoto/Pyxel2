import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOP_TRAVEL,
  ORB_SIZE,
  ORB_SOCKETS,
  ambientHop,
  companionAnchor,
  hopState,
  lyraPresence,
  orbPixels,
  orbPose,
} from '../src/lyra-orb.ts';

const at = (pixels: number[], x: number, y: number) => pixels[y * ORB_SIZE + x];
const c = (ORB_SIZE - 1) / 2;

test('the shell is a round, outlined casing with one eye', () => {
  const open = orbPixels(0, 'open');
  assert.equal(open.length, ORB_SIZE * ORB_SIZE);
  for (const [x, y] of [
    [0, 0],
    [ORB_SIZE - 1, 0],
    [0, ORB_SIZE - 1],
    [ORB_SIZE - 1, ORB_SIZE - 1],
  ])
    assert.equal(at(open, x, y), 0);
  assert.equal(at(open, c, 0), 1, 'outline at the crown');
  assert.equal(at(open, c, c), 10, 'bright core at the centre of the eye');
  // Looking straight ahead the design is symmetrical, apart from the shading.
  for (let y = 0; y < ORB_SIZE; y++)
    for (let x = 0; x < ORB_SIZE; x++)
      assert.equal(at(open, x, y) === 0, at(open, ORB_SIZE - 1 - x, y) === 0);
});

test('gaze moves the eye a pixel, and a closed eye goes dark', () => {
  assert.equal(at(orbPixels(-1, 'open'), c - 1, c), 10);
  assert.equal(at(orbPixels(1, 'open'), c + 1, c), 10);
  const closed = orbPixels(0, 'closed');
  assert.ok(!closed.some((index) => index >= 8 && index <= 10), 'no lit eye pixels');
  const half = orbPixels(0, 'half');
  assert.equal(at(half, c, c), 10);
  assert.equal(at(half, c, c - 2), 7, 'the lid covers the upper eye');
});

test('reduced motion holds her still and steady', () => {
  for (const time of [0, 1.3, 4.6, 5.31]) {
    const pose = orbPose('idle', time, time, -30, true);
    assert.equal(pose.bob, 0);
    assert.equal(pose.eye, 'open');
    assert.equal(pose.gaze, -1);
    assert.equal(pose.ring, null);
  }
  assert.equal(orbPose('speak', 2, 0.4, 10, true).ring, null);
});

test('she faces what holds her attention, and her eye is dark when she is away', () => {
  assert.equal(orbPose('listen', 1, 1, 40, false).gaze, 1);
  assert.equal(orbPose('listen', 1, 1, -40, false).gaze, -1);
  const away = orbPose('away', 1, 1, 40, false);
  assert.equal(away.eye, 'closed');
  assert.ok(away.glow < 0.2);
  // Speaking brightens her eye above its listening level at some point in a line.
  const peaks = [0.1, 0.2, 0.3, 0.5].map((t) => orbPose('speak', 1, t, 1, false).glow);
  assert.ok(Math.max(...peaks) > orbPose('listen', 1, 1, 1, false).glow);
});

test('a hop travels out, holds inside the machine, and comes home', () => {
  const from = { x: 100, y: 300 };
  const hop = { to: { x: 500, y: 250 }, start: 10, end: 13 };
  const leaving = hopState(hop, 10, from, false);
  assert.equal(leaving.phase, 'out');
  assert.deepEqual(leaving.spark, from);
  assert.equal(leaving.shell, 1);
  const inside = hopState(hop, 11, from, false);
  assert.equal(inside.phase, 'inside');
  assert.equal(inside.shell, 0);
  assert.equal(inside.machine, 1);
  assert.equal(inside.spark, null);
  const returning = hopState(hop, 13 + HOP_TRAVEL / 2, from, false);
  assert.equal(returning.phase, 'back');
  assert.ok(returning.spark && returning.spark.y < 250, 'the leap arcs above both ends');
  assert.equal(hopState(hop, 13 + HOP_TRAVEL + 0.01, from, false).phase, 'done');
  // An examination holds the machine open until Gravity is finished.
  assert.equal(hopState({ ...hop, end: null }, 500, from, false).phase, 'inside');
});

test('reduced motion skips the leap but keeps the machine lit', () => {
  const hop = { to: { x: 500, y: 250 }, start: 10, end: 12 };
  const state = hopState(hop, 10, { x: 0, y: 0 }, true);
  assert.equal(state.phase, 'inside');
  assert.equal(state.spark, null);
  assert.equal(hopState(hop, 12, { x: 0, y: 0 }, true).phase, 'done');
});

test('ambient hops are periodic, nearby and deterministic', () => {
  let hops = 0;
  for (let time = 0; time < 340; time += 0.25) {
    const hop = ambientHop('street', time, 600);
    if (!hop) continue;
    assert.ok(Math.abs(hop.to.x - 600) < 420);
    assert.ok(ORB_SOCKETS.street.includes(hop.to));
    assert.deepEqual(ambientHop('street', time, 600), hop);
    if (Math.abs(time - hop.start) < 0.01) hops++;
  }
  assert.equal(hops, 10);
  // Nothing close enough: she stays in the shell.
  for (let time = 0; time < 100; time += 0.5) assert.equal(ambientHop('studio', time, 700), null);
});

test('she keeps a post until she joins Gravity, then travels with her', () => {
  assert.deepEqual(lyraPresence('street', false, false), { kind: 'none' });
  assert.deepEqual(lyraPresence('studio', true, false), { kind: 'none' });
  assert.deepEqual(lyraPresence('street', true, false), { kind: 'post', x: 1280 });
  assert.deepEqual(lyraPresence('den', true, false), { kind: 'post', x: 1150 });
  assert.deepEqual(lyraPresence('street', true, true), { kind: 'follow' });
  assert.deepEqual(lyraPresence('studio', true, true), { kind: 'follow' });
  // The Den is her archive: the shell docks there even as a companion.
  assert.deepEqual(lyraPresence('den', true, true), { kind: 'post', x: 1150 });
  const right = companionAnchor(500, 1, 2);
  const left = companionAnchor(500, -1, 2);
  assert.ok(right.x < 500 && left.x > 500, 'behind whichever shoulder she is not facing');
  assert.ok(right.lift > 0);
});
