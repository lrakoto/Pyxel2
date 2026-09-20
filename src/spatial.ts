import type { AreaId } from './content.ts';
import { SHELTERS, eventEnvelope } from './atmosphere.ts';

/** Relief stays attached to its opening, including at narrow viewport widths. */
export function reliefOffset(x: number, camera: number, width: number, depth: number) {
  return Math.max(-14, Math.min(14, (x - camera - width / 2) * depth));
}
export function shelterShade(x: number) {
  return SHELTERS.reduce((shade, roof) => {
    const inside = Math.min(x - roof.left, roof.right - x);
    return Math.max(shade, Math.max(0, Math.min(1, inside / 24)) * 0.24);
  }, 0);
}
function polygon(c: CanvasRenderingContext2D, points: number[][], color: string) {
  c.fillStyle = color;
  c.beginPath();
  points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  c.fill();
}

/** Recessed glazing and projecting fascia reuse the original painted surfaces. */
export function drawRelief(c: CanvasRenderingContext2D, plate: HTMLCanvasElement, cam: number) {
  const openings = [
    { x: 450, y: 340, w: 30, h: 91, tint: '#192b30' },
    { x: 990, y: 339, w: 43, h: 91, tint: '#4b3823' },
    { x: 1468, y: 349, w: 82, h: 77, tint: '#132b2c' },
    { x: 154, y: 155, w: 70, h: 45, tint: '#1a221f' },
    { x: 367, y: 50, w: 13, h: 31, tint: '#1a221f' },
  ];
  c.save();
  for (const o of openings) {
    const x = o.x - cam,
      shift = reliefOffset(o.x, cam, c.canvas.width, -0.024);
    if (x + o.w < 0 || x > c.canvas.width) continue;
    c.save();
    c.beginPath();
    c.rect(x, o.y, o.w, o.h);
    c.clip();
    c.fillStyle = '#080f12';
    c.fillRect(x, o.y, o.w, o.h);
    c.drawImage(plate, o.x, o.y, o.w, o.h, x + shift, o.y + 2, o.w, o.h - 2);
    polygon(
      c,
      [
        [x, o.y],
        [x + shift, o.y + 2],
        [x + shift, o.y + o.h],
        [x, o.y + o.h],
      ],
      o.tint,
    );
    polygon(
      c,
      [
        [x + o.w, o.y],
        [x + o.w + shift, o.y + 2],
        [x + o.w + shift, o.y + o.h],
        [x + o.w, o.y + o.h],
      ],
      o.tint,
    );
    c.fillStyle = '#070c1080';
    c.fillRect(x, o.y, o.w, 3);
    c.restore();
    c.fillStyle = '#9b9b7638';
    c.fillRect(x - 1, o.y + o.h, o.w + 2, 2);
  }
  for (const roof of SHELTERS) {
    const x = roof.left - cam,
      w = roof.right - roof.left;
    const shift = reliefOffset(roof.left + w / 2, cam, c.canvas.width, 0.018);
    polygon(
      c,
      [
        [x, roof.roof],
        [x + w, roof.roof],
        [x + w + shift, roof.roof + 7],
        [x + shift, roof.roof + 7],
      ],
      '#070f12d9',
    );
    c.drawImage(plate, roof.left, roof.roof - 5, w, 5, x + shift, roof.roof - 5, w, 5);
    c.fillStyle = roof.warm ? '#96826355' : '#65898755';
    c.fillRect(x + shift, roof.roof - 1, w, 1);
  }
  // Projecting edge of the vertical tube sign.
  const sx = 1250 - cam,
    shift = reliefOffset(1250, cam, c.canvas.width, 0.025);
  polygon(
    c,
    [
      [sx, 155],
      [sx + shift, 158],
      [sx + shift, 263],
      [sx, 260],
    ],
    '#221b21',
  );
  c.fillStyle = '#a8544a65';
  c.fillRect(sx + shift, 158, 1, 103);
  c.restore();
}

/** A non-traversable service passage behind the street fence. */
export function drawAlley(c: CanvasRenderingContext2D, cam: number, time: number) {
  const x = 625 - cam,
    width = 124,
    back = x + 64 + reliefOffset(689, cam, c.canvas.width, -0.04);
  if (x + width < 0 || x > c.canvas.width) return;
  c.save();
  c.beginPath();
  c.rect(x, 280, width, 157);
  c.clip();
  c.fillStyle = '#14272d';
  c.fillRect(x, 280, width, 157);
  polygon(
    c,
    [
      [x, 280],
      [back - 14, 322],
      [back - 14, 388],
      [x, 437],
    ],
    '#0d1c23',
  );
  polygon(
    c,
    [
      [x + width, 280],
      [back + 14, 322],
      [back + 14, 388],
      [x + width, 437],
    ],
    '#172b30',
  );
  polygon(
    c,
    [
      [x, 437],
      [back - 14, 388],
      [back + 14, 388],
      [x + width, 437],
    ],
    '#22363b',
  );
  c.strokeStyle = '#78918a22';
  c.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const d = (i / 7) ** 2,
      y = 389 + d * 49;
    c.beginPath();
    c.moveTo(back - 14 - (back - x - 14) * d, y);
    c.lineTo(back + 14 + (x + width - back - 14) * d, y);
    c.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const y = 288 + i * 18;
    c.strokeStyle = '#69807822';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(back - 14, 322 + (y - 280) * 0.46);
    c.stroke();
    c.fillStyle = '#203d4166';
    c.fillRect(x + width - 10, y, 3, 11);
  }
  c.fillStyle = '#071316';
  c.fillRect(back - 11, 353, 22, 35);
  c.fillStyle = '#88b9ac';
  c.fillRect(back - 8, 350, 16, 2);
  const glow = c.createRadialGradient(back, 364, 2, back, 370, 57);
  glow.addColorStop(0, '#76b7a42b');
  glow.addColorStop(1, '#76b7a400');
  c.fillStyle = glow;
  c.fillRect(x, 310, width, 127);
  const phase = (time + 9) % 37;
  if (phase < 9) {
    const walker = back - 23 + phase * 5;
    c.fillStyle = '#0a191de0';
    c.fillRect(walker, 375, 5, 13);
    c.beginPath();
    c.arc(walker + 2.5, 372, 2.7, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 0.06 + eventEnvelope(time, 31, 9) * 0.06;
  c.fillStyle = '#94b6b2';
  c.fillRect(x, 365, width, 72);
  c.restore();
}

/** New near-plane fixtures frame the action without covering evidence centers. */
export function drawNearArchitecture(
  c: CanvasRenderingContext2D,
  area: AreaId,
  cam: number,
  time: number,
) {
  c.save();
  if (area === 'street') {
    for (const anchor of [330, 1750]) {
      const x = anchor - cam * 1.13;
      c.fillStyle = '#081215';
      c.fillRect(x, 62, 145, 6);
      c.fillStyle = '#304448';
      c.fillRect(x, 62, 145, 1);
      for (let i = 0; i < 9; i++) {
        c.fillStyle = '#091417';
        c.fillRect(x + i * 17, 28, 3, 35);
      }
      c.strokeStyle = '#0b191c';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, 65);
      c.lineTo(x + 20, 88);
      c.lineTo(x + 27, 65);
      c.stroke();
      c.fillStyle = '#739d9b55';
      for (let i = 0; i < 3; i++) {
        const drop = (time * 0.63 + i * 0.31) % 1;
        c.globalAlpha = (1 - drop) * 0.5;
        c.fillRect(x + 30 + i * 48, 68 + drop * 83, 1, 4);
      }
      c.globalAlpha = 1;
    }
    for (const anchor of [85, 1630]) {
      const x = anchor - cam * 1.16;
      c.fillStyle = '#081215';
      c.fillRect(x, 477, 158, 5);
      c.fillStyle = '#273b3d';
      c.fillRect(x, 477, 158, 1);
      for (let i = 0; i < 6; i++) {
        c.fillStyle = '#081215';
        c.fillRect(x + i * 30, 480, 4, 60);
      }
    }
  } else {
    const x = (area === 'studio' ? 390 : 1300) - cam * 1.055;
    c.strokeStyle = '#0b1416';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, 148);
    c.stroke();
    polygon(
      c,
      [
        [x - 7, 148],
        [x + 7, 148],
        [x + 24, 166],
        [x - 24, 166],
      ],
      '#142123',
    );
    c.fillStyle = area === 'studio' ? '#b69b69' : '#649e9d';
    c.fillRect(x - 18, 166, 36, 2);
    c.fillStyle = '#050d0f';
    c.fillRect(x - 24, 168, 48, 3);
    c.fillStyle = '#5c696138';
    for (let i = 0; i < 7; i++) c.fillRect(x - 13 + i * 4, 158 + (i % 2) * 2, 2, 1);
  }
  c.restore();
}

/** Room furnishings sit between the wall and the foreground easels/racks. */
export function drawRoomFurniture(
  c: CanvasRenderingContext2D,
  area: AreaId,
  cam: number,
  plate?: HTMLCanvasElement,
) {
  if (area === 'street') return;
  c.save();
  const anchor = area === 'studio' ? 240 : 440,
    x = anchor - cam * 1.025;
  c.fillStyle = '#08121488';
  c.beginPath();
  c.ellipse(x + 47, 451, 65, 8, 0, 0, Math.PI * 2);
  c.fill();
  if (area === 'studio') {
    polygon(
      c,
      [
        [x, 383],
        [x + 84, 383],
        [x + 99, 394],
        [x + 10, 394],
      ],
      '#4a4536',
    );
    c.fillStyle = '#1e2826';
    c.fillRect(x + 10, 394, 89, 9);
    for (const dx of [15, 87]) {
      c.fillStyle = '#182321';
      c.fillRect(x + dx, 402, 5, 46);
      c.fillStyle = '#4f514044';
      c.fillRect(x + dx, 402, 1, 46);
    }
    if (plate) c.drawImage(plate, 300, 355, 70, 25, x + 11, 382, 69, 8);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = ['#897052', '#546a62', '#7b5146', '#9d8b68'][i];
      c.fillRect(x + 20 + i * 13, 378 - (i % 2) * 3, 9, 5);
    }
  } else {
    polygon(
      c,
      [
        [x, 330],
        [x + 58, 330],
        [x + 72, 341],
        [x + 14, 341],
      ],
      '#344449',
    );
    c.fillStyle = '#142328';
    c.fillRect(x, 330, 58, 108);
    polygon(
      c,
      [
        [x + 58, 330],
        [x + 72, 341],
        [x + 72, 444],
        [x + 58, 438],
      ],
      '#0b171d',
    );
    for (let i = 0; i < 4; i++) {
      c.fillStyle = '#344447';
      c.fillRect(x + 7, 340 + i * 23, 43, 17);
      c.fillStyle = '#132329';
      c.fillRect(x + 9, 342 + i * 23, 39, 13);
      if (plate) {
        c.drawImage(plate, 1110, 158 + i * 45, 86, 36, x + 8, 341 + i * 23, 42, 16);
        c.fillStyle = '#091a1c66';
        c.fillRect(x + 8, 341 + i * 23, 42, 16);
      }
      c.fillStyle = '#76a996';
      c.fillRect(x + 43, 347 + i * 23, 2, 2);
    }
  }
  c.restore();
}
