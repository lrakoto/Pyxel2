import test from 'node:test';
import assert from 'node:assert/strict';
import { caseRecap, renderArchive, renderResume, renderRecovery } from '../src/archive-ui.ts';
import { CaseModel, freshSave } from '../src/model.ts';
import { CLUES, CORE_DEDUCTIONS, FOLLOWUP_CLUES, FOLLOWUP_DEDUCTIONS } from '../src/content.ts';
import type { SlotSummary } from '../src/save-archive.ts';

const slot = (values: Partial<SlotSummary> = {}): SlotSummary => ({
  id: 1,
  name: 'Case file 01',
  updatedAt: Date.UTC(2026, 8, 22, 16),
  save: freshSave(),
  recovered: false,
  corrupt: false,
  history: [],
  ...values,
});

test('a new or early case recap never reveals later people, places or deductions', () => {
  const save = freshSave();
  for (const clues of [[], ['camera'], ['writing']] as const) {
    save.clues = [...clues];
    const recap = caseRecap(save);
    assert.doesNotMatch(recap.summary, /Lyra|Ada|Meridian|Bellwether|harvested|extracted/i);
    assert.equal(recap.lead, new CaseModel(save).objective);
    if (clues.length) assert.ok(recap.summary.includes(CLUES[clues[0]].title));
  }
});

test('recap uses the most recently collected record without mutating the save', () => {
  const save = freshSave();
  save.clues = ['painting', 'diary', 'camera'];
  save.deductions = ['voices'];
  const before = JSON.stringify(save);
  const recap = caseRecap(save);
  assert.ok(recap.summary.includes(CLUES.camera.title));
  assert.match(recap.summary, /painting holds witnesses/);
  assert.doesNotMatch(recap.summary, /first surviving memory|Ada|Meridian/);
  assert.equal(JSON.stringify(save), before);
});

test('returning recaps follow earned milestones and preserve the current objective', () => {
  const save = freshSave();
  save.clues = ['device', 'residue', 'painting', 'diary', 'writing', 'portrait'];
  save.deductions = [...CORE_DEDUCTIONS];
  save.contact = true;
  save.area = 'den';
  assert.match(caseRecap(save).summary, /You met Lyra/);
  assert.doesNotMatch(caseRecap(save).summary, /Ada|Meridian|Bellwether/);
  save.clues.push('fragment');
  save.companion = true;
  save.escaped = true;
  save.followup = true;
  save.clues.push(...FOLLOWUP_CLUES);
  save.deductions.push(...FOLLOWUP_DEDUCTIONS);
  assert.match(caseRecap(save).summary, /recovered Ada’s name/);
  assert.equal(caseRecap(save).lead, new CaseModel(save).objective);
  save.resolution = 'protect';
  assert.match(caseRecap(save).summary, /private archive/);
  save.resolution = 'testify';
  assert.match(caseRecap(save).summary, /sealed witness statement/);
});

test('archive distinguishes occupied, empty and unreadable files without an overwrite action', () => {
  const html = renderArchive(
    [slot(), slot({ id: 2, save: null }), slot({ id: 3, save: null, corrupt: true })],
    1,
  );
  assert.match(html, /data-action="archive-open" data-slot="1"/);
  assert.match(html, /data-action="archive-create" data-slot="2"/);
  assert.doesNotMatch(html, /data-action="[^"]+" data-slot="3"/);
  assert.match(html, /kept intact/);
  assert.match(html, /IN USE/);
  assert.match(html, /env\/street.webp/);
});

test('case names and checkpoint identifiers are escaped in text and attributes', () => {
  const named = slot({
    name: '<img src=x onerror="alert(1)"> & \'case\'',
    history: [{ id: '" onclick="bad()', savedAt: 2, save: freshSave() }],
  });
  for (const html of [renderArchive([named], 1), renderResume(named), renderRecovery(named)]) {
    assert.doesNotMatch(html, /<img src=x|onclick="bad|onerror="alert/);
    assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  }
  assert.match(renderResume(named), /id="archive-name"[^>]*maxlength="40"/);
  assert.match(renderRecovery(named), /data-checkpoint="&quot; onclick=&quot;bad\(\)"/);
});

test('resume and recovery expose safe actions and explain the reversible restore', () => {
  const saved = slot({
    recovered: true,
    history: [{ id: 'prior-1', savedAt: 1, save: freshSave() }],
  });
  const resume = renderResume(saved);
  assert.match(resume, /data-action="resume-slot" data-slot="1"/);
  assert.match(resume, /data-action="archive-rename" data-slot="1"/);
  assert.match(resume, /data-action="archive-history" data-slot="1"/);
  assert.match(resume, /role="status"/);
  const recovery = renderRecovery(saved);
  assert.match(recovery, /current progress is kept as a checkpoint/);
  assert.match(recovery, /data-action="archive-restore" data-slot="1" data-checkpoint="prior-1"/);
  assert.doesNotMatch(renderRecovery(slot()), /data-action="archive-restore"/);
  assert.doesNotMatch(renderResume(slot({ corrupt: true })), /data-action="resume-slot"/);
});
