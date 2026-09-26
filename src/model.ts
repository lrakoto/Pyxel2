import {
  AREAS,
  CLUES,
  DEDUCTIONS,
  CORE_DEDUCTIONS,
  FOLLOWUP_DEDUCTIONS,
  FOLLOWUP_CLUES,
  SHIPMENT_DEDUCTIONS,
  SHIPMENT_CLUES,
  type AreaId,
  type ClueId,
  type DeductionId,
  type Hotspot,
} from './content.ts';
import { INSIGHTS } from './narrative.ts';
export interface SaveData {
  introSeen: boolean;
  version: 1;
  area: AreaId;
  x: number;
  clues: ClueId[];
  deductions: DeductionId[];
  contact: boolean;
  companion: boolean;
  escaped: boolean;
  followup: boolean;
  insights: string[];
  resumeHotspot: string | null;
  resolution: 'protect' | 'testify' | null;
  /** The third case, “Follow the shipment”, is open and Gravity's transit card has its fare. */
  shipment: boolean;
  /** Gravity and Lyra named the buyer, which closes the third case. */
  buyerNamed: boolean;
}
export const SAVE_KEY = 'everybody-nobody:fragments:v1';
/** A locked Den route leads to its known contact once Gravity has earned that lead. */
export function mapDestination(model: CaseModel, destination: string) {
  return destination === 'den-door' && model.deduced && !model.save.contact ? 'lyra' : destination;
}

export function routeLabel(destination: string | null) {
  if (!destination) return null;
  return AREAS.street.hotspots.find((h) => h.id === destination)?.label ?? null;
}
/**
 * The district is a hub: interior-to-interior routes pass through the street. Meridian Clinic is
 * off the hub, a train ride away, so its only way out also leads back to the street.
 */
export function nextRouteHotspot(area: AreaId, destination: string): Hotspot | null {
  const end = AREAS.street.hotspots.find((h) => h.id === destination);
  if (!end || end.target === area) return null;
  if (area === 'street') return end;
  return AREAS[area].hotspots.find((h) => h.target === 'street') ?? null;
}
/** Where Gravity comes in: through the door she used, or off the night train by the vending machines. */
export function arrivalX(to: AreaId, from: AreaId) {
  if (to !== 'street') return AREAS[to].spawn;
  if (from === 'studio') return 965;
  if (from === 'den') return 1465;
  return AREAS.street.spawn;
}
/** A theory can be worked only once the case it belongs to is open. */
export function theoryOpen(save: SaveData, id: DeductionId) {
  if (FOLLOWUP_DEDUCTIONS.includes(id)) return save.followup;
  if (SHIPMENT_DEDUCTIONS.includes(id)) return save.shipment;
  return true;
}
export function freshSave(): SaveData {
  return {
    version: 1,
    introSeen: false,
    area: 'street',
    x: 440,
    clues: [],
    deductions: [],
    contact: false,
    companion: false,
    escaped: false,
    followup: false,
    insights: [],
    resumeHotspot: null,
    resolution: null,
    shipment: false,
    buyerNamed: false,
  };
}
export function parseSave(raw: string | null): SaveData {
  try {
    const d: unknown = JSON.parse(raw || 'null');
    if (!d || typeof d !== 'object') return freshSave();
    const s = d as Partial<SaveData>;
    if (s.version !== 1 || !s.area || !Object.hasOwn(AREAS, s.area)) return freshSave();
    let clues = [
      ...new Set(
        (Array.isArray(s.clues) ? s.clues : []).filter(
          (id): id is ClueId => typeof id === 'string' && Object.hasOwn(CLUES, id),
        ),
      ),
    ];
    let deductions = DEDUCTIONS.filter(
      (d) =>
        Array.isArray(s.deductions) &&
        s.deductions.includes(d.id) &&
        d.pair.every((id) => clues.includes(id)),
    ).map((d) => d.id);
    const contact = s.contact === true && CORE_DEDUCTIONS.every((id) => deductions.includes(id));
    const companion = s.companion === true && contact && clues.includes('fragment');
    const escaped = companion && s.escaped === true;
    const followup = escaped && s.followup === true;
    if (!followup) {
      clues = clues.filter((id) => !FOLLOWUP_CLUES.includes(id));
      deductions = deductions.filter((id) => !FOLLOWUP_DEDUCTIONS.includes(id));
    }
    const resolution =
      followup &&
      FOLLOWUP_DEDUCTIONS.every((id) => deductions.includes(id)) &&
      (s.resolution === 'protect' || s.resolution === 'testify')
        ? s.resolution
        : null;
    // Saves from before the third case have neither field; both default to closed.
    const shipment = resolution !== null && s.shipment === true;
    if (!shipment) {
      clues = clues.filter((id) => !SHIPMENT_CLUES.includes(id));
      deductions = deductions.filter((id) => !SHIPMENT_DEDUCTIONS.includes(id));
    }
    const buyerNamed =
      shipment &&
      SHIPMENT_DEDUCTIONS.every((id) => deductions.includes(id)) &&
      s.buyerNamed === true;
    const insights = INSIGHTS.filter(
      (i) =>
        Array.isArray(s.insights) &&
        s.insights.includes(i.id) &&
        clues.includes(i.clue) &&
        i.requires.every((id) => clues.includes(id)),
    ).map((i) => i.id);
    const area =
      (s.area === 'den' && !contact) || (s.area === 'clinic' && !shipment) ? 'street' : s.area;
    return {
      version: 1,
      introSeen:
        s.introSeen === true ||
        clues.length > 0 ||
        area !== 'street' ||
        (typeof s.x === 'number' && s.x !== 440),
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
      followup,
      insights,
      resolution,
      shipment,
      buyerNamed,
      resumeHotspot:
        typeof s.resumeHotspot === 'string' &&
        AREAS[area].hotspots.some(
          (h) =>
            h.id === s.resumeHotspot &&
            (h.kind === 'talk' || h.kind === 'clue') &&
            (h.requires !== 'followup' || followup) &&
            (h.requires !== 'shipment' || shipment) &&
            (h.requires !== 'deduced' || CORE_DEDUCTIONS.every((id) => deductions.includes(id))),
        )
          ? s.resumeHotspot
          : null,
    };
  } catch {
    return freshSave();
  }
}
export class CaseModel {
  constructor(public save: SaveData = freshSave()) {}
  get deduced() {
    return CORE_DEDUCTIONS.every((id) => this.save.deductions.includes(id));
  }
  get followupSolved() {
    return (
      this.save.followup && FOLLOWUP_DEDUCTIONS.every((id) => this.save.deductions.includes(id))
    );
  }
  startFollowup() {
    if (!this.save.escaped || this.save.followup) return false;
    this.save.followup = true;
    return true;
  }
  resolveFollowup(choice: 'protect' | 'testify') {
    if (!this.followupSolved || this.save.resolution) return false;
    this.save.resolution = choice;
    return true;
  }
  get shipmentSolved() {
    return (
      this.save.shipment && SHIPMENT_DEDUCTIONS.every((id) => this.save.deductions.includes(id))
    );
  }
  /** Opens “Follow the shipment”: the Meridian lead from Ada's case, and a fare on the card. */
  startShipment() {
    if (!this.save.resolution || this.save.shipment) return false;
    this.save.shipment = true;
    return true;
  }
  nameBuyer() {
    if (!this.shipmentSolved || this.save.buyerNamed) return false;
    this.save.buyerNamed = true;
    return true;
  }
  /**
   * Meridian on the district map. It appears once Ada's case points there, and is a ride away
   * once the next case puts a fare on the transit card. There is no street door to walk to.
   */
  get meridian(): 'hidden' | 'no-fare' | 'ride' | 'here' {
    if (this.save.area === 'clinic') return 'here';
    if (this.save.shipment) return 'ride';
    return this.save.resolution ? 'no-fare' : 'hidden';
  }
  get awaitingAmbush() {
    return this.save.area === 'street' && this.save.companion && !this.save.escaped;
  }
  get objective() {
    if (this.save.buyerNamed) return 'The Broker paid for Marlon. Find out who wears the name.';
    if (this.shipmentSolved) return 'The records agree. Tell Lyra who paid for Marlon.';
    if (this.save.shipment) {
      const found = this.save.clues.filter((id) => SHIPMENT_CLUES.includes(id)).length;
      if (found === SHIPMENT_CLUES.length)
        return 'Connect the records. Where Marlon went, who runs intake B, who paid.';
      if (this.save.area === 'clinic') return 'Search intake B. Find where the collection went.';
      return found
        ? 'Return to Meridian Clinic. Intake B has more to give up.'
        : 'Take the night train to Meridian Clinic. Find intake B.';
    }
    if (this.save.resolution) return 'Ada Vale is remembered. The trail leads to Meridian Clinic.';
    if (this.followupSolved)
      return 'Return to Lyra in the Den. Decide how to preserve Ada’s story.';
    if (this.save.followup)
      return this.save.clues.filter((id) => FOLLOWUP_CLUES.includes(id)).length ===
        FOLLOWUP_CLUES.length
        ? 'Connect the records. Recover a name, verify the memory, trace the shipment.'
        : 'Revisit the archive, the studio and Mei’s night shift. Find who the first woman was.';
    if (this.save.escaped) return 'Find who erased the first one.';
    if (this.awaitingAmbush)
      return 'Protect the memory. Face the enforcers or take Lyra’s escape route.';
    if (this.save.companion) return 'Leave the Den. Keep the memory safe.';
    if (this.save.clues.includes('fragment')) return 'Speak to Lyra about the first memory.';
    if (this.save.contact) return 'Enter the Memory Den. Recover archive 001.';
    if (this.deduced) return 'Find the watcher outside the Memory Den.';
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
    return this.save.buyerNamed
      ? 'THE BROKER’S RECEIPT'
      : this.save.shipment
        ? 'FOLLOW THE SHIPMENT'
        : this.save.resolution
          ? 'A NAME KEPT SAFE'
          : this.save.followup
            ? 'THE FIRST ONE'
            : this.save.escaped
              ? 'THE FIRST ONE'
              : this.save.contact
                ? 'THE MEMORY KEEPER'
                : this.deduced
                  ? 'SOMEONE IS WATCHING'
                  : 'THE LAST WORK';
  }
  available(h: Hotspot) {
    if (h.requires === 'followup') return this.save.followup;
    if (h.requires === 'shipment') return this.save.shipment;
    if (h.id === 'noodles' && this.save.followup) return false;
    if (h.id === 'lyra' && this.save.companion) return false;
    return !h.requires || (h.requires === 'deduced' ? this.deduced : true);
  }
  unlocked(h: Hotspot) {
    return h.requires !== 'contact' || this.save.contact;
  }
  collect(id: ClueId) {
    if (FOLLOWUP_CLUES.includes(id) && !this.save.followup) return false;
    if (SHIPMENT_CLUES.includes(id) && !this.save.shipment) return false;
    if (this.save.clues.includes(id)) return false;
    this.save.clues.push(id);
    return true;
  }
  connect(a: ClueId, b: ClueId) {
    if (a === b || !this.save.clues.includes(a) || !this.save.clues.includes(b)) return null;
    const match = DEDUCTIONS.find((d) => d.pair.includes(a) && d.pair.includes(b));
    if (match && !theoryOpen(this.save, match.id)) return null;
    // A successful return means a newly established connection. Replaying an
    // old pair must not replay the discovery sound, save, or story reactions.
    if (!match || this.save.deductions.includes(match.id)) return null;
    this.save.deductions.push(match.id);
    return match;
  }

  /**
   * Why a pairing failed, in Gravity's voice.
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
  explain(
    a: ClueId,
    b: ClueId,
  ): {
    reason: 'matched' | 'spent' | 'warm' | 'kind' | 'cold';
    text: string;
  } {
    const recorded = DEDUCTIONS.find(
      (d) =>
        a !== b && d.pair.includes(a) && d.pair.includes(b) && this.save.deductions.includes(d.id),
    );
    if (recorded)
      return {
        reason: 'matched',
        text: `Already recorded: ${recorded.title}. You can read this connection in the margin notes.`,
      };
    const open = DEDUCTIONS.filter(
      (d) => !this.save.deductions.includes(d.id) && theoryOpen(this.save, d.id),
    );
    const solvedWith = (id: ClueId) =>
      DEDUCTIONS.some((d) => this.save.deductions.includes(d.id) && d.pair.includes(id));
    const live = (id: ClueId) => open.some((d) => d.pair.includes(id));

    if ((solvedWith(a) && !live(a)) || (solvedWith(b) && !live(b)))
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
  sprintSpeed = 290,
) {
  const speed = dash ? sprintSpeed : 145;
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
