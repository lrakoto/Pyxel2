import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('recorded drips contain audible splash attacks rather than amplified room rumble', () => {
  const recordings: Buffer[] = [];
  for (const variant of ['a', 'b', 'c']) {
    const file = readFileSync(new URL(`../public/audio/drip-${variant}.wav`, import.meta.url));
    assert.equal(file.toString('ascii', 0, 4), 'RIFF');
    assert.equal(file.toString('ascii', 8, 12), 'WAVE');
    let rate = 0;
    let data: Buffer | undefined;
    for (let offset = 12; offset + 8 <= file.length; ) {
      const id = file.toString('ascii', offset, offset + 4);
      const size = file.readUInt32LE(offset + 4);
      if (id === 'fmt ') {
        assert.equal(file.readUInt16LE(offset + 8), 1, 'uncompressed PCM');
        assert.equal(file.readUInt16LE(offset + 10), 1, 'mono');
        assert.equal(file.readUInt16LE(offset + 22), 16, '16-bit');
        rate = file.readUInt32LE(offset + 12);
      }
      if (id === 'data') data = file.subarray(offset + 8, offset + 8 + size);
      offset += 8 + size + (size % 2);
    }
    assert.equal(rate, 44100);
    assert.ok(data);
    const duration = data.length / 2 / rate;
    assert.ok(duration >= 0.15 && duration <= 0.25);
    assert.equal(data.readInt16LE(0), 0, 'no onset discontinuity');
    assert.equal(data.readInt16LE(data.length - 2), 0, 'no cut-off click');
    let peak = 0;
    let energy = 0;
    let total = 0;
    let low = 0;
    let lowEnergy = 0;
    let attackEnergy = 0;
    const lowpass = 1 - Math.exp((-2 * Math.PI * 200) / rate);
    for (let i = 0; i < data.length; i += 2) {
      const sample = data.readInt16LE(i) / 32768;
      peak = Math.max(peak, Math.abs(sample));
      energy += sample * sample;
      total += sample;
      low += lowpass * (sample - low);
      lowEnergy += low * low;
      if (i / 2 < rate * 0.08) attackEnergy += sample * sample;
    }
    const rms = Math.sqrt(energy / (data.length / 2));
    assert.ok(peak > 0.6 && peak < 0.66, 'consistent transient peaks with mixing headroom');
    assert.ok(rms > 0.05 && rms < 0.09, 'no unexpectedly loud or silent variant');
    assert.ok(lowEnergy / energy < 0.2, 'low-frequency tub rumble must not dominate the drop');
    assert.ok(attackEnergy / energy > 0.85, 'the crop starts on a splash, not a gap between drops');
    assert.ok(Math.abs(total / (data.length / 2)) < 0.003, 'no significant DC offset');
    recordings.push(data);
  }
  assert.ok(!recordings[0].equals(recordings[1]) && !recordings[1].equals(recordings[2]));
});
