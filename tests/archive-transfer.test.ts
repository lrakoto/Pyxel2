import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_CASE_FILE_BYTES,
  CaseFileError,
  assertCaseFileSize,
  exportCaseFile,
  parseCaseFile,
  findImportSlot,
} from '../src/archive-transfer.ts';
import { renderArchive, renderImportPreview, renderResume } from '../src/archive-ui.ts';
import {
  SaveArchive,
  ACTIVE_SLOT_KEY,
  slotKey,
  slotBackupKey,
  type SlotSummary,
} from '../src/save-archive.ts';
import { CaseModel, freshSave, parseSave, SAVE_KEY } from '../src/model.ts';
import {
  CORE_DEDUCTIONS,
  DEDUCTIONS,
  FOLLOWUP_CLUES,
  FOLLOWUP_DEDUCTIONS,
} from '../src/content.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

const slot = (changes: Partial<SlotSummary> = {}): SlotSummary => ({
  id: 1,
  name: 'Night shift',
  updatedAt: Date.UTC(2026, 8, 22, 17),
  save: freshSave(),
  recovered: false,
  corrupt: false,
  history: [],
  ...changes,
});
const envelope = (changes: Record<string, unknown> = {}) => ({
  format: 'gravity-case-file',
  version: 1,
  name: 'Night shift',
  savedAt: Date.UTC(2026, 8, 22, 17),
  save: freshSave(),
  ...changes,
});
function hasCode(code: CaseFileError['code']) {
  return (error: unknown) => error instanceof CaseFileError && error.code === code;
}
function completedSave() {
  const model = new CaseModel();
  for (const d of DEDUCTIONS.filter((d) => CORE_DEDUCTIONS.includes(d.id) || d.id === 'entry')) {
    d.pair.forEach((id) => model.collect(id));
    model.connect(...d.pair);
  }
  model.collect('fragment');
  model.save.contact = true;
  model.save.companion = true;
  model.save.escaped = true;
  model.startFollowup();
  FOLLOWUP_CLUES.forEach((id) => model.collect(id));
  for (const d of DEDUCTIONS.filter((d) => FOLLOWUP_DEDUCTIONS.includes(d.id)))
    model.connect(...d.pair);
  model.resolveFollowup('protect');
  model.save.area = 'den';
  model.save.x = 820;
  return parseSave(JSON.stringify(model.save));
}

test('portable files round trip earned progress without history, browser keys, or mutation', () => {
  const source = slot({
    save: completedSave(),
    history: [{ id: 'old', savedAt: 1, save: freshSave() }],
  });
  const before = JSON.stringify(source);
  const file = exportCaseFile(source);
  const imported = parseCaseFile(file.contents);
  assert.deepEqual(imported.save, source.save);
  assert.equal(imported.name, source.name);
  assert.equal(imported.savedAt, source.updatedAt);
  assert.equal(file.filename, 'gravity-night-shift-2026-09-22.json');
  assert.deepEqual(Object.keys(JSON.parse(file.contents)), [
    'format',
    'version',
    'name',
    'savedAt',
    'save',
  ]);
  assert.doesNotMatch(file.contents, /history|localStorage|everybody-nobody:fragments/);
  assert.equal(JSON.stringify(source), before);
});

test('size limits apply before parsing, including multi-byte data and the exact byte boundary', () => {
  assert.throws(() => assertCaseFileSize(MAX_CASE_FILE_BYTES + 1), hasCode('too-large'));
  assert.throws(() => assertCaseFileSize(Infinity), hasCode('invalid-file'));
  assert.throws(() => parseCaseFile('{'.repeat(MAX_CASE_FILE_BYTES + 1)), hasCode('too-large'));
  assert.throws(() => parseCaseFile('é'.repeat(MAX_CASE_FILE_BYTES / 2 + 1)), hasCode('too-large'));
  const normal = JSON.stringify(envelope());
  assert.deepEqual(parseCaseFile(normal.padEnd(MAX_CASE_FILE_BYTES, ' ')).save, freshSave());
});

test('foreign JSON, storage dumps, malformed checkpoints and unsupported versions are rejected', () => {
  for (const text of [
    '',
    '{',
    'null',
    '[]',
    '42',
    JSON.stringify(freshSave()),
    JSON.stringify({ [SAVE_KEY]: JSON.stringify(freshSave()) }),
    JSON.stringify(envelope({ format: 'another-game' })),
    JSON.stringify(envelope({ name: null })),
    JSON.stringify(envelope({ savedAt: -1 })),
    JSON.stringify(envelope({ savedAt: 9e15 })),
    JSON.stringify(envelope({ save: { ...freshSave(), area: '__proto__' } })),
    JSON.stringify(envelope({ save: { ...freshSave(), clues: {} } })),
  ])
    assert.throws(() => parseCaseFile(text), hasCode('invalid-file'));
  assert.throws(
    () => parseCaseFile(JSON.stringify(envelope({ version: 2 }))),
    hasCode('unsupported-version'),
  );
  assert.throws(
    () => parseCaseFile(JSON.stringify(envelope({ save: { ...freshSave(), version: 2 } }))),
    hasCode('unsupported-version'),
  );
  const deeplyNested = JSON.stringify(envelope()).replace(
    '"clues":[]',
    '"clues":' + '['.repeat(12000) + '0' + ']'.repeat(12000),
  );
  assert.throws(() => parseCaseFile(deeplyNested), hasCode('invalid-file'));
});

test('import validation strips unknown data and unearned story gates before previewing', () => {
  const proposal = parseCaseFile(
    JSON.stringify(
      envelope({
        name: '\u0000  <img src=x onerror="bad()"> \n  case  ',
        save: {
          ...freshSave(),
          x: 99999,
          clues: ['camera', 'camera', 'unknown', 'chime'],
          deductions: ['entry', 'identity'],
          contact: true,
          companion: true,
          followup: true,
          escaped: true,
          resolution: 'protect',
          untrusted: '<script>bad()</script>',
        },
        html: '<script>bad()</script>',
      }),
    ),
  );
  assert.equal(proposal.name, '<img src=x onerror="bad()"> case');
  assert.deepEqual(proposal.save.clues, ['camera']);
  assert.deepEqual(proposal.save.deductions, []);
  assert.equal(proposal.save.contact, false);
  assert.equal(proposal.save.followup, false);
  assert.equal(proposal.save.resolution, null);
  assert.equal(proposal.save.x, 1750);
  assert.doesNotMatch(JSON.stringify(proposal), /untrusted|<script>/);
  const preview = renderImportPreview(proposal, 2);
  assert.match(preview, /&lt;img src=x onerror=&quot;bad\(\)&quot;&gt;/);
  assert.doesNotMatch(preview, /<img src=x|<script>|Ada|Meridian|Bellwether|archive 001/);
  assert.match(preview, /data-action="archive-import-confirm" data-slot="2"/);
  assert.match(preview, /current investigation stays open/);
});

test('download filenames cannot carry paths or control characters and unavailable saves refuse export', () => {
  const file = exportCaseFile(slot({ name: ' ../Été\\case\u0000 / notes  ' }));
  assert.match(file.filename, /^gravity-[a-z0-9-]+-2026-09-22\.json$/);
  assert.doesNotMatch(file.filename, /[\\/\u0000]/);
  assert.throws(() => exportCaseFile(slot({ save: null })), hasCode('unreadable-case'));
  assert.throws(() => exportCaseFile(slot({ corrupt: true })), hasCode('unreadable-case'));
  assert.throws(() => exportCaseFile(slot({ updatedAt: Infinity })), hasCode('unreadable-case'));
});

test('import creates an independent reloadable case without switching the active investigation', () => {
  const storage = memoryStorage();
  const archive = new SaveArchive(storage, () => 2000);
  archive.create(1, 'Original');
  archive.select(1);
  archive.write({ ...freshSave(), clues: ['painting'] });
  const original = JSON.stringify(archive.list()[0]);
  const proposal = parseCaseFile(exportCaseFile(slot({ save: completedSave() })).contents);
  archive.importCase(2, proposal.name, proposal.save);
  assert.equal(archive.activeId, 1);
  assert.equal(storage.getItem(ACTIVE_SLOT_KEY), '1');
  assert.equal(JSON.stringify(archive.list()[0]), original);
  assert.deepEqual(archive.read().save.clues, ['painting']);
  proposal.save.clues.length = 0;
  const reloaded = new SaveArchive(storage);
  assert.equal(reloaded.activeId, 1);
  assert.deepEqual(reloaded.list()[1].save, completedSave());
  assert.deepEqual(reloaded.list()[1].history, []);
  assert.equal(reloaded.list()[1].updatedAt, 2000);
});

test('import never overwrites occupied, recovered, or corrupt folders, including a competing tab', () => {
  const storage = memoryStorage();
  const archive = new SaveArchive(storage);
  const stale = new SaveArchive(storage);
  archive.create(2, 'Other tab');
  const original = storage.getItem(slotKey(2));
  assert.throws(() => stale.importCase(2, 'Overwrite', freshSave()), /occupied/);
  assert.equal(storage.getItem(slotKey(2)), original);
  storage.map.set(slotBackupKey(2), original!);
  storage.map.set(slotKey(2), '{broken');
  assert.throws(() => archive.importCase(2, 'Recovered overwrite', freshSave()), /occupied/);
  storage.map.set(slotBackupKey(2), 'broken too');
  assert.throws(() => archive.importCase(2, 'Corrupt overwrite', freshSave()), /occupied/);
  assert.equal(storage.getItem(slotKey(2)), '{broken');
  assert.equal(storage.getItem(slotBackupKey(2)), 'broken too');
});

test('stale observations of an externally cleared folder cannot bypass archive write protection', () => {
  const storage = memoryStorage();
  const archive = new SaveArchive(storage);
  archive.create(2, 'Previously occupied');
  storage.map.delete(slotKey(2));
  assert.throws(() => archive.importCase(2, 'Stale import', freshSave()), /another tab/);
  assert.equal(storage.getItem(slotKey(2)), null);
});

test('failed storage and invalid imported saves leave all folders and active selection unchanged', () => {
  const storage = memoryStorage();
  const archive = new SaveArchive(storage);
  archive.create(1, 'Original');
  archive.select(1);
  const before = new Map(storage.map);
  assert.throws(
    () => archive.importCase(2, 'Invalid', { ...freshSave(), version: 2 } as never),
    /supported/,
  );
  assert.deepEqual(storage.map, before);
  const setItem = storage.setItem;
  storage.setItem = (key, value) => {
    if (key === slotKey(2)) throw new Error('quota');
    setItem(key, value);
  };
  assert.throws(() => archive.importCase(2, 'No room', freshSave()), /quota/);
  assert.deepEqual(storage.map, before);
  assert.equal(archive.activeId, 1);
  assert.equal(archive.list()[1].save, null);
});

test('slot selection and UI only offer empty folders and explain a full archive', () => {
  const slots = [slot(), slot({ id: 2, save: null, corrupt: true }), slot({ id: 3, save: null })];
  assert.equal(findImportSlot(slots), 3);
  assert.equal(findImportSlot(slots, 3), 3);
  assert.throws(() => findImportSlot(slots, 2), hasCode('slot-unavailable'));
  const html = renderArchive(slots, 1);
  assert.match(html, /data-action="archive-import" data-slot="3"/);
  assert.doesNotMatch(html, /data-action="archive-import" data-slot="[12]"/);
  assert.match(renderResume(slots[0]), /data-action="archive-export" data-slot="1"/);
  assert.doesNotMatch(renderResume(slots[1]), /data-action="archive-export"/);
  slots[2] = slot({ id: 3 });
  assert.throws(() => findImportSlot(slots), hasCode('slots-full'));
  assert.match(renderArchive(slots, 1), /All three folders are in use/);
  assert.doesNotMatch(renderArchive(slots, 1), /data-action="archive-import"/);
});
