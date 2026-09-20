import { AREAS, type AreaId } from './content.ts';

/** Glass edge moisture and fixture-local light; drawn behind the characters. */
export function interiorFinish(
  c: CanvasRenderingContext2D,
  area: AreaId,
  cam: number,
  time: number,
) {
  if (area === 'street') return;
  c.save();
  for (const pane of AREAS[area].water?.panes ?? []) {
    const x = pane.x - cam;
    if (x + pane.w < 0 || x > c.canvas.width) continue;
    c.save();
    c.beginPath();
    c.rect(x, pane.y, pane.w, pane.h);
    c.clip();
    c.globalCompositeOperation = 'screen';
    const film = c.createLinearGradient(x, 0, x + pane.w, 0);
    film.addColorStop(0, '#789d9a16');
    film.addColorStop(0.12, '#789d9a03');
    film.addColorStop(0.85, '#789d9a00');
    film.addColorStop(1, '#789d9a1b');
    c.fillStyle = film;
    c.fillRect(x, pane.y, pane.w, pane.h);
    // Stationary beads hug the frame; existing water runners supply the motion.
    c.fillStyle = '#aac6bd';
    c.globalAlpha = 0.18;
    for (let i = 0; i < 18; i++) {
      const edge = i % 2 ? pane.w - 3 - (i % 7) : 2 + (i % 6);
      c.fillRect(x + edge, pane.y + 8 + ((i * 29) % (pane.h - 12)), 1, i % 3 === 0 ? 2 : 1);
    }
    c.restore();
    if (area === 'studio') {
      c.save();
      c.globalCompositeOperation = 'screen';
      // Narrow slats leave alternating light and shadow across the back wall.
      for (let i = 0; i < 4; i++) {
        const origin = x + 14 + (i * (pane.w - 28)) / 4;
        const wash = c.createLinearGradient(0, pane.y + pane.h, 0, 330);
        wash.addColorStop(0, '#8cabba0c');
        wash.addColorStop(1, '#8cabba00');
        c.fillStyle = wash;
        c.beginPath();
        c.moveTo(origin, pane.y + pane.h);
        c.lineTo(origin + 5, pane.y + pane.h);
        c.lineTo(origin + 69, 330);
        c.lineTo(origin + 48, 330);
        c.fill();
      }
      c.restore();
    }
  }
  if (area === 'den') {
    // The scan remains inside the existing archive column, never flashing the room.
    const phase = (time % 18) / 18;
    const strength = Math.sin(phase * Math.PI) ** 4;
    c.save();
    c.globalCompositeOperation = 'screen';
    c.beginPath();
    c.ellipse(823 - cam, 288, 59, 94, 0, 0, Math.PI * 2);
    c.clip();
    const y = 198 + phase * 180;
    const band = c.createLinearGradient(0, y - 12, 0, y + 3);
    band.addColorStop(0, '#8fe9e400');
    band.addColorStop(0.85, '#8fe9e41a');
    band.addColorStop(1, '#8fe9e400');
    c.globalAlpha = strength;
    c.fillStyle = band;
    c.fillRect(763 - cam, y - 12, 120, 15);
    c.restore();
  }
  c.restore();
}
