import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PNG } from 'pngjs';
import { applyLyraPalette } from '../src/lyra-candidate.ts';
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
