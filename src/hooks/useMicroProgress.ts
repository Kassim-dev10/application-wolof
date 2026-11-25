import { useCallback, useEffect, useState } from 'react';
import { dateKey } from '@/lib/progress';
import {
  applyMicroAttempt,
  createInitialMicroProgress,
  sanitizeMicroProgress,
  type MicroProgressState,
} from '@/lib/microLessons';

/**
 * Clé distincte de « waxwolof.progress.v1 » : la sauvegarde existante des phrases
 * n'est ni lue ni réécrite ici.
 */
export const MICRO_STORAGE_KEY = 'waxwolof.microlessons.v1';

function load(): MicroProgressState {
  try {
    const raw = window.localStorage.getItem(MICRO_STORAGE_KEY);
    return raw ? sanitizeMicroProgress(JSON.parse(raw)) : createInitialMicroProgress();
  } catch {
    return createInitialMicroProgress();
  }
}

/** Progression par micro-leçon, persistée à chaque changement. */
export function useMicroProgress() {
  const [micro, setMicro] = useState<MicroProgressState>(load);

  useEffect(() => {
    try {
      window.localStorage.setItem(MICRO_STORAGE_KEY, JSON.stringify(micro));
    } catch {
      // stockage indisponible : déjà signalé par la sauvegarde des phrases
    }
  }, [micro]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === MICRO_STORAGE_KEY) setMicro(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const recordMicroAttempt = useCallback((microId: string, passed: boolean, score?: number) => {
    setMicro((s) => applyMicroAttempt(s, microId, dateKey(), passed, score));
  }, []);

  const resetMicro = useCallback(() => {
    try {
      window.localStorage.removeItem(MICRO_STORAGE_KEY);
    } catch {
      // rien à effacer
    }
    setMicro(createInitialMicroProgress());
  }, []);

  return { micro, recordMicroAttempt, resetMicro };
}
