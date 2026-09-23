import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cinematic, INTRO, INTRO_MARK, sample, sampleTrack } from '../src/cinematic.ts';
import { AREAS } from '../src/content.ts';
import { freshSave } from '../src/model.ts';

test('tracks hold their ends and ease between keys', () => {
  const keys = [
    { at: 1, value: 10 },
    { at: 3, value: 20 },
  ];
  assert.equal(sampleTrack(keys, 0), 10);
  assert.equal(sampleTrack(keys, 2), 15);
  assert.equal(sampleTrack(keys, 9), 20);
  assert.equal(
    sampleTrack(
      [
        { at: 0, value: 0 },
        { at: 1, value: 1, ease: 'linear' },
      ],
      0.25,
    ),
    0.25,
  );
});

test('the intro opens on black and hands back the play framing', () => {
  const first = sample(INTRO, 0);
  assert.equal(first.fade, 1);
  assert.equal(first.bars, 1);
  const last = sample(INTRO, INTRO.duration);
  assert.equal(last.fade, 0);
  assert.equal(last.bars, 0);
  assert.equal(last.zoom, 1);
  assert.equal(last.focus, INTRO_MARK);
  assert.equal(INTRO_MARK, freshSave().x);
});

test('intro tracks and cues stay ordered, in bounds and inside the running time', () => {
  for (const keys of Object.values(INTRO.tracks)) {
    for (let i = 1; i < keys.length; i++) assert.ok(keys[i].at > keys[i - 1].at);
    assert.ok(keys[keys.length - 1].at <= INTRO.duration);
  }
  for (const key of INTRO.tracks.focus)
    assert.ok(key.value >= 0 && key.value <= AREAS.street.width);
  for (const key of INTRO.tracks.zoom) assert.ok(key.value >= 1);
  for (const cue of INTRO.cues) assert.ok(cue.at >= 0 && cue.at < INTRO.duration);
});

test('captions never overlap, and each is readable at its typing speed', () => {
  const captions = [...INTRO.captions].sort((a, b) => a.from - b.from);
  for (let i = 1; i < captions.length; i++) assert.ok(captions[i].from >= captions[i - 1].to);
  for (const c of captions) {
    const mid = sample(INTRO, c.to - 0.5).caption!;
    assert.equal(mid.text, c.text);
    // Typed text must finish with at least a beat left to read it.
    assert.equal(sample(INTRO, c.to - 1).caption!.shown, c.text.length);
  }
});

test('stepping fires every cue exactly once, however the frames are sliced', () => {
  for (const dt of [1 / 60, 1 / 7, 0.1]) {
    const cine = new Cinematic(INTRO);
    const fired = [];
    while (!cine.done) fired.push(...cine.step(dt));
    assert.deepEqual(fired, INTRO.cues);
  }
});

test('skipping resolves the staging the rest of the scene would have done', () => {
  const cine = new Cinematic(INTRO);
  cine.step(1);
  const rest = cine.remainder();
  assert.ok(rest.every((c) => c.kind !== 'sound'));
  assert.equal(rest.at(-1)?.x, INTRO_MARK);
  cine.step(INTRO.duration);
  assert.equal(cine.done, true);
  assert.deepEqual(cine.remainder(), []);
});
