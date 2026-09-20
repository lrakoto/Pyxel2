import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CaseModel, parseSave, nextRouteHotspot } from '../src/model.ts';
import {
  CORE_DEDUCTIONS,
  FOLLOWUP_DEDUCTIONS,
  FOLLOWUP_CLUES,
  DEDUCTIONS,
  AREAS,
} from '../src/content.ts';
import { INSIGHTS, insightFor, lyraIntroduction, lyraTopics } from '../src/narrative.ts';
import { CharacterMotion, storyFrameIndex } from '../src/character-motion.ts';
function completedFirstCase(optional = false) {
  const m = new CaseModel();
  for (const d of DEDUCTIONS.filter(
    (d) => CORE_DEDUCTIONS.includes(d.id) || (optional && d.id === 'entry'),
  )) {
    d.pair.forEach((id) => m.collect(id));
    m.connect(...d.pair);
  }
  m.collect('fragment');
  m.save.contact = true;
  m.save.companion = true;
  m.save.escaped = true;
  return m;
}
test('both witness preparation paths support both saved second-case resolutions', () => {
  for (const optional of [false, true])
    for (const choice of ['protect', 'testify'] as const) {
      let m = completedFirstCase(optional);
      assert.equal(m.deduced, true);
      assert.equal(m.startFollowup(), true);
      assert.equal(m.startFollowup(), false);
      assert.equal(m.resolveFollowup(choice), false);
      for (const id of FOLLOWUP_CLUES) assert.equal(m.collect(id), true);
      for (const d of DEDUCTIONS.filter((d) => FOLLOWUP_DEDUCTIONS.includes(d.id))) {
        assert.equal(m.connect(d.pair[1], d.pair[0])?.id, d.id);
        m = new CaseModel(parseSave(JSON.stringify(m.save)));
      }
      assert.equal(m.followupSolved, true);
      assert.equal(m.awaitingAmbush, false);
      assert.equal(m.resolveFollowup(choice), true);
      assert.equal(m.resolveFollowup(choice === 'protect' ? 'testify' : 'protect'), false);
      assert.equal(parseSave(JSON.stringify(m.save)).resolution, choice);
    }
});
test('old completed saves acquire additive defaults without losing progress', () => {
  const { followup, insights, resolution, ...old } = completedFirstCase(true).save;
  const restored = parseSave(JSON.stringify(old));
  assert.equal(restored.companion, true);
  assert.equal(restored.escaped, true);
  assert.equal(restored.followup, false);
  assert.deepEqual(restored.insights, []);
  assert.equal(restored.resolution, null);
  assert.ok(restored.deductions.includes('entry'));
});
test('new evidence, insights and resolutions cannot be forged ahead of their gates', () => {
  const m = new CaseModel();
  assert.equal(m.startFollowup(), false);
  assert.equal(m.collect('sketch'), false);
  const restored = parseSave(
    JSON.stringify({
      ...m.save,
      followup: true,
      clues: FOLLOWUP_CLUES,
      deductions: FOLLOWUP_DEDUCTIONS,
      insights: INSIGHTS.map((i) => i.id),
      resolution: 'protect',
    }),
  );
  assert.equal(restored.followup, false);
  assert.deepEqual(restored.clues, []);
  assert.deepEqual(restored.insights, []);
  assert.equal(restored.resolution, null);
  assert.doesNotThrow(() => parseSave(JSON.stringify({ ...m.save, deductions: {} })));
});
test('every re-examination requires related evidence and survives a saved field note', () => {
  for (const insight of INSIGHTS) {
    const m = completedFirstCase();
    m.startFollowup();
    m.save.clues = [];
    m.collect(insight.clue);
    assert.equal(insightFor(m, insight.clue), undefined);
    insight.requires.forEach((id) => m.collect(id));
    assert.equal(insightFor(m, insight.clue)?.id, insight.id);
    // Restore the already-earned first case so save validation preserves chapter two.
    const full = completedFirstCase();
    full.startFollowup();
    full.collect(insight.clue);
    insight.requires.forEach((id) => full.collect(id));
    full.save.insights.push(insight.id, 'unknown');
    assert.deepEqual(parseSave(JSON.stringify(full.save)).insights, [insight.id]);
  }
});
test('Lyra refers only to earned optional deductions and reveals identity after connection', () => {
  const m = completedFirstCase();
  assert.doesNotMatch(lyraIntroduction(m)[0].text, /oil|lock|camera/);
  m.collect('lock');
  assert.match(lyraIntroduction(m)[0].text, /oil/);
  m.collect('camera');
  m.connect('camera', 'lock');
  assert.match(lyraIntroduction(m)[0].text, /appointment/);
  assert.ok(lyraTopics(m).some((t) => t.id === 'entry'));
  m.startFollowup();
  m.collect('chime');
  m.collect('register');
  assert.ok(!lyraTopics(m).some((t) => t.id === 'ada'));
  m.connect('register', 'chime');
  assert.ok(lyraTopics(m).some((t) => t.id === 'ada'));
});
test('second-case hotspots unlock together and the witness remains routable from interiors', () => {
  const m = completedFirstCase();
  const hotspots = Object.values(AREAS)
    .flatMap((a) => a.hotspots)
    .filter((h) => h.requires === 'followup');
  assert.equal(hotspots.length, 5);
  assert.ok(hotspots.every((h) => !m.available(h)));
  m.startFollowup();
  assert.ok(hotspots.every((h) => m.available(h)));
  assert.equal(nextRouteHotspot('den', 'mei')?.target, 'street');
  assert.equal(nextRouteHotspot('street', 'mei')?.id, 'mei');
});
test('exploration poses settle, turns finish, and reduced motion suppresses idle animation', () => {
  const motion = new CharacterMotion();
  assert.equal(motion.update(0.02, -1, 0, false, false, false).tag, 'turn');
  motion.update(0.2, -1, 0, false, false, false);
  assert.equal(motion.update(0.02, -1, 0, false, false, false).tag, 'breathe');
  assert.equal(motion.update(0.02, -1, 0, true, false, false).tag, 'examine');
  assert.equal(storyFrameIndex('examine', 40, 4), 3);
  assert.equal(motion.update(2, -1, 0, false, false, true).time, 0);
  assert.equal(motion.update(0.1, -1, 145, false, false, true).tag, 'stride');
});
