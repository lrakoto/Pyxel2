import {
  AREAS,
  CLUES,
  DEDUCTIONS,
  type AreaId,
  type ClueId,
  type DeductionId,
  type Hotspot,
  type IdentityChoice,
} from './content.ts';
export interface SaveData {
  version: 2;
  area: AreaId;
  x: number;
  clues: ClueId[];
  deductions: DeductionId[];
  contact: boolean;
  companion: boolean;
  escaped: boolean;
  identityChoice: IdentityChoice | null;
}
type StoredSave = Omit<Partial<SaveData>, 'version'> & { version?: number };
export const SAVE_KEY = 'everybody-nobody:fragments:v2';
export const LEGACY_SAVE_KEYS = ['everybody-nobody:fragments:v1'];
export const CHAPTER_TWO_CLUES: ClueId[] = [
  'drawing',
  'census',
  'badge',
  'purge',
  'letter',
  'audit',
];
const solvedChapter = (deductions: DeductionId[], chapter: 1 | 2) =>
  DEDUCTIONS.filter((d) => d.chapter === chapter).every((d) => deductions.includes(d.id));
export function nextRouteHotspot(area: AreaId, destination: string): Hotspot | null {
  const location = Object.values(AREAS).find((a) => a.hotspots.some((h) => h.id === destination));
  const end = location?.hotspots.find((h) => h.id === destination);
  if (!location || !end || end.target === area) return null;
  const target = end.target ?? location.id;
  if (target === area) return end;
  const visited = new Set<AreaId>([area]);
  const queue = AREAS[area].hotspots
    .filter((h) => h.target)
    .map((h) => ({ area: h.target!, first: h }));
  while (queue.length) {
    const next = queue.shift()!;
    if (next.area === target) return next.first;
    if (visited.has(next.area)) continue;
    visited.add(next.area);
    for (const h of AREAS[next.area].hotspots)
      if (h.target && !visited.has(h.target)) queue.push({ area: h.target, first: next.first });
  }
  return null;
}
export function freshSave(): SaveData {
  return {
    version: 2,
    area: 'street',
    x: 440,
    clues: [],
    deductions: [],
    contact: false,
    companion: false,
    escaped: false,
    identityChoice: null,
  };
}
export function parseSave(raw: string | null): SaveData {
  try {
    const d: unknown = JSON.parse(raw || 'null');
    if (!d || typeof d !== 'object') return freshSave();
    const s = d as StoredSave;
    if ((s.version !== 1 && s.version !== 2) || !s.area || !Object.hasOwn(AREAS, s.area))
      return freshSave();
    const clues = [
      ...new Set(
        (Array.isArray(s.clues) ? s.clues : []).filter(
          (id): id is ClueId => typeof id === 'string' && Object.hasOwn(CLUES, id),
        ),
      ),
    ];
    const deductions = DEDUCTIONS.filter(
      (d) => s.deductions?.includes(d.id) && d.pair.every((id) => clues.includes(id)),
    ).map((d) => d.id);
    const contact = s.contact === true && solvedChapter(deductions, 1);
    const companion = s.companion === true && contact && clues.includes('fragment');
    const escaped = companion && s.escaped === true;
    const identityChoice =
      escaped &&
      solvedChapter(deductions, 2) &&
      (s.identityChoice === 'restore' || s.identityChoice === 'preserve')
        ? s.identityChoice
        : null;
    const area =
      (s.area === 'den' && !contact) || (s.area === 'registry' && !escaped) ? 'street' : s.area;
    return {
      version: 2,
      area,
      x:
        typeof s.x === 'number' && Number.isFinite(s.x)
          ? Math.max(50, Math.min(AREAS[area].width - 50, s.x))
          : AREAS[area].spawn,
      clues,
      deductions,
      contact,
      companion,
      escaped,
      identityChoice,
    };
  } catch {
    return freshSave();
  }
}
export class CaseModel {
  constructor(public save: SaveData = freshSave()) {}
  get deduced() {
    return solvedChapter(this.save.deductions, 1);
  }
  get identityDeduced() {
    return solvedChapter(this.save.deductions, 2);
  }
  get objective() {
    if (this.save.identityChoice === 'restore')
      return 'Mara Venn has her name back. See how Lyra carries it.';
    if (this.save.identityChoice === 'preserve')
      return 'Mara remains hidden. Her memory stays with you and Lyra.';
    if (this.identityDeduced) return 'Ask Lyra what happened to Mara Venn.';
    if (this.save.escaped && CHAPTER_TWO_CLUES.every((id) => this.save.clues.includes(id)))
      return 'Open the case board. Connect Mara’s records.';
    if (this.save.area === 'registry') return 'Search the annex. Reconstruct Mara Venn’s identity.';
    if (this.save.escaped) return 'Enter the Civic Registry Annex through the Memory Den.';
    if (this.save.companion) return 'Leave the Den. Keep the memory safe.';
    if (this.save.clues.includes('fragment')) return 'Speak to Lyra about the first memory.';
    if (this.save.contact) return 'Enter the Memory Den. Recover archive 001.';
    if (this.deduced) return 'Find the woman outside the Memory Den.';
    if (
      this.save.clues.filter((id) =>
        ['device', 'residue', 'painting', 'diary', 'writing', 'portrait'].includes(id),
      ).length === 6
    )
      return 'Open the case board. Connect the evidence.';
    if (this.save.area === 'studio') return 'Read the room. Find what Marlon left behind.';
    return 'Investigate Marlon Graves’ studio.';
  }
  get chapter() {
    return this.save.identityChoice
      ? 'MARA VENN'
      : this.identityDeduced
        ? 'A NAME IN THE RAIN'
        : this.save.escaped
          ? 'THE FIRST ONE'
          : this.save.contact
            ? 'THE MEMORY KEEPER'
            : this.deduced
              ? 'SOMEONE IS WATCHING'
              : 'THE LAST WORK';
  }
  get chapterNumber() {
    if (this.save.identityChoice) return 6;
    if (this.identityDeduced) return 5;
    if (this.save.escaped) return 4;
    if (this.save.contact) return 3;
    if (this.deduced) return 2;
    return 1;
  }
  available(h: Hotspot) {
    if (h.id === 'lyra' && this.save.companion) return false;
    if (h.id === 'identity-record' && !this.save.identityChoice) return false;
    return !h.requires || (h.requires === 'deduced' ? this.deduced : true);
  }
  unlocked(h: Hotspot) {
    if (h.requires === 'contact') return this.save.contact;
    if (h.requires === 'escaped') return this.save.escaped;
    return true;
  }
  collect(id: ClueId) {
    if (this.save.clues.includes(id)) return false;
    this.save.clues.push(id);
    return true;
  }
  connect(a: ClueId, b: ClueId) {
    if (a === b || !this.save.clues.includes(a) || !this.save.clues.includes(b)) return null;
    const match = DEDUCTIONS.find((d) => d.pair.includes(a) && d.pair.includes(b));
    if (match && !this.save.deductions.includes(match.id)) this.save.deductions.push(match.id);
    return match ?? null;
  }
  chooseIdentity(choice: IdentityChoice) {
    if (!this.save.escaped || !this.identityDeduced) return false;
    this.save.identityChoice = choice;
    return true;
  }
}
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export interface Body {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: number;
}
export function stepBody(
  p: Body,
  axis: number,
  jump: boolean,
  dt: number,
  width: number,
  dash = false,
) {
  const speed = dash ? 290 : 145;
  p.vx += (axis * speed - p.vx) * Math.min(1, dt * (axis ? 18 : 24));
  if (axis) p.facing = Math.sign(axis);
  if (jump && p.grounded) {
    p.vy = -340;
    p.grounded = false;
  }
  p.vy += 900 * dt;
  p.x = clamp(p.x + p.vx * dt, 32, width - 32);
  p.y += p.vy * dt;
  if (p.y >= 438) {
    p.y = 438;
    p.vy = 0;
    p.grounded = true;
  }
}
export function segmentHits(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  x: number,
  y: number,
  r: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return (ax + t * dx - x) ** 2 + (ay + t * dy - y) ** 2 <= r * r;
}
