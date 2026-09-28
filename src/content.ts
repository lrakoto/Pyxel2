import type { AreaWater } from './water.ts';
export type AreaId = 'street' | 'studio' | 'den' | 'clinic';
export type ClueId =
  | 'camera'
  | 'lock'
  | 'diary'
  | 'painting'
  | 'portrait'
  | 'residue'
  | 'device'
  | 'writing'
  | 'fragment'
  | 'chime'
  | 'register'
  | 'transfer'
  | 'witness'
  | 'sketch'
  | 'manifest'
  | 'cartridge'
  | 'consent'
  | 'seal'
  | 'sale';
export type DeductionId =
  | 'harvest'
  | 'voices'
  | 'first'
  | 'entry'
  | 'identity'
  | 'seizure'
  | 'continuity'
  | 'intake'
  | 'front'
  | 'buyer';
export const CORE_DEDUCTIONS: DeductionId[] = ['harvest', 'voices', 'first'];
export const FOLLOWUP_DEDUCTIONS: DeductionId[] = ['identity', 'seizure', 'continuity'];
export const FOLLOWUP_CLUES: ClueId[] = ['chime', 'register', 'transfer', 'witness', 'sketch'];
/** The third case, “Follow the shipment”: intake B at Meridian Clinic. */
export const SHIPMENT_DEDUCTIONS: DeductionId[] = ['intake', 'front', 'buyer'];
export const SHIPMENT_CLUES: ClueId[] = ['manifest', 'cartridge', 'consent', 'seal', 'sale'];
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
  chime: {
    id: 'chime',
    title: 'Four notes before the rain',
    category: 'ARCHIVE AUDIO',
    glyph: '♪',
    body: 'Behind the drawing lesson: four descending notes, then a child says “Bellwether.” A school announcement, recorded inside memory 001.',
    observation:
      'Under her voice. Four notes. A bell that doesn’t belong to this room. Then the child says “Bellwether.” The memory kept the place even when they removed her name.',
  },
  register: {
    id: 'register',
    title: 'A name in the margins',
    category: 'PAPER REGISTER',
    glyph: '▤',
    body: 'Bellwether evening school, room 4. Instructor: Ada Vale. Her lesson plan reads “Draw a bird from memory.” Her city ID is stamped VOID; the paper record predates the stamp.',
    observation:
      'Ada Vale. Evening classes, room four. “Draw a bird from memory.” They voided her ID, but nobody thought to erase the carbon copy.',
  },
  transfer: {
    id: 'transfer',
    title: 'The receiver’s last destination',
    category: 'DISPATCH LOG',
    glyph: '↗',
    body: 'The studio receiver’s spool records an outbound shipment to Meridian Clinic, intake B. Contractor code V-17. The public transaction index has been wiped.',
    observation:
      'Meridian Clinic. Intake B. The public log is empty, but the spool still remembers where the last shipment went. Someone trusted the delete key too much.',
  },
  witness: {
    id: 'witness',
    title: 'Mei’s carbon copy',
    category: 'WITNESS ACCOUNT',
    glyph: '〞',
    body: 'Mei kept the meal receipt signed by a V-17 driver on the night Marlon died. The driver asked for directions to Meridian’s intake B. Her account independently confirms the receiver’s destination.',
    observation:
      'A meal receipt, signed V-17. Mei remembers the driver asking for intake B. The machine says where it went. Now someone can say who carried it.',
  },
  sketch: {
    id: 'sketch',
    title: 'The bird outside the machine',
    category: 'PHYSICAL DRAWING',
    glyph: '⌁',
    body: 'Behind the unfinished portrait: a child’s bird drawn with an extra line across its left wing. The same correction appears in archive 001. The paper bears a Bellwether class stamp.',
    observation:
      'A crooked wing. She didn’t erase it. She showed the child how to turn the mistake into a feather. The same line as the memory. Something real made it out.',
  },
  manifest: {
    id: 'manifest',
    title: 'The night intake',
    category: 'INTAKE LEDGER',
    glyph: '▦',
    body: 'Intake B’s ledger for the night Marlon died. Every entry that week is a donor session except one: “Collection · Sector 07 · courier V-17 · lot B-0419 · hold for buyer.”',
    observation:
      'Donor session, donor session, donor session. Then one line in a different hand: a collection from Sector 07, courier V-17, held for a buyer. No name. They logged him like freight.',
  },
  cartridge: {
    id: 'cartridge',
    title: 'Minds kept cold',
    category: 'NEURAL CARGO',
    glyph: '▣',
    body: 'A refrigerated rack of sealed cartridges, each holding an iridescent polymer that shifts with the light. They are labelled by talent, not by name: HANDS, PATIENCE, COLOUR. Only the newest carries initials: M.G.',
    observation:
      'Hands. Patience. Colour. Labelled like cuts of meat. The newest one just says M.G. The film inside turns toward the light. I’ve seen it do that before.',
  },
  consent: {
    id: 'consent',
    title: 'Paid in meal credits',
    category: 'SIGNED CONSENT',
    glyph: '▭',
    body: 'Consent forms on the donor recliners promise “therapeutic creativity archiving,” paid in meal credits. The same names return week after week. The fine print hands everything archived to a processing partner, marked with a small folded veil.',
    observation:
      'Two meals for an afternoon of someone’s imagination. The same names come back every week, and every week the signature forgets a little more of itself.',
  },
  seal: {
    id: 'seal',
    title: 'The folded veil',
    category: 'PHYSICAL TRACE',
    glyph: '▽',
    body: 'The crates by the loading door are sealed with red tape pressed with a folded veil, not Meridian’s cross. No destination, no clinic registration: only a courier window at 03:00.',
    observation:
      'Not the clinic’s cross. A folded veil, pressed into red tape. Lyra went still when she saw it. The enforcers who came for the memory answered to this mark.',
  },
  sale: {
    id: 'sale',
    title: 'Sold before it arrived',
    category: 'SALE RECORD',
    glyph: '◫',
    body: 'The outbound terminal’s sale log, opened by Lyra from inside the machine: lot B-0419, reserved three days before collection and paid in full. Buyer: THE BROKER. Memo: “Nothing is sacred once someone is hungry enough to sell it.”',
    observation:
      'Lot B-0419. Reserved three days before it was collected. Paid in full. The buyer signs with a title instead of a name, and leaves a memo that reads like a shrug.',
  },
};
export interface Deduction {
  id: DeductionId;
  pair: [ClueId, ClueId];
  title: string;
  conclusion: string;
  /**
   * What the board asks while the theory is open, and the nudge under it.
   * These used to be positional arrays indexed alongside DEDUCTIONS in the
   * board markup, which meant reordering the deductions silently attached
   * each question to the wrong theory.
   */
  question: string;
  hint: string;
}
export const DEDUCTIONS: Deduction[] = [
  {
    id: 'harvest',
    pair: ['device', 'residue'],
    title: 'A mind was harvested',
    question: 'What happened to Marlon?',
    hint: 'Compare the machine with what it left behind.',
    conclusion:
      'The receiver and the residue tell the same story. Marlon’s creative patterns were extracted through his implants. His death was the cost, not the purpose.',
  },
  {
    id: 'voices',
    pair: ['painting', 'diary'],
    title: 'The painting holds witnesses',
    question: 'What is inside the painting?',
    hint: 'Look for a personal account of the faces.',
    conclusion:
      'The voices in the diary belong to the faces in the painting. Marlon made an archive of the people inside him. His last work is evidence.',
  },
  {
    id: 'first',
    pair: ['writing', 'portrait'],
    title: 'Find archive zero-zero-one',
    question: 'Who is the first one?',
    hint: 'His last words point to something he painted.',
    conclusion:
      '“The first one” is the woman in the earliest portrait, numbered 001. Someone who deals in memories might still know where to find hers.',
  },
  {
    id: 'entry',
    pair: ['camera', 'lock'],
    title: 'An appointment, not a break-in',
    question: 'How did the intruder prepare?',
    hint: 'Compare the missing time outside with the entry inside.',
    conclusion:
      'A targeted camera outage and a silently prepared lock: the entry was coordinated. Ask about a scheduled pickup, not a stranger forcing a door.',
  },
  {
    id: 'identity',
    pair: ['chime', 'register'],
    title: 'Her name is Ada Vale',
    question: 'Who taught the child?',
    hint: 'A sound locates the lesson. A paper record names its teacher.',
    conclusion:
      'The Bellwether announcement and the matching lesson plan identify Ada Vale. The city voided her number; it did not undo her life.',
  },
  {
    id: 'seizure',
    pair: ['transfer', 'witness'],
    title: 'A route to Meridian',
    question: 'Where did the stolen minds go?',
    hint: 'Find an independent account of the receiver’s destination.',
    conclusion:
      'The spool and Mei’s signed receipt independently place V-17 at Meridian Clinic, intake B. This is a route that can be followed, not just an accusation.',
  },
  {
    id: 'continuity',
    pair: ['fragment', 'sketch'],
    title: 'A memory with a witness',
    question: 'Can the archive be trusted?',
    hint: 'Look for a detail that exists both inside the memory and outside it.',
    conclusion:
      'The corrected wing exists in the memory and on a child’s paper drawing. Archive 001 preserves an event, not a synthetic replacement.',
  },
  {
    id: 'intake',
    pair: ['residue', 'cartridge'],
    title: 'Marlon arrived at intake B',
    question: 'Where did Marlon’s mind go?',
    hint: 'Something left Marlon at the studio. Find where it was kept.',
    conclusion:
      'The film beneath Marlon’s body and the polymer in the cartridge marked M.G. are the same carrier. What the receiver pulled out of him was sealed and kept cold at intake B.',
  },
  {
    id: 'front',
    pair: ['consent', 'seal'],
    title: 'A clinic for the Veil',
    question: 'Who really runs intake B?',
    hint: 'Compare what the donors signed with what leaves by the loading door.',
    conclusion:
      'The forms promise therapy and sign everything over to a partner marked with a folded veil. The crates leave under the same seal. Meridian treats Sector 07’s poor; intake B processes them for the Veil Syndicate.',
  },
  {
    id: 'buyer',
    pair: ['manifest', 'sale'],
    title: 'The Broker paid for Marlon',
    question: 'Who paid for the collection?',
    hint: 'Match the night’s delivery to the sale it was made for.',
    conclusion:
      'V-17’s collection from Sector 07 was logged as lot B-0419, and lot B-0419 was reserved and paid for three days before it was collected. Marlon was taken to order. The buyer signs as the Broker.',
  },
];
/** The notebook keeps one file per case. */
export type CaseFileId = 'graves' | 'first-one' | 'shipment';
export function theoryFile(id: DeductionId): CaseFileId {
  if (FOLLOWUP_DEDUCTIONS.includes(id)) return 'first-one';
  if (SHIPMENT_DEDUCTIONS.includes(id)) return 'shipment';
  return 'graves';
}
/** A file shows its own records, and any earlier record that one of its theories reopens. */
export function clueFile(id: ClueId): CaseFileId {
  return FOLLOWUP_CLUES.includes(id)
    ? 'first-one'
    : SHIPMENT_CLUES.includes(id)
      ? 'shipment'
      : 'graves';
}
export function inCaseFile(file: CaseFileId, id: ClueId) {
  return (
    clueFile(id) === file ||
    DEDUCTIONS.some((d) => theoryFile(d.id) === file && d.pair.includes(id))
  );
}
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  kind: 'clue' | 'door' | 'talk' | 'flavor';
  clue?: ClueId;
  target?: AreaId;
  text?: string;
  requires?: 'deduced' | 'contact' | 'followup' | 'shipment';
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
      {
        id: 'mei',
        x: 180,
        y: 345,
        label: 'Mei · night shift',
        kind: 'talk',
        clue: 'witness',
        requires: 'followup',
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
        y: 378,
        label: 'The watcher in the rain',
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
      { x: 788, y: 87, color: '#ffc271', intensity: 1.7, flicker: 0.55, flare: 0.18 }, // failing bulb
      // Centre the catch on the luminous tube, not the metal cage beside it.
      { x: 1224, y: 236, color: '#4fe6e0', intensity: 1.25, flicker: 0.25, flare: 0.12 }, // neural receiver
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
      {
        id: 'sketch',
        x: 550,
        y: 285,
        label: 'Behind the portrait',
        kind: 'clue',
        clue: 'sketch',
        requires: 'followup',
      },
      {
        id: 'transfer',
        x: 1220,
        y: 300,
        label: 'Receiver dispatch spool',
        kind: 'clue',
        clue: 'transfer',
        requires: 'followup',
      },
    ],
  },
  den: {
    id: 'den',
    title: 'The Memory Den',
    subtitle: 'LYRA’S ARCHIVE · BELOW THE GRID',
    width: 1500,
    // Clear of the near-plane cabinet at the stair foot, so arrival isn't behind furniture.
    spawn: 230,
    color: '#85d6d0',
    figureScale: 2.85,
    ground: 438,
    lights: [
      { x: 79, y: 227, color: '#ffb066', intensity: 0.9, flicker: 0.2, flare: 0.18 }, // stairwell lamp
      // The plate already carries the bright projection rings; let the housing stay dark.
      { x: 823, y: 201, color: '#5ef0ea', intensity: 1.85, flicker: 0.18, flare: 0.18 }, // memory column
      { x: 1196, y: 195, color: '#4fd6e8', intensity: 1.1, flicker: 0.6 }, // monitor wall
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
      { id: 'lyra-den', x: 1150, y: 300, label: 'Lyra', kind: 'talk' },
      {
        id: 'chime',
        x: 850,
        y: 235,
        label: 'Listen beneath the memory',
        kind: 'clue',
        clue: 'chime',
        requires: 'followup',
      },
      {
        id: 'register',
        x: 450,
        y: 270,
        label: 'Bellwether paper register',
        kind: 'clue',
        clue: 'register',
        requires: 'followup',
      },
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
  /**
   * Outside Sector 07: there is no street door, only the night train on the transit card.
   * Positions measured against the finished Meridian plate in 1500 × 540 world coordinates.
   */
  clinic: {
    id: 'clinic',
    title: 'Meridian Clinic',
    subtitle: 'INTAKE B · AFTER HOURS',
    width: 1500,
    // Just inside the night-service door, clear of the dock's near-plane curtain.
    spawn: 180,
    color: '#9cc9d4',
    figureScale: 2.85,
    ground: 438,
    lights: [
      { x: 330, y: 56, color: '#d6efff', intensity: 1.05, flicker: 0.2 }, // tube over intake
      { x: 760, y: 56, color: '#cfe4ff', intensity: 1.15, flicker: 0.52 }, // failing tube, recliners
      { x: 1176, y: 56, color: '#cfe4ff', intensity: 0.95, flicker: 0.12 }, // loading bay
      { x: 410, y: 253, color: '#ffc17c', intensity: 0.7 }, // counter lamp
      // Many small cartridge lights behind glass: a soft spill, not one dazzling point.
      { x: 930, y: 236, color: '#7fdcff', intensity: 1.35, flicker: 0.12 }, // cold storage
      { x: 1360, y: 262, color: '#ff5a48', intensity: 0.85, flicker: 0.45 }, // outbound terminal
      { x: 80, y: 360, color: '#ffb066', intensity: 0.8 }, // sodium light under the service door
    ],
    water: {
      // The night-service door is rolled a third of the way up: the rain is right there.
      openings: [{ x: 30, y: 239, w: 109, h: 183 }],
      // Condensation running down the cold-storage glass.
      panes: [{ x: 869, y: 158, w: 121, h: 231 }],
      leaks: [
        { x: 196, from: 36, to: 462 },
        { x: 1262, from: 40, to: 466 },
      ],
      puddles: [
        { x: 110, y: 460, rx: 104, ry: 16 },
        { x: 930, y: 474, rx: 128, ry: 20 },
        { x: 1262, y: 466, rx: 112, ry: 18 },
      ],
    },
    hotspots: [
      {
        id: 'clinic-exit',
        x: 85,
        y: 370,
        label: 'Return to Sector 07',
        kind: 'door',
        target: 'street',
      },
      {
        id: 'manifest',
        x: 330,
        y: 318,
        label: 'Intake ledger',
        kind: 'clue',
        clue: 'manifest',
        requires: 'shipment',
      },
      {
        id: 'notice',
        x: 320,
        y: 267,
        label: 'Health notice',
        kind: 'flavor',
        text: 'Free neural health checks. Sector 07 residents welcome. The paper has curled in the damp. Nobody takes it down, because it still works.',
      },
      {
        id: 'consent',
        x: 648,
        y: 351,
        label: 'Donor recliners',
        kind: 'clue',
        clue: 'consent',
        requires: 'shipment',
      },
      {
        id: 'cartridge',
        x: 930,
        y: 262,
        label: 'Cold storage',
        kind: 'clue',
        clue: 'cartridge',
        requires: 'shipment',
      },
      {
        id: 'seal',
        x: 1150,
        y: 392,
        label: 'Outbound crates',
        kind: 'clue',
        clue: 'seal',
        requires: 'shipment',
      },
      {
        id: 'sale',
        x: 1360,
        y: 262,
        label: 'Outbound terminal',
        kind: 'clue',
        clue: 'sale',
        requires: 'shipment',
      },
    ],
  },
};
export const LYRA_ARCHIVE = [
  {
    speaker: 'LYRA',
    text: 'The city erased her name. I kept the memory. I thought that if someone remembered, she wouldn’t be entirely gone.',
  },
  { speaker: 'GRAVITY', text: 'Marlon heard them. All those people.' },
  { speaker: 'LYRA', text: 'He tried to give them back their faces. They killed him for it.' },
  { speaker: 'GRAVITY', text: 'Then we find who took them.' },
  {
    speaker: 'LYRA',
    text: 'Your implant has an unused channel. If you let me, I can stay with you. Beyond this room. Beyond their cameras.',
  },
];
