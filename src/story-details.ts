import type { ClueId } from './content.ts';
import { FOLLOWUP_DEDUCTIONS } from './content.ts';
import type { CaseModel, SaveData } from './model.ts';

const EXAMINED_RECORDS = ['diary', 'painting', 'device'] as const satisfies readonly ClueId[];
type ExaminedRecord = (typeof EXAMINED_RECORDS)[number];
export interface StoryDetails {
  examined: ExaminedRecord[];
  archiveRecovered: boolean;
  memoryPreserved: boolean;
}

/** No visual state is retained between frames or case files. Restoring notes also restores the room. */
export function storyDetails(save: SaveData): StoryDetails {
  const archiveRecovered = save.area === 'den' && save.contact && save.clues.includes('fragment');
  return {
    examined:
      save.area === 'studio' ? EXAMINED_RECORDS.filter((id) => save.clues.includes(id)) : [],
    archiveRecovered,
    memoryPreserved:
      archiveRecovered &&
      save.followup &&
      save.resolution !== null &&
      FOLLOWUP_DEDUCTIONS.every((id) => save.deductions.includes(id)),
  };
}

// Coordinates sit on authored objects, not their interaction-marker positions:
// a journal page corner, the painting's lower frame and the receiver's workbench lip.
const RECORD_TABS: Record<ExaminedRecord, { x: number; y: number; width: number }> = {
  diary: { x: 349, y: 311, width: 7 },
  painting: { x: 907, y: 307, width: 10 },
  device: { x: 1264, y: 327, width: 10 },
};

function evidenceTab(c: CanvasRenderingContext2D, x: number, y: number, width: number) {
  // A tiny folded paper tab, attached at its upper edge. No bright marker or floating label.
  c.fillStyle = '#080f10b8';
  c.fillRect(x + 1, y + 2, width + 1, 6);
  c.fillStyle = '#857955';
  c.fillRect(x, y, width, 6);
  c.fillStyle = '#aaa079';
  c.fillRect(x, y, width, 1);
  c.fillStyle = '#514b35';
  c.fillRect(x + 2, y + 3, width - 4, 1);
  c.fillStyle = '#46534a';
  c.fillRect(x + width - 2, y + 4, 2, 2);
}

/** Small progress marks embedded in the room, drawn before people and live reflections. */
export function drawStoryDetails(
  c: CanvasRenderingContext2D,
  model: CaseModel,
  cam: number,
  time: number,
  reducedMotion: boolean,
) {
  const details = storyDetails(model.save);
  if (!details.examined.length && !details.archiveRecovered) return;
  c.save();
  c.translate(-Math.round(cam), 0);
  for (const id of details.examined) {
    const tab = RECORD_TABS[id];
    evidenceTab(c, tab.x, tab.y, tab.width);
  }
  if (details.archiveRecovered) {
    // The existing archive pedestal gains a settled bank of status lamps. Their
    // light stays confined to the metal lip, preserving the room's dark values.
    const breath = reducedMotion ? 0 : Math.sin(time * 0.8) * 0.045;
    for (const x of [773, 794, 815]) {
      c.fillStyle = '#0a181b';
      c.fillRect(x - 2, 398, 10, 5);
      c.fillStyle = '#497d72';
      c.fillRect(x, 399, 5, 2);
      c.globalAlpha = 0.7 + breath;
      c.fillStyle = '#98c7ab';
      c.fillRect(x + 1, 399, 3, 1);
      c.globalAlpha = 0.1 + breath;
      c.fillStyle = '#7fbfa3';
      c.fillRect(x - 3, 403, 12, 2);
      c.globalAlpha = 1;
    }
  }
  if (details.memoryPreserved) {
    // The already-present left CRT in the second monitor row holds the bird
    // shared by archive 001 and the child's drawing. Neither choice erases it.
    c.fillStyle = '#0b211ecc';
    c.fillRect(1120, 233, 40, 26);
    c.strokeStyle = '#77a999';
    c.globalAlpha = 0.66;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(1127, 248);
    c.lineTo(1135, 246);
    c.lineTo(1138, 239);
    c.lineTo(1143, 244);
    c.lineTo(1151, 240);
    c.lineTo(1149, 246);
    c.lineTo(1155, 248);
    c.lineTo(1149, 250);
    c.lineTo(1143, 253);
    c.lineTo(1136, 250);
    c.lineTo(1127, 252);
    c.lineTo(1132, 248);
    c.lineTo(1127, 245);
    c.stroke();
    c.beginPath();
    c.moveTo(1137, 248);
    c.lineTo(1143, 245);
    c.lineTo(1147, 247);
    c.stroke();
    c.fillStyle = '#a9c8ac';
    c.fillRect(1150, 247, 1, 1);
    c.globalAlpha = 0.15;
    c.fillStyle = '#021313';
    for (let y = 234; y < 259; y += 3) c.fillRect(1120, y, 40, 1);
  }
  c.restore();
}
