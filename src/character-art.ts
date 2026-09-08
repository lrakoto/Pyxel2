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

type ColePose = { stride?: number; crouch?: number; airborne?: boolean };

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
