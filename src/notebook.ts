import type { ClueId } from './content.ts';

/** Notes appear only on evidence already collected; none reveal a later deduction. */
export const RECORD_MOUNTS: Record<ClueId, { material: string; note: string; label: string }> = {
  camera: { material: 'photo', note: '11 minutes. Only this camera.', label: 'CONTACT PRINT' },
  lock: { material: 'tracing', note: 'Fresh oil on an old hinge.', label: 'SCENE RUBBING' },
  diary: { material: 'paper', note: 'His own words. Keep these.', label: 'NOTEBOOK EXTRACT' },
  painting: { material: 'photo', note: 'The same mark in every eye.', label: 'SCENE PHOTOGRAPH' },
  portrait: { material: 'photo', note: '001. Before the others.', label: 'DETAIL PHOTOGRAPH' },
  residue: { material: 'tracing', note: 'Something stayed behind.', label: 'FIELD SKETCH' },
  device: { material: 'photo', note: 'Outbound only. No return.', label: 'SCENE PHOTOGRAPH' },
  writing: { material: 'tracing', note: 'Instructions. Not a name.', label: 'WALL TRANSCRIPTION' },
  fragment: { material: 'carbon', note: 'A moment worth keeping.', label: 'ARCHIVE TRANSCRIPT' },
  chime: { material: 'carbon', note: 'Four notes, then Bellwether.', label: 'LISTENING NOTES' },
  register: { material: 'carbon', note: 'Paper remembers.', label: 'REGISTER COPY' },
  transfer: {
    material: 'carbon',
    note: 'The spool kept the destination.',
    label: 'DISPATCH TRANSCRIPT',
  },
  witness: { material: 'receipt', note: 'Mei kept the carbon.', label: 'WITNESS EXHIBIT' },
  sketch: { material: 'paper', note: 'She kept the crooked wing.', label: 'RECOVERED DRAWING' },
};
