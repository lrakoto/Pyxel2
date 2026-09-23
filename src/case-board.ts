import { CLUES, DEDUCTIONS, FOLLOWUP_DEDUCTIONS, type ClueId, type Deduction } from './content.ts';
import type { SaveData } from './model.ts';
import { RECORD_MOUNTS } from './notebook.ts';
import { evidenceArt } from './evidence-art.ts';

/** A record is spent only when every currently available use has been solved. */
export function evidenceBoardState(
  save: SaveData,
  id: ClueId,
  theories: readonly Deduction[] = DEDUCTIONS,
) {
  const relevant = theories.filter(
    (d) => d.pair.includes(id) && (save.followup || !FOLLOWUP_DEDUCTIONS.includes(d.id)),
  );
  const matches = relevant.filter((d) => save.deductions.includes(d.id));
  const complete = matches.length > 0 && relevant.every((d) => save.deductions.includes(d.id));
  return { matches, complete, selectable: save.clues.includes(id) && !complete };
}

export function renderEvidenceCard(save: SaveData, id: ClueId, selected: boolean) {
  const clue = CLUES[id];
  const state = evidenceBoardState(save, id);
  selected = selected && state.selectable;
  const links = state.matches
    .map((d) => {
      const partner = d.pair.find((p) => p !== id)!;
      return `<span class="card-match"><b>✓ MATCHED WITH</b><span>${CLUES[partner].title}</span><small>${d.title}</small></span>`;
    })
    .join('');
  const action = state.complete
    ? 'CONNECTION RECORDED · VIEW BELOW'
    : selected
      ? 'SELECTED −'
      : state.matches.length
        ? 'ANOTHER CONNECTION AVAILABLE +'
        : 'SELECT EVIDENCE +';
  return `<article class="evidence-entry ${state.complete ? 'matched-entry' : ''}" data-material="${RECORD_MOUNTS[id].material}"><button class="evidence-card ${selected ? 'selected' : ''} ${state.matches.length ? 'linked' : ''} ${state.complete ? 'matched' : ''}" data-clue="${id}" aria-pressed="${selected}" ${state.complete ? 'disabled' : ''}><div class="evidence-art evidence-${id}">${evidenceArt(id) || `<span>${clue.glyph}</span>`}<small>${String(Object.keys(CLUES).indexOf(id) + 1).padStart(2, '0')}</small>${state.complete ? '<span class="matched-stamp" role="img" aria-label="Matched">✓</span>' : ''}</div><span class="card-category">${clue.category}</span><h3>${clue.title}</h3><p>${clue.body}</p><span class="hand-note">${RECORD_MOUNTS[id].note}</span>${links}<span class="card-select">${action}</span></button><button class="inspect-record" data-inspect="${id}" aria-label="Inspect ${clue.title}">${state.complete ? 'Read matched record' : 'View record'} <span aria-hidden="true">↗</span></button></article>`;
}
