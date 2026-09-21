/** Palette-only rendering adaptation. Frame geometry, alpha and skin remain untouched. */
export function applyGravityPalette(data: Uint8ClampedArray, width: number, pose = 'idle-1') {
  const colorAt = (i: number) => (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
  // The source reuses its hair shadow in the stockings. Locate the distinctive
  // magenta hair pixels per pose instead of turning the entire purple palette blonde.
  let hairBottom = -1;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] && (colorAt(i) === 0x93278f || colorAt(i) === 0xc51aea))
      hairBottom = Math.max(hairBottom, Math.floor(i / 4 / width));
  }
  const [motion, number] = pose.replace('.png', '').split('-');
  const frame = Number(number) - 1;
  const lowerLeg = (x: number, y: number) => {
    if (motion === 'jump') {
      return frame === 0
        ? y >= 35 && x < 41
        : frame === 1
          ? x < 38 && y < 33
          : frame === 2
            ? x >= 43 && y <= 34
            : y >= 44 || (x >= 40 && y >= 39);
    }
    const start =
      motion === 'run'
        ? ([44, 45, 46, 49, 44, 45, 46, 49][frame] ?? 49)
        : motion === 'walk'
          ? 50
          : ([52, 51, 50, 51][frame] ?? 52);
    return y >= start;
  };
  // Preserve the footwear's dark seams as well as its white sole and trim.
  const bootPixels: [number, number][] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] && [0xa096d1, 0xfcfcfc].includes(colorAt(i)))
      bootPixels.push([(i / 4) % width, Math.floor(i / 4 / width)]);
  }
  for (let i = 0; i < data.length; i += 4) {
    if (!data[i + 3]) continue;
    const color = colorAt(i);
    const y = Math.floor(i / 4 / width);
    const x = (i / 4) % width;
    const bareLeg =
      lowerLeg(x, y) &&
      !bootPixels.some(([bx, by]) => Math.abs(bx - x) <= 2 && Math.abs(by - y) <= 2);
    let replacement: number | undefined;
    if (bareLeg && (color === 0x442b61 || color === 0x050912)) {
      replacement = color === 0x442b61 ? 0xffb164 : 0xb15c51;
    } else if (color === 0x93278f) replacement = 0xd8b568;
    else if (color === 0xc51aea) replacement = 0xffe6a3;
    else if (color === 0x442b61) replacement = y <= hairBottom + 1 ? 0x8f693c : 0x242a36;
    else if (color === 0xffd800) replacement = 0x343d4a;
    else if (color === 0xec7809) replacement = 0x161d29;
    else if (color === 0xa096d1) replacement = 0x929da9;
    if (replacement === undefined) continue;
    data[i] = replacement >> 16;
    data[i + 1] = (replacement >> 8) & 255;
    data[i + 2] = replacement & 255;
  }
}
