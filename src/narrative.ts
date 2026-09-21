import { AREAS, DEDUCTIONS, type ClueId, type DeductionId } from './content.ts';
import type { CaseModel } from './model.ts';

export interface Line {
  speaker: string;
  text: string;
}
export interface Insight {
  id: string;
  clue: ClueId;
  requires: ClueId[];
  title: string;
  text: string;
}
export const INSIGHTS: Insight[] = [
  {
    id: 'faces-have-voices',
    clue: 'painting',
    requires: ['diary'],
    title: 'Different hands',
    text: 'The diary changes what I’m looking at. These faces aren’t painted with one technique. He let each voice move his hand differently. He was trying to keep them separate.',
  },
  {
    id: 'voices-have-faces',
    clue: 'diary',
    requires: ['painting'],
    title: 'A deliberate record',
    text: 'The repeated marks in the painting are in the margins here too. Not symptoms. A filing system. He gave the voices a way to find their own faces.',
  },
  {
    id: 'polymer-return',
    clue: 'residue',
    requires: ['device'],
    title: 'The failed seal',
    text: 'The receiver uses this polymer as a carrier. That torn seal beside the chair explains the spill. The machine kept drawing after the person attached to it could no longer answer.',
  },
  {
    id: 'machine-cost',
    clue: 'device',
    requires: ['residue'],
    title: 'Beyond the safety limit',
    text: 'Now I can see the same film inside the pressure gauge. It passed the red line. Nobody stopped the extraction when Marlon collapsed.',
  },
  {
    id: 'first-is-a-person',
    clue: 'writing',
    requires: ['portrait'],
    title: 'A person, not a prototype',
    text: 'Zero-zero-one is on her frame. “The first one” wasn’t the machine. He spent his last strength asking us to find a person.',
  },
  {
    id: 'portrait-direction',
    clue: 'portrait',
    requires: ['writing'],
    title: 'The eyes he kept',
    text: 'He left a direction on the wall and a face here. The eyes are the only finished part. Whatever else he lost, he wanted her to be recognizable.',
  },
  {
    id: 'quiet-window',
    clue: 'lock',
    requires: ['camera'],
    title: 'Eleven quiet minutes',
    text: 'Oil the hinge, blind the camera, arrive on time. The lock and the missing minutes weren’t separate accidents. Somebody prepared an appointment.',
  },
  {
    id: 'prepared-blindspot',
    clue: 'camera',
    requires: ['lock'],
    title: 'A planned arrival',
    text: 'They didn’t need to blind the whole block. Only the door they had already prepared. Whoever watched this camera knew precisely where the pickup would happen.',
  },
  {
    id: 'bird-correction',
    clue: 'fragment',
    requires: ['sketch'],
    title: 'She kept the mistake',
    text: 'That extra line across the wing is on the paper too. She turns it into a feather without making the child start again. You can erase a name. It’s harder to invent that kindness twice.',
  },
  {
    id: 'register-human',
    clue: 'register',
    requires: ['fragment'],
    title: 'Beyond an ID number',
    text: 'Ada Vale is not just the name attached to a lesson. She is the voice that waited for the child to finish. The VOID stamp describes what the city did, not who she was.',
  },
];

/** Most recently authored applicable insight wins; reading it is a separate mutation. */
export function insightFor(model: CaseModel, clue: ClueId): Insight | undefined {
  if (!model.save.clues.includes(clue)) return;
  return [...INSIGHTS]
    .reverse()
    .find((i) => i.clue === clue && i.requires.every((c) => model.save.clues.includes(c)));
}
export function lyraIntroduction(model: CaseModel): Line[] {
  const opening = model.save.deductions.includes('entry')
    ? 'You put the blind camera and the prepared lock together. They made an appointment. Marlon wasn’t expecting it to be his last.'
    : model.save.clues.includes('lock')
      ? 'You noticed the oil on the lock. Most detectives stop at the body.'
      : 'You stayed with the painting until it stopped looking like a painting. Most people only see the faces.';
  return [
    { speaker: 'LYRA', text: opening },
    { speaker: 'GRAVITY', text: 'You’ve been watching me.' },
    { speaker: 'LYRA', text: 'I’ve been watching everyone walk past. You went inside.' },
    { speaker: 'GRAVITY', text: 'Marlon painted a woman. Number zero-zero-one. You know her?' },
    {
      speaker: 'LYRA',
      text: 'I know what they left of her. Come into the Den. There are things the rain shouldn’t hear.',
    },
  ];
}
export interface Topic {
  id: string;
  title: string;
  detail: string;
  lines: Line[];
}
export function lyraTopics(model: CaseModel): Topic[] {
  const has = (id: ClueId) => model.save.clues.includes(id);
  const solved = (id: DeductionId) => model.save.deductions.includes(id);
  const topics: Topic[] = [
    {
      id: 'next',
      title: 'Where do we look next?',
      detail: 'Talk through the current lead',
      lines: [
        { speaker: 'GRAVITY', text: 'What am I missing?' },
        {
          speaker: 'LYRA',
          text: model.save.resolution
            ? 'A route to Meridian. We have a name to protect, a memory we can trust, and a destination. We go when you’re ready.'
            : model.followupSolved
              ? 'We can name her now. We can also prove the memory is real and trace the shipment. Come to me in the Den. We should decide how to keep this safe.'
              : model.save.followup
                ? !has('chime')
                  ? 'Listen beneath her voice in the archive. Sometimes a place introduces itself when people don’t.'
                  : !has('register')
                    ? 'The old paper register is beside the tape stacks. The city’s database forgot those evening classes. Paper did not.'
                    : !has('sketch')
                      ? 'Marlon kept something behind her portrait. He told me it mattered more than the frame.'
                      : !has('transfer')
                        ? 'The receiver has its own spool, separate from the public log. Go back to the studio.'
                        : !has('witness')
                          ? 'Mei works the night shift at the noodle bar. Ask her what she saw. Give her a reason to trust you.'
                          : 'You have independent records now. Compare a place with a name, a shipment with a witness, and the memory with something real.'
                : model.save.escaped
                  ? 'Go back to archive zero-zero-one. This time, listen to the room around her.'
                  : 'Keep the memory safe. I will stay on your channel.',
        },
      ],
    },
  ];
  if (solved('entry'))
    topics.push({
      id: 'entry',
      title: 'The prepared entry',
      detail: 'Camera outage + studio lock',
      lines: [
        {
          speaker: 'GRAVITY',
          text: 'A blind camera. An oiled hinge. Whoever came had done it before.',
        },
        {
          speaker: 'LYRA',
          text: 'Ask Mei about a pickup. She serves drivers through that window all night. “Did you see a killer?” gets you nowhere. A scheduled driver is something she can remember.',
        },
      ],
    });
  if (has('painting'))
    topics.push({
      id: 'marlon',
      title: 'What was Marlon trying to do?',
      detail: solved('voices') ? 'The witnesses in the painting' : 'The artist behind the evidence',
      lines: [
        {
          speaker: 'LYRA',
          text: solved('voices')
            ? 'He used to apologize when he called someone by the wrong name. Then I realized he was answering a different voice. The painting was his way of letting them speak separately.'
            : 'He wanted people to look long enough to notice someone else. Even before the voices, that was what his work did.',
        },
        { speaker: 'GRAVITY', text: 'Then we keep looking.' },
      ],
    });
  if (solved('identity'))
    topics.push({
      id: 'ada',
      title: 'Ada Vale',
      detail: 'A name recovered',
      lines: [
        { speaker: 'GRAVITY', text: 'Say her name.' },
        {
          speaker: 'LYRA',
          text: 'Ada Vale. I’ve held that memory for years. It shouldn’t feel different now. It does.',
        },
      ],
    });
  if (has('sketch'))
    topics.push({
      id: 'bird',
      title: 'The crooked wing',
      detail: 'What the archive could not erase',
      lines: [
        {
          speaker: 'LYRA',
          text: 'I thought the important part was keeping an exact copy. But she let the child make a mistake. Maybe a memory matters because it leaves room for something new.',
        },
        { speaker: 'GRAVITY', text: 'We’re not just carrying evidence.' },
      ],
    });
  if (model.save.resolution)
    topics.push({
      id: 'archive-choice',
      title: 'How we kept her name',
      detail: 'Our decision · saved with the case',
      lines: [
        {
          speaker: 'LYRA',
          text:
            model.save.resolution === 'protect'
              ? 'Ada’s identity is encrypted in my private archive. The evidence is intact. We follow the Meridian route before exposing her name.'
              : 'Her name and the supporting evidence are in a sealed witness statement. It stays sealed until someone can answer for what happened at Meridian.',
        },
      ],
    });
  return topics;
}

export const FOLLOWUP_OPENING: Line[] = [
  {
    speaker: 'LYRA',
    text: 'We saved one memory. I have spent years being afraid to ask what was around it.',
  },
  {
    speaker: 'GRAVITY',
    text: 'A room has a sound. A drawing has a back. Someone saw the van arrive. We start there.',
  },
  { speaker: 'LYRA', text: 'Then come back to the Den. Let’s listen again.' },
];

/** Hints name a useful location or an open question, never an unearned conclusion. */
export function boardHint(model: CaseModel, second: boolean): string {
  const ids = second ? ['identity', 'seizure', 'continuity'] : ['harvest', 'voices', 'first'];
  const open = DEDUCTIONS.filter(
    (d) => ids.includes(d.id) && !model.save.deductions.includes(d.id),
  );
  if (!open.length)
    return second
      ? 'The records agree. Return to Lyra in the Den to decide how to keep the archive safe.'
      : 'The central questions are answered. The street camera and studio lock can still tell you more about the arrival.';
  const ready = open.find((d) => d.pair.every((id) => model.save.clues.includes(id)));
  if (ready)
    return `You already hold two records relevant to this question: ${ready.question} ${ready.hint}`;
  const missing = open.flatMap((d) => d.pair).filter((id) => !model.save.clues.includes(id));
  const area = Object.values(AREAS).find((a) =>
    a.hotspots.some((h) => h.clue && missing.includes(h.clue) && model.available(h)),
  );
  return area
    ? `There is still relevant evidence in ${area.title}. Use Focus mode to find available observations; collected records have a check mark.`
    : 'Follow the current objective to open the next lead. Lyra’s channel can help you decide where to go.';
}
