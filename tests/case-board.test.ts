import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AREAS,
  CLUES,
  CORE_DEDUCTIONS,
  DEDUCTIONS,
  type ClueId,
  type Deduction,
} from '../src/content.ts';
import { CaseModel, parseSave } from '../src/model.ts';
import { boardHint, lyraIntroduction, lyraTopics } from '../src/narrative.ts';
import { evidenceBoardState, renderEvidenceCard } from '../src/case-board.ts';

function collectEntry() {
  const model = new CaseModel();
  model.collect('camera');
  model.collect('lock');
  return model;
}

test('the street camera and studio lock map to the optional entry in either selection order', () => {
  assert.equal(AREAS.street.hotspots.find((h) => h.id === 'camera')?.clue, 'camera');
  assert.equal(AREAS.studio.hotspots.find((h) => h.id === 'lock')?.clue, 'lock');
  for (const pair of [
    ['camera', 'lock'],
    ['lock', 'camera'],
  ] as [ClueId, ClueId][]) {
    const model = new CaseModel();
    model.collect(pair[0]);
    assert.equal(model.connect(...pair), null, 'both observations must be collected');
    model.collect(pair[1]);
    assert.equal(model.connect(...pair)?.id, 'entry');
    assert.deepEqual(model.save.deductions, ['entry']);
    assert.equal(model.deduced, false, 'optional evidence does not replace core conclusions');
    assert.ok(lyraTopics(model).some((t) => t.id === 'entry'));
    assert.match(lyraIntroduction(model)[0].text, /appointment/);
  }
});

test('repeating the studio lock match does not produce another discovery or mutate the save', () => {
  const model = collectEntry();
  let discoveries = 0;
  if (model.connect('camera', 'lock')) discoveries++;
  const saved = JSON.stringify(model.save);
  if (model.connect('lock', 'camera')) discoveries++;
  if (model.connect('camera', 'lock')) discoveries++;
  assert.equal(discoveries, 1);
  assert.equal(JSON.stringify(model.save), saved);
  assert.equal(model.explain('lock', 'camera').reason, 'matched');
  assert.match(model.explain('lock', 'camera').text, /Already recorded: An appointment/);
});

test('matched cards name their partner and keep a separate enabled record reader', () => {
  const model = collectEntry();
  assert.equal(evidenceBoardState(model.save, 'lock').selectable, true);
  assert.match(renderEvidenceCard(model.save, 'lock', true), /aria-pressed="true"/);
  model.connect('camera', 'lock');
  for (const [id, partner] of [
    ['lock', 'camera'],
    ['camera', 'lock'],
  ] as [ClueId, ClueId][]) {
    const state = evidenceBoardState(model.save, id);
    assert.equal(state.complete, true);
    assert.equal(state.selectable, false);
    assert.deepEqual(
      state.matches.map((d) => d.id),
      ['entry'],
    );
    const html = renderEvidenceCard(model.save, id, true);
    const select = html.match(/<button[^>]*data-clue[^>]*>/)![0];
    const inspect = html.match(/<button[^>]*data-inspect[^>]*>/)![0];
    assert.match(select, /\bdisabled\b/);
    assert.match(select, /aria-pressed="false"/);
    assert.doesNotMatch(inspect, /\bdisabled\b/);
    assert.ok(html.includes(CLUES[partner].title));
    assert.match(html, /class="matched-stamp" role="img" aria-label="Matched">✓<\/span>/);
    assert.doesNotMatch(html, />MATCHED ✓</);
    assert.match(html, /Read matched record/);
  }
});

test('a matched record remains selectable when another unused pairing is still possible', () => {
  const model = collectEntry();
  model.connect('camera', 'lock');
  const entry = DEDUCTIONS.find((d) => d.id === 'entry')!;
  const reuse: Deduction = {
    ...DEDUCTIONS.find((d) => d.id === 'voices')!,
    pair: ['camera', 'diary'],
  };
  const available = evidenceBoardState(model.save, 'camera', [entry, reuse]);
  assert.equal(available.complete, false);
  assert.equal(
    available.selectable,
    true,
    'an uncollected second partner must not consume the record',
  );
  assert.deepEqual(
    available.matches.map((d) => d.id),
    ['entry'],
  );
  model.save.deductions.push('voices');
  assert.equal(evidenceBoardState(model.save, 'camera', [entry, reuse]).complete, true);
});

test('an earned record becomes available again if a later case introduces another use', () => {
  const model = collectEntry();
  model.connect('camera', 'lock');
  const entry = DEDUCTIONS.find((d) => d.id === 'entry')!;
  const later: Deduction = {
    ...DEDUCTIONS.find((d) => d.id === 'continuity')!,
    pair: ['camera', 'sketch'],
  };
  assert.equal(evidenceBoardState(model.save, 'camera', [entry, later]).selectable, false);
  model.save.followup = true;
  assert.equal(evidenceBoardState(model.save, 'camera', [entry, later]).selectable, true);
});

test('the optional lock connection survives reload and is never suggested again after completion', () => {
  let model = collectEntry();
  for (const d of DEDUCTIONS.filter((d) => CORE_DEDUCTIONS.includes(d.id))) {
    d.pair.forEach((id) => model.collect(id));
    model.connect(...d.pair);
  }
  assert.equal(model.deduced, true, 'entry stays optional');
  assert.match(boardHint(model, false), /optional arrival question is still open/);
  model.connect('lock', 'camera');
  model = new CaseModel(parseSave(JSON.stringify(model.save)));
  assert.equal(model.connect('camera', 'lock'), null);
  assert.equal(evidenceBoardState(model.save, 'lock').complete, true);
  assert.match(boardHint(model, false), /All four connections are recorded/);
  assert.doesNotMatch(boardHint(model, false), /still open|compare the street camera/);
  assert.match(boardHint(model, false), /Memory Den/);
});

test('a solved core case with the lock but no camera points to the missing street observation', () => {
  const model = new CaseModel();
  model.collect('lock');
  for (const d of DEDUCTIONS.filter((d) => CORE_DEDUCTIONS.includes(d.id))) {
    d.pair.forEach((id) => model.collect(id));
    model.connect(...d.pair);
  }
  assert.equal(model.save.clues.length, 7);
  assert.equal(model.deduced, true);
  assert.equal(evidenceBoardState(model.save, 'lock').selectable, true);
  assert.match(boardHint(model, false), /return to Sector 07 and examine the street camera/);
  assert.match(boardHint(model, false), /does not block the next lead/);
  assert.doesNotMatch(boardHint(model, false), /already hold/);
  model.collect('camera');
  assert.match(boardHint(model, false), /already hold the street camera and studio lock/);
  assert.equal(model.connect('lock', 'camera')?.id, 'entry');
});
