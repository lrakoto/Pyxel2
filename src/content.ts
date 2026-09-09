import type { AreaWater } from './water.ts';
export type AreaId = 'street' | 'studio' | 'den';
export type ClueId =
  | 'camera'
  | 'lock'
  | 'diary'
  | 'painting'
  | 'portrait'
  | 'residue'
  | 'device'
  | 'writing'
  | 'fragment';
export type DeductionId = 'harvest' | 'voices' | 'first';
export interface Clue {
  id: ClueId;
  title: string;
  category: string;
  body: string;
  observation: string;
  glyph: string;
}
export const CLUES: Record<ClueId, Clue> = {
  camera: {
    id: 'camera',
    title: 'Eleven missing minutes',
    category: 'SURVEILLANCE',
    glyph: '▥',
    body: 'The street camera lost eleven minutes at 02:14. Every other camera in Sector 7 kept recording. Someone made a private appointment with Marlon.',
    observation:
      'Eleven minutes missing. The rain never stopped. Neither did the camera across the road. Someone only needed this doorway to disappear.',
  },
  lock: {
    id: 'lock',
    title: 'A professional entry',
    category: 'PHYSICAL TRACE',
    glyph: '⌑',
    body: 'The studio lock was picked; its hinges were freshly oiled. No forced entry. Whoever came here wanted a quiet extraction.',
    observation:
      'No splinters. No broken bolt. Just fresh oil on an old hinge. They came in quietly. That takes preparation.',
  },
  diary: {
    id: 'diary',
    title: 'The voices in the work',
    category: 'PERSONAL RECORD',
    glyph: '≋',
    body: '“They don’t know I can hear them. The fragments. They’re here. In the work. In ME.” Marlon was trying to paint out the minds he could hear.',
    observation:
      '“The fragments. They’re not gone. They’re in the work. In me.” He wasn’t losing his mind. He was finding other people’s.',
  },
  painting: {
    id: 'painting',
    title: 'Everybody / Nobody',
    category: 'NEURAL ART',
    glyph: '◈',
    body: 'A thousand fragmented faces, painted in distinct styles. Each contains the same tiny neural signature. The painting holds a multitude of minds.',
    observation:
      'A thousand faces. A thousand ways of seeing. But the same little mark in every eye. This isn’t a portrait. It’s a record.',
  },
  portrait: {
    id: 'portrait',
    title: 'The unfinished woman',
    category: 'NEURAL ART',
    glyph: '◐',
    body: 'A woman dissolving into light. “001” is scratched into the lower frame. The earliest canvas in the room; her eyes are still unmistakably human.',
    observation:
      'He painted her before all the others. Number one. Most of the face is gone, but he kept the eyes. He wanted someone to recognize her.',
  },
  residue: {
    id: 'residue',
    title: 'The iridescent trace',
    category: 'BIOLOGICAL TRACE',
    glyph: '⌁',
    body: 'An iridescent film beneath the body outline. Its conductive polymer matches the material inside the neural receiver. It flowed out of Marlon.',
    observation:
      'The body’s gone. Something stayed behind. Oil on water, only it follows the light. Whatever leaked from him wasn’t supposed to leave a human being.',
  },
  device: {
    id: 'device',
    title: 'An extraction, still running',
    category: 'NEURAL HARDWARE',
    glyph: '⌘',
    body: 'An illegal neural receiver, locked in outbound mode. It pulls creative patterns out; it cannot restore them. The extraction continued after Marlon died.',
    observation:
      'Outbound only. No return channel. This machine wasn’t helping him create. It was taking away the part that could.',
  },
  writing: {
    id: 'writing',
    title: 'Find the first one',
    category: 'LAST TESTIMONY',
    glyph: '〃',
    body: '“THEY TAKE WHAT MAKES YOU YOU. FIND THE FIRST ONE.” Written with failing hands. Not an accusation: instructions left for whoever came next.',
    observation:
      '“Find the first one.” He used his last words to leave a direction. Not the killer’s name. Someone else’s beginning.',
  },
  fragment: {
    id: 'fragment',
    title: 'The first surviving memory',
    category: 'RECOVERED ARCHIVE',
    glyph: '◎',
    body: 'Archive 001: a woman teaching a child to draw a bird. Her legal identity is blank. Lyra preserved the memory after the city erased its owner.',
    observation:
      'A woman teaching a child to draw a bird. Not a masterpiece. Not something you could sell. Just a moment that made someone who they were.',
  },
};
export interface Deduction {
  id: DeductionId;
  pair: [ClueId, ClueId];
  title: string;
  conclusion: string;
}
export const DEDUCTIONS: Deduction[] = [
  {
    id: 'harvest',
    pair: ['device', 'residue'],
    title: 'A mind was harvested',
    conclusion:
      'The receiver and the residue tell the same story. Marlon’s creative patterns were extracted through his implants. His death was the cost, not the purpose.',
  },
  {
    id: 'voices',
    pair: ['painting', 'diary'],
    title: 'The painting holds witnesses',
    conclusion:
      'The voices in the diary belong to the faces in the painting. Marlon made an archive of the people inside him. His last work is evidence.',
  },
  {
    id: 'first',
    pair: ['writing', 'portrait'],
    title: 'Find archive zero-zero-one',
    conclusion:
      '“The first one” is the woman in the earliest portrait, numbered 001. Someone who deals in memories might still know where to find hers.',
  },
];
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: 'clue' | 'door' | 'talk' | 'flavor';
  clue?: ClueId;
  target?: AreaId;
  text?: string;
  requires?: 'deduced' | 'contact';
}
/**
 * A neon sign or practical light. These do not light the plate — that is
 * painted in — they exist so the wet-rim glow on characters knows what colour
 * is falling on them and from which side. Positions follow the lit fixtures
 * visible in each plate.
 */
export interface SignLight {
  x: number;
  y: number;
  color: string;
  intensity: number;
  /** 0 = a steady lamp, 1 = a tube on its way out. */
  flicker?: number;
  /**
   * Flare scale, for fixtures that earn one: a bare lamp pointed into the
   * room, or light behind glass. Absent for anything diffuse — a neon sign
   * facing the street, a monitor wall — which gets only its halo.
   */
  flare?: number;
}
export interface Area {
  id: AreaId;
  title: string;
  subtitle: string;
  width: number;
  spawn: number;
  color: string;
  /**
   * How large a standing adult reads against this plate, with the street at 1.
   * The interior plates were painted from much closer in, so a figure drawn at
   * the street's size stands about a third of its proper height in a room.
   */
  figureScale: number;
  /**
   * The surface characters stand on. On the street this is the pavement, not
   * the kerb line below it — standing on the latter reads as walking in the
   * gutter.
   */
  ground: number;
  /** Neon and practicals feeding the wet-rim glow. */
  lights: SignLight[];
  /** Rain, leaks and standing water. Positions measured off the plate. */
  water?: AreaWater;
  hotspots: Hotspot[];
}
export const AREAS: Record<AreaId, Area> = {
  street: {
    id: 'street',
    title: 'Sector 07',
    subtitle: 'THE LOW DISTRICT · NEW ANGELES',
    width: 1800,
    spawn: 440,
    color: '#e6aa62',
    figureScale: 1,
    ground: 434,
    lights: [
      // Positions measured off the frontage plate, taking each sign's densest
      // row rather than its centroid: the rim glow only needs a direction, but
      // a flare is drawn at the light, and a centroid drags down toward the
      // lit shopfront under the sign.
      { x: 183, y: 262, color: '#ffa64d', intensity: 1.5, flicker: 0.3 }, // noodle bar
      { x: 420, y: 341, color: '#4fb4e8', intensity: 0.9, flicker: 0.5 }, // vending machines
      { x: 1008, y: 310, color: '#ff3b30', intensity: 1.5, flicker: 0.38 }, // GRAVES
      { x: 1259, y: 200, color: '#ff2f45', intensity: 0.8, flicker: 0.92 }, // failing kanji tube
      { x: 1547, y: 274, color: '#4fe6e0', intensity: 1.7, flicker: 0.22 }, // MEMORY DEN
    ],
    hotspots: [
      {
        id: 'noodles',
        x: 240,
        y: 360,
        label: 'Night shift',
        kind: 'flavor',
        text: 'Steam, ginger, burnt oil. The city can take almost anything from you. Hunger, it lets you keep.',
      },
      { id: 'camera', x: 550, y: 300, label: 'Street camera', kind: 'clue', clue: 'camera' },
      {
        id: 'studio-door',
        x: 965,
        y: 372,
        label: 'Marlon’s studio',
        kind: 'door',
        target: 'studio',
      },
      {
        id: 'lyra',
        x: 1280,
        y: 365,
        label: 'The woman in the rain',
        kind: 'talk',
        requires: 'deduced',
      },
      {
        id: 'den-door',
        x: 1510,
        y: 370,
        label: 'Memory Den',
        kind: 'door',
        target: 'den',
        requires: 'contact',
      },
    ],
  },
  studio: {
    id: 'studio',
    title: 'Graves’ studio',
    subtitle: 'CRIME SCENE 07–031 · INTERIOR',
    width: 1500,
    spawn: 140,
    color: '#e6aa62',
    figureScale: 2.8,
    ground: 438,
    lights: [
      // Interior fixtures measured off their plates, same as the street signs.
      { x: 227, y: 213, color: '#7fd98c', intensity: 0.8, flicker: 0.5 }, // terminal screen
      // A bare bulb hung into the room and a lit glass cylinder: both are
      // point sources, so both flare. The terminal screen beside them is
      // diffuse and keeps its halo alone.
      { x: 788, y: 87, color: '#ffc271', intensity: 2.1, flicker: 0.55, flare: 0.3 }, // failing bulb
      { x: 1251, y: 236, color: '#4fe6e0', intensity: 1.6, flicker: 0.25, flare: 0.22 }, // neural receiver
      { x: 60, y: 330, color: '#ffb066', intensity: 0.9 }, // street through the door
    ],
    water: {
      // The doorway at the far left looks out on the wet street.
      openings: [{ x: 20, y: 40, w: 78, h: 380 }],
      // The two slatted windows high on the back wall.
      panes: [
        { x: 500, y: 46, w: 120, h: 92 },
        { x: 1010, y: 48, w: 175, h: 95 },
      ],
      leaks: [
        { x: 300, from: 34, to: 464 },
        { x: 1150, from: 28, to: 474 },
      ],
      // Water pools under the leaks, and reads where there is something
      // bright overhead for it to hold: the doorway, the bulb, the receiver.
      puddles: [
        { x: 150, y: 458, rx: 105, ry: 16 },
        { x: 300, y: 464, rx: 112, ry: 17 },
        { x: 788, y: 472, rx: 152, ry: 22 },
        { x: 1150, y: 462, rx: 118, ry: 18 },
      ],
    },
    hotspots: [
      {
        id: 'street-exit',
        x: 85,
        y: 370,
        label: 'Return to Sector 07',
        kind: 'door',
        target: 'street',
      },
      { id: 'lock', x: 195, y: 350, label: 'Door lock', kind: 'clue', clue: 'lock' },
      { id: 'diary', x: 320, y: 305, label: 'Marlon’s journal', kind: 'clue', clue: 'diary' },
      {
        id: 'painting',
        x: 720,
        y: 235,
        label: 'Everybody / Nobody',
        kind: 'clue',
        clue: 'painting',
      },
      {
        id: 'portrait',
        x: 600,
        y: 360,
        label: 'Unfinished portrait',
        kind: 'clue',
        clue: 'portrait',
      },
      { id: 'residue', x: 960, y: 423, label: 'Iridescent residue', kind: 'clue', clue: 'residue' },
      { id: 'device', x: 1200, y: 350, label: 'Neural receiver', kind: 'clue', clue: 'device' },
      { id: 'writing', x: 1070, y: 215, label: 'Last testimony', kind: 'clue', clue: 'writing' },
    ],
  },
  den: {
    id: 'den',
    title: 'The Memory Den',
    subtitle: 'LYRA’S ARCHIVE · BELOW THE GRID',
    width: 1500,
    spawn: 140,
    color: '#85d6d0',
    figureScale: 2.85,
    ground: 438,
    lights: [
      { x: 79, y: 227, color: '#ffb066', intensity: 0.9, flicker: 0.2, flare: 0.18 }, // stairwell lamp
      { x: 823, y: 201, color: '#5ef0ea', intensity: 2.4, flicker: 0.18, flare: 0.34 }, // memory column
      { x: 1196, y: 195, color: '#4fd6e8', intensity: 1.3, flicker: 0.6 }, // monitor wall
    ],
    // Below the grid, so nothing to see out of: the weather gets in as
    // condensation on the archive glass and as leaks from the pipe runs.
    water: {
      panes: [
        { x: 570, y: 130, w: 200, h: 258 },
        { x: 960, y: 130, w: 190, h: 250 },
      ],
      leaks: [
        { x: 430, from: 40, to: 452 },
        { x: 1290, from: 44, to: 466 },
      ],
      puddles: [
        { x: 120, y: 458, rx: 108, ry: 17 },
        { x: 430, y: 466, rx: 124, ry: 19 },
        { x: 823, y: 480, rx: 168, ry: 24 },
        { x: 1250, y: 460, rx: 122, ry: 18 },
      ],
    },
    hotspots: [
      {
        id: 'den-exit',
        x: 90,
        y: 370,
        label: 'Return to Sector 07',
        kind: 'door',
        target: 'street',
      },
      {
        id: 'archive',
        x: 820,
        y: 315,
        label: 'Recover archive 001',
        kind: 'clue',
        clue: 'fragment',
      },
      { id: 'lyra-den', x: 1150, y: 365, label: 'Lyra', kind: 'talk' },
      {
        id: 'tapes',
        x: 420,
        y: 325,
        label: 'The unclaimed',
        kind: 'flavor',
        text: 'Names on paper labels. A teacher. A mechanic. Someone’s father. The city calls them redundant data. Lyra keeps them in alphabetical order.',
      },
    ],
  },
};
export const LYRA_INTRO = [
  { speaker: 'LYRA', text: 'You noticed the oil on the lock. Most detectives stop at the body.' },
  { speaker: 'COLE', text: 'You’ve been watching me.' },
  { speaker: 'LYRA', text: 'I’ve been watching everyone walk past. You went inside.' },
  { speaker: 'COLE', text: 'Marlon painted a woman. Number zero-zero-one. You know her?' },
  {
    speaker: 'LYRA',
    text: 'I know what they left of her. Come into the Den. There are things the rain shouldn’t hear.',
  },
];
export const LYRA_ARCHIVE = [
  {
    speaker: 'LYRA',
    text: 'The city erased her name. I kept the memory. I thought that if someone remembered, she wouldn’t be entirely gone.',
  },
  { speaker: 'COLE', text: 'Marlon heard them. All those people.' },
  { speaker: 'LYRA', text: 'He tried to give them back their faces. They killed him for it.' },
  { speaker: 'COLE', text: 'Then we find who took them.' },
  {
    speaker: 'LYRA',
    text: 'Your implant has an unused channel. If you let me, I can stay with you. Beyond this room. Beyond their cameras.',
  },
];
