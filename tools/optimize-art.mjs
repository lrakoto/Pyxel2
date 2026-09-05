import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'assets/environments');
const destination = join(root, 'public/env');
await mkdir(destination, { recursive: true });
for (const file of (await readdir(source)).filter(f => f.endsWith('.png')).sort()) {
  const input = join(source, file);
  const output = join(destination, file.replace(/\.png$/, '.webp'));
  await sharp(input).webp({ lossless: true, effort: 6 }).toFile(output);
  // Decoded RGB must match; transparent RGB is irrelevant for these opaque masters.
  const original = await sharp(input).ensureAlpha().raw().toBuffer();
  const encoded = await sharp(output).ensureAlpha().raw().toBuffer();
  if (!original.equals(encoded)) throw new Error(`Lossless verification failed: ${file}`);
  const before = (await stat(input)).size;
  const after = (await stat(output)).size;
  console.log(`${file}: ${(before / 1e6).toFixed(2)} → ${(after / 1e6).toFixed(2)} MB; pixels verified`);
}
