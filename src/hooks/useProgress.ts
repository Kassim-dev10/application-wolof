import { useCallback, useEffect, useState } from 'react';
import {
  applyResult,
  createInitialProgress,
  dateKey,
  recordSession,
  type ProgressState,
  type SessionRecord,
  type SpeakingResult,
} from '@/lib/progress';
import { clearProgress, loadProgress, PROGRESS_STORAGE_KEY, saveProgress } from '@/lib/progressStore';
import type { SessionDuration } from '@/lib/highlights';

export type SessionSummaryInput = Pick<SessionRecord, 'lessonId' | 'duration' | 'practiced' | 'mastered' | 'review'>;

/** Progression persistée : chaque changement est écrit aussitôt dans localStorage. */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    setStorageOk(saveProgress(progress));
  }, [progress]);

  // Synchronise les onglets ouverts en parallèle
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_STORAGE_KEY) setProgress(loadProgress());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreferredDuration = useCallback((d: SessionDuration) => {
    setProgress((s) => (s.preferredDuration === d ? s : { ...s, preferredDuration: d }));
  }, []);

  const setLastLesson = useCallback((id: string) => {
    setProgress((s) => (s.lastLessonId === id ? s : { ...s, lastLessonId: id }));
  }, []);

  const recordResult = useCallback((phraseId: string, result: SpeakingResult) => {
    setProgress((s) => applyResult(s, phraseId, result, dateKey()));
  }, []);

  const completeSession = useCallback((input: SessionSummaryInput) => {
    const now = new Date();
    setProgress((s) =>
      recordSession(s, { ...input, id: `${now.getTime()}-${input.lessonId}`, date: dateKey(now), completedAt: now.toISOString() }),
    );
  }, []);

  const resetProgress = useCallback(() => {
    clearProgress();
    setProgress(createInitialProgress());
  }, []);

  return { progress, storageOk, setPreferredDuration, setLastLesson, recordResult, completeSession, resetProgress };
}
