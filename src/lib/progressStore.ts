/**
 * Persistance locale de la progression (localStorage).
 * Si le stockage est indisponible (navigation privée, quota, refus), l'app
 * continue de fonctionner en mémoire et le signale.
 */
import { createInitialProgress, sanitizeProgress, type ProgressState } from '@/lib/progress';

export const PROGRESS_STORAGE_KEY = 'waxwolof.progress.v1';

export function loadProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return createInitialProgress();
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return createInitialProgress();
  }
}

/** Renvoie false si l'écriture a échoué. */
export function saveProgress(state: ProgressState): boolean {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // stockage indisponible : rien à effacer
  }
}
