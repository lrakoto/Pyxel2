import test from 'node:test';
import assert from 'node:assert/strict';
import { DialogueReader, nativeActivation } from '../src/dialogue-reader.ts';

test('one activation reveals before advancing or completing a conversation', () => {
  const reader = new DialogueReader();
  reader.open(['First line', 'Last line']);
  assert.equal(reader.label, 'Reveal line');
  assert.equal(reader.advance(), 'reveal');
  assert.equal(reader.index, 0);
  assert.equal(reader.label, 'Continue');
  assert.equal(reader.advance(), 'line');
  assert.equal(reader.label, 'Reveal line');
  assert.equal(reader.advance(), 'reveal');
  assert.equal(reader.label, 'Close');
  assert.equal(reader.advance(), 'close');
});

test('review preserves reading progress without skipping forward or completing the story', () => {
  const reader = new DialogueReader();
  reader.open(['Old line', 'A longer new line']);
  assert.equal(reader.previous(), false);
  reader.advance();
  reader.advance();
  reader.tick(0.1, false);
  const partial = reader.revealed;
  assert.equal(reader.previous(), true);
  assert.equal(reader.revealed, 'Old line'.length);
  assert.equal(reader.advance(), 'line');
  assert.equal(reader.revealed, partial);
  assert.equal(reader.advance(), 'reveal');
});

test('pause, reduced motion, and a new conversation preserve the right reading state', () => {
  const reader = new DialogueReader();
  reader.open(['Something to read']);
  reader.tick(0, false);
  reader.tick(-1, false);
  assert.equal(reader.revealed, 0);
  reader.tick(0, true);
  assert.equal(reader.complete, true);
  reader.open(['New text', 'Next'], true);
  assert.equal(reader.index, 0);
  assert.equal(reader.label, 'Continue');
  reader.advance();
  assert.equal(reader.label, 'Close');
  reader.open([]);
  assert.equal(reader.advance(), null);
  assert.equal(reader.previous(), false);
});

test('native Enter/Space activation stays with controls while field shortcuts remain available', () => {
  for (const code of ['Enter', 'Space']) {
    for (const tag of ['BUTTON', 'A', 'INPUT', 'SUMMARY'])
      assert.ok(nativeActivation(code, tag, null));
    assert.ok(nativeActivation(code, 'DIV', 'button'));
    assert.equal(nativeActivation(code, 'CANVAS', null), false);
  }
  assert.equal(nativeActivation('KeyE', 'BUTTON', null), false);
  assert.equal(nativeActivation('KeyD', 'BUTTON', null), false);
});
