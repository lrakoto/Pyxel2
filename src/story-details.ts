import type { ClueId } from './content.ts';
import { FOLLOWUP_DEDUCTIONS } from './content.ts';
import type { CaseModel, SaveData } from './model.ts';

const EXAMINED_RECORDS = ['diary', 'painting', 'device'] as const satisfies readonly ClueId[];
type ExaminedRecord = (typeof EXAMINED_RECORDS)[number];
export interface StoryDetails {
  examined: ExaminedRecord[];
  witnessComparison: boolean;
  archiveRecovered: boolean;
  memoryPreserved: boolean;
  clinicRecords: ClueId[];
}

/** No visual state is retained between frames or case files. Restoring notes also restores the room. */
export function storyDetails(save: SaveData): StoryDetails {
  const archiveRecovered = save.area === 'den' && save.contact && save.clues.includes('fragment');
  return {
    examined:
      save.area === 'studio' ? EXAMINED_RECORDS.filter((id) => save.clues.includes(id)) : [],
    witnessComparison:
      save.area === 'studio' &&
      save.clues.includes('diary') &&
      save.clues.includes('painting') &&
      save.deductions.includes('voices'),
    archiveRecovered,
    clinicRecords:
      save.area === 'clinic' && save.shipment
        ? (['manifest', 'cartridge', 'sale'] as ClueId[]).filter((id) => save.clues.includes(id))
        : [],
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

function witnessComparison(c: CanvasRenderingContext2D) {
  // Gravity's two pencil copies hang from the painting's existing bottom rail.
  // They compare the journal margins with an eye in the painting, not new evidence.
  c.save();
  c.translate(798, 313);
  for (const [x, y] of [
    [0, 0],
    [25, 2],
  ]) {
    c.fillStyle = '#080c0bae';
    c.fillRect(x + 2, y + 3, 24, 31);
    c.fillStyle = x === 0 ? '#776b50' : '#71654b';
    c.beginPath();
    c.moveTo(x, y + 2);
    c.lineTo(x + 23, y + 1);
    c.lineTo(x + 23, y + 27);
    c.lineTo(x + 19, y + 31);
    c.lineTo(x, y + 30);
    c.closePath();
    c.fill();
    c.fillStyle = '#96805c';
    c.fillRect(x + 1, y + 2, 21, 1);
    c.fillStyle = '#635d46';
    for (let i = 0; i < 11; i++) {
      c.fillRect(x + 2 + ((i * 7) % 19), y + 5 + ((i * 11) % 21), 1 + (i % 2), 1);
    }
    c.fillStyle = '#514b39';
    c.fillRect(x + 19, y + 27, 4, 1);
    c.fillRect(x + 19, y + 28, 1, 3);
    // Folded metal clips share the rail at y=313; neither page floats below it.
    c.fillStyle = '#1b2420';
    c.fillRect(x + 8, -2, 6, 6 + y);
    c.fillStyle = '#6d7562';
    c.fillRect(x + 9, -2, 4, 1);
    c.fillRect(x + 10, -1, 1, 4 + y);
  }
  // Uneven diary lines, with one scratched-out phrase left intact.
  c.fillStyle = '#484735';
  for (let row = 0; row < 4; row++) {
    c.fillRect(4, 8 + row * 4, 9 + (row % 3) * 3, 1);
  }
  c.fillRect(7, 13, 11, 1);
  // An incomplete face study: keep the drawing rough, like the source journal.
  c.strokeStyle = '#484735';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(30, 14);
  c.lineTo(32, 9);
  c.lineTo(38, 7);
  c.lineTo(43, 11);
  c.lineTo(42, 22);
  c.lineTo(37, 27);
  c.lineTo(32, 23);
  c.moveTo(38, 15);
  c.lineTo(36, 20);
  c.lineTo(39, 20);
  c.moveTo(35, 23);
  c.lineTo(39, 23);
  c.stroke();
  // The same unlit neural mark in the journal margin and the copied eye.
  c.fillStyle = '#344d48';
  for (const [x, y] of [
    [16, 23],
    [32, 14],
  ]) {
    c.fillRect(x, y, 4, 1);
    c.fillRect(x + 2, y - 1, 1, 4);
  }
  c.restore();
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
  if (!details.examined.length && !details.archiveRecovered && !details.clinicRecords.length)
    return;
  c.save();
  c.translate(-Math.round(cam), 0);
  for (const id of details.examined) {
    const tab = RECORD_TABS[id];
    evidenceTab(c, tab.x, tab.y, tab.width);
  }
  if (details.witnessComparison) witnessComparison(c);
  if (details.clinicRecords.includes('manifest')) evidenceTab(c, 348, 330, 9);
  if (details.clinicRecords.includes('cartridge')) {
    // A copied lot number on the cabinet lip, anchored to the glass rack.
    c.fillStyle = '#253b3b';
    c.fillRect(918, 359, 31, 8);
    c.fillStyle = '#b0bda3';
    c.font = '6px monospace';
    c.fillText('M.G.', 922, 365);
  }
  if (details.clinicRecords.includes('sale')) {
    // Lyra leaves a readable copy on the terminal, rather than a looping error screen.
    c.fillStyle = '#0a1e20';
    c.fillRect(1328, 246, 64, 35);
    c.fillStyle = '#76a99b';
    c.font = '6px monospace';
    c.fillText('B-0419 / COPIED', 1331, 254);
    c.fillStyle = '#3c655f';
    for (let i = 0; i < 4; i++) c.fillRect(1331, 260 + i * 4, 28 + (i % 3) * 9, 1);
    c.fillStyle = '#b4b994';
    c.fillRect(1385, 275, 3, 2);
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
