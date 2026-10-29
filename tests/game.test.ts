import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CaseModel,
  freshSave,
  parseSave,
  stepBody,
  segmentHits,
  CHAPTER_TWO_CLUES,
  type Body,
} from '../src/model.ts';
import { AREAS, CLUES, DEDUCTIONS } from '../src/content.ts';
import { Combat } from '../src/combat.ts';
const body = (): Body => ({ x: 500, y: 438, vx: 0, vy: 0, grounded: true, facing: 1 });
const firstInvestigation = () => {
  const m = new CaseModel();
  for (const d of DEDUCTIONS.filter((d) => d.chapter === 1)) {
    d.pair.forEach((id) => m.collect(id));
    m.connect(...d.pair);
  }
  m.collect('fragment');
  Object.assign(m.save, { contact: true, companion: true, escaped: true, area: 'den' });
  return m;
};
const maraInvestigation = () => {
  const m = firstInvestigation();
  CHAPTER_TWO_CLUES.forEach((id) => m.collect(id));
  for (const d of DEDUCTIONS.filter((d) => d.chapter === 2)) m.connect(...d.pair);
  m.save.area = 'registry';
  return m;
};
test('invalid, future, and hostile saves recover to a playable fresh case', () => {
  for (const raw of [
    null,
    '{',
    'null',
    '42',
    '{"version":99}',
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
test('first investigation survives a serialized checkpoint and opens the registry lead', () => {
  const m = firstInvestigation();
  const restored = new CaseModel(parseSave(JSON.stringify(m.save)));
  assert.equal(restored.deduced, true);
  assert.equal(restored.save.companion, true);
  assert.equal(restored.save.area, 'den');
  assert.equal(restored.save.version, 2);
  assert.equal(restored.save.identityChoice, null);
  assert.equal(restored.objective, 'Enter the Civic Registry Annex through the Memory Den.');
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

test('map routes across the door graph and stops at the requested destination', async () => {
  const { nextRouteHotspot } = await import('../src/model.ts');
  assert.equal(nextRouteHotspot('studio', 'den-door')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'den-door')?.target, 'den');
  assert.equal(nextRouteHotspot('den', 'den-door'), null);
  assert.equal(nextRouteHotspot('den', 'studio-door')?.target, 'street');
  assert.equal(nextRouteHotspot('studio', 'registry-door')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'registry-door')?.target, 'den');
  assert.equal(nextRouteHotspot('den', 'registry-door')?.target, 'registry');
  assert.equal(nextRouteHotspot('registry', 'registry-door'), null);
  assert.equal(nextRouteHotspot('registry', 'studio-door')?.target, 'den');
  assert.equal(nextRouteHotspot('studio', 'noodles')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'noodles')?.id, 'noodles');
  assert.equal(nextRouteHotspot('street', 'missing'), null);
});

test('version-one checkpoints migrate with their completed investigation intact', () => {
  const completed = firstInvestigation();
  const legacy = { ...completed.save, version: 1, identityChoice: undefined };
  const restored = parseSave(JSON.stringify(legacy));
  assert.equal(restored.version, 2);
  assert.equal(restored.area, 'den');
  assert.equal(restored.escaped, true);
  assert.equal(restored.companion, true);
  assert.equal(restored.deductions.length, 3);
  assert.equal(restored.identityChoice, null);
});

test('Mara’s choice stays locked until all six records support three deductions', () => {
  const m = firstInvestigation();
  m.save.area = 'registry';
  assert.equal(m.chooseIdentity('restore'), false);
  assert.equal(m.objective, 'Search the annex. Reconstruct Mara Venn’s identity.');
  CHAPTER_TWO_CLUES.forEach((id) => m.collect(id));
  assert.equal(m.objective, 'Open the case board. Connect Mara’s records.');
  assert.equal(m.chooseIdentity('restore'), false);
  for (const d of DEDUCTIONS.filter((d) => d.chapter === 2)) m.connect(...d.pair);
  assert.equal(m.identityDeduced, true);
  assert.equal(m.objective, 'Ask Lyra what happened to Mara Venn.');
  assert.equal(m.chooseIdentity('restore'), true);
  assert.equal(m.chapterNumber, 6);
});

test('both identity conclusions survive serialization and produce distinct world state', () => {
  for (const choice of ['restore', 'preserve'] as const) {
    const m = maraInvestigation();
    assert.equal(m.chooseIdentity(choice), true);
    const restored = new CaseModel(parseSave(JSON.stringify(m.save)));
    assert.equal(restored.save.identityChoice, choice);
    assert.equal(restored.save.area, 'registry');
    assert.equal(restored.chapter, 'MARA VENN');
    assert.equal(
      restored.objective,
      choice === 'restore'
        ? 'Mara Venn has her name back. See how Lyra carries it.'
        : 'Mara remains hidden. Her memory stays with you and Lyra.',
    );
  }
});

test('save validation rejects an unearned identity choice and locked registry location', () => {
  const m = firstInvestigation();
  m.save.area = 'registry';
  m.save.identityChoice = 'restore';
  const unearned = parseSave(JSON.stringify(m.save));
  assert.equal(unearned.identityChoice, null);
  assert.equal(unearned.area, 'registry');
  const locked = parseSave(JSON.stringify({ ...m.save, escaped: false }));
  assert.equal(locked.identityChoice, null);
  assert.equal(locked.area, 'street');
});

test('all six Mara deduction orders lead to the same conversation lead', () => {
  const chapterTwo = DEDUCTIONS.filter((d) => d.chapter === 2);
  for (const order of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    const m = firstInvestigation();
    for (const i of order) {
      const d = chapterTwo[i];
      d.pair.forEach((id) => m.collect(id));
      m.connect(...d.pair);
    }
    assert.equal(m.identityDeduced, true);
    assert.equal(m.objective, 'Ask Lyra what happened to Mara Venn.');
  }
});

test('map destination ids are unique across the expanded district', () => {
  const ids = Object.values(AREAS).flatMap((a) => a.hotspots.map((h) => h.id));
  assert.equal(new Set(ids).size, ids.length);
});
