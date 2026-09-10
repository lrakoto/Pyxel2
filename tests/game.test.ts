import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CaseModel, freshSave, parseSave, stepBody, segmentHits, type Body } from '../src/model.ts';
import { AREAS, CLUES, DEDUCTIONS, type ClueId } from '../src/content.ts';
import { Combat } from '../src/combat.ts';
const body = (): Body => ({ x: 500, y: 438, vx: 0, vy: 0, grounded: true, facing: 1 });
test('invalid, future, and hostile saves recover to a playable fresh case', () => {
  for (const raw of [
    null,
    '{',
    'null',
    '42',
    '{"version":2}',
    '{"version":1,"area":"__proto__"}',
  ]) {
    const s = parseSave(raw);
    assert.ok(Object.hasOwn(AREAS, s.area));
    assert.ok(Number.isFinite(s.x));
  }
});
test('save validation filters unknown clues, deduplicates, clamps position, and rejects unearned gates', () => {
  const save = parseSave(
    JSON.stringify({
      ...freshSave(),
      area: 'den',
      x: 99999,
      clues: ['camera', 'camera', 'made-up'],
      deductions: ['harvest'],
      contact: true,
      companion: true,
      escaped: true,
    }),
  );
  assert.deepEqual(save.clues, ['camera']);
  assert.deepEqual(save.deductions, []);
  assert.equal(save.area, 'street');
  assert.equal(save.x, 1750);
  assert.equal(save.companion, false);
  assert.equal(save.escaped, false);
});
test('clues grant once and deductions require two collected, matching pieces', () => {
  const m = new CaseModel();
  assert.equal(m.collect('painting'), true);
  assert.equal(m.collect('painting'), false);
  assert.equal(m.connect('painting', 'diary'), null);
  m.collect('diary');
  m.collect('camera');
  assert.equal(m.connect('painting', 'painting'), null);
  assert.equal(m.connect('painting', 'camera'), null);
  assert.equal(m.connect('diary', 'painting')?.id, 'voices');
  m.connect('painting', 'diary');
  assert.deepEqual(m.save.deductions, ['voices']);
});
test('a failed connection is graded, and a warm miss never names the partner', () => {
  const m = new CaseModel();
  (Object.keys(CLUES) as ClueId[]).forEach((id) => m.collect(id));
  const [live, partner] = DEDUCTIONS[0].pair;

  // Exactly one half of an open conclusion: warm, and it must name only the
  // record the player already holds — never the one they still have to find.
  const inert = (Object.keys(CLUES) as ClueId[]).find(
    (id) => !DEDUCTIONS.some((d) => d.pair.includes(id)),
  )!;
  const warm = m.explain(live, inert);
  assert.equal(warm.reason, 'warm');
  assert.ok(warm.text.includes(CLUES[live].title.toLowerCase()));
  assert.ok(!warm.text.toLowerCase().includes(CLUES[partner].title.toLowerCase()));

  // Same category, neither live: rejected on kind rather than on content.
  const pairs: [ClueId, ClueId][] = [];
  const ids = (Object.keys(CLUES) as ClueId[]).filter(
    (id) => !DEDUCTIONS.some((d) => d.pair.includes(id)),
  );
  for (const a of ids)
    for (const b of ids) if (a !== b && CLUES[a].category === CLUES[b].category) pairs.push([a, b]);
  if (pairs.length) assert.equal(m.explain(...pairs[0]).reason, 'kind');

  // Once a conclusion is drawn, its records report as spent.
  m.connect(live, partner);
  assert.equal(m.explain(live, inert).reason, 'spent');
});

test('every deduction carries its own question and hint', () => {
  // These were positional arrays in the board markup; reordering DEDUCTIONS
  // used to silently attach each question to the wrong theory.
  for (const d of DEDUCTIONS) {
    assert.ok(d.question.length > 0, `${d.id} has no question`);
    assert.ok(d.hint.length > 0, `${d.id} has no hint`);
    assert.notEqual(d.question, d.title);
  }
  const questions = new Set(DEDUCTIONS.map((d) => d.question));
  assert.equal(questions.size, DEDUCTIONS.length);
});

test('all six discovery orders lead to the same case objective', () => {
  for (const order of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    const m = new CaseModel();
    for (const i of order) {
      const d = DEDUCTIONS[i];
      d.pair.forEach((id) => m.collect(id));
      m.connect(...d.pair);
    }
    assert.equal(m.deduced, true);
    assert.equal(m.objective, 'Find the woman outside the Memory Den.');
  }
});
test('complete chapter survives a serialized checkpoint and keeps Lyra across areas', () => {
  const m = new CaseModel();
  for (const id of Object.keys(CLUES) as ClueId[]) m.collect(id);
  for (const d of DEDUCTIONS) m.connect(...d.pair);
  m.save.contact = true;
  m.save.companion = true;
  m.save.escaped = true;
  m.save.area = 'den';
  const restored = new CaseModel(parseSave(JSON.stringify(m.save)));
  assert.equal(restored.deduced, true);
  assert.equal(restored.save.companion, true);
  assert.equal(restored.save.area, 'den');
  assert.equal(restored.objective, 'Find who erased the first one.');
});
test('content door graph has valid destinations and every core clue is reachable', () => {
  const core = new Set(DEDUCTIONS.flatMap((d) => d.pair));
  for (const a of Object.values(AREAS))
    for (const h of a.hotspots) {
      if (h.target) assert.ok(AREAS[h.target]);
      if (h.clue) {
        assert.ok(CLUES[h.clue]);
        core.delete(h.clue);
      }
    }
  assert.equal(core.size, 0);
  assert.ok(AREAS.studio.hotspots.some((h) => h.target === 'street'));
  assert.ok(AREAS.den.hotspots.some((h) => h.target === 'street'));
});
test('movement clamps at both scene edges and lands on the same floor', () => {
  const p = body();
  for (let i = 0; i < 1000; i++) stepBody(p, 1, false, 1 / 60, 1500);
  assert.equal(p.x, 1468);
  for (let i = 0; i < 1000; i++) stepBody(p, -1, false, 1 / 60, 1500);
  assert.equal(p.x, 32);
  stepBody(p, 0, true, 1 / 60, 1500);
  assert.equal(p.grounded, false);
  assert.ok(p.y < 438);
  for (let i = 0; i < 120; i++) stepBody(p, 0, false, 1 / 60, 1500);
  assert.equal(p.y, 438);
  assert.equal(p.grounded, true);
});
test('a jump cannot be restarted while airborne', () => {
  const a = body(),
    b = body();
  stepBody(a, 0, true, 1 / 60, 1500);
  stepBody(b, 0, true, 1 / 60, 1500);
  for (let i = 0; i < 12; i++) {
    stepBody(a, 0, true, 1 / 60, 1500);
    stepBody(b, 0, false, 1 / 60, 1500);
  }
  assert.equal(a.y, b.y);
  assert.equal(a.vy, b.vy);
});
test('segment collision catches fast bullets that cross between frames', () => {
  assert.equal(segmentHits(0, 0, 100, 0, 50, 0, 5), true);
  assert.equal(segmentHits(0, 0, 100, 0, 50, 10, 5), false);
  assert.equal(segmentHits(5, 5, 5, 5, 5, 5, 2), true);
});
test('combat damages once per projectile, limits fire cadence, and removes expired projectiles', () => {
  const p = body(),
    c = new Combat(1800, p.x);
  c.enemies = [{ id: 1, x: 550, y: 395, hp: 60, kind: 'enforcer', fire: 10, flash: 0 }];
  c.shoot(p, { x: 550, y: 395 });
  c.shoot(p, { x: 550, y: 395 });
  assert.equal(c.bullets.length, 1);
  c.update(0.1, p);
  assert.equal(c.enemies[0].hp, 40);
  assert.equal(c.bullets.length, 0);
  c.bullets.push({ x: 0, y: 0, px: 0, py: 0, vx: 1, vy: 1, life: 0.001, hostile: false });
  c.update(0.02, p);
  assert.equal(c.bullets.length, 0);
});
test('hostile shots respect grace period and recovery reaches a bounded down state', () => {
  const p = body(),
    c = new Combat(1800, p.x);
  const bullet = () => ({
    x: 480,
    y: 405,
    px: 480,
    py: 405,
    vx: 300,
    vy: 0,
    life: 1,
    hostile: true,
  });
  c.bullets = [bullet(), bullet()];
  c.update(0.1, p);
  assert.equal(c.hp, 88);
  assert.ok(c.invulnerable > 0);
  c.hp = 12;
  c.invulnerable = 0;
  c.bullets = [bullet()];
  c.update(0.1, p);
  assert.equal(c.hp, 0);
  assert.equal(c.down, true);
});
test('two cleared waves produce a finite encounter', () => {
  const p = body(),
    c = new Combat(1800, p.x);
  c.enemies = [];
  c.update(0.016, p);
  assert.equal(c.wave, 2);
  assert.equal(c.enemies.length, 4);
  c.enemies = [];
  c.update(0.016, p);
  assert.equal(c.complete, true);
});

test('four depth planes respond at distinct, ordered camera speeds', async () => {
  const { PARALLAX, layerX } = await import('../src/layers.ts');
  const shifts = Object.values(PARALLAX).map((f) => layerX(1000, 0, f) - layerX(1000, 100, f));
  assert.deepEqual(shifts, [10, 34, 100, 118]);
});
test('water samples the live scene above the surface in reversed vertical order', async () => {
  const { reflectionSourceY } = await import('../src/layers.ts');
  assert.equal(reflectionSourceY(438, 0), 438);
  assert.ok(reflectionSourceY(438, 30) < reflectionSourceY(438, 10));
  assert.ok(reflectionSourceY(438, 90) >= 0);
});

test('map routes interiors through the hub and stops at the requested room', async () => {
  const { nextRouteHotspot } = await import('../src/model.ts');
  assert.equal(nextRouteHotspot('studio', 'den-door')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'den-door')?.target, 'den');
  assert.equal(nextRouteHotspot('den', 'den-door'), null);
  assert.equal(nextRouteHotspot('den', 'studio-door')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'missing'), null);
});
