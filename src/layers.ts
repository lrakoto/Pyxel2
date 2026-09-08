/** The wash that sets the middle-distance city back behind the frontage. */
const MIDGROUND_HAZE = '#12303c3b';

/** Camera-relative velocities of the four physical planes. */
export const PARALLAX = { skyline: 0.1, midground: 0.34, street: 1, foreground: 1.18 } as const;
export function layerX(x: number, camera: number, factor: number) {
  return Math.round(x - camera * factor);
}
export function reflectionSourceY(surface: number, depth: number, compression = 0.62) {
  return Math.floor(surface - depth / compression);
}

/** A lit window in the middle-distance city, for the bloom and flicker pass. */
export interface Window {
  x: number;
  y: number;
  /** Seeded so each window breathes on its own schedule. */
  seed: number;
}

export interface Midground {
  canvas: HTMLCanvasElement;
  /** Only the lit windows: the dark ones have nothing to bloom. */
  windows: Window[];
}

/**
 * A cached middle-distance city, behind the authored street frontage. The lit
 * windows are reported alongside the plate so the frame loop can bloom and
 * flicker them without re-deriving where they are.
 */
export function buildMidground(): Midground {
  const windows: Window[] = [];
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
    const facade = i % 2 ? '#152c35' : '#19313a';
    c.fillStyle = facade;
    c.fillRect(x, y, w, h);

    // Structure: a parapet, a lit right edge, and a darker base course, so
    // each block reads as a solid rather than a flat rectangle.
    c.fillStyle = '#29414a';
    c.fillRect(x, y, w, 3);
    c.fillRect(x + w - 3, y, 3, h);
    c.fillStyle = '#0f2129';
    c.fillRect(x, y + h - 14, w, 14);

    // Vertical pilasters between the window bays.
    const bays = Math.max(1, Math.floor(w / 13) - 1);
    c.fillStyle = i % 3 ? '#12262e' : '#1c343d';
    for (let bay = 0; bay <= bays; bay++) c.fillRect(x + 6 + bay * 13, y + 4, 2, h - 18);

    // Floor slabs every third storey, catching a little light on top.
    for (let band = 1; band * 48 < h - 20; band++) {
      const by = y + band * 48;
      c.fillStyle = '#0d222a';
      c.fillRect(x + 3, by, w - 6, 3);
      c.fillStyle = '#24404a';
      c.fillRect(x + 3, by, w - 6, 1);
    }

    // Roof clutter: a plant box, a water tank on the taller blocks, a mast.
    c.fillStyle = '#203844';
    c.fillRect(x + 9, y - 10, w * 0.58, 10);
    if (h > 250) {
      const tx = x + w * 0.66;
      c.fillStyle = '#1b333c';
      c.fillRect(tx, y - 22, 22, 12);
      c.fillStyle = '#26424c';
      c.fillRect(tx, y - 23, 22, 2);
      c.fillStyle = '#12262e';
      c.fillRect(tx + 3, y - 10, 3, 8);
      c.fillRect(tx + 15, y - 10, 3, 8);
    }
    c.fillStyle = '#162b34';
    c.fillRect(x + w * 0.48, y - 40, 2, 40);
    c.fillStyle = '#813f36';
    c.fillRect(x + w * 0.48 - 1, y - 41, 4, 2);

    for (let row = 0; row < Math.floor(h / 16); row++)
      for (let col = 0; col < Math.floor(w / 13) - 1; col++) {
        const hash = (i * 173 + row * 37 + col * 91) % 31;
        c.fillStyle = hash < 3 ? '#84744e' : hash < 9 ? '#355963' : '#102731';
        const wx = x + 8 + col * 13;
        const wy = y + 10 + row * 16;
        c.fillRect(wx, wy, 4, 7);
        // A sill under each pane, and a grime streak below some of them.
        c.fillStyle = '#0b1e26';
        c.fillRect(wx - 1, wy + 7, 6, 1);
        if (hash % 7 === 0) {
          c.fillStyle = '#0e232b';
          c.fillRect(wx, wy + 8, 4, 6);
        }
        if (hash < 3)
          windows.push({
            x: wx + 2,
            y: wy + 3,
            seed: (i * 71 + row * 13 + col * 29) % 997,
          });
      }

    // A service riser down the facade, and the ledge that breaks it.
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
  // Distance haze is baked into the plane rather than applied by compositing it
  // at reduced alpha: a translucent midground lets the skyline read straight
  // through the buildings and the elevated rail. 'source-atop' washes only the
  // pixels already painted, so the gaps between buildings stay open sky.
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = MIDGROUND_HAZE;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.globalCompositeOperation = 'source-over';
  return { canvas, windows };
}
