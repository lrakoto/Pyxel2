import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../src/content.ts';
import {
  actorPerformance,
  interactionLead,
  interactionPosition,
  interactionReach,
} from '../src/interaction-staging.ts';

test('approaches stop beside each subject and remain within examination reach from either side', () => {
  for (const area of Object.values(AREAS)) {
    for (const h of area.hotspots) {
      for (const facing of [-1, 1]) {
        const x = interactionPosition(h, area, h.x - facing * 220, facing);
        assert.ok(x >= 32 && x <= area.width - 32);
        assert.ok(Math.abs(h.x - x) < interactionReach(h, area));
        if (h.kind === 'talk') assert.ok(Math.abs(h.x - x) >= 45 * area.figureScale);
        assert.equal(
          interactionPosition(h, area, x, facing),
          x,
          'arrival is stable, never walks to the opposite side',
        );
      }
    }
  }
});

test('observations hold the object-specific pose and dialogue reacts to the actual speaker', () => {
  const residue = AREAS.studio.hotspots.find((h) => h.id === 'residue')!;
  assert.equal(actorPerformance(residue, true, 'GRAVITY', false, 3, 0, false).gravity, 'crouch');
  const archive = AREAS.den.hotspots.find((h) => h.id === 'archive')!;
  const projecting = actorPerformance(archive, true, 'GRAVITY', false, 3, 0, false);
  assert.equal(projecting.gravity, 'terminal');
  assert.equal(projecting.lyra, 'project');
  const talk = AREAS.den.hotspots.find((h) => h.id === 'lyra-den')!;
  const listening = actorPerformance(talk, false, 'LYRA', true, 8, 0.6, false);
  assert.equal(listening.gravity, 'listen');
  assert.equal(listening.lyra, 'speak');
  const replying = actorPerformance(talk, false, 'GRAVITY', true, 8, 0.4, false);
  assert.equal(replying.gravity, 'speak');
  assert.equal(replying.lyra, 'listen');
  assert.equal(actorPerformance(null, false, 'MEI', false, 0, 1, false).lyra, 'idle');
});

test('reduced motion skips the staging delay and selects a settled inspection pose', () => {
  const painting = AREAS.studio.hotspots.find((h) => h.id === 'painting')!;
  assert.ok(interactionLead(painting, false) > 0);
  assert.equal(interactionLead(painting, true), 0);
  assert.equal(actorPerformance(painting, true, 'GRAVITY', false, 0, 0, true).gravityTime, 99);
});
