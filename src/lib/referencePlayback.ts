import type { LessonPhrase } from '@/data/lessons';
import { resolveReference } from '@/lib/audio';
import type { PlayOptions } from '@/hooks/useAudioPlayer';

interface PlayerLike {
  play: (key: string, url: string, options?: PlayOptions) => void;
}

export const refKey = (phraseId: string, mode: 'normal' | 'slow') => `${phraseId}:${mode}`;

/** Lance la référence d'une phrase si le fichier existe ; renvoie false sinon (rien n'est simulé). */
export function playReference(
  player: PlayerLike,
  phrase: Pick<LessonPhrase, 'id' | 'audioUrl' | 'slowAudioUrl'>,
  mode: 'normal' | 'slow',
  onEnd?: (ok: boolean) => void,
): boolean {
  const src = resolveReference(phrase);
  const target = mode === 'slow' ? src.slow : src.normal ? { url: src.normal, playbackRate: 1 } : null;
  if (!target) return false;
  player.play(refKey(phrase.id, mode), target.url, { playbackRate: target.playbackRate, onEnd });
  return true;
}
