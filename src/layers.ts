/** Camera-relative velocities of the four physical planes. */
export const PARALLAX = { skyline: 0.1, midground: 0.34, street: 1, foreground: 1.18 } as const;
export function layerX(x: number, camera: number, factor: number) {
  return Math.round(x - camera * factor);
}
export function reflectionSourceY(surface: number, depth: number, compression = 0.62) {
  return Math.floor(surface - depth / compression);
}

/** A cached middle-distance city, behind the authored street frontage. */
export function buildMidground(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2100;
  canvas.height = 540;
  const c = canvas.getContext('2d')!;
  const buildings = [
    [0, 140, 110, 240],
    [105, 102, 76, 290],
    [188, 156, 130, 230],
    [320, 65, 88, 310],
    [420, 135, 125, 265],
    [554, 90, 96, 300],
    [650, 184, 128, 195],
    [786, 116, 83, 270],
    [880, 43, 94, 340],
    [981, 156, 149, 235],
    [1140, 109, 83, 280],
    [1230, 163, 146, 230],
    [1388, 83, 90, 310],
    [1484, 145, 136, 250],
    [1630, 116, 90, 275],
    [1730, 186, 180, 205],
    [1920, 131, 177, 260],
  ];
  buildings.forEach(([x, y, w, h], i) => {
    c.fillStyle = i % 2 ? '#152c35' : '#19313a';
    c.fillRect(x, y, w, h);
    c.fillStyle = '#29414a';
    c.fillRect(x, y, w, 3);
    c.fillRect(x + w - 3, y, 3, h);
    c.fillStyle = '#203844';
    c.fillRect(x + 9, y - 10, w * 0.58, 10);
    c.fillStyle = '#162b34';
    c.fillRect(x + w * 0.48, y - 40, 2, 40);
    c.fillStyle = '#813f36';
    c.fillRect(x + w * 0.48 - 1, y - 41, 4, 2);
    for (let row = 0; row < Math.floor(h / 16); row++)
      for (let col = 0; col < Math.floor(w / 13) - 1; col++) {
        const hash = (i * 173 + row * 37 + col * 91) % 31;
        c.fillStyle = hash < 3 ? '#84744e' : hash < 9 ? '#355963' : '#102731';
        c.fillRect(x + 8 + col * 13, y + 10 + row * 16, 4, 7);
      }
    c.fillStyle = '#0d242dcc';
    c.fillRect(x + w * 0.35, y + 50, 3, h - 50);
    c.fillStyle = '#223c46';
    c.fillRect(x + 6, y + h - 38, w - 12, 2);
  });
  // A separate elevated rail plane stitches the city together.
  c.fillStyle = '#12262e';
  c.fillRect(0, 198, 2100, 13);
  c.fillStyle = '#32505a';
  c.fillRect(0, 195, 2100, 2);
  c.fillRect(0, 208, 2100, 1);
  for (let x = 10; x < 2100; x += 97) {
    c.fillStyle = '#0d232b';
    c.fillRect(x, 211, 7, 215);
    c.strokeStyle = '#18343e';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x, 232);
    c.lineTo(x + 55, 212);
    c.stroke();
    c.fillStyle = '#44606a';
    c.fillRect(x + 3, 211, 1, 150);
  }
  return canvas;
}
