import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyDetails } from '../src/story-details.ts';
import { CaseModel, freshSave, parseSave } from '../src/model.ts';

function recoveredCase() {
  const model = new CaseModel();
  for (const clue of ['device', 'residue', 'diary', 'painting', 'portrait', 'writing'] as const)
    model.collect(clue);
  model.connect('device', 'residue');
  model.connect('diary', 'painting');
  model.connect('portrait', 'writing');
  model.save.contact = true;
  model.save.area = 'den';
  model.collect('fragment');
  return model;
}

test('new cases have no earned room changes in any location', () => {
  for (const area of ['street', 'studio', 'den', 'clinic'] as const) {
    assert.deepEqual(storyDetails({ ...freshSave(), area }), {
      examined: [],
      witnessComparison: false,
      archiveRecovered: false,
      memoryPreserved: false,
      clinicRecords: [],
    });
  }
});

test('studio comparison requires the completed journal/painting connection, not collection alone', () => {
  const model = new CaseModel({ ...freshSave(), area: 'studio' });
  model.collect('diary');
  assert.equal(storyDetails(model.save).witnessComparison, false);
  model.collect('painting');
  assert.equal(storyDetails(model.save).witnessComparison, false);
  model.connect('diary', 'painting');
  assert.equal(storyDetails(model.save).witnessComparison, true);
  for (const missing of ['diary', 'painting'] as const) {
    assert.equal(
      storyDetails({ ...model.save, clues: model.save.clues.filter((id) => id !== missing) })
        .witnessComparison,
      false,
    );
  }
  for (const area of ['street', 'den', 'clinic'] as const) {
    assert.equal(storyDetails({ ...model.save, area }).witnessComparison, false);
  }
});

test('restoring and switching cases rebuilds the comparison without altering saved records', () => {
  const model = new CaseModel({ ...freshSave(), area: 'studio' });
  model.collect('diary');
  model.collect('painting');
  const earlier = JSON.stringify(model.save);
  model.connect('painting', 'diary');
  const earned = JSON.stringify(model.save);
  for (const [raw, expected] of [
    [earned, true],
    [earlier, false],
    [earned, true],
  ] as const) {
    model.save = parseSave(raw);
    const before = JSON.stringify(model.save);
    assert.equal(storyDetails(model.save).witnessComparison, expected);
    assert.equal(JSON.stringify(model.save), before);
    assert.equal(model.save.version, 1);
  }
  model.save = { ...freshSave(), area: 'studio' };
  assert.equal(storyDetails(model.save).witnessComparison, false);
});

test('studio tabs mark only examined objects and never follow players into other areas', () => {
  const save = { ...freshSave(), area: 'studio' as const };
  save.clues.push('diary');
  assert.deepEqual(storyDetails(save).examined, ['diary']);
  save.clues.push('painting', 'camera');
  assert.deepEqual(storyDetails(save).examined, ['diary', 'painting']);
  assert.deepEqual(storyDetails({ ...save, area: 'street' }).examined, []);
  assert.deepEqual(storyDetails({ ...save, area: 'den' }).examined, []);
});

test('Den status lamps require both contact and the recovered fragment', () => {
  const model = recoveredCase();
  assert.equal(storyDetails(model.save).archiveRecovered, true);
  assert.equal(storyDetails({ ...model.save, contact: false }).archiveRecovered, false);
  assert.equal(storyDetails({ ...model.save, clues: [] }).archiveRecovered, false);
  assert.equal(storyDetails({ ...model.save, area: 'studio' }).archiveRecovered, false);
  assert.equal(storyDetails(model.save).memoryPreserved, false);
});

test('the preserved bird appears only after the resolved followup and survives either choice', () => {
  const model = recoveredCase();
  model.save.companion = true;
  model.save.escaped = true;
  model.startFollowup();
  for (const clue of ['chime', 'register', 'transfer', 'witness', 'sketch'] as const)
    model.collect(clue);
  model.connect('chime', 'register');
  model.connect('transfer', 'witness');
  model.connect('fragment', 'sketch');
  const unresolved = JSON.stringify(model.save);
  assert.equal(storyDetails(model.save).memoryPreserved, false);
  for (const resolution of ['protect', 'testify'] as const) {
    const resolved = parseSave(JSON.stringify({ ...model.save, resolution }));
    assert.equal(storyDetails(resolved).memoryPreserved, true);
  }
  // Recovery and file switching never leave late-game art cached in an earlier room.
  model.resolveFollowup('protect');
  assert.equal(storyDetails(model.save).memoryPreserved, true);
  assert.equal(storyDetails(parseSave(unresolved)).memoryPreserved, false);
  assert.equal(storyDetails(freshSave()).memoryPreserved, false);
});

test('clinic changes follow held evidence and clear with an earlier file or another area', () => {
  const save = { ...freshSave(), area: 'clinic' as const, shipment: true };
  save.clues.push('manifest', 'sale');
  assert.deepEqual(storyDetails(save).clinicRecords, ['manifest', 'sale']);
  assert.deepEqual(storyDetails({ ...save, area: 'studio' }).clinicRecords, []);
  assert.deepEqual(storyDetails({ ...save, shipment: false }).clinicRecords, []);
  assert.deepEqual(storyDetails({ ...save, clues: [] }).clinicRecords, []);
});
