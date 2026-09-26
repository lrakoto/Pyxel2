import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AREAS,
  CLUES,
  CORE_DEDUCTIONS,
  DEDUCTIONS,
  FOLLOWUP_CLUES,
  FOLLOWUP_DEDUCTIONS,
  SHIPMENT_CLUES,
  SHIPMENT_DEDUCTIONS,
  inCaseFile,
  theoryFile,
} from '../src/content.ts';
import { CaseModel, arrivalX, nextRouteHotspot, parseSave } from '../src/model.ts';
import { boardHint, lyraTopics } from '../src/narrative.ts';
import { evidenceBoardState, renderEvidenceCard } from '../src/case-board.ts';
import { caseRecap } from '../src/archive-ui.ts';
import { MACHINE_CLUES, ORB_SOCKETS } from '../src/lyra-orb.ts';
import { evidenceArt } from '../src/evidence-art.ts';

/** A save with Ada's case resolved: the point where the Meridian lead exists. */
function resolvedSecondCase() {
  const m = new CaseModel();
  for (const d of DEDUCTIONS.filter((d) => CORE_DEDUCTIONS.includes(d.id))) {
    d.pair.forEach((id) => m.collect(id));
    m.connect(...d.pair);
  }
  m.collect('fragment');
  Object.assign(m.save, { contact: true, companion: true, escaped: true });
  m.startFollowup();
  FOLLOWUP_CLUES.forEach((id) => m.collect(id));
  DEDUCTIONS.filter((d) => FOLLOWUP_DEDUCTIONS.includes(d.id)).forEach((d) => m.connect(...d.pair));
  m.resolveFollowup('testify');
  return m;
}
const reload = (m: CaseModel) => new CaseModel(parseSave(JSON.stringify(m.save)));

test('cross-referenced evidence reopens only in the new file and keeps its provenance', () => {
  const m = resolvedSecondCase();
  m.startShipment();
  assert.equal(evidenceBoardState(m.save, 'residue', 'graves').complete, true);
  assert.equal(evidenceBoardState(m.save, 'residue', 'shipment').selectable, true);
  assert.match(renderEvidenceCard(m.save, 'residue', false, 'shipment'), /FROM CASE 07–031/);
  assert.doesNotMatch(renderEvidenceCard(m.save, 'residue', false, 'graves'), /CROSS-REFERENCE/);
  m.collect('cartridge');
  m.connect('residue', 'cartridge');
  assert.equal(evidenceBoardState(m.save, 'residue', 'shipment').complete, true);
  assert.equal(evidenceBoardState(m.save, 'residue', 'graves').complete, true);
});

test('saves from before the third case load with it closed and lose nothing', () => {
  const { shipment, buyerNamed, ...old } = resolvedSecondCase().save;
  const restored = parseSave(JSON.stringify(old));
  assert.equal(restored.shipment, false);
  assert.equal(restored.buyerNamed, false);
  assert.equal(restored.resolution, 'testify');
  assert.deepEqual(restored.clues, old.clues);
  assert.deepEqual(restored.deductions, old.deductions);
});

test('the shipment case cannot be opened, visited or forged before Ada’s case is resolved', () => {
  const early = new CaseModel();
  assert.equal(early.startShipment(), false);
  assert.equal(early.collect('manifest'), false);
  assert.equal(early.meridian, 'hidden');
  const forged = parseSave(
    JSON.stringify({
      ...early.save,
      area: 'clinic',
      shipment: true,
      buyerNamed: true,
      clues: SHIPMENT_CLUES,
      deductions: SHIPMENT_DEDUCTIONS,
      resumeHotspot: 'sale',
    }),
  );
  assert.equal(forged.area, 'street');
  assert.equal(forged.shipment, false);
  assert.equal(forged.buyerNamed, false);
  assert.deepEqual(forged.clues, []);
  assert.deepEqual(forged.deductions, []);
  assert.equal(forged.resumeHotspot, null);
});

test('the transit card turns Meridian from a lead into a ride', () => {
  const m = resolvedSecondCase();
  assert.equal(m.meridian, 'no-fare');
  assert.equal(m.startShipment(), true);
  assert.equal(m.startShipment(), false);
  assert.equal(m.meridian, 'ride');
  assert.match(m.objective, /night train to Meridian/);
  m.save.area = 'clinic';
  assert.equal(m.meridian, 'here');
  assert.match(m.objective, /Search intake B/);
  const restored = reload(m);
  assert.equal(restored.save.area, 'clinic');
  assert.equal(restored.save.shipment, true);
});

test('five records and three connections name the buyer, in any order, across reloads', () => {
  for (const order of [
    [0, 1, 2],
    [2, 1, 0],
    [1, 2, 0],
  ]) {
    let m = resolvedSecondCase();
    m.startShipment();
    m.save.area = 'clinic';
    SHIPMENT_CLUES.forEach((id) => assert.equal(m.collect(id), true));
    assert.match(m.objective, /Connect the records/);
    assert.equal(m.nameBuyer(), false);
    const theories = DEDUCTIONS.filter((d) => SHIPMENT_DEDUCTIONS.includes(d.id));
    for (const i of order) {
      assert.equal(m.connect(theories[i].pair[1], theories[i].pair[0])?.id, theories[i].id);
      m = reload(m);
    }
    assert.equal(m.shipmentSolved, true);
    assert.match(m.objective, /Tell Lyra/);
    assert.equal(m.nameBuyer(), true);
    assert.equal(m.nameBuyer(), false);
    m = reload(m);
    assert.equal(m.save.buyerNamed, true);
    assert.equal(m.chapter, 'THE BROKER’S RECEIPT');
    assert.match(m.objective, /Broker/);
  }
});

test('Marlon’s residue reopens in the shipment file once the case is open', () => {
  const m = resolvedSecondCase();
  assert.equal(evidenceBoardState(m.save, 'residue').selectable, false);
  m.startShipment();
  assert.equal(evidenceBoardState(m.save, 'residue').selectable, true);
  assert.ok(inCaseFile('shipment', 'residue'));
  assert.ok(inCaseFile('graves', 'residue'));
  assert.ok(!inCaseFile('graves', 'manifest'));
  for (const id of SHIPMENT_CLUES) assert.ok(inCaseFile('shipment', id));
  assert.deepEqual(
    DEDUCTIONS.filter((d) => theoryFile(d.id) === 'shipment').map((d) => d.id),
    SHIPMENT_DEDUCTIONS,
  );
});

test('hints and Lyra point at the ride, then the room, and never name the buyer early', () => {
  const m = resolvedSecondCase();
  m.startShipment();
  assert.match(boardHint(m, 'shipment'), /district map/);
  assert.match(lyraTopics(m)[0].lines[1].text, /Fremont line/);
  m.save.area = 'clinic';
  assert.match(lyraTopics(m)[0].lines[1].text, /intake counter/);
  for (const id of ['manifest', 'sale'] as const) m.collect(id);
  assert.match(boardHint(m, 'shipment'), /already hold two records/);
  assert.ok(!lyraTopics(m).some((t) => t.id === 'broker'));
  assert.doesNotMatch(caseRecap(m.save).summary, /Broker/);
  m.connect('manifest', 'sale');
  assert.ok(lyraTopics(m).some((t) => t.id === 'broker'));
});

test('the clinic is reached by train and left through its own door', () => {
  assert.ok(!AREAS.street.hotspots.some((h) => h.target === 'clinic'));
  assert.equal(nextRouteHotspot('clinic', 'studio-door')?.id, 'clinic-exit');
  assert.equal(arrivalX('street', 'clinic'), AREAS.street.spawn);
  assert.equal(arrivalX('street', 'studio'), 965);
  assert.equal(arrivalX('clinic', 'street'), AREAS.clinic.spawn);
});

test('Lyra has clinic machines to step into, and every clinic record is illustrated', () => {
  for (const id of ['cartridge', 'sale'] as const) {
    assert.ok(MACHINE_CLUES.includes(id));
    const h = AREAS.clinic.hotspots.find((h) => h.clue === id)!;
    assert.ok(ORB_SOCKETS.clinic.some((s) => Math.abs(s.x - h.x) < 40));
  }
  for (const id of SHIPMENT_CLUES) {
    assert.match(evidenceArt(id), /<svg/);
    assert.ok(CLUES[id].body.length > 0);
  }
  assert.match(evidenceArt('sale'), /THE BROKER/);
});
