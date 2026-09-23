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
  for (const area of ['street', 'studio', 'den'] as const) {
    assert.deepEqual(storyDetails({ ...freshSave(), area }), {
      examined: [],
      archiveRecovered: false,
      memoryPreserved: false,
    });
  }
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
