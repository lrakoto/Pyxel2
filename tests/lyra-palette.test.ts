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

test('new female model preserves all seven source poses and a constant foot baseline', () => {
  const layers = ['base', 'suit', 'hair'].map((name) =>
    PNG.sync.read(
      readFileSync(new URL(`../public/character-lab/lyra-human/${name}.png`, import.meta.url)),
    ),
  );
  for (const layer of layers) {
    assert.equal(layer.width, 320);
    assert.equal(layer.height, 640);
  }
  const poses = new Set<string>();
  for (let frame = 0; frame < 7; frame++) {
    const pixels = new Uint8ClampedArray(32 * 64 * 4);
    for (let y = 0; y < 64; y++)
      for (let x = 0; x < 32; x++)
        for (const layer of layers) {
          const from = (y * layer.width + x + frame * 32) * 4;
          if (layer.data[from + 3])
            pixels.set(layer.data.subarray(from, from + 4), (y * 32 + x) * 4);
        }
    const original = pixels.slice();
    applyLyraHumanoidPalette(pixels);
    let bottom = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      assert.equal(pixels[i + 3], original[i + 3], `frame ${frame}: original alpha`);
      if (!pixels[i + 3]) continue;
      assert.ok(
        pixels[i + 2] >= pixels[i + 1] && pixels[i + 1] > pixels[i],
        `frame ${frame}: cyan-blue spectrum`,
      );
      bottom = Math.max(bottom, Math.floor(i / 4 / 32) + 1);
    }
    assert.equal(bottom, LYRA_HUMAN_CROP.y + LYRA_HUMAN_CROP.cellHeight);
    poses.add(Buffer.from(pixels).toString('base64'));
  }
  assert.ok(poses.size >= 4, 'distinct authored motion silhouettes, not a repeated idle pose');
});
