import { AREAS, CLUES, DEDUCTIONS } from './content.ts';
import { CaseModel, parseSave, type SaveData } from './model.ts';
import type { SlotSummary } from './save-archive.ts';
import type { CaseFileProposal } from './archive-transfer.ts';

const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const number = (value: number) => String(value).padStart(2, '0');

/** Use only recorded discoveries, never the content of an undiscovered clue. */
export function caseRecap(save: SaveData): { summary: string; lead: string } {
  const current = parseSave(JSON.stringify(save));
  const model = new CaseModel(current);
  const recent = current.clues.at(-1);
  const deduction = [...DEDUCTIONS].reverse().find((item) => current.deductions.includes(item.id));
  let summary = 'Your field notes are still blank. The Graves case is waiting in Sector 07.';
  if (current.resolution)
    summary =
      current.resolution === 'protect'
        ? 'You kept Ada Vale’s identity in Lyra’s private archive. The evidence points to Meridian Clinic.'
        : 'You preserved Ada Vale’s name and the evidence in a sealed witness statement.';
  else if (model.followupSolved)
    summary = 'You recovered Ada’s name, verified her memory and traced the shipment.';
  else if (current.followup)
    summary = 'You and Lyra are following the surviving memory back to the woman it belongs to.';
  else if (current.escaped)
    summary = 'You made it through Sector 07 with the first memory intact. Lyra’s channel is open.';
  else if (current.companion)
    summary = 'Lyra is travelling with you. The first memory is in your care.';
  else if (current.clues.includes('fragment'))
    summary = 'You recovered archive 001: a woman teaching a child to draw a bird.';
  else if (current.contact)
    summary = 'You met Lyra. She kept the first surviving memory beneath the city.';
  else if (model.deduced)
    summary = 'The studio evidence is connected. Marlon’s last work points toward the first one.';
  else if (deduction) summary = `Your notes connect the evidence: “${deduction.title}.”`;
  else if (current.introSeen)
    summary = 'You arrived in Sector 07 to investigate Marlon Graves’ death.';
  if (recent && !current.resolution) summary += ` Your latest record is “${CLUES[recent].title}.”`;
  return { summary, lead: model.objective };
}

function dateStamp(timestamp: number) {
  const date = new Date(timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0 || Number.isNaN(date.getTime()))
    return '<span class="archive-date">Date not recorded</span>';
  const label = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
  return `<time class="archive-date" datetime="${escape(date.toISOString())}">${escape(label)}</time>`;
}

function photo(save: SaveData) {
  const area = AREAS[save.area];
  const src = `${import.meta.env?.BASE_URL ?? '/'}env/${area.id}.webp`;
  // A scene plate from the saved location, not a live or captured screenshot.
  return `<figure class="archive-photo"><img src="${escape(src)}" alt="" loading="lazy" width="240" height="110"><figcaption>${escape(area.title)}</figcaption></figure>`;
}

function stats(save: SaveData) {
  return `<span class="archive-stats"><span>${number(save.clues.length)} records</span><span>${number(save.deductions.length)} connections</span></span>`;
}

function card(slot: SlotSummary, activeId: number) {
  const label = escape(slot.name);
  if (slot.corrupt)
    return `<li class="archive-folder archive-damaged"><span class="archive-tab">FILE ${number(slot.id)}</span><span class="archive-stamp">PRESERVED</span><h3>${label}</h3><p>This file cannot be read. Its saved data has been kept intact.</p><span class="archive-folder-foot">No changes made to this file</span></li>`;
  if (!slot.save)
    return `<li class="archive-folder archive-empty"><span class="archive-tab">FILE ${number(slot.id)}</span><span class="archive-empty-mark" aria-hidden="true">+</span><h3>Room for a new case.</h3><p>A separate set of notes.<br>A fresh beginning in Sector 07.</p><button class="archive-open" data-action="archive-create" data-slot="${slot.id}" aria-label="Start a new investigation in file ${number(slot.id)}">New investigation <span aria-hidden="true">↗</span></button><button class="archive-open archive-import-link" data-action="archive-import" data-slot="${slot.id}" aria-label="Import a saved investigation into file ${number(slot.id)}">Import case <span aria-hidden="true">↓</span></button></li>`;
  const model = new CaseModel(slot.save);
  return `<li class="archive-folder${slot.id === activeId ? ' is-active' : ''}"><span class="archive-tab">FILE ${number(slot.id)}</span>${slot.recovered ? '<span class="archive-stamp">RECOVERED</span>' : slot.id === activeId ? '<span class="archive-stamp">IN USE</span>' : ''}${photo(slot.save)}<div class="archive-folder-copy"><span class="archive-kicker">${escape(model.chapter)}</span><h3>${label}</h3>${stats(slot.save)}<span class="archive-filed">LAST FILED ${dateStamp(slot.updatedAt)}</span></div><button class="archive-open" data-action="archive-open" data-slot="${slot.id}" aria-label="Open ${label}">Open case file <span aria-hidden="true">↗</span></button></li>`;
}

export function renderArchive(slots: SlotSummary[], activeId: number): string {
  const canImport = slots.some((slot) => !slot.save && !slot.corrupt);
  return `<section class="case-archive"><div class="archive-intro"><p>Some things are worth keeping.</p><span>Three case files · saved in this browser</span></div><ol class="archive-folders" aria-label="Saved investigations">${slots.map((slot) => card(slot, activeId)).join('')}</ol><p class="archive-note">Each file keeps its own investigation and recent checkpoints. Returning to a file picks up its story where you left it.</p><p class="archive-note archive-transfer-note">${canImport ? 'Take your case with you: download a saved file, then import it into an empty folder on another device.' : 'All three folders are in use. You can still download any saved case; importing requires an empty folder in another browser or profile.'} Files stay on your device.</p></section>`;
}

export function renderResume(slot: SlotSummary): string {
  if (!slot.save || slot.corrupt)
    return `<section class="case-archive"><p class="archive-note">This file is not available to resume.</p><button class="text-button" data-action="archive">← All case files</button></section>`;
  const { summary, lead } = caseRecap(slot.save);
  return `<section class="case-archive archive-resume"><button class="text-button archive-back" data-action="archive">← All case files</button><div class="archive-return"><aside>${photo(slot.save)}<span class="archive-filed">LAST FILED ${dateStamp(slot.updatedAt)}</span>${stats(slot.save)}<span class="archive-kicker">FILE ${number(slot.id)} · ${escape(new CaseModel(slot.save).chapter)}</span></aside><div class="archive-recap"><span class="archive-kicker">WHERE YOU LEFT OFF</span><h3>${escape(slot.name)}</h3><p>${escape(summary)}</p>${slot.recovered ? '<p class="archive-recovered" role="status">Recovered from the last intact checkpoint. Your case is ready to continue.</p>' : ''}<div class="archive-lead"><span class="archive-kicker">NEXT NOTE TO FOLLOW</span><p>${escape(lead)}</p></div><button class="primary" data-action="resume-slot" data-slot="${slot.id}">Continue investigation <span aria-hidden="true">→</span></button></div></div><div class="archive-tools"><div class="archive-rename"><label for="archive-name">Name on the folder</label><div><input id="archive-name" name="archive-name" type="text" maxlength="40" value="${escape(slot.name)}" autocomplete="off" spellcheck="false"><button class="secondary" data-action="archive-rename" data-slot="${slot.id}">Rename</button></div></div><button class="text-button archive-history-link" data-action="archive-history" data-slot="${slot.id}">Earlier checkpoints <span aria-hidden="true">↗</span><small>${slot.history.length ? `${slot.history.length} kept with this file` : 'No earlier checkpoints yet'}</small></button><button class="text-button archive-history-link archive-export-link" data-action="archive-export" data-slot="${slot.id}">Download case <span aria-hidden="true">↓</span><small>Latest saved checkpoint · earlier checkpoints stay here</small></button></div></section>`;
}

export function renderRecovery(slot: SlotSummary): string {
  if (slot.corrupt || !slot.save)
    return `<section class="case-archive"><p class="archive-note">No readable checkpoints are available for this file.</p><button class="text-button" data-action="archive">← All case files</button></section>`;
  return `<section class="case-archive archive-recovery"><button class="text-button archive-back" data-action="archive-open" data-slot="${slot.id}">← Back to ${escape(slot.name)}</button><p class="archive-recovery-intro">Retrace your steps.</p><p class="archive-note">Restore an earlier point in this case. Your current progress is kept as a checkpoint, so you can return to it.</p><ol class="archive-checkpoints" aria-label="Earlier checkpoints">${slot.history.map((checkpoint, i) => `<li><span class="archive-checkpoint-number">${number(i + 1)}</span><div>${dateStamp(checkpoint.savedAt)}<h3>${escape(AREAS[checkpoint.save.area].title)}</h3>${stats(checkpoint.save)}<p>${escape(caseRecap(checkpoint.save).lead)}</p></div><button class="secondary" data-action="archive-restore" data-slot="${slot.id}" data-checkpoint="${escape(checkpoint.id)}">Restore <span class="sr-only">checkpoint ${number(i + 1)}</span><span aria-hidden="true">↶</span></button></li>`).join('')}</ol>${slot.history.length ? '' : '<p class="archive-no-checkpoints">No earlier checkpoints yet. Keep investigating—new discoveries and area changes will be filed here.</p>'}</section>`;
}

/** A preview only: filing and resuming are separate, explicit actions. */
export function renderImportPreview(proposal: CaseFileProposal, id: number): string {
  const save = parseSave(JSON.stringify(proposal.save));
  const { summary, lead } = caseRecap(save);
  return `<section class="case-archive archive-import-preview"><button class="text-button archive-back" data-action="archive">← Back to archive</button><div class="archive-return"><aside>${photo(save)}<span class="archive-filed">SOURCE CHECKPOINT ${dateStamp(proposal.savedAt)}</span>${stats(save)}</aside><div class="archive-recap"><span class="archive-kicker">READY FOR EMPTY FOLDER ${number(id)}</span><h3>${escape(proposal.name)}</h3><p>${escape(summary)}</p><div class="archive-lead"><span class="archive-kicker">NEXT NOTE TO FOLLOW</span><p>${escape(lead)}</p></div><p class="archive-import-notice">This copy will be filed in folder ${number(id)}. Your current investigation stays open, and your other case files stay intact.</p><button class="primary" data-action="archive-import-confirm" data-slot="${id}">File imported case <span aria-hidden="true">↓</span></button><p class="archive-note">Only the latest saved checkpoint travels with this file. Nothing is uploaded.</p></div></div></section>`;
}
