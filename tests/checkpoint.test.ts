import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCheckpoint, writeCheckpoint, BACKUP_KEY } from '../src/checkpoint.ts';
import { freshSave, SAVE_KEY, parseSave, CaseModel } from '../src/model.ts';
import { boardHint } from '../src/narrative.ts';
function storage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}
test('damaged primary recovers previous valid checkpoint without losing its clues', () => {
  const s = storage(),
    save = freshSave();
  save.clues = ['painting'];
  writeCheckpoint(s, save);
  save.clues.push('diary');
  writeCheckpoint(s, save);
  s.map.set(SAVE_KEY, '{broken');
  const r = readCheckpoint(s);
  assert.equal(r.recovered, true);
  assert.deepEqual(r.save.clues, ['painting']);
});
test('unchanged autosaves preserve backup and intentional restart replaces both slots', () => {
  const s = storage(),
    save = freshSave();
  writeCheckpoint(s, save);
  save.clues.push('painting');
  writeCheckpoint(s, save);
  const before = s.getItem(BACKUP_KEY);
  writeCheckpoint(s, save);
  assert.equal(s.getItem(BACKUP_KEY), before);
  writeCheckpoint(s, freshSave(), true);
  s.map.set(SAVE_KEY, 'broken');
  assert.deepEqual(readCheckpoint(s).save.clues, []);
});
test('backup failure does not prevent saving the primary checkpoint', () => {
  const s = storage();
  writeCheckpoint(s, freshSave());
  const set = s.setItem;
  s.setItem = (k, v) => {
    if (k === BACKUP_KEY) throw Error('quota');
    set(k, v);
  };
  const save = freshSave();
  save.clues = ['painting'];
  writeCheckpoint(s, save);
  assert.deepEqual(readCheckpoint(s).save.clues, ['painting']);
});
test('resume markers are area-specific and cannot bypass a locked case', () => {
  const s = freshSave();
  s.area = 'studio';
  s.resumeHotspot = 'painting';
  assert.equal(parseSave(JSON.stringify(s)).resumeHotspot, 'painting');
  s.resumeHotspot = 'mei';
  assert.equal(parseSave(JSON.stringify(s)).resumeHotspot, null);
  s.area = 'street';
  assert.equal(parseSave(JSON.stringify(s)).resumeHotspot, null);
  s.resumeHotspot = '__proto__';
  assert.equal(parseSave(JSON.stringify(s)).resumeHotspot, null);
});
test('hints distinguish missing records from a pair already available without giving a conclusion', () => {
  const m = new CaseModel();
  assert.match(boardHint(m, false), /evidence in/);
  m.collect('painting');
  m.collect('diary');
  const hint = boardHint(m, false);
  assert.match(hint, /already hold/);
  assert.doesNotMatch(hint, /Ada Vale|Meridian/);
});

test('intro completion survives a checkpoint at the starting position and resets with a new case', () => {
  const s = storage(),
    save = freshSave();
  save.introSeen = true;
  writeCheckpoint(s, save);
  assert.equal(readCheckpoint(s).save.introSeen, true);
  writeCheckpoint(s, freshSave(), true);
  assert.equal(readCheckpoint(s).save.introSeen, false);
});

test('older saves infer intro completion from existing progress', () => {
  const { introSeen, ...legacy } = freshSave();
  assert.equal(parseSave(JSON.stringify(legacy)).introSeen, false);
  assert.equal(parseSave(JSON.stringify({ ...legacy, x: 600 })).introSeen, true);
  assert.equal(parseSave(JSON.stringify({ ...legacy, clues: ['painting'] })).introSeen, true);
});
