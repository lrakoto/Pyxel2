import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PNG } from 'pngjs';
import { applyGravityPalette } from '../src/gravity-palette.ts';
import { CANDIDATE_CROP, candidateFloorOffset } from '../src/character-candidate.ts';

test('interior art pivot places every planted idle and walk sole on the physical floor', () => {
  const directory = new URL('../public/character-lab/warped/', import.meta.url);
  const files = readdirSync(directory).filter((name) => /^(idle|walk)-\d+\.png$/.test(name));
  assert.equal(files.length, 20);
  for (const file of files) {
    const frame = PNG.sync.read(readFileSync(new URL(file, directory)));
    let sole = 0;
    for (let y = 0; y < frame.height; y++)
      for (let x = 0; x < frame.width; x++)
        if (frame.data[(y * frame.width + x) * 4 + 3]) sole = Math.max(sole, y + 1);
    for (const figure of [2.8, 2.85]) {
      const height = 73 * figure;
      const drawnSole =
        -height +
        ((sole - CANDIDATE_CROP.y) * height) / CANDIDATE_CROP.cellHeight +
        candidateFloorOffset(height);
      assert.ok(Math.abs(drawnSole) < 0.000001, `${file}: sole meets floor at scale ${figure}`);
    }
  }
});

test('Gravity palette preserves alpha, skin and geometry in every authored frame', () => {
  const directory = new URL('../public/character-lab/warped/', import.meta.url);
  const files = readdirSync(directory).filter((name) => name.endsWith('.png'));
  assert.equal(files.length, 32);
  for (const file of files) {
    const source = PNG.sync.read(readFileSync(new URL(file, directory)));
    const data = new Uint8ClampedArray(source.data);
    applyGravityPalette(data, source.width, file);
    let blonde = 0;
    for (let i = 0; i < data.length; i += 4) {
      assert.equal(data[i + 3], source.data[i + 3], `${file}: alpha`);
      const before = source.data.readUIntBE(i, 3);
      const after = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      if (!data[i + 3] || before === 0xffb164 || before === 0xb15c51)
        assert.equal(after, before, `${file}: transparent pixel or skin`);
      if (data[i + 3]) {
        assert.notEqual(after, 0xffd800, `${file}: yellow removed`);
        assert.notEqual(after, 0x93278f, `${file}: magenta removed`);
        if (after === 0xd8b568) blonde++;
      }
    }
    assert.ok(blonde > 0, `${file}: blonde hair present`);
  }
});

test('shared purple separates hair, shorts and bare legs', () => {
  const source = PNG.sync.read(
    readFileSync(new URL('../public/character-lab/warped/idle-1.png', import.meta.url)),
  );
  const data = new Uint8ClampedArray(source.data);
  applyGravityPalette(data, source.width);
  const colors = new Set<number>();
  for (let i = 0; i < data.length; i += 4) {
    if (source.data.readUIntBE(i, 3) === 0x442b61 && data[i + 3])
      colors.add((data[i] << 16) | (data[i + 1] << 8) | data[i + 2]);
  }
  assert.deepEqual(colors, new Set([0x8f693c, 0x242a36, 0xffb164]));
});

test('idle bare legs stay continuous as the knees rise and fall', () => {
  for (let frame = 1; frame <= 4; frame++) {
    const source = PNG.sync.read(
      readFileSync(new URL(`../public/character-lab/warped/idle-${frame}.png`, import.meta.url)),
    );
    const data = new Uint8ClampedArray(source.data);
    applyGravityPalette(data, source.width, `idle-${frame}`);
    // Sample through the thigh/knee/calf, above the preserved boot trim.
    // A fixed recolor boundary left a dark band in frames 2, 3 and 4.
    for (let y = 48; y <= 55; y++) {
      const at = (y * source.width + 34) * 4;
      const color = (data[at] << 16) | (data[at + 1] << 8) | data[at + 2];
      assert.equal(data[at + 3], 255, `idle-${frame}: connected leg at row ${y}`);
      assert.ok([0xffb164, 0xb15c51].includes(color), `idle-${frame}: skin at row ${y}`);
    }
  }
});
