import { useEffect, useReducer } from 'react';
import { checkAudio, subscribeAudioAvailability } from '@/lib/audio';

/**
 * Lance la vérification des URL données et provoque un nouveau rendu quand
 * leur disponibilité est connue. Lire ensuite l'état avec
 * `getAudioAvailability` ou `resolveReference`.
 */
export function useAudioAvailability(urls: string[]): void {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const key = urls.join('|');

  useEffect(() => subscribeAudioAvailability(rerender), []);

  useEffect(() => {
    key.split('|').filter(Boolean).forEach((u) => void checkAudio(u));
  }, [key]);
}
