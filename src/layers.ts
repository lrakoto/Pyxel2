/** The wash that sets the middle-distance city back behind the frontage. */
const MIDGROUND_HAZE = '#14293218';
/** Every facade and rail pier reaches this shared ground behind the pavement. */
export const MIDGROUND_GROUND = 446;

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
    [0, 140, 110],
    [105, 102, 76],
    [188, 156, 130],
    [320, 65, 88],
    [420, 135, 125],
    [554, 90, 96],
    [650, 184, 128],
    [786, 116, 83],
    [880, 43, 94],
    [981, 156, 149],
    [1140, 109, 83],
    [1230, 163, 146],
    [1388, 83, 90],
    [1484, 145, 136],
    [1630, 116, 90],
    [1730, 186, 180],
    [1920, 131, 177],
  ];
  // A continuous embankment closes the sky gaps under the city. Rooflines vary,
  // but the lower floors extend to real ground instead of ending above it.
  c.fillStyle = '#0a171e';
  c.fillRect(0, MIDGROUND_GROUND - 5, canvas.width, canvas.height - MIDGROUND_GROUND + 5);
  buildings.forEach(([x, y, w], i) => {
    const h = MIDGROUND_GROUND - y;
    const facade = i % 2 ? '#10232b' : '#142831';
    c.fillStyle = facade;
    c.fillRect(x, y, w, h);

    // A recessed side stays in shadow; distance should soften the block
    // without removing the distinction between its lit and unlit faces.
    const side = Math.round(w * 0.2);
    c.fillStyle = '#0a1921';
    c.fillRect(x + w - side, y + 3, side, h - 3);

    // Structure: a parapet, a lit right edge, and a darker base course, so
    // each block reads as a solid rather than a flat rectangle.
    c.fillStyle = '#273c45';
    c.fillRect(x, y, w, 3);
    c.fillRect(x + w - side, y + 3, 1, h - 3);
    c.fillStyle = '#0a1920';
    c.fillRect(x, y + h - 14, w, 14);

    // Vertical pilasters between the window bays.
    const bays = Math.max(1, Math.floor(w / 13) - 1);
    c.fillStyle = i % 3 ? '#0c1d25' : '#192f38';
    for (let bay = 0; bay <= bays; bay++) c.fillRect(x + 6 + bay * 13, y + 4, 2, h - 18);

    // Floor slabs every third storey, catching a little light on top.
    for (let band = 1; band * 48 < h - 20; band++) {
      const by = y + band * 48;
      c.fillStyle = '#081820';
      c.fillRect(x + 3, by, w - 6, 3);
      c.fillStyle = '#20353f';
      c.fillRect(x + 3, by, w - 6, 1);
    }

    // Roof clutter: a plant box, a water tank on the taller blocks, a mast.
    c.fillStyle = '#203844';
    c.fillRect(x + 9, y - 10, w * 0.58, 10);
    if (h > 300) {
      const tx = x + w * 0.66;
      c.fillStyle = '#1b333c';
      c.fillRect(tx, y - 22, 22, 12);
      c.fillStyle = '#26424c';
      c.fillRect(tx, y - 23, 22, 2);
      c.fillStyle = '#12262e';
      c.fillRect(tx + 3, y - 10, 3, 10);
      c.fillRect(tx + 15, y - 10, 3, 10);
    }
    c.fillStyle = '#162b34';
    c.fillRect(x + w * 0.48, y - 40, 2, 40);
    c.fillStyle = '#813f36';
    c.fillRect(x + w * 0.48 - 1, y - 41, 4, 2);

    for (let row = 0; row < Math.floor((h - 24) / 16); row++)
      for (let col = 0; col < Math.floor(w / 13) - 1; col++) {
        const hash = (i * 173 + row * 37 + col * 91) % 31;
        c.fillStyle = hash < 3 ? '#9a8050' : hash < 9 ? '#2c4853' : '#091920';
        const wx = x + 8 + col * 13;
        const wy = y + 10 + row * 16;
        c.fillRect(wx, wy, 4, 7);
        // A sill under each pane, and a grime streak below some of them.
        c.fillStyle = '#07151c';
        c.fillRect(wx - 1, wy + 7, 6, 1);
        if (hash % 7 === 0) {
          c.fillStyle = '#0a1b23';
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
    c.fillStyle = '#1c323c';
    c.fillRect(x + 6, y + h - 38, w - 12, 2);

    // A windowless lower course and a broad foot tie each mass to the ground.
    c.fillStyle = '#09171e';
    c.fillRect(x, MIDGROUND_GROUND - 23, w, 23);
    c.fillStyle = '#1d3038';
    c.fillRect(x - 2, MIDGROUND_GROUND - 7, w + 4, 2);
    c.fillStyle = '#071319';
    c.fillRect(x - 4, MIDGROUND_GROUND - 5, w + 8, 7);
  });

  // A separate elevated rail plane stitches the city together.
  c.fillStyle = '#0b1a22';
  c.fillRect(0, 198, 2100, 13);
  c.fillStyle = '#2a414b';
  c.fillRect(0, 195, 2100, 2);
  c.fillRect(0, 208, 2100, 1);
  for (let x = 10; x < 2100; x += 97) {
    c.fillStyle = '#091921';
    c.fillRect(x, 211, 7, MIDGROUND_GROUND - 211);
    c.strokeStyle = '#142b35';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x, 232);
    c.lineTo(x + 55, 212);
    c.stroke();
    c.fillStyle = '#2d454e';
    c.fillRect(x + 3, 211, 1, 150);
    c.fillStyle = '#101f26';
    c.fillRect(x - 4, MIDGROUND_GROUND - 10, 15, 10);
    c.fillStyle = '#061218';
    c.fillRect(x - 7, MIDGROUND_GROUND - 2, 21, 4);
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
