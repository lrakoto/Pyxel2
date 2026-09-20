import { AREAS } from './content.ts';
import { parseSave, SAVE_KEY, type SaveData } from './model.ts';
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const BACKUP_KEY = SAVE_KEY + ':backup';
export function isCheckpoint(raw: string | null): boolean {
  try {
    const s = JSON.parse(raw || 'null');
    return (
      !!s &&
      s.version === 1 &&
      Object.hasOwn(AREAS, s.area) &&
      Array.isArray(s.clues) &&
      Array.isArray(s.deductions)
    );
  } catch {
    return false;
  }
}
export function readCheckpoint(storage: SaveStorage) {
  const primary = storage.getItem(SAVE_KEY);
  if (isCheckpoint(primary)) return { save: parseSave(primary), recovered: false };
  const backup = storage.getItem(BACKUP_KEY);
  return { save: parseSave(isCheckpoint(backup) ? backup : null), recovered: isCheckpoint(backup) };
}
/** Keep the previous valid, different checkpoint. A failed primary write leaves it recoverable. */
export function writeCheckpoint(storage: SaveStorage, save: SaveData, reset = false) {
  const next = JSON.stringify(save),
    previous = storage.getItem(SAVE_KEY);
  if (reset) {
    storage.setItem(SAVE_KEY, next);
    storage.setItem(BACKUP_KEY, next);
    return;
  }
  if (previous === next) return;
  if (isCheckpoint(previous)) {
    try {
      storage.setItem(BACKUP_KEY, previous!);
    } catch {
      /* A full backup must not block a smaller primary write. */
    }
  }
  storage.setItem(SAVE_KEY, next);
}
