import type { Area, Hotspot } from './content.ts';

export type InvestigationPose = 'inspect' | 'crouch' | 'terminal';
export interface ActorPerformance {
  gravity: InvestigationPose | 'speak' | 'listen' | null;
  gravityTime: number;
  lyra: 'idle' | 'speak' | 'listen' | 'project';
  lyraTime: number;
}

export function investigationPose(h: Hotspot): InvestigationPose {
  if (h.clue === 'residue') return 'crouch';
  if (['device', 'transfer', 'fragment', 'chime'].includes(h.clue ?? '')) return 'terminal';
  return 'inspect';
}

/** Stand beside the subject, leaving room for a reach or a face-to-face conversation. */
export function interactionOffset(h: Hotspot, area: Area) {
  return h.kind === 'talk' ? 48 * area.figureScale : h.kind === 'clue' ? 20 * area.figureScale : 0;
}
export function interactionPosition(h: Hotspot, area: Area, playerX: number, facing: number) {
  const side = Math.abs(h.x - playerX) > 1 ? Math.sign(h.x - playerX) : facing;
  return Math.max(32, Math.min(area.width - 32, h.x - side * interactionOffset(h, area)));
}
export function interactionReach(h: Hotspot, area: Area) {
  return Math.max(65, interactionOffset(h, area) + 24);
}
export function interactionLead(h: Hotspot, reducedMotion: boolean) {
  if (reducedMotion) return 0;
  return h.kind === 'clue' ? (investigationPose(h) === 'crouch' ? 0.65 : 0.55) : 0.25;
}

/** Actual speakers drive acting; an observation keeps its relevant inspection pose. */
export function actorPerformance(
  subject: Hotspot | null,
  observing: boolean,
  speaker: string | null,
  lyraInConversation: boolean,
  interactionTime: number,
  lineTime: number,
  reducedMotion: boolean,
): ActorPerformance {
  const inspecting = observing && subject?.kind === 'clue';
  const project = inspecting && subject.clue === 'fragment';
  return {
    gravity: inspecting
      ? investigationPose(subject)
      : speaker === 'GRAVITY'
        ? 'speak'
        : speaker || observing
          ? 'listen'
          : null,
    gravityTime: reducedMotion ? 99 : inspecting ? interactionTime : lineTime,
    lyra: project
      ? 'project'
      : lyraInConversation
        ? speaker === 'LYRA'
          ? 'speak'
          : 'listen'
        : 'idle',
    lyraTime: reducedMotion ? 99 : project ? interactionTime : lineTime,
  };
}
