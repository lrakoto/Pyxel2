import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  applyLyraPalette,
  applyLyraHumanoidPalette,
  LYRA_HUMAN_CROP,
} from '../src/lyra-candidate.ts';
test('Lyra asset recolor preserves silhouette and transparency across all frames', () => {
  const directory = new URL('../public/character-lab/lyra-warped/', import.meta.url);
  const files = readdirSync(directory).filter((name) => name.endsWith('.png'));
  assert.equal(files.length, 14);
  for (const file of files) {
    const source = PNG.sync.read(readFileSync(new URL(file, directory)));
    const data = new Uint8ClampedArray(source.data);
    applyLyraPalette(data);
    let changed = 0;
    for (let i = 0; i < data.length; i += 4) {
      assert.equal(data[i + 3], source.data[i + 3], `${file}: alpha`);
      if (data[i] !== source.data[i]) changed++;
      if (data[i + 3])
        assert.notEqual((data[i] << 16) | (data[i + 1] << 8) | data[i + 2], 0xcc2485);
    }
    assert.ok(changed > 0);
  }
});

function humanPoses() {
  const layers = ['base', 'suit', 'hair'].map((name) =>
    PNG.sync.read(
      readFileSync(new URL(`../public/character-lab/lyra-human/${name}.png`, import.meta.url)),
    ),
  );
  for (const layer of layers) {
    assert.equal(layer.width, 320);
    assert.equal(layer.height, 640);
  }
  return Array.from({ length: 7 }, (_, frame) => {
    const pixels = new Uint8ClampedArray(32 * 64 * 4);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 32; x++)
        for (const layer of layers) {
          const from = (y * layer.width + x + frame * 32) * 4;
          if (layer.data[from + 3])
            pixels.set(layer.data.subarray(from, from + 4), (y * 32 + x) * 4);
        }
    return pixels;
  });
}

test('both Lyra finishes preserve all seven source poses and the fixed foot baseline', () => {
  const poses = new Set<string>();
  for (const [frame, original] of humanPoses().entries()) {
    for (const style of ['cyber', 'projection'] as const) {
      const pixels = original.slice();
      applyLyraHumanoidPalette(pixels, style, frame);
      let bottom = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i + 3], original[i + 3], `${style} frame ${frame}: original alpha`);
        if (!pixels[i + 3]) {
          assert.deepEqual(pixels.slice(i, i + 4), original.slice(i, i + 4));
          continue;
        }
        bottom = Math.max(bottom, Math.floor(i / 4 / 32) + 1);
      }
      assert.equal(bottom, LYRA_HUMAN_CROP.y + LYRA_HUMAN_CROP.cellHeight);
      if (style === 'cyber') poses.add(Buffer.from(pixels).toString('base64'));
    }
  }
  assert.ok(poses.size >= 4, 'distinct authored motion silhouettes, not a repeated idle pose');
});

test('cyber finish keeps dark material separation and sparse accents on the authored anatomy', () => {
  const eyes = [16, 18, 17, 17, 18, 17, 17];
  const colorAt = (data: Uint8ClampedArray, x: number, y: number) => {
    const at = (y * 32 + x) * 4;
    return (data[at] << 16) | (data[at + 1] << 8) | data[at + 2];
  };
  for (const [frame, original] of humanPoses().entries()) {
    const cyber = original.slice(),
      projection = original.slice();
    applyLyraHumanoidPalette(cyber, 'cyber', frame);
    applyLyraHumanoidPalette(projection, 'projection', frame);
    let bright = 0,
      opaque = 0,
      cyberLight = 0,
      projectionLight = 0;
    for (let i = 0; i < cyber.length; i += 4) {
      if (!original[i + 3]) continue;
      opaque++;
      const color = (cyber[i] << 16) | (cyber[i + 1] << 8) | cyber[i + 2];
      if (color === 0x72fbe8 || color === 0xa6fff0) bright++;
      cyberLight += cyber[i] + cyber[i + 1] + cyber[i + 2];
      projectionLight += projection[i] + projection[i + 1] + projection[i + 2];
    }
    assert.ok(bright >= 3 && bright <= 10, `frame ${frame}: sparse hardware lights remain visible`);
    assert.ok(bright / opaque < 0.035, `frame ${frame}: accents do not wash out the suit`);
    assert.ok(
      cyberLight < projectionLight * 0.7,
      `frame ${frame}: materially darker than projection`,
    );
    assert.equal(colorAt(cyber, eyes[frame], 23), 0xa6fff0, 'visor follows the authored eye');
    assert.equal(colorAt(cyber, eyes[frame], 24), 0x8fb7bc, 'face below the visor stays readable');
    assert.equal(
      colorAt(projection, eyes[frame], 23),
      0xc4ffff,
      'previous projection stays unchanged',
    );
  }
});
