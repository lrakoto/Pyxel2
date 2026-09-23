/** The same projection hardware and signal pass are used in the game and motion study. */
export function drawLyraEmitter(
  c: CanvasRenderingContext2D,
  x: number,
  floor: number,
  height: number,
  time: number,
) {
  const unit = height / 70;
  c.save();
  c.translate(Math.round(x), Math.round(floor) + unit);
  c.globalCompositeOperation = 'screen';
  const glow = c.createRadialGradient(0, -height * 0.42, 0, 0, -height * 0.42, height * 0.56);
  glow.addColorStop(0, '#54dbe824');
  glow.addColorStop(0.4, '#43d3e610');
  glow.addColorStop(1, '#38c8df00');
  c.fillStyle = glow;
  c.fillRect(-height * 0.56, -height, height * 1.12, height * 1.12);

  // Three separated contacts read as a projector, rather than a pool of mist.
  c.strokeStyle = '#56c7d5';
  c.lineWidth = Math.max(0.65, unit * 0.45);
  c.globalAlpha = 0.42;
  for (let i = 0; i < 3; i++) {
    const start = (i * Math.PI * 2) / 3 + 0.15;
    c.beginPath();
    c.ellipse(0, 0, 12 * unit, 2.5 * unit, 0, start, start + 1.5);
    c.stroke();
  }
  c.globalAlpha = 0.52 + Math.sin(time * 1.7) * 0.05;
  c.fillStyle = '#8bf6ed';
  for (const side of [-1, 1]) {
    c.fillRect(side * 15 * unit - unit / 2, -unit / 2, unit, unit);
    c.fillRect(side * 11 * unit - unit / 2, -3 * unit, unit, unit);
  }
  c.restore();
}

let signalMask: HTMLCanvasElement | null = null;

/** A brief scan crosses only opaque sprite pixels; the character never disappears. */
export function drawLyraSignal(
  c: CanvasRenderingContext2D,
  source: CanvasImageSource,
  crop: { x: number; y: number; width: number; height: number },
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
) {
  const phase = (time % 7.2) / 7.2;
  if (time <= 0 || phase >= 0.2) return;
  signalMask ??= document.createElement('canvas');
  if (signalMask.width !== crop.width || signalMask.height !== crop.height) {
    signalMask.width = crop.width;
    signalMask.height = crop.height;
  }
  const mask = signalMask.getContext('2d')!;
  mask.globalCompositeOperation = 'source-over';
  mask.clearRect(0, 0, crop.width, crop.height);
  mask.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  mask.globalCompositeOperation = 'source-in';
  mask.fillStyle = '#77fff0';
  // Retain one lit row, clipped to the source silhouette.
  const row = Math.floor((phase / 0.2) * crop.height);
  mask.fillRect(0, row, crop.width, 1);
  mask.clearRect(0, 0, crop.width, row);
  mask.clearRect(0, row + 1, crop.width, crop.height - row - 1);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.globalAlpha *= 0.15;
  c.drawImage(signalMask, x, y, width, height);
  c.restore();
}
