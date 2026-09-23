import { isCheckpoint } from './checkpoint.ts';
import { parseSave, type SaveData } from './model.ts';
import { cleanCaseName, type SlotSummary } from './save-archive.ts';

export const MAX_CASE_FILE_BYTES = 256 * 1024;
const CASE_FILE_FORMAT = 'gravity-case-file';

export type CaseFileErrorCode =
  | 'too-large'
  | 'invalid-file'
  | 'unsupported-version'
  | 'unreadable-case'
  | 'slots-full'
  | 'slot-unavailable';

export class CaseFileError extends Error {
  constructor(
    public readonly code: CaseFileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CaseFileError';
  }
}

export interface CaseFileProposal {
  name: string;
  savedAt: number;
  save: SaveData;
}

/** Call with File.size before reading the file; parsing also checks the actual UTF-8 size. */
export function assertCaseFileSize(bytes: number): void {
  if (!Number.isSafeInteger(bytes) || bytes < 0)
    throw new CaseFileError(
      'invalid-file',
      'This file could not be read. Choose a downloaded Gravity case file.',
    );
  if (bytes > MAX_CASE_FILE_BYTES)
    throw new CaseFileError(
      'too-large',
      'This file is too large. Choose a Gravity case download smaller than 256 KB.',
    );
}

function invalidFile(): never {
  throw new CaseFileError(
    'invalid-file',
    'This is not a readable Gravity case file. Choose the JSON file created with Download case.',
  );
}

function unsupportedVersion(): never {
  throw new CaseFileError(
    'unsupported-version',
    'This case file uses an unsupported version. Open it in the game version that exported it and download a compatible copy.',
  );
}

function dateValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 8.64e15;
}

/** Only our transfer envelope is accepted, never arbitrary storage dumps or executable content. */
export function parseCaseFile(text: string): CaseFileProposal {
  // The length check avoids allocating a second large buffer for obviously oversized input.
  assertCaseFileSize(text.length);
  assertCaseFileSize(new TextEncoder().encode(text).byteLength);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return invalidFile();
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidFile();
  const file = value as Record<string, unknown>;
  if (file.format !== CASE_FILE_FORMAT) return invalidFile();
  if (file.version !== 1) return unsupportedVersion();
  if (typeof file.name !== 'string' || !dateValue(file.savedAt)) return invalidFile();
  if (
    file.save &&
    typeof file.save === 'object' &&
    'version' in file.save &&
    file.save.version !== 1
  )
    return unsupportedVersion();
  if (!file.save || typeof file.save !== 'object' || Array.isArray(file.save)) return invalidFile();
  const checkpoint = file.save as Record<string, unknown>;
  for (const field of ['clues', 'deductions', 'insights']) {
    const records = checkpoint[field];
    if (
      records !== undefined &&
      (!Array.isArray(records) || records.some((id) => typeof id !== 'string'))
    )
      return invalidFile();
  }
  let raw: string | undefined;
  try {
    raw = JSON.stringify(file.save);
  } catch {
    // Malformed files can be small enough to read but nested too deeply to normalize.
    return invalidFile();
  }
  if (!isCheckpoint(raw ?? null)) return invalidFile();
  return {
    name: cleanCaseName(file.name, 1),
    savedAt: file.savedAt,
    save: parseSave(raw),
  };
}

/** Downloads carry the latest saved checkpoint, without browser keys or local recovery history. */
export function exportCaseFile(slot: SlotSummary): { contents: string; filename: string } {
  if (!slot.save || slot.corrupt)
    throw new CaseFileError(
      'unreadable-case',
      'This case has no readable saved checkpoint to download. Choose another case file.',
    );
  const save = JSON.stringify(slot.save);
  if (!isCheckpoint(save) || !dateValue(slot.updatedAt))
    throw new CaseFileError(
      'unreadable-case',
      'This saved checkpoint cannot be downloaded. Reopen the archive and choose a readable case.',
    );
  const name = cleanCaseName(slot.name, slot.id);
  const contents =
    JSON.stringify(
      {
        format: CASE_FILE_FORMAT,
        version: 1,
        name,
        savedAt: slot.updatedAt,
        save: parseSave(save),
      },
      null,
      2,
    ) + '\n';
  assertCaseFileSize(new TextEncoder().encode(contents).byteLength);
  const slug =
    name
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 48) || 'case-file';
  const date = new Date(slot.updatedAt).toISOString().slice(0, 10);
  return { contents, filename: `gravity-${slug}-${date}.json` };
}

/** Recheck immediately before committing: another tab may have filled the chosen folder. */
export function findImportSlot(slots: SlotSummary[], preferredId?: number): number {
  const empty = slots.filter((slot) => [1, 2, 3].includes(slot.id) && !slot.save && !slot.corrupt);
  if (!empty.length)
    throw new CaseFileError(
      'slots-full',
      'All three case folders are in use. Import into a browser or profile with an empty folder; existing cases will not be replaced.',
    );
  if (preferredId !== undefined) {
    if (!empty.some((slot) => slot.id === preferredId))
      throw new CaseFileError(
        'slot-unavailable',
        'That folder is no longer empty. Return to the archive and choose another empty folder.',
      );
    return preferredId;
  }
  return empty[0].id;
}
