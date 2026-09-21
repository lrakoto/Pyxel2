/** Palette-only rendering adaptation. Frame geometry, alpha and skin remain untouched. */
export function applyGravityPalette(data: Uint8ClampedArray, width: number) {
  const colorAt = (i: number) => (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
  // The source reuses its hair shadow in the stockings. Locate the distinctive
  // magenta hair pixels per pose instead of turning the entire purple palette blonde.
  let hairBottom = -1;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] && (colorAt(i) === 0x93278f || colorAt(i) === 0xc51aea))
      hairBottom = Math.max(hairBottom, Math.floor(i / 4 / width));
  }
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const color = colorAt(i);
    const y = Math.floor(i / 4 / width);
    let replacement: number | undefined;
    if (color === 0x93278f) replacement = 0xd8b568;
    else if (color === 0xc51aea) replacement = 0xffe6a3;
    else if (color === 0x442b61) replacement = y <= hairBottom + 1 ? 0x8f693c : 0x242a36;
    else if (color === 0xffd800) replacement = 0x343d4a;
    else if (color === 0xec7809) replacement = 0x161d29;
    else if (color === 0xa096d1) replacement = 0x151b25;
    else if (color === 0xfcfcfc) replacement = 0x292f39;
    if (replacement === undefined) continue;
    data[i] = replacement >> 16;
    data[i + 1] = (replacement >> 8) & 255;
    data[i + 2] = replacement & 255;
  }
}
