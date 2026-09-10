import {
  AREAS,
  CLUES,
  DEDUCTIONS,
  type AreaId,
  type ClueId,
  type DeductionId,
  type Hotspot,
} from './content.ts';
export interface SaveData {
  version: 1;
  area: AreaId;
  x: number;
  clues: ClueId[];
  deductions: DeductionId[];
  contact: boolean;
  companion: boolean;
  escaped: boolean;
}
export const SAVE_KEY = 'everybody-nobody:fragments:v1';
/** The district is a hub: interior-to-interior routes pass through the street. */
export function nextRouteHotspot(area: AreaId, destination: string): Hotspot | null {
  const end = AREAS.street.hotspots.find((h) => h.id === destination);
  if (!end || end.target === area) return null;
  if (area === 'street') return end;
  return AREAS[area].hotspots.find((h) => h.target === 'street') ?? null;
}
export function freshSave(): SaveData {
  return {
    version: 1,
    area: 'street',
    x: 440,
    clues: [],
    deductions: [],
    contact: false,
    companion: false,
    escaped: false,
  };
}
export function parseSave(raw: string | null): SaveData {
  try {
    const d: unknown = JSON.parse(raw || 'null');
    if (!d || typeof d !== 'object') return freshSave();
    const s = d as Partial<SaveData>;
    if (s.version !== 1 || !s.area || !Object.hasOwn(AREAS, s.area)) return freshSave();
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
    const contact = s.contact === true && deductions.length === 3;
    const companion = s.companion === true && contact && clues.includes('fragment');
    const area = s.area === 'den' && !contact ? 'street' : s.area;
    return {
      version: 1,
      area,
      x:
        typeof s.x === 'number' && Number.isFinite(s.x)
          ? Math.max(50, Math.min(AREAS[area].width - 50, s.x))
          : AREAS[area].spawn,
      clues,
      deductions,
      contact,
      companion,
      escaped: companion && s.escaped === true,
    };
  } catch {
    return freshSave();
  }
}
export class CaseModel {
  constructor(public save: SaveData = freshSave()) {}
  get deduced() {
    return this.save.deductions.length === 3;
  }
  get objective() {
    if (this.save.escaped) return 'Find who erased the first one.';
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
    return this.save.escaped
      ? 'THE FIRST ONE'
      : this.save.contact
        ? 'THE MEMORY KEEPER'
        : this.deduced
          ? 'SOMEONE IS WATCHING'
          : 'THE LAST WORK';
  }
  available(h: Hotspot) {
    if (h.id === 'lyra' && this.save.companion) return false;
    return !h.requires || (h.requires === 'deduced' ? this.deduced : true);
  }
  unlocked(h: Hotspot) {
    return h.requires !== 'contact' || this.save.contact;
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

  /**
   * Why a pairing failed, in Cole's voice.
   *
   * A single flat rejection for all thirty-six pairs teaches the player
   * nothing and leaves brute force as the only strategy, which is a poor
   * showing for a game about deduction. This grades the miss instead:
   *
   *  - `spent` — one of the two is already accounted for, so the player is
   *    re-treading rather than reasoning;
   *  - `warm` — exactly one of them belongs to a conclusion still open. The
   *    partner is never named, so this rewards a half-right idea without
   *    handing over the answer;
   *  - `kind` — both records are the same category, and a conclusion has to
   *    bridge two different sorts of evidence;
   *  - `cold` — neither leads anywhere.
   */
  explain(a: ClueId, b: ClueId): { reason: 'spent' | 'warm' | 'kind' | 'cold'; text: string } {
    const open = DEDUCTIONS.filter((d) => !this.save.deductions.includes(d.id));
    const solvedWith = (id: ClueId) =>
      DEDUCTIONS.some((d) => this.save.deductions.includes(d.id) && d.pair.includes(id));
    const live = (id: ClueId) => open.some((d) => d.pair.includes(id));

    if (solvedWith(a) || solvedWith(b))
      return {
        reason: 'spent',
        text: 'One of these has already given up what it had. Try the records that have not.',
      };

    const liveA = live(a);
    const liveB = live(b);
    if (liveA !== liveB) {
      const carries = CLUES[liveA ? a : b].title.toLowerCase();
      return {
        reason: 'warm',
        text: `“${carries}” is going to matter. Not with this, though. Keep it and find the other half.`,
      };
    }

    if (CLUES[a].category === CLUES[b].category)
      return {
        reason: 'kind',
        text: 'Two records of the same kind. A conclusion has to bridge one sort of evidence to another.',
      };

    return {
      reason: 'cold',
      text: 'Nothing holds these two together. Read them again and look for what one explains about the other.',
    };
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
  ground = 438,
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
  if (p.y >= ground) {
    p.y = ground;
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
