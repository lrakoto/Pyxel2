import { AREAS, type AreaId, type SignLight } from './content.ts';
import type { CaseModel } from './model.ts';

/** Broad reflected light gives available evidence a home in the composition. */
export function evidenceLight(c: CanvasRenderingContext2D, model: CaseModel, cam: number) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const h of AREAS[model.save.area].hotspots) {
    if (!h.clue || !model.available(h) || !model.unlocked(h)) continue;
    const x = h.x - cam;
    if (x < -90 || x > c.canvas.width + 90) continue;
    const seen = model.save.clues.includes(h.clue);
    const glow = c.createRadialGradient(x, h.y, 2, x, h.y, 58);
    glow.addColorStop(0, seen ? '#c2b18505' : '#c2b18516');
    glow.addColorStop(1, '#c2b18500');
    c.fillStyle = glow;
    c.fillRect(x - 58, h.y - 58, 116, 116);
  }
  c.restore();
}

/** Short, staggered catches on existing street structures; no extra scenery. */
export function edgeLight(c: CanvasRenderingContext2D, cam: number, lights: SignLight[]) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const light of lights) {
    for (const [x, y, width] of [
      [285, 297, 37],
      [508, 312, 28],
      [1008, 386, 20],
      [1403, 326, 43],
    ]) {
      const strength = Math.max(0, 1 - Math.abs(light.x - x) / 170) * light.intensity;
      if (!strength) continue;
      c.globalAlpha = Math.min(0.25, strength * 0.13);
      c.fillStyle = '#d1cfaf';
      c.fillRect(x - cam - width / 2, y, width, 1);
      c.fillRect(x - cam, y + 2, 1, 15);
    }
  }
  c.restore();
}

/** Restrained, area-specific depth cues, kept behind actors and evidence. */
export function roomVeil(c: CanvasRenderingContext2D, area: AreaId, cam: number, time: number) {
  c.save();
  c.globalCompositeOperation = 'screen';
  if (area === 'street') {
    for (let i = 0; i < 4; i++) {
      const x = i * 480 - cam * 0.68 + Math.sin(time * 0.06 + i) * 28;
      const fog = c.createRadialGradient(x, 414, 2, x, 414, 170);
      fog.addColorStop(0, '#729b9a0b');
      fog.addColorStop(1, '#729b9a00');
      c.fillStyle = fog;
      c.fillRect(x - 170, 355, 340, 82);
    }
  } else {
    const warm = area === 'studio';
    c.fillStyle = warm ? '#ddbc83' : '#83bbd0';
    for (let i = 0; i < 22; i++) {
      const x = ((i * 89) % AREAS[area].width) - cam + Math.sin(time * 0.13 + i) * 4;
      const y = 170 + ((i * 31) % 220) + Math.sin(time * 0.17 + i * 2) * 6;
      c.globalAlpha = 0.035 + Math.max(0, Math.sin(i * 3 + time * 0.3)) * 0.07;
      c.fillRect(x, y, 1, warm ? 1 : 2);
    }
  }
  c.restore();
}

/** Damp grit reflects fragmented color; puddle mirrors are drawn separately. */
export function dampAsphalt(c: CanvasRenderingContext2D, cam: number, lights: SignLight[]) {
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const light of lights) {
    c.fillStyle = light.color;
    for (let i = 0; i < 14; i++) {
      c.globalAlpha = Math.min(0.08, light.intensity * 0.025) * (1 - i / 18);
      const x = light.x - cam + Math.sin(i * 8.1 + light.x) * 34;
      c.fillRect(x, 441 + ((i * 7) % 30), 3 + (i % 7), 1);
    }
  }
  c.restore();
}
