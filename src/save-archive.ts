import { BACKUP_KEY, isCheckpoint, type SaveStorage } from './checkpoint.ts';
import { freshSave, parseSave, SAVE_KEY, type SaveData } from './model.ts';

export const ARCHIVE_KEY = SAVE_KEY + ':archive:v1';
export const ARCHIVE_PREFIX = ARCHIVE_KEY;
export const ACTIVE_SLOT_KEY = ARCHIVE_KEY + ':active';
const HISTORY_LIMIT = 4;
const SLOT_IDS = [1, 2, 3] as const;

export interface SaveHistoryEntry {
  id: string;
  savedAt: number;
  save: SaveData;
}
export interface SlotSummary {
  id: number;
  name: string;
  updatedAt: number;
  save: SaveData | null;
  recovered: boolean;
  /** An occupied but unreadable file must never be offered as an empty slot. */
  corrupt: boolean;
  history: SaveHistoryEntry[];
}
interface SlotEnvelope {
  version: 1;
  id: number;
  name: string;
  updatedAt: number;
  save: SaveData;
  history: SaveHistoryEntry[];
  recoveryNotice?: boolean;
}
interface StoredSlot {
  envelope: SlotEnvelope | null;
  raw: string | null;
  recovered: boolean;
  occupied: boolean;
  fingerprint: string;
}

export function slotKey(id: number): string {
  checkId(id);
  return `${ARCHIVE_KEY}:slot:${id}`;
}
export function slotBackupKey(id: number): string {
  return slotKey(id) + ':previous';
}
function checkId(id: number) {
  if (!SLOT_IDS.includes(id as (typeof SLOT_IDS)[number])) {
    throw new RangeError('Choose a case file from 1 to 3.');
  }
}
function defaultName(id: number) {
  return `Case file ${String(id).padStart(2, '0')}`;
}
function cleanName(name: string, id: number) {
  return (
    name
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 48) || defaultName(id)
  );
}
function isDate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function normalizedSave(value: unknown): SaveData {
  const raw = JSON.stringify(value);
  if (!isCheckpoint(raw)) throw new Error('This checkpoint is not a supported case file.');
  return parseSave(raw);
}
function parseEnvelope(raw: string | null, id: number): SlotEnvelope | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as SlotEnvelope;
    if (
      !value ||
      value.version !== 1 ||
      value.id !== id ||
      typeof value.name !== 'string' ||
      !isDate(value.updatedAt) ||
      !Array.isArray(value.history) ||
      value.history.length > HISTORY_LIMIT
    )
      return null;
    const ids = new Set<string>();
    const history = value.history.map((entry) => {
      if (
        !entry ||
        typeof entry.id !== 'string' ||
        !entry.id ||
        entry.id.length > 100 ||
        ids.has(entry.id) ||
        !isDate(entry.savedAt)
      ) {
        throw new Error('Invalid checkpoint history.');
      }
      ids.add(entry.id);
      return { id: entry.id, savedAt: entry.savedAt, save: normalizedSave(entry.save) };
    });
    return {
      version: 1,
      id,
      name: cleanName(value.name, id),
      updatedAt: value.updatedAt,
      save: normalizedSave(value.save),
      history,
      recoveryNotice: value.recoveryNotice === true,
    };
  } catch {
    return null;
  }
}
function progressKey(save: SaveData) {
  const { x: _x, resumeHotspot: _resumeHotspot, ...progress } = save;
  return JSON.stringify(progress);
}

/** Each slot is an atomic envelope; unrelated cases never share a write or recovery key. */
export class SaveArchive {
  private selected: number;
  private known = new Map<number, string>();

  constructor(
    private storage: SaveStorage,
    private now = () => Date.now(),
  ) {
    const storedId = Number(storage.getItem(ACTIVE_SLOT_KEY));
    this.selected = SLOT_IDS.includes(storedId as (typeof SLOT_IDS)[number]) ? storedId : 1;
    this.migrateLegacy();
    for (const id of SLOT_IDS) this.known.set(id, this.load(id).fingerprint);
  }

  get activeId() {
    return this.selected;
  }

  list(): SlotSummary[] {
    return SLOT_IDS.map((id) => {
      const stored = this.load(id),
        envelope = stored.envelope;
      return {
        id,
        name: envelope?.name ?? defaultName(id),
        updatedAt: envelope?.updatedAt ?? 0,
        save: envelope?.save ?? null,
        recovered: stored.recovered,
        corrupt: stored.occupied && !envelope,
        history: envelope?.history ?? [],
      };
    });
  }

  select(id: number): void {
    checkId(id);
    const stored = this.load(id);
    this.requireReadable(stored);
    this.storage.setItem(ACTIVE_SLOT_KEY, String(id));
    this.selected = id;
    this.known.set(id, stored.fingerprint);
  }

  read(): { save: SaveData; recovered: boolean } {
    const stored = this.load(this.selected);
    this.requireReadable(stored);
    this.known.set(this.selected, stored.fingerprint);
    return { save: stored.envelope?.save ?? freshSave(), recovered: stored.recovered };
  }

  write(save: SaveData, reset = false): void {
    const stored = this.load(this.selected);
    this.requireReadable(stored);
    this.requireCurrent(this.selected, stored);
    const next = normalizedSave(save),
      previous = stored.envelope;
    if (
      !reset &&
      previous &&
      !stored.recovered &&
      JSON.stringify(previous.save) === JSON.stringify(next)
    )
      return;
    const updatedAt = this.timestamp();
    let history = reset ? [] : (previous?.history ?? []);
    if (!reset && previous && progressKey(previous.save) !== progressKey(next)) {
      history = this.withHistory(previous, history);
    }
    this.commit(
      {
        version: 1,
        id: this.selected,
        name: previous?.name ?? defaultName(this.selected),
        updatedAt,
        save: next,
        history,
      },
      stored,
      reset,
    );
  }

  create(id: number, name: string): void {
    checkId(id);
    const stored = this.load(id);
    if (stored.occupied) throw new Error('That case file is already occupied.');
    this.requireCurrent(id, stored);
    this.commit(
      {
        version: 1,
        id,
        name: cleanName(name, id),
        updatedAt: this.timestamp(),
        save: freshSave(),
        history: [],
      },
      stored,
    );
  }

  rename(id: number, name: string): void {
    checkId(id);
    const stored = this.load(id);
    this.requireReadable(stored);
    this.requireCurrent(id, stored);
    if (!stored.envelope) throw new Error('Start an investigation before naming this case file.');
    const nextName = cleanName(name, id);
    if (stored.envelope.name === nextName && !stored.recovered) return;
    // A label edit is not playtime and should not move the last-played timestamp.
    this.commit({ ...stored.envelope, name: nextName, recoveryNotice: false }, stored);
  }

  restore(id: number, checkpointId: string): void {
    checkId(id);
    const stored = this.load(id);
    this.requireReadable(stored);
    this.requireCurrent(id, stored);
    const previous = stored.envelope;
    const entry = previous?.history.find((item) => item.id === checkpointId);
    if (!previous || !entry) throw new Error('That checkpoint is no longer available.');
    // Keep the current case as a checkpoint so a mistaken restore is reversible.
    const history = this.withHistory(
      previous,
      previous.history.filter((item) => item.id !== checkpointId),
    );
    this.commit(
      {
        ...previous,
        save: entry.save,
        history,
        updatedAt: this.timestamp(),
        recoveryNotice: false,
      },
      stored,
    );
  }

  private timestamp() {
    const now = this.now();
    if (!isDate(now)) throw new Error('The save clock is unavailable.');
    return now;
  }

  private withHistory(previous: SlotEnvelope, history: SaveHistoryEntry[]): SaveHistoryEntry[] {
    const matching = progressKey(previous.save);
    const retained = history.filter((entry) => progressKey(entry.save) !== matching);
    let suffix = 0,
      id: string;
    do {
      id = `${previous.id}-${previous.updatedAt.toString(36)}-${suffix++}`;
    } while (retained.some((entry) => entry.id === id));
    return [{ id, savedAt: previous.updatedAt, save: previous.save }, ...retained].slice(
      0,
      HISTORY_LIMIT,
    );
  }

  private load(id: number): StoredSlot {
    const raw = this.storage.getItem(slotKey(id));
    const envelope = parseEnvelope(raw, id);
    if (envelope)
      return {
        envelope,
        raw,
        recovered: envelope.recoveryNotice === true,
        occupied: true,
        fingerprint: JSON.stringify([raw]),
      };
    const backup = this.storage.getItem(slotBackupKey(id));
    const recovered = parseEnvelope(backup, id);
    return {
      envelope: recovered,
      raw: recovered ? backup : null,
      recovered: !!recovered,
      occupied: raw !== null || backup !== null,
      fingerprint: JSON.stringify([raw, backup]),
    };
  }

  private requireReadable(stored: StoredSlot) {
    if (stored.occupied && !stored.envelope)
      throw new Error('This case file is damaged. Choose another file to preserve it.');
  }

  private requireCurrent(id: number, stored: StoredSlot) {
    if (this.known.get(id) !== stored.fingerprint) {
      throw new Error(
        'This case file changed in another tab. Reload to protect the newer progress.',
      );
    }
  }

  private commit(envelope: SlotEnvelope, previous: StoredSlot, reset = false) {
    const next = JSON.stringify(envelope);
    // A failed backup aborts before primary replacement. A failed primary keeps
    // its old value and a valid previous envelope; quota failures reach the UI.
    if (reset) this.storage.setItem(slotBackupKey(envelope.id), next);
    else if (previous.raw) this.storage.setItem(slotBackupKey(envelope.id), previous.raw);
    this.storage.setItem(slotKey(envelope.id), next);
    this.known.set(envelope.id, JSON.stringify([next]));
  }

  private migrateLegacy() {
    if (
      SLOT_IDS.some(
        (id) =>
          this.storage.getItem(slotKey(id)) !== null ||
          this.storage.getItem(slotBackupKey(id)) !== null,
      )
    )
      return;
    const primary = this.storage.getItem(SAVE_KEY),
      backup = this.storage.getItem(BACKUP_KEY);
    const primaryValid = isCheckpoint(primary),
      backupValid = isCheckpoint(backup);
    if (!primaryValid && !backupValid) return;
    const save = parseSave(primaryValid ? primary : backup),
      now = this.timestamp();
    const history: SaveHistoryEntry[] = [];
    if (primaryValid && backupValid) {
      const previous = parseSave(backup);
      if (progressKey(previous) !== progressKey(save))
        history.push({ id: 'legacy-backup', savedAt: now, save: previous });
    }
    this.commit(
      {
        version: 1,
        id: 1,
        name: defaultName(1),
        updatedAt: now,
        save,
        history,
        recoveryNotice: !primaryValid,
      },
      {
        envelope: null,
        raw: null,
        recovered: false,
        occupied: false,
        fingerprint: JSON.stringify([null, null]),
      },
      true,
    );
  }
}
