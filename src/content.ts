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
export interface Area {
  id: AreaId;
  title: string;
  subtitle: string;
  width: number;
  spawn: number;
  color: string;
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
