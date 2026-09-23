import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SaveArchive, ACTIVE_SLOT_KEY, slotKey, slotBackupKey } from '../src/save-archive.ts';
import { BACKUP_KEY } from '../src/checkpoint.ts';
import { freshSave, SAVE_KEY } from '../src/model.ts';

function storage() {
  const map = new Map<string, string>();
  let writes = 0;
  return {
    map,
    get writes() {
      return writes;
    },
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes++;
      map.set(key, value);
    },
  };
}
function archive() {
  const store = storage();
  let clock = 1000;
  return {
    store,
    saves: new SaveArchive(store, () => clock++),
    reload: () => new SaveArchive(store, () => clock++),
  };
}

test('the archive offers exactly three empty files and remembers selection without overwriting progress', () => {
  const { saves, store, reload } = archive();
  assert.deepEqual(
    saves.list().map((slot) => [slot.id, slot.save, slot.corrupt]),
    [
      [1, null, false],
      [2, null, false],
      [3, null, false],
    ],
  );
  assert.deepEqual(saves.read().save, freshSave());
  saves.create(2, '  Second\n case  ');
  assert.equal(saves.activeId, 1);
  saves.select(2);
  saves.write({ ...freshSave(), clues: ['painting'] });
  assert.equal(reload().activeId, 2);
  assert.equal(saves.list()[1].name, 'Second case');
  assert.equal(store.getItem(SAVE_KEY), null);
  assert.throws(() => saves.create(2, 'Replacement'), /occupied/);
  assert.deepEqual(saves.read().save.clues, ['painting']);
});

test('legacy migration preserves both keys and the prior meaningful checkpoint', () => {
  const store = storage();
  const primary = JSON.stringify({ ...freshSave(), clues: ['painting', 'diary'] });
  const backup = JSON.stringify({ ...freshSave(), clues: ['painting'] });
  store.setItem(SAVE_KEY, primary);
  store.setItem(BACKUP_KEY, backup);
  const saves = new SaveArchive(store, () => 3000);
  assert.deepEqual(saves.read().save.clues, ['painting', 'diary']);
  assert.deepEqual(saves.list()[0].history[0].save.clues, ['painting']);
  assert.equal(store.getItem(SAVE_KEY), primary);
  assert.equal(store.getItem(BACKUP_KEY), backup);
  saves.select(2);
  saves.write(freshSave());
  const another = new SaveArchive(store);
  assert.equal(another.activeId, 2);
  assert.equal(another.list()[0].updatedAt, 3000);
});

test('legacy backup migration reports recovery and a successful save clears that notice', () => {
  const store = storage();
  store.setItem(SAVE_KEY, '{broken');
  store.setItem(BACKUP_KEY, JSON.stringify({ ...freshSave(), clues: ['painting'] }));
  const saves = new SaveArchive(store);
  assert.equal(saves.read().recovered, true);
  assert.deepEqual(saves.read().save.clues, ['painting']);
  assert.equal(new SaveArchive(store).read().recovered, true);
  saves.write(saves.read().save);
  assert.equal(saves.read().recovered, false);
  assert.equal(store.getItem(SAVE_KEY), '{broken');
});

test('separate investigations retain their own saves, names and history', () => {
  const { saves } = archive();
  saves.create(1, 'Marlon');
  saves.write({ ...freshSave(), clues: ['painting'] });
  const first = saves.list()[0];
  saves.create(2, 'New trail');
  saves.select(2);
  saves.write({ ...freshSave(), area: 'studio', x: 240 });
  assert.deepEqual(saves.list()[0], first);
  assert.equal(saves.list()[1].save?.area, 'studio');
  assert.equal(saves.list()[2].save, null);
  saves.select(1);
  assert.deepEqual(saves.read().save.clues, ['painting']);
});

test('a damaged primary recovers the previous envelope with its name and history', () => {
  const { saves, store } = archive();
  saves.create(1, 'Last light');
  saves.write({ ...freshSave(), clues: ['painting'] });
  const previous = saves.list()[0];
  saves.write({ ...freshSave(), clues: ['painting', 'diary'] });
  store.map.set(slotKey(1), '{broken');
  assert.equal(saves.read().recovered, true);
  assert.deepEqual(saves.read().save, previous.save);
  assert.equal(saves.list()[0].name, 'Last light');
  assert.deepEqual(saves.list()[0].history, previous.history);
  saves.write(saves.read().save);
  assert.equal(saves.read().recovered, false);
  assert.ok(JSON.parse(store.getItem(slotKey(1))!));
});

test('position-only autosaves preserve four recent meaningful checkpoints', () => {
  const { saves } = archive();
  const save = freshSave();
  save.introSeen = true;
  saves.write(save);
  save.clues.push('painting');
  saves.write(save);
  const history = saves.list()[0].history;
  for (let x = 500; x < 1500; x += 5) saves.write({ ...save, x });
  assert.deepEqual(saves.list()[0].history, history);
  save.clues.push('diary');
  saves.write(save);
  save.clues.push('camera');
  saves.write(save);
  save.area = 'studio';
  saves.write(save);
  save.area = 'street';
  saves.write(save);
  const checkpoints = saves.list()[0].history;
  assert.equal(checkpoints.length, 4);
  assert.equal(checkpoints[0].save.area, 'studio');
  assert.deepEqual(checkpoints[1].save.clues, ['painting', 'diary', 'camera']);
  assert.ok(checkpoints[0].savedAt >= checkpoints[1].savedAt);
  assert.equal(new Set(checkpoints.map((entry) => entry.id)).size, 4);
});

test('unchanged saves make no writes and do not rotate recovery or timestamps', () => {
  const { saves, store } = archive();
  saves.write(freshSave());
  saves.write({ ...freshSave(), clues: ['painting'] });
  const before = saves.list()[0],
    backup = store.getItem(slotBackupKey(1)),
    writes = store.writes;
  saves.write(saves.read().save);
  saves.write(saves.read().save);
  assert.equal(store.writes, writes);
  assert.equal(store.getItem(slotBackupKey(1)), backup);
  assert.deepEqual(saves.list()[0], before);
});

test('restoring history preserves current progress as an undo checkpoint and leaves other cases alone', () => {
  const { saves } = archive();
  saves.write(freshSave());
  saves.write({ ...freshSave(), clues: ['painting'] });
  saves.write({ ...freshSave(), clues: ['painting', 'diary'] });
  saves.create(2, 'Other case');
  const other = saves.list()[1];
  const checkpoint = saves.list()[0].history.find((entry) => entry.save.clues.length === 1)!;
  saves.restore(1, checkpoint.id);
  assert.deepEqual(saves.read().save.clues, ['painting']);
  const undo = saves.list()[0].history[0];
  assert.deepEqual(undo.save.clues, ['painting', 'diary']);
  saves.restore(1, undo.id);
  assert.deepEqual(saves.read().save.clues, ['painting', 'diary']);
  assert.deepEqual(saves.list()[1], other);
  assert.throws(() => saves.restore(1, 'missing'), /no longer available/);
});

test('renaming does not change last-played time or create a progress checkpoint', () => {
  const { saves } = archive();
  saves.write({ ...freshSave(), clues: ['painting'] });
  const before = saves.list()[0];
  saves.rename(1, '  Night shift  ');
  assert.equal(saves.list()[0].name, 'Night shift');
  assert.equal(saves.list()[0].updatedAt, before.updatedAt);
  assert.deepEqual(saves.list()[0].history, before.history);
  saves.rename(1, 'x'.repeat(100));
  assert.equal(saves.list()[0].name.length, 48);
  assert.throws(() => saves.rename(3, 'empty'), /Start an investigation/);
});

test('reset clears history and prevents recovery from reviving the discarded case', () => {
  const { saves, store } = archive();
  saves.create(1, 'Marlon');
  saves.write({ ...freshSave(), clues: ['painting'] });
  saves.write({ ...freshSave(), clues: ['painting', 'diary'] });
  saves.write(freshSave(), true);
  assert.equal(saves.list()[0].history.length, 0);
  store.map.set(slotKey(1), 'broken');
  assert.deepEqual(saves.read().save, freshSave());
  assert.equal(saves.list()[0].name, 'Marlon');
});

test('corrupt occupied files cannot be silently recreated, autosaved over or remigrated', () => {
  const store = storage();
  store.setItem(slotKey(1), '{broken');
  store.setItem(SAVE_KEY, JSON.stringify({ ...freshSave(), clues: ['painting'] }));
  const saves = new SaveArchive(store);
  assert.equal(saves.list()[0].corrupt, true);
  assert.equal(saves.list()[0].save, null);
  assert.throws(() => saves.read(), /damaged/);
  assert.throws(() => saves.write(freshSave()), /damaged/);
  assert.throws(() => saves.write(freshSave(), true), /damaged/);
  assert.throws(() => saves.create(1, 'Overwrite'), /occupied/);
  assert.equal(store.getItem(slotKey(1)), '{broken');
  saves.select(2);
  saves.create(2, 'Safe case');
  assert.deepEqual(saves.read().save, freshSave());
});

test('invalid envelopes and foreign slot backups never become playable progress', () => {
  const { saves, store } = archive();
  saves.create(1, 'Original');
  const original = JSON.parse(store.getItem(slotKey(1))!);
  for (const invalid of [
    { ...original, version: 99 },
    { ...original, id: 2 },
    { ...original, updatedAt: -1 },
    { ...original, history: [{}] },
    { ...original, save: { ...freshSave(), area: '__proto__' } },
  ]) {
    store.map.set(slotKey(1), JSON.stringify(invalid));
    assert.equal(saves.list()[0].corrupt, true);
  }
  store.map.set(slotBackupKey(1), JSON.stringify({ ...original, id: 2 }));
  assert.throws(() => saves.read(), /damaged/);
  assert.throws(() => saves.write({ ...freshSave(), version: 2 } as never));
});

test('a failed primary write keeps the existing save recoverable and reports the error', () => {
  const { saves, store } = archive();
  saves.write({ ...freshSave(), clues: ['painting'] });
  const prior = store.getItem(slotKey(1));
  const setItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === slotKey(1)) throw new Error('quota');
    setItem(key, value);
  };
  assert.throws(() => saves.write({ ...freshSave(), clues: ['painting', 'diary'] }), /quota/);
  assert.equal(store.getItem(slotKey(1)), prior);
  assert.deepEqual(saves.read().save.clues, ['painting']);
  store.map.set(slotKey(1), 'broken');
  assert.deepEqual(saves.read().save.clues, ['painting']);
});

test('a failed backup or active selection write aborts without reporting success', () => {
  const { saves, store } = archive();
  saves.write({ ...freshSave(), clues: ['painting'] });
  const before = store.getItem(slotKey(1)),
    setItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === slotBackupKey(1) || key === ACTIVE_SLOT_KEY) throw new Error('quota');
    setItem(key, value);
  };
  assert.throws(() => saves.write({ ...freshSave(), clues: ['painting', 'diary'] }), /quota/);
  assert.equal(store.getItem(slotKey(1)), before);
  assert.throws(() => saves.select(2), /quota/);
  assert.equal(saves.activeId, 1);
});

test('slot validation and returned copies protect the archive from accidental mutation', () => {
  const { saves } = archive();
  saves.write({ ...freshSave(), clues: ['painting'] });
  saves.read().save.clues.length = 0;
  saves.list()[0].save!.clues.length = 0;
  assert.deepEqual(saves.read().save.clues, ['painting']);
  for (const invalid of [0, 4, -1, 1.5, NaN]) {
    assert.throws(() => saves.select(invalid), RangeError);
    assert.throws(() => saves.create(invalid, 'invalid'), RangeError);
  }
});

test('another tab cannot overwrite newer progress until it explicitly loads the new state', () => {
  const { saves, store } = archive();
  saves.write(freshSave());
  const stale = new SaveArchive(store, () => 2000);
  saves.write({ ...freshSave(), clues: ['painting'] });
  stale.list(); // Drawing the archive is not permission to replace a running model.
  assert.throws(() => stale.write(freshSave()), /another tab/);
  assert.throws(() => stale.write(freshSave(), true), /another tab/);
  assert.throws(() => stale.rename(1, 'Old tab'), /another tab/);
  assert.throws(() => stale.restore(1, stale.list()[0].history[0].id), /another tab/);
  assert.deepEqual(saves.read().save.clues, ['painting']);
  const current = stale.read().save;
  current.clues.push('diary');
  stale.write(current);
  assert.deepEqual(stale.read().save.clues, ['painting', 'diary']);
  assert.throws(() => saves.write({ ...freshSave(), clues: ['painting'] }), /another tab/);
});

test('a change to another case does not prevent an independent active investigation from saving', () => {
  const { saves, store } = archive();
  saves.create(1, 'One');
  saves.create(2, 'Two');
  const other = new SaveArchive(store);
  other.select(2);
  other.write({ ...freshSave(), clues: ['diary'] });
  saves.write({ ...freshSave(), clues: ['painting'] });
  assert.deepEqual(saves.read().save.clues, ['painting']);
  assert.deepEqual(other.read().save.clues, ['diary']);
});

test('failed target reads leave the selected file and its stored active ID unchanged', () => {
  const { saves, store } = archive();
  saves.create(1, 'Safe');
  saves.select(1);
  store.map.set(slotKey(2), 'broken');
  assert.throws(() => saves.select(2), /damaged/);
  assert.equal(saves.activeId, 1);
  assert.equal(store.getItem(ACTIVE_SLOT_KEY), '1');
  const getItem = store.getItem;
  store.getItem = (key) => {
    if (key === slotKey(3)) throw new Error('storage blocked');
    return getItem(key);
  };
  assert.throws(() => saves.select(3), /storage blocked/);
  assert.equal(saves.activeId, 1);
  assert.equal(store.getItem(ACTIVE_SLOT_KEY), '1');
});

test('interrupted migration preserves the latest legacy save in a recoverable envelope', () => {
  const store = storage();
  const primary = JSON.stringify({ ...freshSave(), clues: ['painting', 'diary'] });
  const backup = JSON.stringify({ ...freshSave(), clues: ['painting'] });
  store.setItem(SAVE_KEY, primary);
  store.setItem(BACKUP_KEY, backup);
  const setItem = store.setItem;
  store.setItem = (key, value) => {
    if (key === slotKey(1)) throw new Error('quota');
    setItem(key, value);
  };
  assert.throws(() => new SaveArchive(store), /quota/);
  assert.equal(store.getItem(SAVE_KEY), primary);
  assert.equal(store.getItem(BACKUP_KEY), backup);
  store.setItem = setItem;
  const recovered = new SaveArchive(store);
  assert.deepEqual(recovered.read().save.clues, ['painting', 'diary']);
  assert.equal(recovered.read().recovered, true);
  assert.equal(recovered.list()[1].save, null);
  recovered.write(recovered.read().save);
  assert.equal(recovered.read().recovered, false);
});

test('migration storage failure before any archive write leaves legacy migration retryable', () => {
  const store = storage();
  const primary = JSON.stringify({ ...freshSave(), clues: ['painting'] });
  store.setItem(SAVE_KEY, primary);
  const setItem = store.setItem;
  store.setItem = () => {
    throw new Error('storage blocked');
  };
  assert.throws(() => new SaveArchive(store), /storage blocked/);
  assert.equal(store.getItem(slotKey(1)), null);
  assert.equal(store.getItem(slotBackupKey(1)), null);
  assert.equal(store.getItem(SAVE_KEY), primary);
  store.setItem = setItem;
  assert.deepEqual(new SaveArchive(store).read().save.clues, ['painting']);
});
