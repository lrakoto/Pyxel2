// Character pixel designs adapted from the original Pyxel prototype.
// Canvas frames are cached once; the rendering and animation runtime is new.
function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx);
  return canvas;
}

/**
 * High-resolution procedural sprite frames. This module is the stand-in art
 * layer for the Aseprite pipeline: it draws each character at the detail
 * level we expect from real imports, so the switch to compiled .aseprite
 * sheets is a content drop, not a code change.
 *
 * Sprites are authored as string rows ('.' = transparent), built once via a
 * helper so width mismatches can't silently shift a silhouette. Palette
 * definitions stay as close to the legacy 14x28 originals as possible so the
 * rim shader, scarf anchor, and lighting relationships survive the upgrade.
 */

/** Turns row strings into a canvas texture, asserting uniform width. */
export function framesFromRows(
  w: number,
  rows: string[][],
  palette: Record<string, string>,
): HTMLCanvasElement[] {
  for (const [i, frame] of rows.entries()) {
    if (frame.some((r) => r.length !== w)) {
      throw new Error(`sprite frame ${i} has a row that isn't ${w}px wide`);
    }
  }
  return rows.map((frame) => spriteFromRows(frame, palette));
}

function spriteFromRows(rows: string[], palette: Record<string, string>): HTMLCanvasElement {
  return canvasTexture(rows[0].length, rows.length, (ctx) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const color = palette[ch];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  });
}

/* ------------------------------------------------------------------ */
/* Cole: 32x64. Tall cinematic side-profile, facing right.             */
/*                                                                     */
/* Vertical layout (texels):                                           */
/*   hat crown   4-10   (tapered; rows 0-3 are padding)                */
/*   hat brim    11-14  (wide, dips at the front over the eyes)        */
/*   face/skin   14-20  (mostly brim shadow; nose and jaw catch light) */
/*   scarf       18-33  (bulked wrap + a short front drape; the verlet */
/*                       tail continues from the neck anchor at ~23)   */
/*   coat        21-48  (lapel, shoulders, waist, knee-length hem)     */
/*   legs/boots  46-63  (frame-specific)                               */
/*                                                                     */
/* Proportions follow the reference sheet: a small head under a wide   */
/* brim, a long charcoal coat to the knee, and the red scarf as the    */
/* single element that reads at any distance.                          */
/* ------------------------------------------------------------------ */

export const COLE_W = 32;
export const COLE_H = 64;

export const COLE_PALETTE: Record<string, string> = {
  H: '#0e1013', // hat crown
  h: '#191c21', // hat brim (top face)
  b: '#07090b', // hat band and brim underside
  S: '#6b4a38', // skin
  f: '#3d2a20', // face in brim shadow
  d: '#241812', // hair, deepest facial shadow
  G: '#d92b23', // scarf, lit
  G2: '#b01f1c', // scarf, mid fold
  G3: '#7d1512', // scarf, deep fold
  C: '#3a3f47', // coat, lit upper
  D: '#22262c', // coat, shadowed
  E: '#171a1f', // coat, darkest panel and inner lining
  L: '#4d545e', // coat highlight (shoulder, lapel edge)
  N: '#62788a', // rain-caught edge
  P: '#1b1e23', // trousers
  P2: '#262a30', // trouser highlight
  B: '#0e1013', // boots and gloves
};

type ColePose = {
  stride?: number;
  crouch?: number;
  airborne?: boolean;
  gesture?: number;
  turn?: boolean;
  detail?: boolean;
};

/**
 * Fresh 32x64 Cole art: every pose is drawn independently at native pixel
 * size. Draw order is the character's own layering, back to front — legs,
 * coat over the thighs, head over the collar, hat over the head, and the
 * scarf last so its drape reads on top of the coat rather than behind it.
 */
function makeColeFrame({
  stride = 0,
  crouch = 0,
  airborne = false,
  gesture = 0,
  turn = false,
  detail = false,
}: ColePose = {}): HTMLCanvasElement {
  const K = COLE_PALETTE;
  return canvasTexture(COLE_W, COLE_H, (ctx) => {
    const rect = (color: string, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y + crouch), w, h);
    };
    const poly = (color: string, pts: [number, number][]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + crouch) : ctx.moveTo(x, y + crouch)));
      ctx.closePath();
      ctx.fill();
    };

    // --- Legs, drawn first so the coat hem falls over the thighs ------
    const front = Math.round(stride * 5);
    const back = Math.round(-stride * 4);
    const legTop = airborne ? 44 : 43;
    poly(K.P, [
      [11, legTop],
      [15, legTop],
      [13 + back, 53],
      [12 + back, 60],
      [9 + back, 60],
      [10, 52],
    ]);
    rect(K.B, 9 + back, 58, 6, 3);
    rect(K.B, 8 + back, 60, 8, 3);
    poly(K.P2, [
      [15, legTop],
      [19, legTop],
      [20 + front, 53],
      [19 + front, 60],
      [16 + front, 60],
      [16, 52],
    ]);
    rect(K.B, 16 + front, 58, 6, 3);
    rect(K.B, 15 + front, 60, 8, 3);
    rect('#2b323c', 17 + front, 58, 3, 1);

    // --- Coat ---------------------------------------------------------
    // Straight-cut and knee-length. Narrow enough that the legs read
    // below it, with the front panel catching the street light.
    poly(K.E, [
      [9, 22],
      [13, 19],
      [20, 19],
      [24, 22],
      [25, 29],
      [24, 45],
      [9, 45],
      [8, 29],
    ]);
    poly(K.D, [
      [10, 22],
      [14, 20],
      [20, 20],
      [23, 22],
      [24, 29],
      [23, 44],
      [10, 44],
      [9, 29],
    ]);
    poly(K.C, [
      [17, 20],
      [22, 22],
      [24, 29],
      [23, 44],
      [17, 44],
    ]);
    // Lapel edge and shoulder catch.
    poly(K.L, [
      [15, 20],
      [19, 21],
      [17, 30],
      [14, 25],
    ]);
    rect(K.L, 21, 23, 2, 5);
    // Front opening, belt and hem shadow.
    rect(K.E, 17, 30, 1, 15);
    rect(K.b, 11, 33, 12, 1);
    rect(K.b, 10, 43, 14, 2);

    // --- Head ---------------------------------------------------------
    // A real profile: nape, brow in brim shadow, a lit cheek, and a nose
    // that breaks the silhouette so he reads facing his direction.
    rect(K.d, 13, 13, 4, 9);
    rect(K.f, 16, 13, 7, 9);
    rect(K.d, 16, 13, 7, 3);
    rect(K.S, 18, 16, 5, 4);
    rect('#7d5843', 19, 17, 3, 2);
    rect(K.S, 22, 16, 2, 3);
    rect(K.S, 23, 17, 1, 2);
    rect(K.f, 17, 20, 5, 2);
    rect(K.d, 16, 19, 2, 1);

    // --- Wide-brim fedora ---------------------------------------------
    // The brim is what reads at a distance: wider than the shoulders,
    // dipping at the front so the eyes stay buried.
    rect(K.H, 15, 5, 5, 1);
    rect(K.H, 14, 6, 7, 1);
    rect(K.H, 13, 7, 9, 3);
    rect(K.b, 13, 10, 10, 1);
    rect(K.h, 8, 11, 17, 2);
    rect(K.h, 21, 12, 5, 1);
    rect(K.b, 9, 13, 16, 1);
    rect(K.N, 20, 6, 1, 4);

    // --- Scarf ---------------------------------------------------------
    // Bulked around the neck and over the jaw, then draped down the coat
    // front. The simulated cloth tail continues from the same anchor.
    // The wrap stays inside the coat's shoulders, and the drape is kept
    // short: the simulated tail hangs from the same anchor, and a wide
    // static drape on top of it turns the whole figure into a red slab.
    poly(K.G3, [
      [14, 19],
      [23, 19],
      [24, 23],
      [21, 26],
      [15, 25],
      [13, 22],
    ]);
    poly(K.G, [
      [15, 20],
      [22, 20],
      [23, 23],
      [20, 25],
      [16, 24],
      [14, 22],
    ]);
    rect(K.G2, 16, 22, 6, 1);
    rect(K.G2, 17, 21, 3, 1);
    // The drape, on top of the coat.
    poly(K.G, [
      [19, 25],
      [22, 25],
      [22, 30],
      [21, 34],
      [19, 34],
    ]);
    rect(K.G3, 21, 26, 1, 8);
    rect(K.G2, 19, 29, 2, 1);

    // --- Arm ------------------------------------------------------------
    // Counter-swings with the stride; the glove stays a separate block so
    // it doesn't read as a hole in the coat.
    const arm = Math.round(stride * 2);
    poly(K.D, [
      [21, 23],
      [24, 26],
      [24 - arm, 36],
      [21 - arm, 35],
      [20, 27],
    ]);
    rect(K.E, 21 - arm, 34, 3, 2);
    rect(K.B, 21 - arm, 36, 4, 4);
    if (detail) {
      // Native-pixel tailoring: collar seam, pocket, rain edges and boot welt.
      rect('#7c858b', 13, 24, 1, 5);
      rect('#24292e', 11, 28, 4, 1);
      rect('#525e65', 11, 29, 3, 1);
      rect('#9f7957', 18, 33, 2, 1);
      rect('#69747b', 10, 39, 1, 3);
      rect('#343d46', 16 + front, 62, 7, 1);
      rect('#ac8060', 22, 18, 1, 1);
      // Lapel, double-stitched cuff, brass fasteners and broken rain highlights.
      rect('#899096', 12, 24, 1, 3);
      rect('#4c555c', 15, 27, 1, 13);
      rect('#242a30', 16, 28, 1, 12);
      rect('#b39b71', 17, 30, 1, 1);
      rect('#927d60', 17, 36, 1, 1);
      rect('#6a777b', 22 - arm, 33, 2, 1);
      rect('#7e8e91', 11, 32, 1, 2);
      rect('#606e75', 12, 36, 1, 1);
      rect('#a08169', 22, 19, 2, 1);
      rect('#3c3331', 21, 20, 2, 1);
      // A broken hat highlight, shaded cheek, rain-worn sleeve and moving coat vents.
      rect('#555c60', 15, 6, 3, 1);
      rect('#343b41', 10, 11, 12, 1);
      rect('#9b785c', 21, 17, 2, 2);
      rect('#24272b', 19, 16, 5, 1);
      rect('#809a98', 22, 16, 1, 1);
      rect('#544132', 23, 19, 1, 1);
      poly('#343e45', [
        [11, 32],
        [14, 34],
        [14, 43],
        [10 + Math.round(stride), 44],
      ]);
      poly('#121c24', [
        [17, 35],
        [19, 37],
        [21 + Math.round(stride * 2), 44],
        [17, 43],
      ]);
      rect('#677175', 12, 41, 2, 1);
      rect('#435059', 19, 40, 1, 2);
      rect('#667179', 10 + back, 57, 1, 2);
      rect('#39444d', 18 + front, 57, 1, 3);
      rect('#5a646a', 22 - arm, 36, 2, 1);
    }
    if (gesture) {
      // A bent elbow and small cyan notebook. The final frame is held while reading.
      rect(K.D, 21, 32, 5, 9);
      poly(K.L, [
        [21, 27],
        [24, 28],
        [26, 33 - gesture],
        [29, 31 - gesture],
        [30, 34 - gesture],
        [25, 37 - gesture],
        [21, 33],
      ]);
      rect(K.B, 27, 31 - gesture, 4, 3);
      rect('#121e25', 26, 27 - gesture, 5, 5);
      rect('#8db9b6', 27, 28 - gesture, 3, 3);
      rect('#cee3cf', 27, 28 - gesture, 2, 1);
    }
    if (turn) {
      rect(K.H, 21, 7, 2, 4);
      rect(K.f, 16, 15, 8, 6);
      rect(K.S, 17, 17, 2, 3);
      rect('#846249', 21, 17, 2, 3);
      rect(K.b, 16, 16, 7, 1);
      rect(K.G2, 14, 22, 8, 2);
    }
  });
}

export const COLE_FRAMES: {
  idle: HTMLCanvasElement[];
  walk: HTMLCanvasElement[];
  jump: HTMLCanvasElement[];
} = {
  idle: [makeColeFrame()],
  walk: [-1, -0.62, -0.18, 0.18, 0.62, 1].map((stride) => makeColeFrame({ stride })),
  jump: [
    makeColeFrame({ stride: 0.45, airborne: true }),
    makeColeFrame({ stride: 0.15, crouch: 1 }),
  ],
};

/** Additional hand-authored exploration frames; original combat frames stay intact. */
export const COLE_STORY_FRAMES: Record<string, HTMLCanvasElement[]> = {
  breathe: [0, 0, 1, 1, 0, 0].map((crouch) => makeColeFrame({ crouch, detail: true })),
  stride: [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7].map((stride) =>
    makeColeFrame({ stride, detail: true }),
  ),
  turn: [makeColeFrame({ turn: true, detail: true }), makeColeFrame({ detail: true })],
  examine: [0, 1, 2, 3].map((gesture) => makeColeFrame({ gesture, detail: true })),
  listen: [0, 0, 1, 0].map((crouch) => makeColeFrame({ crouch, detail: true })),
};

/** Mirrors each row left-to-right (used by the compact NPC fallback art). */
function mirrorRows(rows: string[]): string[] {
  return rows.map((r) => [...r].reverse().join(''));
}

/* ------------------------------------------------------------------ */
/* Sector 7 Enforcer: 24×30. Armoured, heavy-visor ground unit.         */
/*                                                                      */
/*   helmet   2–9    (dome + visor slit)                                */
/*   jacket   10–27  (plates, chest emblem, armoured skirt)             */
/*   legs     28–29  (frame-specific) + boots                           */
/* ------------------------------------------------------------------ */

export const ENFORCER_W = 24;
export const ENFORCER_H = 30;

export const ENFORCER_PALETTE: Record<string, string> = {
  M: '#3a4250', // helmet / armour plate
  A: '#667180', // hard armour edge
  m: '#2a3140', // plate shade
  V: '#ff3b46', // visor glow
  J: '#262b35', // jacket
  j: '#161a21', // jacket shadow
  K: '#1c212b', // knee / joint
  B: '#0e1014', // boots
};

const ENFORCER_BODY = [
  '........MMMMMMMM........', // 0
  '.......MMMMMMMMM........', // 1  dome top
  '......AMMMMMMMMA........', // 2
  '......MMMMMMMMMM........', // 3
  '......MMMMMMMMMM........', // 4
  '......VVVVVVVVVV........', // 5  visor slit glows
  '......MMMMMMMMMM........', // 6
  '.......MMMMMMMM.........', // 7
  '........MMMMMM..........', // 8  chin guard
  '.......JJJJJJJJ.........', // 9  collar
  '......JJJJJJJJJJ........', // 10 shoulders
  '.....JJJJJJJJJJJ........', // 11
  '....AJJJJJJJJJJA........', // 12 pauldron edges
  '....JJJJJJJJJJJJ........', // 13
  '....JJjJJJJJJjJJ........', // 14 chest plate seam
  '....JJjJJJJJJjJJ........', // 15
  '....JJjJJJJJJjJJ........', // 16
  '....JJJJJJJJJJJJ........', // 17
  '....JJJJJJJJJJJJ........', // 18
  '....JJJJJJJJJJJJ........', // 19
  '....JJJJJJJJJJJJ........', // 20
  '....JJJJJJJJJJJJ........', // 21 mid torso
  '....JJJJJJJJJJJJ........', // 22
  '.....JJJJJJJJJJ.........', // 23 armoured skirt
  '.....JJJJJJJJJJ.........', // 24
  '.....JJJJJJJJJJ.........', // 25
  '......JJJJJJJJ..........', // 26
  '......JJJJJJJJ..........', // 27 hem
];

const ENFORCER_LEGS_STEP_A = [
  '....KKK....KKK..........', // 28
  '...BBB......BBB.........', // 29
];

const ENFORCER_LEGS_STEP_B = [
  '.....KKKKKKK............', // 28
  '....BBBBBBBB............', // 29
];

export const ENFORCER_FRAMES: { walk: HTMLCanvasElement[] } = {
  walk: framesFromRows(
    ENFORCER_W,
    [
      [...ENFORCER_BODY, ...ENFORCER_LEGS_STEP_A],
      [...ENFORCER_BODY, ...ENFORCER_LEGS_STEP_B],
      [...ENFORCER_BODY, ...mirrorRows(ENFORCER_LEGS_STEP_A)],
      [...ENFORCER_BODY, ...ENFORCER_LEGS_STEP_B],
    ],
    ENFORCER_PALETTE,
  ),
};

/* ------------------------------------------------------------------ */
/* Aerial drone: 16×10. Hover body, rotor blur, sensor eye.             */
/* ------------------------------------------------------------------ */

export const DRONE_W = 16;
export const DRONE_H = 10;

export const DRONE_PALETTE: Record<string, string> = {
  M: '#4a5360', // rotor blur
  D: '#2b313c', // hull
  d: '#161a21', // hull shadow
  V: '#36e0ff', // sensor eye
  R: '#ff3548', // hostile sensor core
};

const DRONE_BODY = [
  '.M...M....M...M.', // 0 rotor tips
  '..MM........MM..', // 1 rotor blur
  '...dDDDDDDd.....', // 2 top hull
  '..dDDDDDDDDd....', // 3
  '..DDDDDDDDDD....', // 4
  '..DDVVRVVVDD....', // 5 sensor eye band + red lock core
  '..dDDDDDDDDd....', // 6
  '...dDDDDDDd.....', // 7
  '....dDDDDd......', // 8 belly
  '.....d..d.......', // 9 landing skids
];

export const DRONE_FRAMES: { hover: HTMLCanvasElement[] } = {
  // Two hover frames: the rotor blur alternates which diagonal it biases, so
  // the eye reads as a fast spin even at 2 fps.
  hover: framesFromRows(DRONE_W, [DRONE_BODY, droneRotorFrame(true)], DRONE_PALETTE),
};

/** A second hover frame with the rotor blur drawn on the opposite diagonal. */
function droneRotorFrame(_alt: boolean): string[] {
  return [
    'M.....M..M....M.', // 0 rotor tips, shifted
    '..M........MM...', // 1 blur
    '...dDDDDDDd.....',
    '..dDDDDDDDDd....',
    '..DDDDDDDDDD....',
    '..DDVVRVVVDD....',
    '..dDDDDDDDDd....',
    '...dDDDDDDd.....',
    '....dDDDDd......',
    '.....d..d.......',
  ];
}

/* ------------------------------------------------------------------ */
/* Street pedestrians: 16 wide, 28 tall. Two cut silhouettes that stroll */
/* the sidewalk — a coat walker and a hood walker. 4-phase walk legs.    */
/* ------------------------------------------------------------------ */

export const PED_W = 16;
export const PED_H = 28;

/**
 * Ped palettes are per-instance (rain-slicked tones); rows use a fixed key
 * set that the caller maps to a chosen tone. 'k' is the coat/hood fill, 'f'
 * the sliver of face at the collar.
 */
/** The colour of the night air a block back, used to bake in distance haze. */
export const NIGHT_AIR = '#1a2a30';

/** How far the background walkers and their umbrellas sit into that air. */
export const PED_HAZE = 0.62;

/** Blends `hex` toward `air`; t=0 keeps the colour, t=1 returns the air. */
export function mixHex(hex: string, air: string, t: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r, g, b] = parse(hex);
  const [ar, ag, ab] = parse(air);
  const channel = (c: number, a: number) =>
    Math.round(c * (1 - t) + a * t)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r, ar)}${channel(g, ag)}${channel(b, ab)}`;
}

export function pedPalette(coat: string, face = '#caa07c'): Record<string, string> {
  return {
    H: '#15191f',
    k: coat,
    // The coat's shaded side. Without it the silhouette is a flat slab.
    j: mixHex(coat, '#000000', 0.42),
    f: face,
    P: '#1b1f25',
    B: '#0d0f13',
  };
}

/*
 * The coat has to end in a hem wide enough to sit over both legs. An earlier
 * cut tapered to two pixels at the waist while the legs started four pixels
 * apart, so the walker read as a cape hung over a disconnected pair of legs.
 * The torso now keeps its mass down to a flared skirt, and the legs start
 * directly under it.
 */
const PED_COAT_BODY = [
  '.....HHHH.......', // 0  hat crown
  '....HHHHHH......', // 1  brim
  '.....jkkf.......', // 2  collar + face sliver
  '....jkkkkk......', // 3  shoulders
  '...jkkkkkkk.....', // 4
  '...jkkkkkkk.....', // 5
  '...jkkkkkkk.....', // 6
  '...jkkkkkkk.....', // 7  chest
  '...jkkkkkk......', // 8  taper to the waist
  '...jkkkkkk......', // 9
  '...jkkkkkk......', // 10
  '...jkkkkkk......', // 11 waist
  '..jkkkkkkk......', // 12 skirt flares
  '..jkkkkkkkk.....', // 13
  '..jkkkkkkkk.....', // 14
  '..jkkkkkkkk.....', // 15
  '..jkkkkkkkk.....', // 16
  '..jkkkkkkkk.....', // 17
  '..jkkkkkkkk.....', // 18 hem
  '..BBBBBBBBB.....', // 19 hem underside
];

const PED_HOOD_BODY = [
  '.....kkkk.......', // 0  hood crown
  '....jkkkkk......', // 1
  '....jkkkfk......', // 2  hood opening + face
  '...jkkkkkkk.....', // 3  shoulders
  '...jkkkkkkk.....', // 4
  '...jkkkkkkk.....', // 5
  '...jkkkkkk......', // 6
  '...jkkkkkk......', // 7
  '...jkkkkkk......', // 8
  '...jkkkkkk......', // 9
  '...jkkkkkk......', // 10
  '..jkkkkkkk......', // 11
  '..jkkkkkkkk.....', // 12
  '..jkkkkkkkk.....', // 13
  '..jkkkkkkkk.....', // 14
  '..jkkkkkkkk.....', // 15
  '..jkkkkkkkk.....', // 16
  '..jkkkkkkkk.....', // 17
  '..jkkkkkkkk.....', // 18
  '..BBBBBBBBB.....', // 19
];

/* Legs run to the bottom row, so the walker's feet meet its contact shadow. */
const PED_LEGS_A = [
  '...PP...PP......', // 20
  '...PP...PP......',
  '...PP...PP......',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '..PP.....PP.....',
  '.BBB.....BBB....',
  '.BBB.....BBB....', // 27
];

const PED_LEGS_B = [
  '....PP.PP.......', // 20
  '....PP.PP.......',
  '....PP.PP.......',
  '....PP..PP......',
  '...PP...PP......',
  '...PP....PP.....',
  '..BBB....BBB....',
  '..BBB....BBB....', // 27
];

/** Pads the body block (rows 0–19) with an 8-row leg pose to reach 28 rows. */
function pedRows(body: string[], legs: string[]): string[] {
  return [...body.slice(0, 20), ...legs];
}

/**
 * Background walkers. `haze` bakes the distance wash into the palette instead
 * of drawing the sprite at reduced alpha, which would let the storefronts
 * behind them show straight through the figure.
 */
export function makePedFrames(
  kind: 'coat' | 'hood',
  coatTone: string,
  haze = 0,
): HTMLCanvasElement[] {
  const body = kind === 'coat' ? PED_COAT_BODY : PED_HOOD_BODY;
  const base = pedPalette(coatTone);
  const pal = Object.fromEntries(
    Object.entries(base).map(([key, color]) => [key, mixHex(color, NIGHT_AIR, haze)]),
  );
  return framesFromRows(
    PED_W,
    [
      pedRows(body, PED_LEGS_A),
      pedRows(body, PED_LEGS_B),
      pedRows(body, mirrorRows(PED_LEGS_A)),
      pedRows(body, PED_LEGS_B),
    ],
    pal,
  );
}

/* ------------------------------------------------------------------ */
/* Lyra: 16×32. Hooded AI silhouette with a cyan face-glow.             */
/*                                                                     */
/* She is a humanoid AI who has been watching Cole; her face is a soft   */
/* cyan light set deep in a dark hood — the inhuman tell. A single idle */
/* frame with a subtle two-stage glow flicker (handled by the caller via*/
/* emissive intensity), no walk cycle yet (she is met standing still).   */
/* ------------------------------------------------------------------ */

export const LYRA_W = 16;
export const LYRA_H = 32;

export const LYRA_PALETTE: Record<string, string> = {
  c: '#0a0e14', // cloak fill (near-black blue)
  C: '#141a24', // cloak rim (slightly lighter edge)
  g: '#7fe9ff', // face glow (cyan)
  G: '#bff5ff', // face glow core (brighter)
  h: '#2a3a4a', // hood inner shadow
  s: '#1a2230', // cloak seam
  m: '#562044', // restrained magenta cloak lining
  B: '#0d1218', // boots
};

// The hand-shaped hood/cloak rows intentionally vary by a pixel at the right
// edge; normalize that transparent padding before the strict frame validator.
const LYRA_IDLE = [
  '......cccc......', // 0 hood apex
  '.....cC CCc.....', // 1
  '....cC   Cc....', // 2
  '...cC     Cc...', // 3
  '..cC  GGGG  Cc.', // 4 face glow band (eyes)
  '..cC  gggg  Cc.', // 5
  '..cChhGGGGhhCc.', // 6 cheeks/jaw glow
  '..cChhgggghhCc.', // 7
  '...cChhhhhCc...', // 8 chin
  '....cCCCCc....', // 9 hood lip
  '...cccccccc....', // 10 shoulders yoke
  '..ccssssssscc..', // 11 cloak shoulders
  '..cssssssssc...', // 12
  '.csssssssssc...', // 13
  '.cssssssssmc...', // 14
  '.cssssssssmc...', // 15
  '.csssssssssc...', // 16
  '.csssssssssc...', // 17
  '.cssssssssc....', // 18
  '.cssssssssc....', // 19
  '.csssssssmc....', // 20
  '..cssssssc.....', // 21
  '..cssssssc.....', // 22
  '..cssssssc.....', // 23
  '..csss.sssc....', // 24 split before legs
  '..css...ssc....', // 25
  '..css...ssc....', // 26
  '..c.....cc.....', // 27 legs
  '..c.....cc.....', // 28
  '.cc.....ccc....', // 29
  '.cc.....ccc....', // 30
  '.BB.....BBB....', // 31 feet
].map((row) => row.padEnd(LYRA_W, '.'));

export function makeLyraFrame(): HTMLCanvasElement {
  return framesFromRows(LYRA_W, [LYRA_IDLE], LYRA_PALETTE)[0];
}

/** Lyra's own holographic avatar: cropped hair, a high-collar suit and memory traces. */
function lyraPortrait(phase: number, talking: boolean): HTMLCanvasElement {
  return canvasTexture(32, 64, (c) => {
    const r = (color: string, x: number, y: number, w: number, h: number) => {
      c.fillStyle = color;
      c.fillRect(x, y, w, h);
    };
    const p = (color: string, points: number[][]) => {
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.fill();
    };
    // An asymmetric stance and structured clothing keep the silhouette human.
    p('#326b9a', [
      [10, 37],
      [16, 37],
      [15, 49],
      [13, 60],
      [8, 60],
      [10, 49],
    ]);
    p('#447fad', [
      [17, 37],
      [23, 37],
      [22, 49],
      [24, 60],
      [19, 60],
      [17, 48],
    ]);
    r('#77bdd5', 10, 43, 1, 13);
    r('#71acd1', 21, 44, 1, 12);
    r('#336d9a', 7, 60, 7, 3);
    r('#3d7da9', 19, 60, 8, 3);
    r('#9bdbdf', 7, 62, 7, 1);
    r('#84c7e0', 20, 62, 7, 1);
    p('#3476a4', [
      [10, 20],
      [21, 20],
      [24, 25],
      [21, 33],
      [23, 41],
      [17, 43],
      [10, 41],
      [12, 33],
      [8, 25],
    ]);
    p('#5a9bc3', [
      [12, 22],
      [17, 24],
      [16, 33],
      [18, 40],
      [12, 40],
      [13, 32],
    ]);
    p('#275780', [
      [19, 23],
      [22, 24],
      [20, 33],
      [22, 39],
      [19, 40],
      [17, 32],
    ]);
    r('#99ccdc', 12, 20, 8, 2);
    r('#29466a', 12, 22, 8, 1);
    r('#284d78', 11, 35, 11, 2);
    r('#b1e2e1', 15, 35, 2, 1);
    // A small split peplum gives Lyra a recognisable, non-military outline.
    p('#4777a7', [
      [11, 36],
      [15, 38],
      [13, 45],
      [8, 44],
    ]);
    p('#666fa8', [
      [19, 37],
      [22, 36],
      [25, 44],
      [20, 46],
    ]);
    r('#a095cc', 23, 41, 1, 3);
    const hand = talking ? [0, 2, 3, 1][phase] : 0;
    p('#478db4', [
      [9, 22],
      [7, 24],
      [5, 35],
      [7, 43],
      [10, 42],
      [8, 34],
      [11, 27],
    ]);
    r('#a5d9df', 7, 41, 3, 4);
    p('#4d91ba', [
      [22, 23],
      [25, 26],
      [25, 34 - hand],
      [29, 31 - hand],
      [30, 34 - hand],
      [25, 39],
      [21, 31],
    ]);
    r('#b8e6e3', 27, 31 - hand, 4, 3);
    r('#6baacb', 29, 29 - hand, 1, 2);
    // Short swept hair frames an uncovered face rather than a glowing hood.
    r('#4376a5', 14, 16, 5, 5);
    p('#6caacf', [
      [11, 8],
      [18, 6],
      [22, 10],
      [21, 17],
      [17, 20],
      [12, 17],
    ]);
    p('#abdadd', [
      [15, 9],
      [20, 10],
      [20, 16],
      [17, 18],
      [14, 16],
    ]);
    p('#2b426c', [
      [8, 8],
      [11, 4],
      [18, 3],
      [23, 7],
      [23, 16],
      [21, 17],
      [20, 10],
      [16, 8],
      [12, 11],
      [11, 18],
      [8, 16],
    ]);
    p('#526da3', [
      [9, 8],
      [12, 5],
      [18, 4],
      [21, 7],
      [15, 6],
      [11, 10],
      [10, 15],
      [9, 15],
    ]);
    r('#8793c4', 12, 5, 5, 1);
    r('#48729a', 21, 10, 1, 5);
    r('#294f78', 13, 12, 2, 1);
    r('#294f78', 18, 12, 2, 1);
    r('#d8f7ee', 14, 12, 1, 1);
    r('#d8f7ee', 19, 12, 1, 1);
    r('#78b9cf', 17, 13, 1, 2);
    r('#447897', 16, 16, 3, 1);
    if (talking && phase === 2) r('#315d7c', 16, 16, 2, 2);
    // Data travels inside the silhouette; no full-frame flicker or missing face.
    c.save();
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 18; i++) {
      const x = 7 + ((i * 7) % 18),
        y = 23 + ((i * 11 + phase * 2) % 36);
      r(i % 3 === 0 ? '#b8cae0' : '#a0e3e0', x, y, i % 4 === 0 ? 3 : 1, 1);
    }
    c.globalAlpha = 0.11;
    for (let y = 6 + (phase % 2); y < 63; y += 3) r('#c4f3f0', 5, y, 26, 1);
    c.restore();
  });
}
export const LYRA_STORY_FRAMES: Record<string, HTMLCanvasElement[]> = {
  idle: [0, 1, 2, 3].map((phase) => lyraPortrait(phase, false)),
  listen: [0, 1, 2, 3].map((phase) => lyraPortrait(phase, true)),
};
