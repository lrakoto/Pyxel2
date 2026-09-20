import type { AreaId, SignLight } from './content.ts';

/** Street-coordinate roofs: only the pavement rain plane is sheltered. */
export const SHELTERS = [
  { left: 43, right: 285, roof: 296, floor: 434, warm: true },
  { left: 310, right: 508, roof: 311, floor: 434, warm: false },
  { left: 1403, right: 1698, roof: 326, floor: 434, warm: false },
] as const;
export function underShelter(x: number, y: number): boolean {
  return SHELTERS.some((s) => x > s.left && x < s.right && y >= s.roof && y <= s.floor);
}
/** Short, smooth events separated by quiet intervals, with no flashing edges. */
export function eventEnvelope(time: number, period: number, duration: number, phase = 0) {
  const t = (((time + phase) % period) + period) % period;
  return t < duration ? Math.sin((t / duration) * Math.PI) ** 2 : 0;
}
export function drawGutters(c: CanvasRenderingContext2D, cam: number, time: number) {
  c.save();
  c.lineWidth = 0.7;
  for (const [index, s] of SHELTERS.entries()) {
    for (const edge of [s.left + 3, s.right - 3]) {
      const x = edge - cam;
      if (x < -5 || x > c.canvas.width + 5) continue;
      c.strokeStyle = s.warm ? '#e1c593' : '#91c9cb';
      for (let i = 0; i < 7; i++) {
        const progress = (time * (1.2 + i * 0.04) + i * 0.147 + index * 0.31) % 1;
        const y = s.roof + progress * (s.floor - s.roof);
        c.globalAlpha = 0.15 + progress * 0.16;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 1, y + 4 + progress * 5);
        c.stroke();
      }
      const impact = (time * 1.7 + index * 0.3) % 1;
      c.globalAlpha = (1 - impact) * 0.24;
      c.beginPath();
      c.ellipse(x, s.floor + 4, impact * 8, impact * 2, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}
/** A passer-by behind glass, clipped to the authored window opening. */
export function drawWindowLife(c: CanvasRenderingContext2D, cam: number, time: number) {
  c.save();
  for (const [i, w] of [
    { x: 154, y: 155, w: 70, h: 45 },
    { x: 367, y: 50, w: 13, h: 31 },
  ].entries()) {
    const phase = (time + i * 17) % 43;
    if (phase > 7) continue;
    c.save();
    c.beginPath();
    c.rect(w.x - cam, w.y, w.w, w.h);
    c.clip();
    const x = w.x - cam - 8 + (phase / 7) * (w.w + 16);
    c.globalAlpha = 0.42;
    c.fillStyle = '#102020';
    c.beginPath();
    c.ellipse(x, w.y + 13, 3, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x - 4, w.y + 17, 8, 19);
    c.restore();
  }
  c.restore();
}
export function drawInteriorMood(
  c: CanvasRenderingContext2D,
  area: AreaId,
  cam: number,
  time: number,
) {
  if (area === 'street') return;
  c.save();
  c.globalCompositeOperation = 'screen';
  if (area === 'studio') {
    // A few pigment flecks, visibly warmer than the room's ordinary dust.
    for (let i = 0; i < 22; i++) {
      const x = 520 + ((i * 37) % 440) + Math.sin(time * 0.23 + i) * 8 - cam;
      const y = 155 + ((i * 29 + time * (1 + (i % 3))) % 225);
      c.fillStyle = ['#b38b51', '#78948a', '#a77265'][i % 3];
      c.globalAlpha = 0.11 + Math.sin(time * 0.5 + i) ** 2 * 0.12;
      c.fillRect(x, y, 1 + (i % 7 === 0 ? 1 : 0), 1);
    }
    const pulse = eventEnvelope(time, 19, 3, 5);
    c.globalAlpha = 0.12 * pulse;
    c.fillStyle = '#8bd8cd';
    c.fillRect(1222 - cam, 202, 18, 85);
    c.globalAlpha = 0.2 * pulse;
    for (let i = 0; i < 4; i++) c.fillRect(1246 - cam + i * 5, 328 - (i % 2) * 3, 2, 2);
  } else {
    // Signal bands stay inside the projection; screen light never strobes the room.
    const signal = eventEnvelope(time, 23, 4, 8);
    c.globalAlpha = 0.12 * signal;
    c.fillStyle = '#9ddbc9';
    for (let i = 0; i < 4; i++) c.fillRect(775 - cam, 225 + ((time * 17 + i * 29) % 130), 123, 1);
    for (let i = 0; i < 12; i++) {
      const x = 1060 + (i % 4) * 41 - cam,
        y = 172 + Math.floor(i / 4) * 39;
      c.globalAlpha = 0.04 + 0.04 * Math.sin(time * 0.35 + i) ** 2;
      c.fillRect(x, y, 18, 10);
    }
  }
  c.restore();
}
export function drawPassingLight(c: CanvasRenderingContext2D, cam: number, lights: SignLight[]) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const light of lights) {
    const x = light.x - cam;
    const wash = c.createRadialGradient(x, 432, 8, x, 432, 210);
    wash.addColorStop(0, '#e7d8a921');
    wash.addColorStop(0.45, '#b5cad110');
    wash.addColorStop(1, '#adc4cc00');
    c.fillStyle = wash;
    c.fillRect(x - 210, 260, 420, 225);
  }
  c.restore();
}
