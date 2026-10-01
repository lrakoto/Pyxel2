import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, type AreaId, type ClueId } from '../src/content.ts';
import {
  HOP_TRAVEL,
  AmbientHopSession,
  ORB_SIZE,
  ORB_SOCKETS,
  ambientHop,
  examinationSocket,
  companionAnchor,
  hopState,
  lyraPresence,
  lyraSignal,
  orbPixels,
  orbPose,
} from '../src/lyra-orb.ts';

const at = (pixels: number[], x: number, y: number) => pixels[y * ORB_SIZE + x];
const c = (ORB_SIZE - 1) / 2;

test('examinations share physical ambient sockets without moving clue labels', () => {
  const before = JSON.stringify(AREAS);
  const expected: [AreaId, ClueId, number, number][] = [
    ['street', 'camera', 550, 300],
    ['studio', 'device', 1224, 236],
    ['studio', 'transfer', 1224, 236],
    ['den', 'chime', 823, 201],
    ['clinic', 'cartridge', 927, 412],
    ['clinic', 'sale', 1360, 262],
  ];
  for (const [area, clue, x, y] of expected) {
    const socket = examinationSocket(area, clue);
    assert.deepEqual(socket, { x, y });
    assert.ok(ORB_SOCKETS[area].includes(socket!), 'one shared ambient/examination position');
    for (const other of Object.keys(AREAS) as AreaId[]) {
      if (other !== area) assert.equal(examinationSocket(other, clue), null);
    }
  }
  assert.equal(examinationSocket('studio', 'diary'), null);
  assert.equal(examinationSocket('den', 'fragment'), null, 'archive projection keeps its own beat');
  assert.equal(examinationSocket('street', undefined), null);
  assert.equal(JSON.stringify(AREAS), before);
  assert.equal(AREAS.studio.hotspots.find((h) => h.clue === 'device')!.y, 350);
});

test('receiver eye and shared light hold at the tube, then return to the current shell', () => {
  const to = examinationSocket('studio', 'device')!;
  const hop = { to, start: 10, end: null as number | null };
  const shell = { x: 1090, y: 280 };
  for (const reduced of [false, true]) {
    const held = lyraSignal(hop, 11, shell, reduced);
    assert.deepEqual(held.light, to);
    assert.equal(held.state?.shell, 0, 'no second lit eye in the shell');
    assert.equal(held.state?.machine, 1);
    assert.deepEqual(lyraSignal(hop, 11, shell, reduced), held, 'pause freezes the signal');
    assert.deepEqual(lyraSignal(hop, 80, { x: 1000, y: 280 }, reduced).light, to);
  }
  hop.end = 80;
  const movedShell = { x: 1000, y: 280 };
  const returning = lyraSignal(hop, 80.2, movedShell, false);
  assert.deepEqual(returning.light, returning.state?.spark);
  assert.deepEqual(lyraSignal(hop, 81, movedShell, false).light, movedShell);
  assert.deepEqual(lyraSignal(hop, 80, movedShell, true).light, movedShell);
  assert.equal(lyraSignal(null, 81, movedShell, false).state, null, 'scene reset clears occupancy');
});

test('ambient visits retain their machine when Gravity moves and finish once', () => {
  const visit = new AmbientHopSession();
  assert.equal(visit.sample('street', 19, 600, true, true), null);
  const started = visit.sample('street', 20, 600, true, true);
  assert.ok(started);
  assert.equal(visit.sample('street', 21, 1600, true, false), started);
  assert.equal(visit.sample('street', 21, 1600, true, false), started, 'paused redraw');
  assert.equal(visit.sample('street', 24, 1600, true, true), null);
  assert.equal(
    visit.sample('street', 24.1, 1600, true, true),
    null,
    'no repeat in the same window',
  );
});

test('ambient visits do not begin mid-hop, while moving, or after an interruption', () => {
  const visit = new AmbientHopSession();
  assert.equal(visit.sample('street', 21, 600, true, true), null, 'late room arrival');
  assert.equal(visit.sample('street', 54, 600, true, false), null, 'moving at scheduled start');
  assert.equal(visit.sample('street', 54.1, 600, true, true), null);
  assert.ok(visit.sample('street', 88, 600, true, true));
  assert.equal(
    visit.sample('street', 88.1, 600, false, true),
    null,
    'hard disable or reduced motion',
  );
  assert.equal(
    visit.sample('street', 88.2, 600, true, true),
    null,
    'no restart after interruption',
  );
  assert.equal(visit.sample('clinic', 89, 930, true, true), null, 'area reset');
  assert.equal(visit.sample('street', 0, 600, true, true), null, 'clock reset');
  assert.ok(visit.sample('street', 20, 600, true, true));
});

test('a conversation returns an occupied ambient signal without delaying dialogue or restarting', () => {
  const visit = new AmbientHopSession();
  const shell = { x: 560, y: 300 };
  const hop = visit.sample('street', 20, 600, true, true)!;
  assert.equal(lyraSignal(hop, 20.6, shell, false).state?.phase, 'inside');
  const recalled = visit.sample('street', 21, 600, true, true, true)!;
  assert.equal(recalled, hop, 'retain the occupied machine');
  assert.equal(recalled.end, 21);
  assert.deepEqual(lyraSignal(recalled, 21, shell, false).light, hop.to);
  const returning = visit.sample('street', 21.2, 900, true, false, true)!;
  assert.equal(returning.end, 21, 'repeated speaking frames cannot prolong the return');
  const signal = lyraSignal(returning, 21.2, { x: 860, y: 300 }, false);
  assert.equal(signal.state?.phase, 'back');
  assert.deepEqual(signal.light, signal.state?.spark);
  assert.notDeepEqual(signal.light, shell, 'no teleport into the shell');
  assert.equal(visit.sample('street', 21.5, 900, true, true, true), null);
  assert.equal(visit.sample('street', 21.6, 900, true, true), null, 'no restart after speaking');
  assert.ok(visit.sample('street', 54, 900, true, true), 'next scheduled window still works');
});

test('interruption during departure reaches the socket before retracing and hard resets clear it', () => {
  const visit = new AmbientHopSession();
  const shell = { x: 560, y: 300 };
  const hop = visit.sample('street', 20, 600, true, true)!;
  const before = lyraSignal(hop, 20.1, shell, false);
  const recalled = visit.sample('street', 20.1, 600, true, true, true)!;
  assert.equal(recalled.end, 20 + HOP_TRAVEL);
  assert.deepEqual(lyraSignal(recalled, 20.1, shell, false), before, 'no mid-arc jump');
  const atSocket = lyraSignal(recalled, 20 + HOP_TRAVEL, shell, false);
  assert.deepEqual(atSocket.light, hop.to, 'continuous turn at the socket');
  assert.equal(lyraSignal(recalled, 20 + HOP_TRAVEL + 1e-6, shell, false).state?.phase, 'back');
  assert.equal(visit.sample('street', 20.1, 600, true, true, true), recalled, 'paused redraw');
  assert.equal(recalled.end, 20 + HOP_TRAVEL, 'a paused redraw cannot postpone return');
  assert.equal(
    visit.sample('street', 20.3, 600, false, true),
    null,
    'reduced motion or explicit hop',
  );
  assert.equal(visit.sample('street', 20.4, 600, true, true), null);
  assert.ok(visit.sample('street', 54, 600, true, true));
  assert.equal(visit.sample('clinic', 54.1, 930, true, true, true), null, 'area transition');
  assert.equal(visit.sample('street', 0, 600, true, true), null, 'clock reset');
  assert.equal(
    visit.sample('street', 20, 600, true, true, true),
    null,
    'speaking at scheduled start',
  );
});

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

test('Lyra carries her room lighting into a machine and brings it home', () => {
  const shell = { x: 100, y: 300 };
  const hop = { to: { x: 500, y: 250 }, start: 10, end: 13 };
  const leaving = lyraSignal(hop, 10.2, shell, false);
  assert.deepEqual(leaving.light, leaving.state?.spark);
  assert.notDeepEqual(leaving.light, shell);
  assert.deepEqual(lyraSignal(hop, 11, shell, false).light, hop.to);
  const back = lyraSignal(hop, 13.2, shell, false);
  assert.deepEqual(back.light, back.state?.spark);
  assert.deepEqual(lyraSignal(hop, 14, shell, false), { hop: null, state: null, light: shell });
  assert.deepEqual(lyraSignal(hop, 9, shell, false).light, shell);
  assert.deepEqual(lyraSignal(null, 11, shell, false).light, shell);
  assert.deepEqual(lyraSignal(hop, 10, shell, true).light, hop.to);
  assert.deepEqual(lyraSignal(hop, 13, shell, true).light, shell);
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
